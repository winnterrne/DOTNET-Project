import type {
  DB,
  User,
  MemberMembership,
  MembershipPlan,
  ClassBooking,
  PTBooking,
  PaymentMethod,
  Notification,
  CheckIn,
  GroupClass,
  ClassSession,
  EquipmentReport,
  ReportStatus,
  Role,
} from '../types';
import {
  uid,
  todayStr,
  addDays,
  addMonths,
  atTime,
  hoursUntil,
  diffDays,
  weekStart,
  fmtDateTime,
  fmtDate,
  toDateStr,
  parseDate,
} from '../utils';

const nowIso = () => new Date().toISOString();
function fail(msg: string): never {
  throw new Error(msg);
}
const dateOf = (iso: string) => toDateStr(new Date(iso));

/* ------------------------------------------------------------------ */
/*  Lookups                                                            */
/* ------------------------------------------------------------------ */
export const userById = (db: DB, id?: string) => db.users.find((u) => u.id === id);
export const branchById = (db: DB, id?: string) => db.branches.find((b) => b.id === id);
export const planById = (db: DB, id: string) => db.membershipPlans.find((p) => p.id === id);
export const ptPlanById = (db: DB, id: string) => db.ptPlans.find((p) => p.id === id);
export const classById = (db: DB, id: string) => db.classes.find((c) => c.id === id);
export const sessionById = (db: DB, id: string) => db.sessions.find((s) => s.id === id);

export const scopeIncludes = (scope: 'all' | string[], branchId: string) =>
  scope === 'all' || scope.includes(branchId);

export const scopeLabel = (db: DB, scope: 'all' | string[]) =>
  scope === 'all'
    ? 'Tất cả chi nhánh'
    : scope.map((id) => branchById(db, id)?.name.replace('DFGym ', '') ?? id).join(', ');

/* ------------------------------------------------------------------ */
/*  Notifications                                                      */
/* ------------------------------------------------------------------ */
export function notify(
  db: DB,
  userId: string,
  title: string,
  message: string,
  type: Notification['type'] = 'info',
  link?: string,
  key?: string,
) {
  if (key && db.notifications.some((n) => n.key === key && n.userId === userId)) return;
  db.notifications.unshift({
    id: uid('ntf'),
    userId,
    title,
    message,
    type,
    read: false,
    createdAt: nowIso(),
    link,
    key,
  });
}

const notifyRole = (db: DB, role: Role, title: string, msg: string, type: Notification['type'], link?: string, branchId?: string) =>
  db.users
    .filter((u) => u.role === role && !u.locked && (!branchId || !u.branchId || u.branchId === branchId))
    .forEach((u) => notify(db, u.id, title, msg, type, link));

/* ------------------------------------------------------------------ */
/*  Membership status                                                  */
/* ------------------------------------------------------------------ */
export const isFrozenOn = (db: DB, membershipId: string, date: string) =>
  db.freezeRequests.some(
    (f) => f.membershipId === membershipId && f.status === 'approved' && f.startDate <= date && date <= f.endDate,
  );

export type MStatus = 'pending_payment' | 'upcoming' | 'active' | 'frozen' | 'expired' | 'cancelled';

export function membershipStatus(db: DB, m: MemberMembership, date = todayStr()): MStatus {
  if (m.payStatus === 'pending_payment') return 'pending_payment';
  if (m.payStatus === 'cancelled') return 'cancelled';
  if (date < m.startDate) return 'upcoming';
  if (date > m.endDate) return 'expired';
  if (isFrozenOn(db, m.id, date)) return 'frozen';
  return 'active';
}

/** gói hội viên đã thanh toán bao phủ ngày `date` (có thể đang freeze) */
export const membershipOn = (db: DB, memberId: string, date = todayStr()) =>
  db.memberships
    .filter((m) => m.memberId === memberId && m.payStatus === 'paid' && m.startDate <= date && date <= m.endDate)
    .sort((a, b) => b.endDate.localeCompare(a.endDate))[0];

export const latestPaidMembership = (db: DB, memberId: string) =>
  db.memberships
    .filter((m) => m.memberId === memberId && m.payStatus === 'paid')
    .sort((a, b) => b.endDate.localeCompare(a.endDate))[0];

export function checkMembershipValid(db: DB, memberId: string, branchId: string, date = todayStr()) {
  const m = membershipOn(db, memberId, date);
  if (!m) return { ok: false as const, reason: 'Không có gói hội viên còn hiệu lực' };
  if (isFrozenOn(db, m.id, date)) return { ok: false as const, reason: 'Gói hội viên đang trong thời gian tạm ngưng (freeze)', membership: m };
  const plan = planById(db, m.planId)!;
  if (!scopeIncludes(plan.branchScope, branchId))
    return { ok: false as const, reason: `Gói ${plan.name} không áp dụng tại chi nhánh này`, membership: m };
  return { ok: true as const, membership: m, plan };
}

export const ptPackageValid = (p: { payStatus: string; startDate: string; endDate: string; sessionsUsed: number; sessionsTotal: number }, date = todayStr()) =>
  p.payStatus === 'paid' && p.startDate <= date && date <= p.endDate && p.sessionsUsed < p.sessionsTotal;

export function ptBalance(db: DB, memberId: string, date = todayStr()) {
  const m = membershipOn(db, memberId, date);
  const free = m && !isFrozenOn(db, m.id, date) ? Math.max(0, m.freeSessionsTotal - m.freeSessionsUsed) : 0;
  const pkgs = db.ptPackages.filter((p) => p.memberId === memberId && ptPackageValid(p, date));
  const pkg = pkgs.reduce((s, p) => s + p.sessionsTotal - p.sessionsUsed, 0);
  return { free, pkg, total: free + pkg, membership: m, packages: pkgs };
}

/* ------------------------------------------------------------------ */
/*  Auth                                                               */
/* ------------------------------------------------------------------ */
const COLORS = ['#7c5cff', '#ff5c8a', '#00c2a8', '#ffb020', '#3fa9ff', '#ff7a45', '#a259ff', '#2ed47a'];

export function register(db: DB, data: { fullName: string; email: string; phone: string; password: string; gender: User['gender']; dob: string }) {
  if (db.users.some((u) => u.email.toLowerCase() === data.email.toLowerCase())) fail('Email đã được sử dụng');
  if (data.password.length < 6) fail('Mật khẩu tối thiểu 6 ký tự');
  const user: User = {
    id: uid('u'),
    role: 'member',
    email: data.email.trim(),
    password: data.password,
    fullName: data.fullName.trim(),
    phone: data.phone,
    gender: data.gender,
    dob: data.dob,
    address: '',
    avatarColor: COLORS[db.users.length % COLORS.length],
    locked: false,
    createdAt: nowIso(),
    cardCode: 'DF' + Math.floor(100000 + Math.random() * 899999),
  };
  db.users.push(user);
  notify(db, user.id, 'Chào mừng đến DFGymCenter!', 'Hãy cập nhật hồ sơ và chỉ số cơ thể ban đầu, sau đó chọn gói tập phù hợp.', 'success', '/member/profile');
  return user;
}

export function login(db: DB, email: string, password: string) {
  const u = db.users.find((x) => x.email.toLowerCase() === email.trim().toLowerCase());
  if (!u || u.password !== password) fail('Email hoặc mật khẩu không đúng');
  if (u!.locked) fail('Tài khoản đã bị khóa. Vui lòng liên hệ quản trị viên.');
  return u!;
}

export function createStaff(db: DB, data: Partial<User> & { role: Role; email: string; fullName: string }) {
  if (db.users.some((u) => u.email.toLowerCase() === data.email.toLowerCase())) fail('Email đã tồn tại');
  const u: User = {
    id: uid('u'),
    password: '123456',
    phone: '',
    gender: 'other',
    dob: '1995-01-01',
    address: '',
    avatarColor: COLORS[db.users.length % COLORS.length],
    locked: false,
    createdAt: nowIso(),
    ...data,
  } as User;
  if (u.role === 'trainer' && !u.trainer)
    u.trainer = { specialties: [], experienceYears: 0, certifications: [], bio: '', branchIds: u.branchId ? [u.branchId] : [] };
  if (u.role === 'member' && !u.cardCode) u.cardCode = 'DF' + Math.floor(100000 + Math.random() * 899999);
  db.users.push(u);
  return u;
}

/* ------------------------------------------------------------------ */
/*  Payment & membership                                               */
/* ------------------------------------------------------------------ */
function activateMembership(db: DB, m: MemberMembership) {
  const plan = planById(db, m.planId)!;
  const latest = latestPaidMembership(db, m.memberId);
  const today = todayStr();
  const start = latest && latest.endDate >= today ? addDays(latest.endDate, 1) : today;
  m.isRenewal = !!(latest && latest.endDate >= today);
  m.startDate = start;
  m.endDate = addDays(addMonths(start, plan.durationMonths), -1);
  m.payStatus = 'paid';
  m.freeSessionsTotal = plan.freePTSessions;
}

export function purchaseMembership(db: DB, memberId: string, planId: string, branchId: string, method: PaymentMethod, success: boolean) {
  const plan = planById(db, planId) ?? fail('Gói không tồn tại');
  const m: MemberMembership = {
    id: uid('ms'),
    memberId,
    planId,
    startDate: todayStr(),
    endDate: todayStr(),
    payStatus: 'pending_payment',
    freeSessionsTotal: 0,
    freeSessionsUsed: 0,
    freezeCountUsed: 0,
    freezeDaysUsed: 0,
    isRenewal: false,
    createdAt: nowIso(),
  };
  db.memberships.push(m);
  return payMembership(db, m.id, branchId, method, success);
}

export function payMembership(db: DB, membershipId: string, branchId: string, method: PaymentMethod, success: boolean) {
  const m = db.memberships.find((x) => x.id === membershipId) ?? fail('Không tìm thấy gói');
  const plan = planById(db, m.planId)!;
  const latest = latestPaidMembership(db, m.memberId);
  const renewal = !!(latest && latest.endDate >= todayStr());
  db.payments.unshift({
    id: uid('pay'),
    memberId: m.memberId,
    kind: renewal ? 'renewal' : 'membership',
    refId: m.id,
    amount: plan.price,
    method,
    status: success ? 'success' : 'failed',
    branchId,
    description: `${renewal ? 'Gia hạn' : 'Mua'} gói ${plan.name}`,
    createdAt: nowIso(),
  });
  if (success) {
    activateMembership(db, m);
    notify(
      db,
      m.memberId,
      'Thanh toán thành công',
      `Gói ${plan.name} đã được kích hoạt, hiệu lực ${fmtDate(m.startDate)} – ${fmtDate(m.endDate)}.${plan.freePTSessions ? ` Tặng kèm ${plan.freePTSessions} buổi PT.` : ''}`,
      'success',
      '/member/memberships',
    );
  } else {
    notify(db, m.memberId, 'Thanh toán thất bại', `Giao dịch cho gói ${plan.name} không thành công. Bạn có thể thanh toán lại trong mục Gói tập.`, 'danger', '/member/memberships');
  }
  return success;
}

export function purchasePT(db: DB, memberId: string, ptPlanId: string, branchId: string, method: PaymentMethod, success: boolean) {
  const plan = ptPlanById(db, ptPlanId) ?? fail('Gói PT không tồn tại');
  const m = membershipOn(db, memberId);
  if (!m) fail('Bạn cần có gói hội viên còn hiệu lực để mua gói PT');
  const pkg = {
    id: uid('pt'),
    memberId,
    ptPlanId,
    sessionsTotal: plan.sessions,
    sessionsUsed: 0,
    startDate: todayStr(),
    endDate: todayStr(),
    payStatus: 'pending_payment' as const,
    createdAt: nowIso(),
  };
  db.ptPackages.push(pkg);
  return payPT(db, pkg.id, branchId, method, success);
}

export function payPT(db: DB, pkgId: string, branchId: string, method: PaymentMethod, success: boolean) {
  const pkg = db.ptPackages.find((p) => p.id === pkgId) ?? fail('Không tìm thấy gói PT');
  const plan = ptPlanById(db, pkg.ptPlanId)!;
  db.payments.unshift({
    id: uid('pay'),
    memberId: pkg.memberId,
    kind: 'pt',
    refId: pkg.id,
    amount: plan.price,
    method,
    status: success ? 'success' : 'failed',
    branchId,
    description: `Mua gói PT ${plan.name}`,
    createdAt: nowIso(),
  });
  if (success) {
    pkg.payStatus = 'paid';
    pkg.startDate = todayStr();
    pkg.endDate = addDays(todayStr(), plan.validityDays - 1);
    notify(db, pkg.memberId, 'Thanh toán thành công', `Gói PT ${plan.name} (${plan.sessions} buổi) đã kích hoạt, dùng đến ${fmtDate(pkg.endDate)}.`, 'success', '/member/memberships');
  } else {
    notify(db, pkg.memberId, 'Thanh toán thất bại', `Giao dịch gói PT ${plan.name} không thành công. Vui lòng thanh toán lại.`, 'danger', '/member/memberships');
  }
  return success;
}

/* ------------------------------------------------------------------ */
/*  Freeze                                                             */
/* ------------------------------------------------------------------ */
export function requestFreeze(db: DB, memberId: string, membershipId: string, startDate: string, days: number, reason: string) {
  const m = db.memberships.find((x) => x.id === membershipId && x.memberId === memberId) ?? fail('Không tìm thấy gói');
  const plan = planById(db, m.planId)!;
  const st = membershipStatus(db, m);
  if (!['active', 'upcoming', 'frozen'].includes(st)) fail('Chỉ có thể tạm ngưng gói đang hiệu lực');
  if (plan.maxFreezeTimes === 0) fail(`Gói ${plan.name} không hỗ trợ tạm ngưng`);
  if (startDate <= todayStr()) fail('Ngày bắt đầu tạm ngưng phải sau hôm nay');
  if (startDate < m.startDate || startDate > m.endDate) fail('Ngày bắt đầu phải nằm trong thời hạn gói');
  if (days < 1) fail('Số ngày tạm ngưng không hợp lệ');
  if (db.freezeRequests.some((f) => f.membershipId === m.id && f.status === 'pending')) fail('Bạn đang có một yêu cầu chờ duyệt');
  if (m.freezeCountUsed >= plan.maxFreezeTimes) fail(`Đã dùng hết ${plan.maxFreezeTimes} lần tạm ngưng của gói`);
  if (m.freezeDaysUsed + days > plan.maxFreezeDays) fail(`Vượt quá số ngày cho phép (còn ${plan.maxFreezeDays - m.freezeDaysUsed} ngày)`);
  const endDate = addDays(startDate, days - 1);
  if (db.freezeRequests.some((f) => f.membershipId === m.id && f.status === 'approved' && !(endDate < f.startDate || startDate > f.endDate)))
    fail('Trùng với khoảng tạm ngưng đã được duyệt');
  db.freezeRequests.unshift({
    id: uid('fr'),
    memberId,
    membershipId,
    startDate,
    endDate,
    days,
    reason,
    status: 'pending',
    createdAt: nowIso(),
  });
  const member = userById(db, memberId)!;
  notifyRole(db, 'receptionist', 'Yêu cầu freeze mới', `${member.fullName} yêu cầu tạm ngưng gói ${plan.name} ${days} ngày từ ${fmtDate(startDate)}.`, 'warning', '/staff/freeze');
}

export function handleFreeze(db: DB, reqId: string, staffId: string, approve: boolean, note: string) {
  const f = db.freezeRequests.find((x) => x.id === reqId) ?? fail('Không tìm thấy yêu cầu');
  if (f.status !== 'pending') fail('Yêu cầu đã được xử lý');
  const m = db.memberships.find((x) => x.id === f.membershipId)!;
  const plan = planById(db, m.planId)!;
  f.status = approve ? 'approved' : 'rejected';
  f.handledBy = staffId;
  f.handledAt = nowIso();
  f.note = note;
  if (!approve) {
    notify(db, f.memberId, 'Yêu cầu freeze bị từ chối', `Yêu cầu tạm ngưng gói ${plan.name} đã bị từ chối.${note ? ' Lý do: ' + note : ''}`, 'danger', '/member/memberships');
    return;
  }
  // cộng dồn ngày vào gói và các gói nối tiếp
  const oldEnd = m.endDate;
  m.endDate = addDays(m.endDate, f.days);
  m.freezeCountUsed += 1;
  m.freezeDaysUsed += f.days;
  db.memberships
    .filter((x) => x.memberId === m.memberId && x.id !== m.id && x.payStatus === 'paid' && x.startDate > oldEnd)
    .forEach((x) => {
      x.startDate = addDays(x.startDate, f.days);
      x.endDate = addDays(x.endDate, f.days);
    });
  // hủy lịch trong khoảng freeze
  let cancelled = 0;
  db.classBookings
    .filter((b) => b.memberId === f.memberId && ['booked', 'waitlist'].includes(b.status))
    .forEach((b) => {
      const s = sessionById(db, b.sessionId)!;
      if (s.date >= f.startDate && s.date <= f.endDate) {
        const wasBooked = b.status === 'booked';
        b.status = 'auto_cancelled';
        b.updatedAt = nowIso();
        cancelled++;
        if (wasBooked) promoteWaitlist(db, s.id);
      }
    });
  db.ptBookings
    .filter((b) => b.memberId === f.memberId && ['pending', 'confirmed'].includes(b.status))
    .forEach((b) => {
      const d = dateOf(b.startAt);
      if (d >= f.startDate && d <= f.endDate) {
        b.status = 'auto_cancelled';
        b.updatedAt = nowIso();
        refundPT(db, b);
        cancelled++;
        const member = userById(db, b.memberId)!;
        notify(db, b.trainerId, 'Lịch hẹn PT bị hủy', `Lịch hẹn với ${member.fullName} lúc ${fmtDateTime(b.startAt)} bị hủy do hội viên tạm ngưng gói.`, 'warning', '/trainer/requests');
      }
    });
  notify(
    db,
    f.memberId,
    'Yêu cầu freeze được duyệt',
    `Gói ${plan.name} tạm ngưng ${fmtDate(f.startDate)} – ${fmtDate(f.endDate)}. Hạn mới: ${fmtDate(m.endDate)}.`,
    'success',
    '/member/memberships',
  );
  if (cancelled)
    notify(db, f.memberId, 'Lịch tập bị hủy tự động', `${cancelled} lịch đặt trong thời gian freeze đã được hủy và hoàn lượt/buổi PT.`, 'warning', '/member/bookings');
}

/* ------------------------------------------------------------------ */
/*  Classes & sessions                                                 */
/* ------------------------------------------------------------------ */
export function ensureSessions(db: DB, fromOffset = 0, toOffset = 14) {
  const today = todayStr();
  for (const c of db.classes) {
    if (!c.active) continue;
    for (let i = fromOffset; i <= toOffset; i++) {
      const date = addDays(today, i);
      if (!c.daysOfWeek.includes(parseDate(date).getDay())) continue;
      if (db.sessions.some((s) => s.classId === c.id && s.date === date)) continue;
      const startAt = atTime(date, c.startTime);
      db.sessions.push({
        id: `ses_${c.id}_${date}`,
        classId: c.id,
        date,
        startAt,
        endAt: new Date(new Date(startAt).getTime() + c.durationMin * 60000).toISOString(),
        trainerId: c.trainerId,
        room: c.room,
        status: 'scheduled',
        attendanceConfirmed: false,
      });
    }
  }
}

export const sessionBookings = (db: DB, sessionId: string) => db.classBookings.filter((b) => b.sessionId === sessionId);
export const bookedCount = (db: DB, sessionId: string) =>
  db.classBookings.filter((b) => b.sessionId === sessionId && ['booked', 'attended', 'no_show'].includes(b.status)).length;
export const waitlistOf = (db: DB, sessionId: string) =>
  db.classBookings
    .filter((b) => b.sessionId === sessionId && b.status === 'waitlist')
    .sort((a, b) => b.priority - a.priority || a.createdAt.localeCompare(b.createdAt));

export function bookClass(db: DB, memberId: string, sessionId: string) {
  const s = sessionById(db, sessionId) ?? fail('Buổi học không tồn tại');
  const c = classById(db, s.classId)!;
  if (s.status !== 'scheduled') fail('Buổi học đã bị hủy hoặc kết thúc');
  if (new Date(s.startAt).getTime() <= Date.now()) fail('Buổi học đã bắt đầu');
  const v = checkMembershipValid(db, memberId, c.branchId, s.date);
  if (!v.ok) fail(v.reason);
  if (db.classBookings.some((b) => b.sessionId === s.id && b.memberId === memberId && ['booked', 'waitlist'].includes(b.status)))
    fail('Bạn đã đăng ký buổi học này');
  const plan = v.plan!;
  if (plan.classBookingsPerWeek > 0) {
    const ws = weekStart(s.startAt);
    const used = db.classBookings.filter((b) => {
      if (b.memberId !== memberId || !['booked', 'waitlist', 'attended', 'no_show', 'late_cancelled'].includes(b.status)) return false;
      const ss = sessionById(db, b.sessionId);
      return ss && weekStart(ss.startAt) === ws;
    }).length;
    if (used >= plan.classBookingsPerWeek) fail(`Gói ${plan.name} giới hạn ${plan.classBookingsPerWeek} lượt đặt lớp/tuần. Bạn đã dùng hết lượt của tuần này.`);
  }
  const full = bookedCount(db, s.id) >= c.capacity;
  if (full && hoursUntil(s.startAt) <= db.settings.waitlistCutoffHours)
    fail(`Lớp đã đầy và còn dưới ${db.settings.waitlistCutoffHours} giờ trước giờ học. Vui lòng chọn lớp khác.`);
  const b: ClassBooking = {
    id: uid('cb'),
    sessionId: s.id,
    memberId,
    membershipId: v.membership!.id,
    status: full ? 'waitlist' : 'booked',
    priority: plan.priority,
    checkedIn: false,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  db.classBookings.push(b);
  if (full) {
    const pos = waitlistOf(db, s.id).findIndex((x) => x.id === b.id) + 1;
    notify(db, memberId, 'Đã vào danh sách chờ', `Lớp ${c.name} ${fmtDateTime(s.startAt)} đã đầy. Bạn đang ở vị trí #${pos} trong danh sách chờ.`, 'warning', '/member/bookings');
  } else {
    notify(db, memberId, 'Đặt lớp thành công', `Bạn đã đăng ký lớp ${c.name} lúc ${fmtDateTime(s.startAt)}.`, 'success', '/member/bookings');
  }
  return b;
}

export function promoteWaitlist(db: DB, sessionId: string) {
  const s = sessionById(db, sessionId)!;
  const c = classById(db, s.classId)!;
  if (s.status !== 'scheduled' || hoursUntil(s.startAt) <= db.settings.waitlistCutoffHours) return;
  while (bookedCount(db, s.id) < c.capacity) {
    const next = waitlistOf(db, s.id).find((b) => checkMembershipValid(db, b.memberId, c.branchId, s.date).ok);
    if (!next) break;
    next.status = 'booked';
    next.updatedAt = nowIso();
    notify(db, next.memberId, 'Bạn đã được xếp vào lớp!', `Có chỗ trống ở lớp ${c.name} lúc ${fmtDateTime(s.startAt)}. Bạn đã được chuyển từ danh sách chờ vào lớp.`, 'success', '/member/bookings');
  }
}

export function cancelClassBooking(db: DB, memberId: string, bookingId: string) {
  const b = db.classBookings.find((x) => x.id === bookingId && x.memberId === memberId) ?? fail('Không tìm thấy lịch đặt');
  const s = sessionById(db, b.sessionId)!;
  const c = classById(db, s.classId)!;
  if (!['booked', 'waitlist'].includes(b.status)) fail('Không thể hủy lịch này');
  if (new Date(s.startAt).getTime() <= Date.now()) fail('Buổi học đã bắt đầu');
  b.updatedAt = nowIso();
  if (b.status === 'waitlist') {
    b.status = 'cancelled';
    return 'waitlist';
  }
  const timely = hoursUntil(s.startAt) >= db.settings.cancelDeadlineHours;
  b.status = timely ? 'cancelled' : 'late_cancelled';
  notify(
    db,
    memberId,
    'Đã hủy lịch lớp',
    timely ? `Đã hủy lớp ${c.name} ${fmtDateTime(s.startAt)} và hoàn lại lượt đặt.` : `Hủy quá hạn (dưới ${db.settings.cancelDeadlineHours} giờ) – lượt đặt lớp ${c.name} bị tính là đã sử dụng.`,
    timely ? 'info' : 'warning',
    '/member/bookings',
  );
  promoteWaitlist(db, s.id);
  return timely ? 'timely' : 'late';
}

export function confirmAttendance(db: DB, sessionId: string, attendedIds: string[]) {
  const s = sessionById(db, sessionId) ?? fail('Không tìm thấy buổi học');
  const c = classById(db, s.classId)!;
  if (new Date(s.startAt).getTime() > Date.now()) fail('Chỉ điểm danh sau khi buổi học bắt đầu');
  if (s.status === 'cancelled') fail('Buổi học đã bị hủy');
  let rejected = 0;
  db.classBookings
    .filter((b) => b.sessionId === s.id && ['booked', 'attended', 'no_show'].includes(b.status))
    .forEach((b) => {
      const want = attendedIds.includes(b.memberId);
      const checked = b.checkedIn || hasCheckinOn(db, b.memberId, c.branchId, s.date);
      if (want && !checked) rejected++;
      b.status = want && checked ? 'attended' : 'no_show';
      b.updatedAt = nowIso();
      if (b.status === 'attended')
        notify(db, b.memberId, 'Đã xác nhận tham gia', `Bạn đã được xác nhận tham gia lớp ${c.name}. Hãy để lại đánh giá nhé!`, 'success', '/member/bookings', `att_${b.id}`);
    });
  s.attendanceConfirmed = true;
  s.status = 'completed';
  return rejected;
}

export const hasCheckinOn = (db: DB, memberId: string, branchId: string, date: string) =>
  db.checkins.some((c) => c.memberId === memberId && c.branchId === branchId && c.result === 'success' && dateOf(c.checkInAt) === date);

function generateFutureSessions(db: DB, c: GroupClass) {
  // xóa buổi tương lai chưa có ai đặt, giữ buổi đã có đăng ký
  const now = Date.now();
  db.sessions = db.sessions.filter(
    (s) => !(s.classId === c.id && new Date(s.startAt).getTime() > now && s.status === 'scheduled' && sessionBookings(db, s.id).length === 0),
  );
  db.sessions
    .filter((s) => s.classId === c.id && new Date(s.startAt).getTime() > now && s.status === 'scheduled')
    .forEach((s) => {
      s.trainerId = c.trainerId;
      s.room = c.room;
    });
  ensureSessions(db);
}

export function saveClass(db: DB, data: GroupClass) {
  const idx = db.classes.findIndex((c) => c.id === data.id);
  const prev = idx >= 0 ? db.classes[idx] : undefined;
  if (idx >= 0) db.classes[idx] = data;
  else db.classes.push(data);
  generateFutureSessions(db, data);
  if (!prev || prev.trainerId !== data.trainerId) {
    notify(db, data.trainerId, 'Bạn được phân công lớp mới', `Lớp ${data.name} – ${branchById(db, data.branchId)?.name}, ${data.startTime} (${data.durationMin} phút).`, 'info', '/trainer/classes');
  }
}

export function deleteClass(db: DB, classId: string) {
  const c = classById(db, classId) ?? fail('Không tìm thấy lớp');
  db.sessions
    .filter((s) => s.classId === classId && s.status === 'scheduled' && new Date(s.startAt).getTime() > Date.now())
    .forEach((s) => cancelSession(db, s.id, 'Lớp học ngừng hoạt động'));
  c.active = false;
}

export function cancelSession(db: DB, sessionId: string, reason: string) {
  const s = sessionById(db, sessionId) ?? fail('Không tìm thấy buổi học');
  const c = classById(db, s.classId)!;
  s.status = 'cancelled';
  s.note = reason;
  db.classBookings
    .filter((b) => b.sessionId === s.id && ['booked', 'waitlist'].includes(b.status))
    .forEach((b) => {
      b.status = 'auto_cancelled';
      b.updatedAt = nowIso();
      notify(db, b.memberId, 'Buổi học bị hủy', `Lớp ${c.name} lúc ${fmtDateTime(s.startAt)} đã bị hủy. ${reason}. Lượt đặt được hoàn lại.`, 'danger', '/member/bookings');
    });
  notify(db, s.trainerId, 'Buổi dạy bị hủy', `Buổi ${c.name} lúc ${fmtDateTime(s.startAt)} đã bị hủy. ${reason}`, 'warning', '/trainer/classes');
}

export function rescheduleSession(db: DB, sessionId: string, date: string, time: string, room: string, trainerId: string) {
  const s = sessionById(db, sessionId) ?? fail('Không tìm thấy buổi học');
  const c = classById(db, s.classId)!;
  const old = s.startAt;
  const oldTrainer = s.trainerId;
  s.date = date;
  s.startAt = atTime(date, time);
  s.endAt = new Date(new Date(s.startAt).getTime() + c.durationMin * 60000).toISOString();
  s.room = room;
  s.trainerId = trainerId;
  const msg = `Lớp ${c.name} đổi từ ${fmtDateTime(old)} sang ${fmtDateTime(s.startAt)} (${room}).`;
  db.classBookings
    .filter((b) => b.sessionId === s.id && ['booked', 'waitlist'].includes(b.status))
    .forEach((b) => notify(db, b.memberId, 'Buổi học được đổi lịch', msg, 'warning', '/member/bookings'));
  notify(db, trainerId, 'Buổi dạy được đổi lịch', msg, 'warning', '/trainer/classes');
  if (oldTrainer !== trainerId) notify(db, oldTrainer, 'Buổi dạy được chuyển cho HLV khác', `Buổi ${c.name} ${fmtDateTime(old)} đã được chuyển sang HLV khác.`, 'info');
}

/* ------------------------------------------------------------------ */
/*  PT booking                                                         */
/* ------------------------------------------------------------------ */
export const slotTaken = (db: DB, slotId: string) => db.ptBookings.some((b) => b.slotId === slotId && ['pending', 'confirmed', 'completed', 'no_show', 'late_cancelled'].includes(b.status));

function refundPT(db: DB, b: PTBooking) {
  if (b.source.type === 'membership_free') {
    const m = db.memberships.find((x) => x.id === b.source.id);
    if (m && m.freeSessionsUsed > 0) m.freeSessionsUsed--;
  } else {
    const p = db.ptPackages.find((x) => x.id === b.source.id);
    if (p && p.sessionsUsed > 0) p.sessionsUsed--;
  }
}

export function bookPT(db: DB, memberId: string, slotId: string, note: string) {
  const slot = db.trainerSlots.find((s) => s.id === slotId) ?? fail('Khung giờ không tồn tại');
  if (new Date(slot.startAt).getTime() <= Date.now()) fail('Khung giờ đã qua');
  if (slotTaken(db, slotId)) fail('Khung giờ đã có người đặt');
  const date = dateOf(slot.startAt);
  const v = checkMembershipValid(db, memberId, slot.branchId, date);
  if (!v.ok) fail(v.reason);
  if (db.ptBookings.some((b) => b.memberId === memberId && ['pending', 'confirmed'].includes(b.status) && b.startAt === slot.startAt))
    fail('Bạn đã có lịch PT khác trùng giờ');
  let source: PTBooking['source'];
  const m = v.membership!;
  if (m.freeSessionsTotal - m.freeSessionsUsed > 0) {
    m.freeSessionsUsed++;
    source = { type: 'membership_free', id: m.id };
  } else {
    const pkg = db.ptPackages
      .filter((p) => p.memberId === memberId && ptPackageValid(p, date) && ptPackageValid(p))
      .filter((p) => scopeIncludes(ptPlanById(db, p.ptPlanId)!.branchScope, slot.branchId))
      .sort((a, b) => a.endDate.localeCompare(b.endDate))[0];
    if (!pkg) fail('Bạn đã hết buổi PT. Vui lòng mua thêm gói PT 1-kèm-1.');
    pkg!.sessionsUsed++;
    source = { type: 'pt_package', id: pkg!.id };
  }
  const b: PTBooking = {
    id: uid('ptb'),
    memberId,
    trainerId: slot.trainerId,
    slotId,
    branchId: slot.branchId,
    startAt: slot.startAt,
    endAt: slot.endAt,
    source,
    status: 'pending',
    note,
    checkedIn: false,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  db.ptBookings.push(b);
  const member = userById(db, memberId)!;
  notify(db, slot.trainerId, 'Yêu cầu đặt lịch PT mới', `${member.fullName} muốn đặt buổi tập lúc ${fmtDateTime(slot.startAt)}.`, 'info', '/trainer/requests');
  notify(
    db,
    memberId,
    'Đã gửi yêu cầu đặt PT',
    `Yêu cầu buổi PT với ${userById(db, slot.trainerId)?.fullName} lúc ${fmtDateTime(slot.startAt)} đang chờ HLV xác nhận (trừ 1 ${source.type === 'membership_free' ? 'buổi tặng kèm' : 'buổi gói PT'}).`,
    'info',
    '/member/bookings',
  );
  return b;
}

export function respondPT(db: DB, bookingId: string, accept: boolean, reason = '') {
  const b = db.ptBookings.find((x) => x.id === bookingId) ?? fail('Không tìm thấy lịch hẹn');
  if (b.status !== 'pending') fail('Lịch hẹn đã được xử lý');
  const trainer = userById(db, b.trainerId)!;
  b.updatedAt = nowIso();
  if (accept) {
    b.status = 'confirmed';
    notify(db, b.memberId, 'Lịch PT đã được xác nhận', `HLV ${trainer.fullName} đã xác nhận buổi tập lúc ${fmtDateTime(b.startAt)}.`, 'success', '/member/bookings');
  } else {
    b.status = 'rejected';
    refundPT(db, b);
    notify(db, b.memberId, 'Lịch PT bị từ chối', `HLV ${trainer.fullName} từ chối buổi tập lúc ${fmtDateTime(b.startAt)}.${reason ? ' Lý do: ' + reason : ''} Buổi PT đã được hoàn lại.`, 'danger', '/member/bookings');
  }
}

export function cancelPTByMember(db: DB, memberId: string, bookingId: string) {
  const b = db.ptBookings.find((x) => x.id === bookingId && x.memberId === memberId) ?? fail('Không tìm thấy lịch hẹn');
  if (!['pending', 'confirmed'].includes(b.status)) fail('Không thể hủy lịch hẹn này');
  if (new Date(b.startAt).getTime() <= Date.now()) fail('Buổi tập đã bắt đầu');
  const timely = b.status === 'pending' || hoursUntil(b.startAt) >= db.settings.cancelDeadlineHours;
  b.status = timely ? 'cancelled' : 'late_cancelled';
  b.updatedAt = nowIso();
  if (timely) refundPT(db, b);
  const member = userById(db, memberId)!;
  notify(db, b.trainerId, 'Lịch hẹn PT bị hủy', `${member.fullName} đã hủy buổi tập lúc ${fmtDateTime(b.startAt)}.`, 'warning', '/trainer/requests');
  notify(
    db,
    memberId,
    'Đã hủy lịch PT',
    timely ? 'Buổi PT đã được hoàn lại vào nguồn đã trừ.' : `Hủy quá hạn (dưới ${db.settings.cancelDeadlineHours} giờ) – buổi PT bị tính là đã sử dụng.`,
    timely ? 'info' : 'warning',
    '/member/bookings',
  );
  return timely;
}

export function cancelPTByTrainer(db: DB, bookingId: string, reason: string) {
  const b = db.ptBookings.find((x) => x.id === bookingId) ?? fail('Không tìm thấy lịch hẹn');
  if (b.status !== 'confirmed') fail('Chỉ hủy được lịch đã xác nhận');
  b.status = 'cancelled';
  b.updatedAt = nowIso();
  refundPT(db, b);
  notify(db, b.memberId, 'HLV đã hủy lịch hẹn', `Buổi PT lúc ${fmtDateTime(b.startAt)} bị hủy. ${reason} Buổi PT đã được hoàn lại.`, 'danger', '/member/bookings');
}

export function completePT(db: DB, bookingId: string, attended: boolean) {
  const b = db.ptBookings.find((x) => x.id === bookingId) ?? fail('Không tìm thấy lịch hẹn');
  if (b.status !== 'confirmed') fail('Lịch hẹn không ở trạng thái đã xác nhận');
  if (new Date(b.startAt).getTime() > Date.now()) fail('Buổi tập chưa diễn ra');
  const checked = b.checkedIn || hasCheckinOn(db, b.memberId, b.branchId, dateOf(b.startAt));
  if (attended && !checked) fail('Hội viên chưa check-in hợp lệ tại chi nhánh trong ngày này');
  b.status = attended ? 'completed' : 'no_show';
  b.updatedAt = nowIso();
  if (attended) notify(db, b.memberId, 'Đã xác nhận buổi PT', `Buổi tập với HLV ${userById(db, b.trainerId)?.fullName} đã hoàn thành. Hãy đánh giá HLV nhé!`, 'success', '/member/bookings');
}

export function addSlot(db: DB, trainerId: string, branchId: string, date: string, start: string, durationMin: number) {
  const startAt = atTime(date, start);
  const endAt = new Date(new Date(startAt).getTime() + durationMin * 60000).toISOString();
  if (new Date(startAt).getTime() <= Date.now()) fail('Không thể thêm khung giờ trong quá khứ');
  const overlap = db.trainerSlots.some((s) => s.trainerId === trainerId && s.startAt < endAt && startAt < s.endAt);
  if (overlap) fail('Trùng với khung giờ rảnh đã có');
  const clash = db.sessions.some((s) => s.trainerId === trainerId && s.status === 'scheduled' && s.startAt < endAt && startAt < s.endAt);
  if (clash) fail('Trùng với lịch dạy lớp nhóm');
  db.trainerSlots.push({ id: uid('slot'), trainerId, branchId, startAt, endAt });
}

export function removeSlot(db: DB, slotId: string) {
  if (slotTaken(db, slotId)) fail('Khung giờ đã có lịch hẹn, không thể xóa');
  db.trainerSlots = db.trainerSlots.filter((s) => s.id !== slotId);
}

/* ------------------------------------------------------------------ */
/*  Check-in / out                                                     */
/* ------------------------------------------------------------------ */
export const openCheckin = (db: DB, memberId: string) =>
  db.checkins.find((c) => c.memberId === memberId && c.result === 'success' && !c.checkOutAt);

export function checkIn(db: DB, opts: { code: string; branchId: string; method: 'card' | 'manual'; staffId?: string; reason?: string }) {
  const code = opts.code.trim().toLowerCase();
  const member = db.users.find(
    (u) => u.role === 'member' && (u.cardCode?.toLowerCase() === code || u.email.toLowerCase() === code || u.phone === opts.code.trim() || u.id === opts.code),
  );
  if (!member) fail('Không tìm thấy hội viên với mã thẻ/thông tin này');
  const rec: CheckIn = {
    id: uid('ci'),
    memberId: member!.id,
    branchId: opts.branchId,
    checkInAt: nowIso(),
    method: opts.method,
    staffId: opts.staffId,
    reason: opts.reason,
    result: 'success',
  };
  const deny = (r: string) => {
    rec.result = 'denied';
    rec.denyReason = r;
    db.checkins.unshift(rec);
    return { record: rec, member: member! };
  };
  if (member!.locked) return deny('Tài khoản bị khóa');
  if (openCheckin(db, member!.id)) return deny('Hội viên đang trong phòng tập (chưa check-out)');
  const v = checkMembershipValid(db, member!.id, opts.branchId);
  if (!v.ok) return deny(v.reason);
  db.checkins.unshift(rec);
  const today = todayStr();
  // xác nhận lịch lớp / PT trong ngày
  db.classBookings
    .filter((b) => b.memberId === member!.id && b.status === 'booked')
    .forEach((b) => {
      const s = sessionById(db, b.sessionId)!;
      if (s.date === today && classById(db, s.classId)!.branchId === opts.branchId) b.checkedIn = true;
    });
  db.ptBookings
    .filter((b) => b.memberId === member!.id && b.status === 'confirmed' && b.branchId === opts.branchId && dateOf(b.startAt) === today)
    .forEach((b) => (b.checkedIn = true));
  return { record: rec, member: member! };
}

export function checkOut(db: DB, opts: { code: string; method: 'card' | 'manual'; staffId?: string }) {
  const code = opts.code.trim().toLowerCase();
  const member = db.users.find((u) => u.role === 'member' && (u.cardCode?.toLowerCase() === code || u.email.toLowerCase() === code || u.phone === opts.code.trim() || u.id === opts.code));
  if (!member) fail('Không tìm thấy hội viên');
  const c = openCheckin(db, member!.id) ?? fail('Hội viên chưa check-in');
  c.checkOutAt = nowIso();
  c.checkoutMethod = opts.method;
  if (opts.staffId && !c.staffId) c.staffId = opts.staffId;
  return { record: c, member: member! };
}

export const presentCount = (db: DB, branchId: string) =>
  db.checkins.filter((c) => c.branchId === branchId && c.result === 'success' && !c.checkOutAt).length;

/* ------------------------------------------------------------------ */
/*  Reviews / metrics / equipment                                      */
/* ------------------------------------------------------------------ */
export function addReview(db: DB, memberId: string, bookingId: string, kind: 'class' | 'pt', rating: number, comment: string) {
  if (db.reviews.some((r) => r.bookingId === bookingId)) fail('Bạn đã đánh giá buổi này');
  if (kind === 'class') {
    const b = db.classBookings.find((x) => x.id === bookingId && x.memberId === memberId) ?? fail('Không tìm thấy');
    if (b.status !== 'attended') fail('Chỉ đánh giá sau khi được xác nhận tham gia');
    const s = sessionById(db, b.sessionId)!;
    db.reviews.unshift({ id: uid('rv'), memberId, targetType: 'class', trainerId: s.trainerId, classId: s.classId, bookingId, rating, comment, createdAt: nowIso() });
  } else {
    const b = db.ptBookings.find((x) => x.id === bookingId && x.memberId === memberId) ?? fail('Không tìm thấy');
    if (b.status !== 'completed') fail('Chỉ đánh giá sau khi buổi PT hoàn thành');
    db.reviews.unshift({ id: uid('rv'), memberId, targetType: 'trainer', trainerId: b.trainerId, bookingId, rating, comment, createdAt: nowIso() });
  }
}

export function reportEquipment(db: DB, reporterId: string, equipmentId: string, description: string) {
  const eq = db.equipment.find((e) => e.id === equipmentId) ?? fail('Thiết bị không tồn tại');
  const r: EquipmentReport = {
    id: uid('er'),
    equipmentId,
    branchId: eq.branchId,
    reporterId,
    description,
    status: 'pending',
    createdAt: nowIso(),
    updates: [{ at: nowIso(), by: reporterId, note: description, status: 'pending' }],
  };
  db.equipmentReports.unshift(r);
  const rep = userById(db, reporterId)!;
  notifyRole(db, 'receptionist', 'Phản ánh thiết bị mới', `${rep.fullName} báo ${eq.name} (${eq.code}) gặp sự cố: ${description}`, 'warning', '/staff/equipment', eq.branchId);
  if (rep.role !== 'member') {
    eq.status = 'broken';
  }
}

export function updateReport(db: DB, reportId: string, staffId: string, status: ReportStatus, note: string) {
  const r = db.equipmentReports.find((x) => x.id === reportId) ?? fail('Không tìm thấy phản ánh');
  r.status = status;
  r.updates.push({ at: nowIso(), by: staffId, note, status });
  const eq = db.equipment.find((e) => e.id === r.equipmentId);
  if (eq) eq.status = status === 'in_progress' ? 'repairing' : status === 'resolved' ? 'active' : eq.status;
  if (status === 'pending' && eq) eq.status = 'broken';
  if (r.reporterId !== staffId) {
    const label = { pending: 'đã ghi nhận', in_progress: 'đang sửa chữa', resolved: 'đã sửa xong', rejected: 'không xác nhận lỗi' }[status];
    notify(db, r.reporterId, 'Cập nhật phản ánh thiết bị', `Thiết bị ${eq?.name} ${label}. ${note}`, status === 'resolved' ? 'success' : 'info', '/member/equipment');
  }
}

/* ------------------------------------------------------------------ */
/*  Scheduler (chạy định kỳ phía client để mô phỏng tác vụ nền)        */
/* ------------------------------------------------------------------ */
export function runScheduler(db: DB) {
  const now = Date.now();
  const today = todayStr();
  const cfg = db.settings;
  ensureSessions(db);

  for (const s of db.sessions) {
    const c = classById(db, s.classId);
    if (!c) continue;
    const h = (new Date(s.startAt).getTime() - now) / 3600000;
    // hết hạn danh sách chờ
    if (s.status === 'scheduled' && h <= cfg.waitlistCutoffHours) {
      db.classBookings
        .filter((b) => b.sessionId === s.id && b.status === 'waitlist')
        .forEach((b) => {
          b.status = 'waitlist_expired';
          b.updatedAt = nowIso();
          notify(db, b.memberId, 'Lớp đã đầy', `Rất tiếc, lớp ${c.name} lúc ${fmtDateTime(s.startAt)} vẫn đầy. Vui lòng chọn lịch khác.`, 'warning', '/member/classes');
        });
    }
    // nhắc lịch
    if (s.status === 'scheduled' && h > 0 && h <= cfg.reminderHours) {
      db.classBookings
        .filter((b) => b.sessionId === s.id && b.status === 'booked')
        .forEach((b) => notify(db, b.memberId, 'Sắp đến giờ tập', `Lớp ${c.name} bắt đầu lúc ${fmtDateTime(s.startAt)} tại ${s.room}.`, 'info', '/member/bookings', `rem_${b.id}`));
      notify(db, s.trainerId, 'Sắp đến buổi dạy', `Lớp ${c.name} bắt đầu lúc ${fmtDateTime(s.startAt)} tại ${s.room}.`, 'info', '/trainer/classes', `rem_${s.id}`);
    }
    if (s.status === 'scheduled' && new Date(s.endAt).getTime() < now && !s.attendanceConfirmed && h < -24) {
      s.status = 'completed';
    }
  }

  for (const b of db.ptBookings) {
    const h = (new Date(b.startAt).getTime() - now) / 3600000;
    if (b.status === 'pending' && h <= 0) {
      b.status = 'auto_cancelled';
      b.updatedAt = nowIso();
      refundPT(db, b);
      notify(db, b.memberId, 'Lịch PT hết hạn xác nhận', `HLV chưa xác nhận buổi ${fmtDateTime(b.startAt)} nên lịch bị hủy, buổi PT đã được hoàn lại.`, 'warning', '/member/bookings');
    }
    if (b.status === 'confirmed' && h > 0 && h <= cfg.reminderHours) {
      notify(db, b.memberId, 'Sắp đến buổi PT', `Buổi PT với HLV ${userById(db, b.trainerId)?.fullName} lúc ${fmtDateTime(b.startAt)}.`, 'info', '/member/bookings', `rem_${b.id}`);
      notify(db, b.trainerId, 'Sắp đến lịch hẹn 1-kèm-1', `Buổi PT với ${userById(db, b.memberId)?.fullName} lúc ${fmtDateTime(b.startAt)}.`, 'info', '/trainer/requests', `rem_t_${b.id}`);
    }
  }

  // nhắc gói sắp hết hạn
  for (const m of db.memberships) {
    if (m.payStatus !== 'paid') continue;
    const left = diffDays(today, m.endDate);
    const hasNext = db.memberships.some((x) => x.memberId === m.memberId && x.payStatus === 'paid' && x.startDate > m.endDate);
    if (left >= 0 && left <= cfg.expiryWarningDays && !hasNext) {
      const plan = planById(db, m.planId);
      notify(db, m.memberId, 'Gói hội viên sắp hết hạn', `Gói ${plan?.name} hết hạn ngày ${fmtDate(m.endDate)} (còn ${left} ngày). Gia hạn ngay để không gián đoạn.`, 'warning', '/member/memberships', `exp_${m.id}_${m.endDate}`);
    }
  }
  for (const p of db.ptPackages) {
    if (p.payStatus !== 'paid' || p.endDate < today) continue;
    const left = diffDays(today, p.endDate);
    const remain = p.sessionsTotal - p.sessionsUsed;
    const plan = ptPlanById(db, p.ptPlanId);
    if (remain > 0 && left <= cfg.expiryWarningDays)
      notify(db, p.memberId, 'Gói PT sắp hết hạn', `Gói ${plan?.name} hết hạn ${fmtDate(p.endDate)}, còn ${remain} buổi chưa dùng.`, 'warning', '/member/memberships', `ptexp_${p.id}`);
    if (remain > 0 && remain <= cfg.ptLowSessions)
      notify(db, p.memberId, 'Gói PT sắp hết buổi', `Gói ${plan?.name} chỉ còn ${remain} buổi.`, 'warning', '/member/memberships', `ptlow_${p.id}_${remain}`);
  }

  // tự động check-out vào giờ đóng cửa
  for (const c of db.checkins) {
    if (c.result !== 'success' || c.checkOutAt) continue;
    const br = branchById(db, c.branchId);
    if (!br) continue;
    const close = atTime(dateOf(c.checkInAt), br.closeTime);
    if (new Date(close).getTime() < now) {
      c.checkOutAt = close;
      c.checkoutMethod = 'auto';
    }
  }
}

export const planColor = (p?: MembershipPlan) => p?.color ?? '#7c5cff';
export type { ClassSession };
