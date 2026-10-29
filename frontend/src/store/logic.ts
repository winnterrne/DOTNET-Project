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
  CardStatus,
  MemberCardRecord,
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
/*  Auth & Member Cards                                                */
/* ------------------------------------------------------------------ */
const COLORS = ['#7c5cff', '#ff5c8a', '#00c2a8', '#ffb020', '#3fa9ff', '#ff7a45', '#a259ff', '#2ed47a'];
const CARD_ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

/**
 * Sinh Card_Code ngẫu nhiên, duy nhất, không đoán được (Cryptographically random).
 * Định dạng: DF-XXXX-XXXX
 */
export function generateUniqueCardCode(db: DB): string {
  const makeCode = (): string => {
    const bytes = new Uint8Array(8);
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      crypto.getRandomValues(bytes);
    } else {
      for (let i = 0; i < 8; i++) bytes[i] = Math.floor(Math.random() * 256);
    }
    let p1 = '';
    let p2 = '';
    for (let i = 0; i < 4; i++) p1 += CARD_ALPHABET[bytes[i] % CARD_ALPHABET.length];
    for (let i = 4; i < 8; i++) p2 += CARD_ALPHABET[bytes[i] % CARD_ALPHABET.length];
    return `DF-${p1}-${p2}`;
  };

  let candidate = makeCode();
  const exists = (code: string) =>
    db.users.some((u) => u.cardCode?.toUpperCase() === code) ||
    (db.memberCards ?? []).some((c) => c.cardCode.toUpperCase() === code);

  while (exists(candidate)) {
    candidate = makeCode();
  }
  return candidate;
}

export function ensureMemberCards(db: DB): MemberCardRecord[] {
  if (!db.memberCards) {
    db.memberCards = [];
  }
  for (const u of db.users) {
    if (u.role !== 'member') continue;
    const cards = db.memberCards.filter((c) => c.memberId === u.id);
    if (cards.length === 0) {
      const code = u.cardCode || generateUniqueCardCode(db);
      const status: CardStatus = u.cardStatus || 'ACTIVE';
      u.cardCode = code;
      u.cardStatus = status;
      db.memberCards.push({
        id: `mc_${u.id}_init`,
        memberId: u.id,
        cardCode: code,
        status,
        issuedAt: u.createdAt || nowIso(),
        reason: 'Cấp thẻ hội viên ban đầu',
      });
    } else {
      const primary =
        cards.find((c) => c.status === 'ACTIVE') ??
        cards.find((c) => c.status === 'LOCKED') ??
        cards[0];
      u.cardCode = primary.cardCode;
      u.cardStatus = primary.status;
    }
  }
  return db.memberCards;
}

export function memberCardsOf(db: DB, memberId: string): MemberCardRecord[] {
  const list = ensureMemberCards(db).filter((c) => c.memberId === memberId);
  const rank: Record<CardStatus, number> = { ACTIVE: 3, LOCKED: 2, LOST: 1 };
  return [...list].sort(
    (a, b) => rank[b.status] - rank[a.status] || b.issuedAt.localeCompare(a.issuedAt),
  );
}

export function activeCardOf(db: DB, memberId: string): MemberCardRecord | undefined {
  return memberCardsOf(db, memberId)[0];
}

export function issueMemberCard(
  db: DB,
  opts: {
    memberId: string;
    staffId?: string;
    previousCardStatus?: 'LOCKED' | 'LOST';
    reason?: string;
  },
): MemberCardRecord {
  ensureMemberCards(db);
  const member = db.users.find((u) => u.id === opts.memberId && u.role === 'member') ?? fail('Không tìm thấy hội viên cần cấp thẻ');

  const oldTargetStatus: CardStatus =
    opts.previousCardStatus === 'LOST' ||
    opts.reason?.toLowerCase().includes('mất') ||
    opts.reason?.toLowerCase().includes('lost')
      ? 'LOST'
      : 'LOCKED';

  // Chuyển toàn bộ thẻ ACTIVE hiện tại của hội viên sang LOCKED hoặc LOST
  db.memberCards!
    .filter((c) => c.memberId === member.id)
    .forEach((c) => {
      if (c.status === 'ACTIVE') {
        c.status = oldTargetStatus;
      } else if (oldTargetStatus === 'LOST' && c.status === 'LOCKED') {
        c.status = 'LOST';
      }
    });

  const newCardCode = generateUniqueCardCode(db);
  const newCard: MemberCardRecord = {
    id: uid('mc'),
    memberId: member.id,
    cardCode: newCardCode,
    status: 'ACTIVE',
    issuedAt: nowIso(),
    issuedBy: opts.staffId,
    reason: opts.reason || 'Cấp thẻ hội viên mới tại quầy lễ tân',
  };

  db.memberCards!.unshift(newCard);
  member.cardCode = newCard.cardCode;
  member.cardStatus = 'ACTIVE';

  notify(
    db,
    member.id,
    'Đã cấp thẻ hội viên mới',
    `Thẻ hội viên mới của bạn (${newCard.cardCode}) đã được kích hoạt (ACTIVE). Các thẻ cũ đã tự động chuyển sang ${oldTargetStatus}.`,
    'success',
    '/member/card',
  );

  return newCard;
}

export function updateMemberCardStatus(
  db: DB,
  opts: {
    cardId: string;
    status: CardStatus;
    actorId: string;
    isStaff: boolean;
    reason?: string;
  },
): MemberCardRecord {
  ensureMemberCards(db);
  let card = db.memberCards!.find((c) => c.id === opts.cardId);
  if (!card) {
    // Fallback nếu truyền memberId
    card = activeCardOf(db, opts.cardId);
  }
  if (!card) fail('Không tìm thấy thẻ hội viên');

  // Phân quyền: Hội viên chỉ được đặt LOST cho thẻ của chính mình
  if (!opts.isStaff) {
    if (card.memberId !== opts.actorId) {
      fail('Bạn chỉ có quyền thao tác trên thẻ hội viên của chính mình');
    }
    if (opts.status !== 'LOST') {
      fail('Hội viên chỉ được phép báo mất thẻ (LOST) cho thẻ của mình. Vui lòng liên hệ Lễ tân nếu cần mở khóa hoặc cấp thẻ mới');
    }
  }

  // State machine: Thẻ đã LOST bị vô hiệu hóa vĩnh viễn
  if (card.status === 'LOST' && opts.status !== 'LOST') {
    fail('Thẻ đã báo mất (LOST) bị vô hiệu hóa vĩnh viễn và không thể kích hoạt lại. Vui lòng sử dụng chức năng Cấp thẻ mới');
  }

  // Nếu mở khóa thẻ thành ACTIVE, các thẻ ACTIVE khác của hội viên chuyển sang LOCKED
  if (opts.status === 'ACTIVE') {
    db.memberCards!
      .filter((c) => c.memberId === card!.memberId && c.id !== card!.id && c.status === 'ACTIVE')
      .forEach((c) => {
        c.status = 'LOCKED';
      });
  }

  card.status = opts.status;
  if (opts.reason) card.reason = opts.reason;

  const member = db.users.find((u) => u.id === card!.memberId);
  if (member) {
    const primary = activeCardOf(db, member.id);
    if (primary) {
      member.cardCode = primary.cardCode;
      member.cardStatus = primary.status;
    }

    if (opts.status === 'LOST') {
      notify(
        db,
        member.id,
        'Thẻ hội viên đã báo mất (LOST)',
        `Thẻ ${card.cardCode} đã được chuyển sang trạng thái LOST và vô hiệu hóa hoàn toàn. Vui lòng liên hệ quầy lễ tân để được cấp thẻ mới.`,
        'danger',
        '/member/card',
      );
      if (!opts.isStaff) {
        notifyRole(
          db,
          'receptionist',
          'Hội viên báo mất thẻ',
          `Hội viên ${member.fullName} vừa báo mất thẻ ${card.cardCode}. Vui lòng kiểm tra và cấp thẻ mới tại quầy.`,
          'warning',
          '/staff/member-cards',
        );
      }
    } else if (opts.status === 'LOCKED') {
      notify(
        db,
        member.id,
        'Thẻ hội viên đã bị tạm khóa (LOCKED)',
        `Thẻ ${card.cardCode} của bạn đã bị tạm khóa.${opts.reason ? ` Lý do: ${opts.reason}` : ''}`,
        'warning',
        '/member/card',
      );
    } else if (opts.status === 'ACTIVE') {
      notify(
        db,
        member.id,
        'Thẻ hội viên đã được mở khóa (ACTIVE)',
        `Thẻ ${card.cardCode} của bạn đã được kích hoạt lại và sử dụng bình thường.`,
        'success',
        '/member/card',
      );
    }
  }

  return card;
}

export function register(
  db: DB,
  data: {
    fullName: string;
    email: string;
    phone: string;
    password: string;
    gender: User['gender'];
    dob: string;
    role?: 'member' | 'trainer';
    branchId?: string;
    specialty?: string;
    experienceYears?: number;
  },
) {
  if (db.users.some((u) => u.email.toLowerCase() === data.email.toLowerCase())) fail('Email đã được sử dụng');
  if (data.password.length < 6) fail('Mật khẩu tối thiểu 6 ký tự');
  const targetRole = data.role === 'trainer' ? 'trainer' : 'member';
  if (targetRole === 'trainer' && !data.branchId) {
    fail('Đăng ký Huấn luyện viên bắt buộc phải chọn Chi nhánh làm việc');
  }
  const initialCardCode = targetRole === 'member' ? generateUniqueCardCode(db) : undefined;
  const user: User = {
    id: uid('u'),
    role: targetRole,
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
    branchId: targetRole === 'trainer' ? data.branchId : undefined,
    cardCode: initialCardCode,
    cardStatus: targetRole === 'member' ? 'ACTIVE' : undefined,
    trainer:
      targetRole === 'trainer'
        ? {
            specialties: (data.specialty || 'Gym, Fitness').split(',').map((s) => s.trim()).filter(Boolean),
            experienceYears: data.experienceYears ?? 2,
            certifications: ['Chứng chỉ HLV Thể hình'],
            bio: 'Huấn luyện viên cá nhân tại DFGymCenter',
            branchIds: data.branchId ? [data.branchId] : [],
          }
        : undefined,
  };
  db.users.push(user);
  if (targetRole === 'member' && initialCardCode) {
    if (!db.memberCards) db.memberCards = [];
    db.memberCards.unshift({
      id: uid('mc'),
      memberId: user.id,
      cardCode: initialCardCode,
      status: 'ACTIVE',
      issuedAt: user.createdAt,
      reason: 'Tự động cấp thẻ khi đăng ký tài khoản',
    });
  }
  notify(
    db,
    user.id,
    'Chào mừng đến DFGymCenter!',
    targetRole === 'trainer'
      ? 'Hãy cập nhật hồ sơ chuyên môn và lịch rảnh PT của bạn.'
      : 'Hãy cập nhật hồ sơ và chỉ số cơ thể ban đầu, sau đó chọn gói tập phù hợp.',
    'success',
    targetRole === 'trainer' ? '/trainer/profile' : '/member/profile',
  );
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
  if (u.role === 'member' && !u.cardCode) {
    u.cardCode = generateUniqueCardCode(db);
    u.cardStatus = 'ACTIVE';
    if (!db.memberCards) db.memberCards = [];
    db.memberCards.unshift({
      id: uid('mc'),
      memberId: u.id,
      cardCode: u.cardCode,
      status: 'ACTIVE',
      issuedAt: u.createdAt,
      reason: 'Cấp thẻ hội viên mới',
    });
  }
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
  const trainer = userById(db, trainerId) ?? fail('Không tìm thấy huấn luyện viên');
  const branch = branchById(db, branchId) ?? fail('Không tìm thấy chi nhánh');
  
  // Quy tắc 1: Chi nhánh được phân công
  if (trainer.trainer?.branchIds && trainer.trainer.branchIds.length > 0 && !trainer.trainer.branchIds.includes(branchId)) {
    fail(`Bạn không được phân công dạy tại chi nhánh ${branch.name}`);
  }

  // Quy tắc 2: Thời lượng chuẩn
  if (![45, 60, 90].includes(durationMin)) {
    fail('Thời lượng ca dạy phải là 45 phút, 60 phút hoặc 90 phút theo quy định');
  }

  const startAt = atTime(date, start);
  const endAt = new Date(new Date(startAt).getTime() + durationMin * 60000).toISOString();
  const startTimeMs = new Date(startAt).getTime();
  const now = Date.now();

  // Quy tắc 3: Không mở lịch trong quá khứ và phải trước tối thiểu 2 giờ
  if (startTimeMs <= now) fail('Không thể thêm khung giờ trong quá khứ');
  if (startTimeMs - now < 2 * 3600000) {
    fail('Theo quy định phòng gym, khung giờ rảnh phải được mở trước giờ bắt đầu ít nhất 2 tiếng để hội viên kịp đăng ký');
  }

  // Quy tắc 4: Phải nằm trong khung giờ mở/đóng cửa của chi nhánh
  if (branch.openTime && branch.closeTime) {
    const endMinutes = +start.slice(0, 2) * 60 + +start.slice(3, 5) + durationMin;
    const endHH = String(Math.floor(endMinutes / 60)).padStart(2, '0');
    const endMM = String(endMinutes % 60).padStart(2, '0');
    const endTimeStr = `${endHH}:${endMM}`;
    if (start < branch.openTime || endTimeStr > branch.closeTime) {
      fail(`Khung giờ phải nằm trong thời gian hoạt động của chi nhánh (${branch.openTime} – ${branch.closeTime})`);
    }
  }

  // Quy tắc 5: Giới hạn tối đa 8 ca dạy trong 1 ngày
  const slotsInDay = db.trainerSlots.filter((s) => s.trainerId === trainerId && s.startAt.startsWith(date)).length;
  if (slotsInDay >= 8) {
    fail('Bạn đã mở tối đa 8 ca trong ngày này. Quy định phòng gym giới hạn tối đa 8 ca/ngày để đảm bảo thể lực và chất lượng huấn luyện.');
  }

  // Quy tắc 6: Chống trùng lịch rảnh & lớp nhóm
  const overlap = db.trainerSlots.some((s) => s.trainerId === trainerId && s.startAt < endAt && startAt < s.endAt);
  if (overlap) fail('Trùng với khung giờ rảnh đã có của bạn');
  const clash = db.sessions.some((s) => s.trainerId === trainerId && s.status === 'scheduled' && s.startAt < endAt && startAt < s.endAt);
  if (clash) fail('Trùng với lịch dạy lớp nhóm của bạn');

  db.trainerSlots.push({ id: uid('slot'), trainerId, branchId, startAt, endAt });
}

/* ------------------------------------------------------------------ */
/*  AI Nutrition Advisory Calculation                                  */
/* ------------------------------------------------------------------ */
export interface NutritionPlanResult {
  bmr: number;
  tdee: number;
  targetCalories: number;
  deficitOrSurplus: number;
  macros: { protein: number; carbs: number; fat: number };
  waterLiters: number;
  goalLabel: string;
  meals: {
    name: string;
    time: string;
    calories: number;
    description: string;
    items: string[];
  }[];
  tips: string[];
}

export function calculateNutritionPlan(opts: {
  gender: 'male' | 'female' | 'other';
  age: number;
  weight: number;
  height: number;
  bodyFat?: number;
  goal: 'lose_fat' | 'build_muscle' | 'maintain' | 'endurance';
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'high';
  dietStyle: 'eat_clean' | 'high_protein' | 'vegetarian' | 'low_carb';
}): NutritionPlanResult {
  const { gender, age, weight, height, goal, activityLevel, dietStyle } = opts;

  // BMR (Mifflin-St Jeor formula)
  let bmr = 10 * weight + 6.25 * height - 5 * age;
  bmr = gender === 'female' ? bmr - 161 : bmr + 5;
  bmr = Math.round(bmr);

  // Activity multipliers
  const actMultipliers = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    high: 1.725,
  };
  const tdee = Math.round(bmr * (actMultipliers[activityLevel] || 1.4));

  // Goal calorie adjustment
  let targetCalories = tdee;
  let deficitOrSurplus = 0;
  let goalLabel = 'Duy trì cân nặng & Tăng cường thể lực';

  if (goal === 'lose_fat') {
    deficitOrSurplus = -500;
    targetCalories = Math.max(1200, tdee - 500);
    goalLabel = 'Giảm mỡ & Siết cơ (Fat Loss & Cut)';
  } else if (goal === 'build_muscle') {
    deficitOrSurplus = 350;
    targetCalories = tdee + 350;
    goalLabel = 'Tăng cơ nạc (Lean Bulking)';
  } else if (goal === 'endurance') {
    deficitOrSurplus = 150;
    targetCalories = tdee + 150;
    goalLabel = 'Tăng sức bền & Thể lực tim mạch';
  }

  // Protein grams
  const proteinMultiplier = goal === 'build_muscle' ? 2.2 : goal === 'lose_fat' ? 2.0 : 1.8;
  const protein = Math.round(weight * proteinMultiplier);
  const proteinCals = protein * 4;

  // Fat (25-30% of target calories)
  const fatCals = Math.round(targetCalories * (dietStyle === 'low_carb' ? 0.35 : 0.25));
  const fat = Math.round(fatCals / 9);

  // Remaining cals from carbs
  const carbCals = Math.max(0, targetCalories - proteinCals - fatCals);
  const carbs = Math.round(carbCals / 4);

  // Water: 40ml per kg weight + 0.5L for training
  const waterLiters = +(weight * 0.04 + 0.5).toFixed(1);

  // Diet-specific meal blueprints
  const mealsByStyle: Record<string, NutritionPlanResult['meals']> = {
    eat_clean: [
      {
        name: 'Bữa sáng khởi động',
        time: '07:00 - 07:30',
        calories: Math.round(targetCalories * 0.25),
        description: 'Cung cấp năng lượng sạch, đường hấp thu chậm và đạm nạc',
        items: ['Yến mạch nấu sữa hạnh nhân / sữa chua Hy Lạp', '3 lòng trắng trứng + 1 quả trứng ốp la', '1/2 quả chuối + hạt chia'],
      },
      {
        name: 'Bữa phụ trước tập (Pre-workout)',
        time: '10:00 hoặc trước tập 45p',
        calories: Math.round(targetCalories * 0.1),
        description: 'Tăng glycogen cơ bắp, hỗ trợ tỉnh táo và chống mỏi cơ',
        items: ['1 lát bánh mì đen nguyên cám quết bơ đậu phộng', '1 quả táo xanh / chuối', '1 ly cà phê đen không đường / BCAA'],
      },
      {
        name: 'Bữa trưa phục hồi',
        time: '12:00 - 12:45',
        calories: Math.round(targetCalories * 0.35),
        description: 'Bữa chính cân bằng đầy đủ đạm, tinh bột phức và chất xơ',
        items: ['150g ức gà áp chảo hoặc cá hồi nướng', '1 chén cơm gạo lứt / khoai lang luộc', 'Rau củ luộc (bông cải xanh, măng tây, cà rốt)'],
      },
      {
        name: 'Bữa phụ chiều (Post-workout)',
        time: '16:00 - 16:30',
        calories: Math.round(targetCalories * 0.1),
        description: 'Nạp protein hấp thu nhanh giúp phục hồi sợi cơ bị tổn thương',
        items: ['1 muỗng Whey Protein Isolate pha nước mát', '1 nắm hạt hạnh nhân hoặc óc chó (25g)'],
      },
      {
        name: 'Bữa tối nhẹ bụng & Tái tạo',
        time: '19:00 - 19:30',
        calories: Math.round(targetCalories * 0.2),
        description: 'Giảm tinh bột, tăng chất xơ và đạm nạc giúp giấc ngủ sâu',
        items: ['150g tôm hấp hoặc thăn bò nướng', 'Đĩa xà lách trộn dầu olive và giấm táo', 'Canh rau củ thanh đạm'],
      },
    ],
    high_protein: [
      {
        name: 'Bữa sáng giàu đạm',
        time: '07:00',
        calories: Math.round(targetCalories * 0.25),
        description: 'Kích hoạt đồng hóa protein ngay sau khi thức dậy',
        items: ['Trứng cuộn 4 trứng (2 nguyên, 2 lòng trắng)', '2 lát bánh mì ngũ cốc nguyên hạt', 'Ly sữa tươi tiệt trùng không đường'],
      },
      {
        name: 'Bữa phụ sáng',
        time: '10:00',
        calories: Math.round(targetCalories * 0.1),
        description: 'Duy trì nồng độ Amino Acid trong máu',
        items: ['1 hũ sữa chua Hy Lạp nguyên chất (15g protein)', 'Hạt điều rang sấy tự nhiên'],
      },
      {
        name: 'Bữa trưa tăng cơ',
        time: '12:30',
        calories: Math.round(targetCalories * 0.35),
        description: 'Tối ưu hóa tổng hợp cơ bắp với thịt đỏ và carb sạch',
        items: ['180g bò bít tết hoặc phi lê gà', '1 củ khoai tây nướng hoặc 1 chén cơm lứt', 'Xà lách xốt mè rang'],
      },
      {
        name: 'Bữa phục hồi sau tập',
        time: '16:30',
        calories: Math.round(targetCalories * 0.1),
        description: 'Bổ sung ngay sau buổi tập kháng lực',
        items: ['1 muỗng Whey Protein + 1 quả chuối sứ chín'],
      },
      {
        name: 'Bữa tối tái tạo',
        time: '19:30',
        calories: Math.round(targetCalories * 0.2),
        description: 'Đạm hấp thu chậm giúp nuôi cơ suốt đêm',
        items: ['160g cá ngừ / cá chẽm áp chảo', 'Bông cải xanh xào tỏi dầu oliu', 'Súp nấm thanh đạm'],
      },
    ],
    vegetarian: [
      {
        name: 'Bữa sáng thực vật',
        time: '07:00',
        calories: Math.round(targetCalories * 0.25),
        description: 'Nguồn đạm từ hạt, đậu và yến mạch hữu cơ',
        items: ['Sinh tố yến mạch, bột protein thực vật, sữa hạt điều', 'Bánh mì đen kẹp bơ quả và dưa leo'],
      },
      {
        name: 'Bữa phụ trước tập',
        time: '10:00',
        calories: Math.round(targetCalories * 0.1),
        description: 'Tăng cường năng lượng tự nhiên',
        items: ['1 quả chuối + 2 muỗng bơ đậu phộng nguyên chất', 'Hạt chia ngâm nước dừa'],
      },
      {
        name: 'Bữa trưa chay năng động',
        time: '12:30',
        calories: Math.round(targetCalories * 0.35),
        description: 'Kết hợp các loại đậu và ngũ cốc để đủ axit amin thiết yếu',
        items: ['Đậu hũ áp chảo sốt cà chua nấm đông cô', '1 chén cơm gạo lứt trộn đậu gà và đậu lăng', 'Canh rong biển đậu hũ non'],
      },
      {
        name: 'Bữa phụ phục hồi',
        time: '16:30',
        calories: Math.round(targetCalories * 0.1),
        description: 'Nạp protein thực vật tinh khiết',
        items: ['1 ly sữa đậu nành tươi không đường', 'Hạt óc chó và hạnh nhân (30g)'],
      },
      {
        name: 'Bữa tối thuần khiết',
        time: '19:30',
        calories: Math.round(targetCalories * 0.2),
        description: 'Nhẹ bụng, giàu chất chống oxy hóa',
        items: ['Tempeh / Đậu nành lên men áp chảo', 'Salad rau củ sốt chanh dây', 'Bí đỏ hấp hạt sen'],
      },
    ],
    low_carb: [
      {
        name: 'Bữa sáng Keto/Low-Carb',
        time: '07:00',
        calories: Math.round(targetCalories * 0.3),
        description: 'Chất béo lành mạnh và protein cao, carb dưới 5g',
        items: ['3 quả trứng bác bơ tỏi', '3 lát thịt xông khói áp chảo giòn', '1/2 quả bơ sáp cắt lát'],
      },
      {
        name: 'Bữa trưa năng lượng bền bỉ',
        time: '12:30',
        calories: Math.round(targetCalories * 0.35),
        description: 'Chuyển hóa mỡ thành năng lượng hoạt động',
        items: ['200g cá hồi áp chảo sốt kem bơ chanh', 'Măng tây và bông cải trắng xào dầu olive', 'Salad rau bina với hạt hướng dương'],
      },
      {
        name: 'Bữa phụ chiều',
        time: '16:30',
        calories: Math.round(targetCalories * 0.1),
        description: 'Chống đói và duy trì trạng thái Ketosis',
        items: ['Phô mai sợi / Phô mai miếng Cheddar', 'Hạt mắc ca hoặc hạnh nhân (30g)'],
      },
      {
        name: 'Bữa tối giàu đạm sạch',
        time: '19:30',
        calories: Math.round(targetCalories * 0.25),
        description: 'Protein nạc và rau lá xanh đậm',
        items: ['180g đùi gà nướng thảo mộc', 'Salad bắp cải tím trộn giấm dầu oliu', 'Canh nấm thịt băm'],
      },
    ],
  };

  const meals = mealsByStyle[dietStyle] || mealsByStyle.eat_clean;

  const tips = [
    `💧 Uống đủ ${waterLiters} lít nước mỗi ngày; uống 250ml nước trước buổi tập 30 phút.`,
    '⏰ Bữa ăn trước tập nên cách giờ tập 60 - 90 phút để hệ tiêu hóa làm việc ổn định, tránh trào ngược.',
    '🥩 Đảm bảo nạp đủ lượng Protein mục tiêu hàng ngày để cơ bắp phục hồi và phát triển tối đa.',
    '😴 Ngủ đủ 7 - 8 tiếng mỗi đêm; 80% quá trình đốt mỡ và xây dựng mô cơ diễn ra khi cơ thể trong giấc ngủ sâu.',
    '🥗 Luôn ăn rau củ trước bữa ăn chính để bổ sung chất xơ và kiểm soát nồng độ đường huyết sau ăn.',
  ];

  return {
    bmr,
    tdee,
    targetCalories,
    deficitOrSurplus,
    macros: { protein, carbs, fat },
    waterLiters,
    goalLabel,
    meals,
    tips,
  };
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
  ensureMemberCards(db);
  const code = opts.code.trim().toLowerCase();
  const matchedCard = db.memberCards?.find((c) => c.cardCode.toLowerCase() === code);
  const member =
    (matchedCard ? db.users.find((u) => u.id === matchedCard.memberId) : undefined) ??
    db.users.find(
      (u) =>
        u.role === 'member' &&
        (u.cardCode?.toLowerCase() === code ||
          u.email.toLowerCase() === code ||
          u.phone === opts.code.trim() ||
          u.id === opts.code),
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
  if (opts.method === 'card') {
    const targetCard = matchedCard ?? activeCardOf(db, member!.id);
    if (targetCard?.status === 'LOST') {
      return deny(`Thẻ hội viên (${targetCard.cardCode}) đã báo mất (LOST) và bị vô hiệu hóa. Vui lòng liên hệ lễ tân để cấp thẻ mới.`);
    }
    if (targetCard?.status === 'LOCKED') {
      return deny(`Thẻ hội viên (${targetCard.cardCode}) đang bị khóa (LOCKED). Vui lòng liên hệ lễ tân để mở khóa hoặc cấp thẻ mới.`);
    }
  }
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
