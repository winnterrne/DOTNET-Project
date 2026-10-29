import type { DB, User, MemberMembership, Payment, CheckIn, ClassBooking, PTBooking, TrainerSlot, Equipment, PaymentMethod } from '../types';
import { todayStr, addDays, addMonths, atTime, toDateStr } from '../utils';
import { ensureSessions } from './logic';

/** PRNG có seed để dữ liệu demo ổn định */
function rng(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
}

export function createSeed(): DB {
  const r = rng(42);
  const pick = <T,>(a: T[]) => a[Math.floor(r() * a.length)];
  const T = todayStr();
  const iso = (date: string, hhmm = '09:00') => atTime(date, hhmm);
  let n = 0;
  const id = (p: string) => `${p}_${(++n).toString(36)}`;

  const db: DB = {
    version: 1,
    users: [],
    branches: [
      { id: 'br1', name: 'DFGym Quận 1', address: '45 Lê Lợi, Phường Bến Nghé, Quận 1, TP.HCM', phone: '028 3822 1111', openTime: '05:30', closeTime: '22:00', rooms: ['Phòng Yoga', 'Phòng Cycling', 'Studio A', 'Khu PT'], active: true },
      { id: 'br2', name: 'DFGym Quận 7', address: '128 Nguyễn Lương Bằng, Phú Mỹ Hưng, Quận 7, TP.HCM', phone: '028 3999 2222', openTime: '05:00', closeTime: '23:00', rooms: ['Studio B', 'Phòng Boxing', 'Phòng Yoga', 'Khu PT'], active: true },
      { id: 'br3', name: 'DFGym Bình Thạnh', address: '215 Điện Biên Phủ, Phường 15, Quận Bình Thạnh, TP.HCM', phone: '028 3512 3333', openTime: '06:00', closeTime: '22:00', rooms: ['Phòng Yoga', 'Studio C', 'Khu PT'], active: true },
      { id: 'br4', name: 'DFGym Quận 3', address: '190 Võ Văn Tần, Phường 5, Quận 3, TP.HCM', phone: '028 3930 4444', openTime: '05:30', closeTime: '22:00', rooms: ['Phòng Yoga', 'Studio A', 'Khu PT'], active: true },
      { id: 'br5', name: 'DFGym Phú Nhuận', address: '86 Phan Xích Long, Phường 2, Quận Phú Nhuận, TP.HCM', phone: '028 3995 5555', openTime: '06:00', closeTime: '22:00', rooms: ['Studio A', 'Phòng Cycling', 'Khu PT'], active: true },
    ],
    equipment: [],
    equipmentReports: [],
    membershipPlans: [
      { id: 'mp_basic_cg', name: 'Basic Quận 1', durationMonths: 1, price: 550000, priority: 1, branchScope: ['br1'], freePTSessions: 0, maxFreezeTimes: 0, maxFreezeDays: 0, classBookingsPerWeek: 3, description: 'Gói tháng tiết kiệm, tập tại chi nhánh Quận 1.', benefits: ['Tập tại cơ sở Quận 1', '3 lượt lớp nhóm/tuần', 'Tủ đồ miễn phí'], color: '#3fa9ff', active: true },
      { id: 'mp_basic_q1', name: 'Basic Quận 7', durationMonths: 1, price: 600000, priority: 1, branchScope: ['br2'], freePTSessions: 0, maxFreezeTimes: 0, maxFreezeDays: 0, classBookingsPerWeek: 3, description: 'Gói tháng tiết kiệm, tập tại chi nhánh Quận 7 (Phú Mỹ Hưng).', benefits: ['Tập tại cơ sở Quận 7', '3 lượt lớp nhóm/tuần', 'Tủ đồ miễn phí'], color: '#00c2a8', active: true },
      { id: 'mp_standard', name: 'Standard 3 tháng', durationMonths: 3, price: 1500000, priority: 2, branchScope: 'all', freePTSessions: 0, maxFreezeTimes: 1, maxFreezeDays: 15, classBookingsPerWeek: 5, description: 'Tập chéo mọi chi nhánh tại TP.HCM, phù hợp người mới.', benefits: ['Tập chéo toàn hệ thống TP.HCM', '5 lượt lớp nhóm/tuần', 'Freeze 1 lần, tối đa 15 ngày'], color: '#7c5cff', active: true },
      { id: 'mp_premium', name: 'Premium 12 tháng', durationMonths: 12, price: 5200000, priority: 2, branchScope: 'all', freePTSessions: 2, maxFreezeTimes: 3, maxFreezeDays: 60, classBookingsPerWeek: 0, description: 'Cam kết dài hạn với mức giá tốt nhất.', benefits: ['Tập chéo toàn hệ thống TP.HCM', 'Không giới hạn lớp nhóm', 'Tặng 2 buổi PT', 'Freeze 3 lần, tối đa 60 ngày'], color: '#ffb020', active: true },
      { id: 'mp_vip', name: 'VIP 6 tháng', durationMonths: 6, price: 6900000, priority: 3, branchScope: 'all', freePTSessions: 6, maxFreezeTimes: 2, maxFreezeDays: 30, classBookingsPerWeek: 0, description: 'Trải nghiệm cao cấp, ưu tiên cao nhất khi xếp lớp.', benefits: ['Tập chéo toàn hệ thống TP.HCM', 'Không giới hạn lớp nhóm', 'Tặng 6 buổi PT 1-kèm-1', 'Ưu tiên cao nhất danh sách chờ', 'Freeze 2 lần, tối đa 30 ngày', 'Khăn & nước miễn phí'], color: '#ff5c8a', active: true },
    ],
    ptPlans: [
      { id: 'pt5', name: 'PT Starter 5 buổi', sessions: 5, validityDays: 30, price: 1750000, branchScope: 'all', description: 'Làm quen kỹ thuật, xây dựng giáo án cá nhân.', active: true },
      { id: 'pt10', name: 'PT Pro 10 buổi', sessions: 10, validityDays: 60, price: 3200000, branchScope: 'all', description: 'Lộ trình giảm mỡ/tăng cơ trong 2 tháng.', active: true },
      { id: 'pt20', name: 'PT Elite 20 buổi', sessions: 20, validityDays: 120, price: 5800000, branchScope: 'all', description: 'Thay đổi toàn diện, theo sát dinh dưỡng.', active: true },
      { id: 'pt8_q1', name: 'PT Boxing Quận 7 (8 buổi)', sessions: 8, validityDays: 45, price: 2600000, branchScope: ['br2'], description: 'Chuyên sâu Boxing & Kickfit tại cơ sở Quận 7.', active: true },
    ],
    memberships: [],
    ptPackages: [],
    freezeRequests: [],
    payments: [],
    classes: [],
    sessions: [],
    classBookings: [],
    trainerSlots: [],
    ptBookings: [],
    checkins: [],
    bodyMetrics: [],
    reviews: [],
    notifications: [],
    memberCards: [],
    settings: { reminderHours: 2, cancelDeadlineHours: 4, waitlistCutoffHours: 8, expiryWarningDays: 7, ptLowSessions: 2 },
  };

  const base = (u: Partial<User> & Pick<User, 'id' | 'role' | 'email' | 'fullName'>): User => ({
    password: '123456',
    phone: '09' + Math.floor(10000000 + r() * 89999999),
    gender: 'male',
    dob: '1995-05-12',
    address: 'Việt Nam',
    avatarColor: pick(['#7c5cff', '#ff5c8a', '#00c2a8', '#ffb020', '#3fa9ff', '#ff7a45', '#a259ff', '#2ed47a']),
    locked: false,
    createdAt: iso(addDays(T, -400)),
    ...u,
  });

  db.users.push(
    base({ id: 'admin', role: 'admin', email: 'admin@dfgym.vn', fullName: 'Trần Quản Trị', gender: 'male' }),
    base({ id: 'rc1', role: 'receptionist', email: 'letan@dfgym.vn', fullName: 'Lê Thu Hằng', gender: 'female', branchId: 'br1' }),
    base({ id: 'rc2', role: 'receptionist', email: 'letan2@dfgym.vn', fullName: 'Phạm Quốc Bảo', branchId: 'br2' }),
    base({ id: 'rc3', role: 'receptionist', email: 'letan3@dfgym.vn', fullName: 'Võ Ngọc Trâm', gender: 'female', branchId: 'br3' }),
    base({ id: 'tr1', role: 'trainer', email: 'pt@dfgym.vn', fullName: 'Hoàng Đức Minh', trainer: { specialties: ['Tăng cơ', 'HIIT', 'Cycling'], experienceYears: 7, certifications: ['ACE CPT', 'NASM CES'], bio: 'Cựu VĐV thể hình TP.HCM, chuyên xây dựng lộ trình tăng cơ – giảm mỡ khoa học.', branchIds: ['br1', 'br2', 'br5'] } }),
    base({ id: 'tr2', role: 'trainer', email: 'pt.lan@dfgym.vn', fullName: 'Nguyễn Ngọc Lan', gender: 'female', trainer: { specialties: ['Yoga', 'Body Pump', 'Phục hồi'], experienceYears: 5, certifications: ['RYT-500 Yoga Alliance'], bio: 'Huấn luyện viên Yoga với 5 năm kinh nghiệm, tập trung vào sự linh hoạt và hơi thở.', branchIds: ['br1', 'br4'] } }),
    base({ id: 'tr3', role: 'trainer', email: 'pt.hung@dfgym.vn', fullName: 'Đặng Văn Hùng', trainer: { specialties: ['Boxing', 'Zumba', 'Giảm mỡ'], experienceYears: 9, certifications: ['ISSA CPT', 'Zumba B1'], bio: 'Nhiệt huyết, vui vẻ, chuyên cardio cường độ cao và võ thuật thể hình.', branchIds: ['br2', 'br3'] } }),
    base({ id: 'tr4', role: 'trainer', email: 'pt.thao@dfgym.vn', fullName: 'Trương Phương Thảo', gender: 'female', trainer: { specialties: ['Pilates', 'Core', 'Tư thế'], experienceYears: 4, certifications: ['STOTT Pilates'], bio: 'Chuyên Pilates và cải thiện tư thế cho dân văn phòng.', branchIds: ['br3', 'br4', 'br5'] } }),
  );

  const memberNames: [string, string, User['gender']][] = [
    ['m1', 'Nguyễn Văn An', 'male'],
    ['m2', 'Lê Thị Bình', 'female'],
    ['m3', 'Phạm Minh Chi', 'female'],
    ['m4', 'Trần Quốc Dũng', 'male'],
    ['m5', 'Vũ Thị Em', 'female'],
    ['m6', 'Đỗ Hoàng Giang', 'male'],
    ['m7', 'Bùi Thu Hà', 'female'],
    ['m8', 'Ngô Đăng Khoa', 'male'],
    ['m9', 'Hồ Mỹ Linh', 'female'],
    ['m10', 'Lý Thanh Mai', 'female'],
    ['m11', 'Mai Tuấn Nam', 'male'],
    ['m12', 'Cao Bảo Ngọc', 'female'],
    ['m13', 'Tạ Quang Phúc', 'male'],
    ['m14', 'Kiều Diễm Quỳnh', 'female'],
    ['m15', 'Đinh Gia Sơn', 'male'],
    ['m16', 'Châu Ánh Tuyết', 'female'],
  ];
  const joinedAgo = [60, 120, 230, 190, 100, 45, 75, 95, 300, 260, 25, 150, 170, 12, 210, 140];
  const seedCardCodes = [
    'DF-9K4M-7P2X',
    'DF-3H8N-5W6Q',
    'DF-7T2V-4R9B',
    'DF-6C5J-8M3D',
    'DF-2P9L-6K4F',
    'DF-8W3G-2Y7N',
    'DF-4R7X-9B5T',
    'DF-5M6Q-3H8V',
    'DF-9D2K-7F4P',
    'DF-3N8B-5T6W',
    'DF-7Q4H-2V9M',
    'DF-6F5P-8K3R',
    'DF-2Y9T-4W7C',
    'DF-8B3M-6N5J',
    'DF-4V7R-9P2L',
    'DF-5K6D-3Q8X',
  ];
  memberNames.forEach(([mid, name, g], i) => {
    const code = seedCardCodes[i] || `DF-8A${i}K-9M${i}P`;
    const status = mid === 'm5' ? 'LOCKED' : mid === 'm8' ? 'LOST' : 'ACTIVE';
    const created = iso(addDays(T, -joinedAgo[i]));
    db.users.push(
      base({
        id: mid,
        role: 'member',
        email: mid === 'm1' ? 'hoivien@dfgym.vn' : `${mid}@mail.com`,
        fullName: name,
        gender: g,
        dob: `199${i % 10}-0${(i % 9) + 1}-1${i % 9}`,
        cardCode: code,
        cardStatus: status,
        createdAt: created,
        address: pick(['Quận 1, TP.HCM', 'Quận 3, TP.HCM', 'Quận 7, TP.HCM', 'Quận Bình Thạnh, TP.HCM', 'Quận Phú Nhuận, TP.HCM', 'TP. Thủ Đức, TP.HCM', 'Quận 10, TP.HCM']),
      }),
    );
    db.memberCards!.push({
      id: `mc_${mid}_1`,
      memberId: mid,
      cardCode: code,
      status,
      issuedAt: created,
      issuedBy: 'rc1',
      reason: status === 'LOST' ? 'Hội viên báo mất thẻ qua ứng dụng' : status === 'LOCKED' ? 'Tạm khóa thẻ theo yêu cầu xác minh' : 'Cấp thẻ hội viên',
    });
    if (mid === 'm1') {
      db.memberCards!.push({
        id: 'mc_m1_old',
        memberId: 'm1',
        cardCode: 'DF-4X2A-8L5K',
        status: 'LOST',
        issuedAt: iso(addDays(T, -58)),
        issuedBy: 'rc1',
        reason: 'Báo mất thẻ cũ, đã cấp lại thẻ mới DF-9K4M-7P2X',
      });
    }
  });

  /* ---------------- memberships & payments ---------------- */
  const methods: PaymentMethod[] = ['momo', 'vnpay', 'card', 'banking'];
  const addMs = (memberId: string, planId: string, start: string, branchId: string, opts: Partial<MemberMembership> = {}) => {
    const plan = db.membershipPlans.find((p) => p.id === planId)!;
    const m: MemberMembership = {
      id: id('ms'),
      memberId,
      planId,
      startDate: start,
      endDate: addDays(addMonths(start, plan.durationMonths), -1),
      payStatus: 'paid',
      freeSessionsTotal: plan.freePTSessions,
      freeSessionsUsed: 0,
      freezeCountUsed: 0,
      freezeDaysUsed: 0,
      isRenewal: false,
      createdAt: iso(start, '08:15'),
      ...opts,
    };
    db.memberships.push(m);
    const p: Payment = {
      id: id('pay'),
      memberId,
      kind: m.isRenewal ? 'renewal' : 'membership',
      refId: m.id,
      amount: plan.price,
      method: pick(methods),
      status: 'success',
      branchId,
      description: `${m.isRenewal ? 'Gia hạn' : 'Mua'} gói ${plan.name}`,
      createdAt: m.createdAt,
    };
    db.payments.push(p);
    return m;
  };
  const addPT = (memberId: string, planId: string, start: string, used: number, branchId: string) => {
    const plan = db.ptPlans.find((p) => p.id === planId)!;
    const pk = { id: id('pt'), memberId, ptPlanId: planId, sessionsTotal: plan.sessions, sessionsUsed: used, startDate: start, endDate: addDays(start, plan.validityDays - 1), payStatus: 'paid' as const, createdAt: iso(start, '10:00') };
    db.ptPackages.push(pk);
    db.payments.push({ id: id('pay'), memberId, kind: 'pt', refId: pk.id, amount: plan.price, method: pick(methods), status: 'success', branchId, description: `Mua gói PT ${plan.name}`, createdAt: pk.createdAt });
    return pk;
  };

  // m1 – VIP đang hoạt động (tài khoản demo chính)
  addMs('m1', 'mp_standard', addDays(T, -60), 'br1');
  const vipAn = addMs('m1', 'mp_vip', addDays(T, -29), 'br1', { freeSessionsUsed: 5, isRenewal: true, createdAt: iso(addDays(T, -32), '20:10') });
  const ptAn = addPT('m1', 'pt10', addDays(T, -8), 0, 'br1');
  db.payments.push({ id: id('pay'), memberId: 'm1', kind: 'pt', refId: 'pt_failed_demo', amount: 1750000, method: 'momo', status: 'failed', branchId: 'br1', description: 'Mua gói PT PT Starter 5 buổi', createdAt: iso(addDays(T, -9), '21:40') });
  db.ptPackages.push({ id: 'pt_failed_demo', memberId: 'm1', ptPlanId: 'pt5', sessionsTotal: 5, sessionsUsed: 0, startDate: addDays(T, -9), endDate: addDays(T, -9), payStatus: 'pending_payment', createdAt: iso(addDays(T, -9), '21:40') });

  // m2 – Standard sắp hết hạn
  addMs('m2', 'mp_basic_cg', addDays(T, -120), 'br1');
  addMs('m2', 'mp_standard', addDays(T, -85), 'br1');
  // m3 – Premium + gói PT
  addMs('m3', 'mp_premium', addDays(T, -230), 'br1', { freeSessionsUsed: 2 });
  const ptChi = addPT('m3', 'pt5', addDays(T, -6), 1, 'br1');
  // m4 – hết hạn (rời đi)
  addMs('m4', 'mp_basic_cg', addDays(T, -190), 'br1');
  addMs('m4', 'mp_basic_cg', addDays(T, -160), 'br1', { isRenewal: true });
  addMs('m4', 'mp_basic_cg', addDays(T, -50), 'br1');
  // m5 – Standard đang freeze
  const msEm = addMs('m5', 'mp_standard', addDays(T, -40), 'br2', { freezeCountUsed: 1, freezeDaysUsed: 10 });
  msEm.endDate = addDays(msEm.endDate, 10);
  db.freezeRequests.push({ id: id('fr'), memberId: 'm5', membershipId: msEm.id, startDate: addDays(T, -3), endDate: addDays(T, 6), days: 10, reason: 'Công tác nước ngoài', status: 'approved', createdAt: iso(addDays(T, -6)), handledBy: 'rc2', handledAt: iso(addDays(T, -5)), note: 'Đã xác minh' });
  // m6 – Basic Q1
  addMs('m6', 'mp_basic_q1', addDays(T, -14), 'br2');
  // m7 – VIP + PT Boxing
  addMs('m7', 'mp_vip', addDays(T, -70), 'br2', { freeSessionsUsed: 6 });
  addPT('m7', 'pt8_q1', addDays(T, -20), 3, 'br2');
  // m8 – Standard, có yêu cầu freeze chờ duyệt
  const msKhoa = addMs('m8', 'mp_standard', addDays(T, -30), 'br1');
  db.freezeRequests.push({ id: id('fr'), memberId: 'm8', membershipId: msKhoa.id, startDate: addDays(T, 3), endDate: addDays(T, 9), days: 7, reason: 'Phẫu thuật nhỏ, cần nghỉ ngơi theo chỉ định bác sĩ', status: 'pending', createdAt: iso(addDays(T, -1), '15:20') });
  // m9 – Premium
  addMs('m9', 'mp_premium', addDays(T, -300), 'br3', { freeSessionsUsed: 2 });
  // m10 – đã rời đi
  addMs('m10', 'mp_standard', addDays(T, -260), 'br3');
  addMs('m10', 'mp_standard', addDays(T, -170), 'br3', { isRenewal: true });
  // m11 – mới
  addMs('m11', 'mp_standard', addDays(T, -25), 'br3');
  // m12 – Standard x2
  addMs('m12', 'mp_standard', addDays(T, -150), 'br2');
  addMs('m12', 'mp_standard', addDays(T, -60), 'br2', { isRenewal: true });
  // m13 – Basic CG rời đi
  addMs('m13', 'mp_basic_cg', addDays(T, -170), 'br1');
  addMs('m13', 'mp_basic_cg', addDays(T, -140), 'br1', { isRenewal: true });
  addMs('m13', 'mp_basic_cg', addDays(T, -110), 'br1', { isRenewal: true });
  // m14 – mới tinh
  addMs('m14', 'mp_vip', addDays(T, -12), 'br3', { freeSessionsUsed: 1 });
  // m15 – Premium
  addMs('m15', 'mp_premium', addDays(T, -210), 'br2', { freeSessionsUsed: 1 });
  addPT('m15', 'pt20', addDays(T, -100), 14, 'br2');
  // m16 – Standard
  addMs('m16', 'mp_basic_q1', addDays(T, -140), 'br2');
  addMs('m16', 'mp_standard', addDays(T, -45), 'br2');

  /* ---------------- classes ---------------- */
  db.classes.push(
    { id: 'cl_yoga', name: 'Yoga Flow (YOGA-101)', category: 'Yoga', description: 'Chuỗi động tác Vinyasa giúp dẻo dai cột sống và thư giãn sâu.', trainerId: 'tr2', branchId: 'br1', room: 'Phòng Yoga - Lầu 2', daysOfWeek: [1, 3, 5], startTime: '06:30', durationMin: 60, capacity: 15, color: '#10b981', active: true },
    { id: 'cl_pilates', name: 'Pilates Core (PIL-102)', category: 'Pilates', description: 'Tăng cường cơ lõi trọng tâm, cải thiện tư thế chuẩn văn phòng.', trainerId: 'tr4', branchId: 'br3', room: 'Studio C - Lầu 3', daysOfWeek: [2, 4, 6], startTime: '07:30', durationMin: 60, capacity: 12, color: '#0d9488', active: true },
    { id: 'cl_pump', name: 'Body Pump Sức Mạnh (PUMP-201)', category: 'Sức mạnh', description: 'Tạ đòn nhịp điệu, lặp nhiều hiệp – săn chắc toàn thân.', trainerId: 'tr2', branchId: 'br1', room: 'Studio A - Lầu 1', daysOfWeek: [1, 4, 6, 0], startTime: '09:00', durationMin: 60, capacity: 15, color: '#f59e0b', active: true },
    { id: 'cl_stretch', name: 'Mobility & Giãn Cơ (MOB-204)', category: 'Yoga', description: 'Mở khớp vai, hông và phục hồi cơ bắp sau tập nặng.', trainerId: 'tr4', branchId: 'br4', room: 'Phòng Yoga - Lầu 2', daysOfWeek: [1, 3, 5], startTime: '14:00', durationMin: 60, capacity: 15, color: '#0284c7', active: true },
    { id: 'cl_core', name: 'Core & Abs Blast (CORE-205)', category: 'HIIT', description: 'Đốt mỡ bụng chuyên sâu và siết cơ trọng tâm trong 45 phút.', trainerId: 'tr1', branchId: 'br5', room: 'Studio A - Lầu 2', daysOfWeek: [2, 4, 6], startTime: '15:30', durationMin: 45, capacity: 14, color: '#6366f1', active: true },
    { id: 'cl_spin', name: 'Spin Cycling (SPIN-301)', category: 'Cardio', description: 'Đạp xe trong nhà theo nhạc EDM, đốt 550+ kcal.', trainerId: 'tr1', branchId: 'br1', room: 'Phòng Cycling - Lầu 1', daysOfWeek: [2, 4, 6], startTime: '17:30', durationMin: 45, capacity: 12, color: '#3b82f6', active: true },
    { id: 'cl_zumba', name: 'Zumba Latin Party (ZUM-302)', category: 'Dance', description: 'Nhảy Latin sôi động giải tỏa căng thẳng, đốt mỡ toàn thân.', trainerId: 'tr3', branchId: 'br2', room: 'Studio B - Lầu 2', daysOfWeek: [1, 3, 5], startTime: '18:30', durationMin: 60, capacity: 20, color: '#8b5cf6', active: true },
    { id: 'cl_box', name: 'Boxing & Kickfit (BOX-303)', category: 'Võ thuật', description: 'Kỹ thuật đấm - đá cơ bản kết hợp bài tập phản xạ cardio.', trainerId: 'tr3', branchId: 'br2', room: 'Phòng Boxing - Lầu 1', daysOfWeek: [2, 4, 6], startTime: '18:30', durationMin: 60, capacity: 12, color: '#ea580c', active: true },
    { id: 'cl_hiit', name: 'HIIT Burn (HIIT-304)', category: 'HIIT', description: 'Cường độ cao ngắt quãng – lớp nhỏ, đốt calo cực mạnh!', trainerId: 'tr1', branchId: 'br1', room: 'Studio A - Lầu 1', daysOfWeek: [0, 1, 2, 3, 4, 5, 6], startTime: '19:30', durationMin: 45, capacity: 4, color: '#e11d48', active: true },
  );
  ensureSessions(db, -21, 14);

  /* ---------------- check-ins history ---------------- */
  const memberBranch: Record<string, string> = { m1: 'br1', m2: 'br1', m3: 'br1', m5: 'br2', m6: 'br2', m7: 'br2', m8: 'br1', m9: 'br3', m11: 'br3', m12: 'br2', m14: 'br3', m15: 'br2', m16: 'br2' };
  const validOn = (mid: string, date: string) =>
    db.memberships.some((m) => m.memberId === mid && m.startDate <= date && date <= m.endDate) &&
    !db.freezeRequests.some((f) => f.memberId === mid && f.status === 'approved' && f.startDate <= date && date <= f.endDate);
  const ciMap = new Set<string>();
  const addCI = (mid: string, br: string, date: string, inT: string, outT?: string, extra: Partial<CheckIn> = {}) => {
    const k = `${mid}_${br}_${date}`;
    if (ciMap.has(k)) return;
    ciMap.add(k);
    db.checkins.push({ id: id('ci'), memberId: mid, branchId: br, checkInAt: iso(date, inT), checkOutAt: outT ? iso(date, outT) : undefined, method: 'card', checkoutMethod: outT ? 'card' : undefined, result: 'success', ...extra });
  };
  for (let d = -30; d <= -1; d++) {
    const date = addDays(T, d);
    for (const [mid, br] of Object.entries(memberBranch)) {
      if (r() < 0.45 && validOn(mid, date)) {
        const h = 6 + Math.floor(r() * 13);
        const dur = 50 + Math.floor(r() * 70);
        const out = new Date(atTime(date, `${String(h).padStart(2, '0')}:10`));
        out.setMinutes(out.getMinutes() + dur);
        const manual = r() < 0.12;
        addCI(mid, br, date, `${String(h).padStart(2, '0')}:10`, `${String(out.getHours()).padStart(2, '0')}:${String(out.getMinutes()).padStart(2, '0')}`, manual ? { method: 'manual', staffId: br === 'br1' ? 'rc1' : br === 'br2' ? 'rc2' : 'rc3', reason: pick(['Quên thẻ', 'Thẻ bị hỏng', 'Máy quét lỗi']) } : {});
      }
    }
  }
  // từ chối mẫu
  db.checkins.push({ id: id('ci'), memberId: 'm4', branchId: 'br1', checkInAt: iso(addDays(T, -2), '17:45'), method: 'card', result: 'denied', denyReason: 'Không có gói hội viên còn hiệu lực' });
  db.checkins.push({ id: id('ci'), memberId: 'm5', branchId: 'br2', checkInAt: iso(addDays(T, -1), '06:20'), method: 'card', result: 'denied', denyReason: 'Gói hội viên đang trong thời gian tạm ngưng (freeze)' });
  db.checkins.push({ id: id('ci'), memberId: 'm6', branchId: 'br1', checkInAt: iso(addDays(T, -4), '12:05'), method: 'card', result: 'denied', denyReason: 'Gói Basic Quận 7 không áp dụng tại chi nhánh Quận 1' });

  /* ---------------- class bookings (quá khứ & tương lai) ---------------- */
  const now = Date.now();
  const classMembers: Record<string, string[]> = {
    br1: ['m1', 'm2', 'm3', 'm8'],
    br2: ['m6', 'm7', 'm12', 'm15', 'm16'],
    br3: ['m9', 'm11', 'm14'],
    br4: ['m1', 'm3', 'm5'],
    br5: ['m2', 'm8', 'm12'],
  };
  const mkCB = (sessionId: string, memberId: string, status: ClassBooking['status'], createdAt: string, priority = 2, checkedIn = false) =>
    db.classBookings.push({ id: id('cb'), sessionId, memberId, membershipId: db.memberships.find((m) => m.memberId === memberId)?.id ?? '', status, priority, checkedIn, createdAt, updatedAt: createdAt });
  const prio = (mid: string) => {
    const m = db.memberships.filter((x) => x.memberId === mid).sort((a, b) => b.endDate.localeCompare(a.endDate))[0];
    return db.membershipPlans.find((p) => p.id === m?.planId)?.priority ?? 1;
  };
  for (const s of db.sessions) {
    const c = db.classes.find((x) => x.id === s.classId)!;
    const past = new Date(s.startAt).getTime() < now;
    const pool = classMembers[c.branchId];
    if (past) {
      const date = s.date;
      pool.forEach((mid) => {
        if (r() < 0.35 && validOn(mid, date)) {
          const attended = r() < 0.85;
          if (attended) addCI(mid, c.branchId, date, String(new Date(s.startAt).getHours() - 0).padStart(2, '0') + ':' + '00', String(new Date(s.endAt).getHours() + 1).padStart(2, '0') + ':00');
          mkCB(s.id, mid, attended ? 'attended' : 'no_show', new Date(new Date(s.startAt).getTime() - 86400000 * 2).toISOString(), prio(mid), attended);
        }
      });
      // khách vãng lai để số liệu lấp đầy đẹp hơn
      const extra = Math.floor(r() * (c.capacity * 0.6));
      const all = memberNames.map((x) => x[0]).filter((x) => !pool.includes(x) && validOn(x, date));
      for (let i = 0; i < extra && i < all.length; i++) {
        if (db.classBookings.filter((b) => b.sessionId === s.id).length >= c.capacity) break;
        const mid = all[i];
        const st = r() < 0.8 ? 'attended' : 'no_show';
        if (st === 'attended') addCI(mid, c.branchId, date, String(new Date(s.startAt).getHours()).padStart(2, '0') + ':00', String(new Date(s.endAt).getHours() + 1).padStart(2, '0') + ':00');
        mkCB(s.id, mid, st, new Date(new Date(s.startAt).getTime() - 86400000).toISOString(), prio(mid), st === 'attended');
      }
      s.status = 'completed';
      s.attendanceConfirmed = true;
    }
  }
  // HIIT tối mai: đầy 4 chỗ + 1 chờ -> demo waitlist
  const tomorrow = addDays(T, 1);
  const hiitTmr = db.sessions.find((s) => s.classId === 'cl_hiit' && s.date === tomorrow)!;
  ['m2', 'm3', 'm8', 'm16'].forEach((mid, i) => mkCB(hiitTmr.id, mid, 'booked', iso(addDays(T, -1), `1${i}:00`), prio(mid)));
  mkCB(hiitTmr.id, 'm12', 'waitlist', iso(T, '06:00'), prio('m12'));
  // An đã đặt vài lớp sắp tới
  const yogaNext = db.sessions.filter((s) => s.classId === 'cl_yoga' && new Date(s.startAt).getTime() > now)[0];
  const spinNext = db.sessions.filter((s) => s.classId === 'cl_spin' && new Date(s.startAt).getTime() > now)[0];
  if (yogaNext) mkCB(yogaNext.id, 'm1', 'booked', iso(addDays(T, -1), '20:00'), 3);
  if (spinNext) mkCB(spinNext.id, 'm1', 'booked', iso(addDays(T, -1), '20:05'), 3);
  // vài lịch tương lai khác
  db.sessions
    .filter((s) => new Date(s.startAt).getTime() > now && s.id !== hiitTmr.id)
    .forEach((s) => {
      const c = db.classes.find((x) => x.id === s.classId)!;
      classMembers[c.branchId].forEach((mid) => {
        if (mid !== 'm1' && r() < 0.3 && validOn(mid, s.date)) mkCB(s.id, mid, 'booked', iso(T, '07:00'), prio(mid));
      });
    });

  /* ---------------- trainer slots & PT bookings ---------------- */
  const slotTimes: Record<string, [string, string][]> = {
    tr1: [['br1', '08:00'], ['br1', '10:00'], ['br1', '14:00'], ['br2', '16:00']],
    tr2: [['br1', '08:00'], ['br1', '15:00'], ['br1', '17:00']],
    tr3: [['br2', '09:00'], ['br2', '11:00'], ['br2', '15:00']],
    tr4: [['br3', '09:00'], ['br3', '14:00'], ['br3', '16:00']],
  };
  const mkSlot = (trainerId: string, branchId: string, date: string, t: string): TrainerSlot => {
    const s = { id: id('slot'), trainerId, branchId, startAt: iso(date, t), endAt: new Date(new Date(iso(date, t)).getTime() + 3600000).toISOString() };
    db.trainerSlots.push(s);
    return s;
  };
  for (let d = 0; d <= 7; d++) {
    const date = addDays(T, d);
    for (const [tid, list] of Object.entries(slotTimes)) {
      list.forEach(([br, t]) => {
        if (d === 0 && new Date(iso(date, t)).getTime() < now) return;
        if (r() < 0.82) mkSlot(tid, br, date, t);
      });
    }
  }
  const mkPT = (memberId: string, slot: TrainerSlot, status: PTBooking['status'], source: PTBooking['source'], note = '') =>
    db.ptBookings.push({ id: id('ptb'), memberId, trainerId: slot.trainerId, slotId: slot.id, branchId: slot.branchId, startAt: slot.startAt, endAt: slot.endAt, source, status, note, checkedIn: status === 'completed', createdAt: new Date(new Date(slot.startAt).getTime() - 2 * 86400000).toISOString(), updatedAt: slot.startAt });
  // An: 3 buổi đã hoàn thành (tặng kèm), 1 đã xác nhận, 1 chờ xác nhận
  [-20, -13, -6].forEach((d) => {
    const date = addDays(T, d);
    const s = mkSlot('tr1', 'br1', date, '07:00');
    addCI('m1', 'br1', date, '06:50', '08:20');
    mkPT('m1', s, 'completed', { type: 'membership_free', id: vipAn.id }, 'Tập ngực – vai');
  });
  const futureTr1 = db.trainerSlots.filter((s) => s.trainerId === 'tr1' && new Date(s.startAt).getTime() > now + 20 * 3600000);
  if (futureTr1[0]) mkPT('m1', futureTr1[0], 'confirmed', { type: 'membership_free', id: vipAn.id }, 'Tập chân');
  if (futureTr1[2]) mkPT('m1', futureTr1[2], 'pending', { type: 'membership_free', id: vipAn.id }, 'Muốn kiểm tra form deadlift');
  // Chi: 1 hoàn thành từ gói PT + 1 yêu cầu chờ HLV Minh duyệt
  {
    const s = mkSlot('tr1', 'br1', addDays(T, -3), '17:00');
    addCI('m3', 'br1', addDays(T, -3), '16:50', '18:15');
    mkPT('m3', s, 'completed', { type: 'pt_package', id: ptChi.id });
    if (futureTr1[1]) {
      mkPT('m3', futureTr1[1], 'pending', { type: 'pt_package', id: ptChi.id }, 'Giảm mỡ bụng');
      ptChi.sessionsUsed++;
    }
  }
  // Hà với HLV Hùng
  {
    [-9, -4].forEach((d) => {
      const s = mkSlot('tr3', 'br2', addDays(T, d), '07:00');
      addCI('m7', 'br2', addDays(T, d), '06:55', '08:10');
      mkPT('m7', s, 'completed', { type: 'pt_package', id: db.ptPackages.find((p) => p.memberId === 'm7')!.id });
    });
    const fs = db.trainerSlots.filter((s) => s.trainerId === 'tr3' && new Date(s.startAt).getTime() > now + 6 * 3600000)[0];
    if (fs) mkPT('m7', fs, 'confirmed', { type: 'pt_package', id: db.ptPackages.find((p) => p.memberId === 'm7')!.id });
  }
  // Sơn với HLV Hùng nhiều buổi quá khứ
  for (let k = 0; k < 6; k++) {
    const d = -28 + k * 4;
    const s = mkSlot('tr3', 'br2', addDays(T, d), '20:00');
    addCI('m15', 'br2', addDays(T, d), '19:50', '21:10');
    mkPT('m15', s, k === 3 ? 'no_show' : 'completed', { type: 'pt_package', id: db.ptPackages.find((p) => p.memberId === 'm15')!.id });
  }
  // Ngọc Lan & Thảo
  [-15, -8].forEach((d) => {
    const s = mkSlot('tr2', 'br1', addDays(T, d), '19:00');
    addCI('m2', 'br1', addDays(T, d), '18:50', '20:10');
    mkPT('m2', s, 'completed', { type: 'membership_free', id: 'none' });
  });
  [-10, -5].forEach((d) => {
    const s = mkSlot('tr4', 'br3', addDays(T, d), '18:00');
    addCI('m14', 'br3', addDays(T, d), '17:50', '19:05');
    mkPT('m14', s, 'completed', { type: 'membership_free', id: db.memberships.find((m) => m.memberId === 'm14')!.id });
  });

  // đang có mặt hôm nay
  const nowH = new Date().getHours();
  if (nowH >= 6) {
    const t = `${String(Math.max(6, nowH - 1)).padStart(2, '0')}:05`;
    addCI('m3', 'br1', T, t);
    addCI('m7', 'br2', T, t);
    addCI('m12', 'br2', T, t, undefined, { method: 'manual', staffId: 'rc2', reason: 'Quên thẻ' });
  }

  /* ---------------- reviews ---------------- */
  const comments = {
    5: ['Tuyệt vời, HLV rất nhiệt tình!', 'Buổi tập cực kỳ hiệu quả', 'Rất đáng tiền, sẽ quay lại', 'Năng lượng tràn đầy!'],
    4: ['Khá tốt, nhạc hơi to', 'Bài tập hay, phòng hơi đông', 'HLV hướng dẫn kỹ'],
    3: ['Bình thường', 'Cần cải thiện điều hòa phòng tập'],
  } as Record<number, string[]>;
  const attendedCB = db.classBookings.filter((b) => b.status === 'attended' && b.memberId !== 'm1');
  attendedCB.forEach((b) => {
    if (r() < 0.35) {
      const s = db.sessions.find((x) => x.id === b.sessionId)!;
      const rating = r() < 0.55 ? 5 : r() < 0.8 ? 4 : 3;
      db.reviews.push({ id: id('rv'), memberId: b.memberId, targetType: 'class', trainerId: s.trainerId, classId: s.classId, bookingId: b.id, rating, comment: pick(comments[rating]), createdAt: s.endAt });
    }
  });
  db.ptBookings
    .filter((b) => b.status === 'completed')
    .forEach((b, i) => {
      if (b.memberId === 'm1' && i === 2) return; // để An có buổi chưa đánh giá
      if (b.memberId === 'm1' || r() < 0.7) {
        const rating = r() < 0.7 ? 5 : 4;
        db.reviews.push({ id: id('rv'), memberId: b.memberId, targetType: 'trainer', trainerId: b.trainerId, bookingId: b.id, rating, comment: pick(comments[rating]), createdAt: b.endAt });
      }
    });

  /* ---------------- body metrics (An) ---------------- */
  const series: [number, number, number, number, number, number, string][] = [
    [78.4, 24.6, 31.8, 96.0, 88.5, 97.5, 'Khởi điểm: Đo InBody lần đầu, bắt đầu lộ trình giảm mỡ tăng cơ'],
    [77.6, 24.0, 32.0, 96.4, 87.2, 97.2, 'Tuần 2: Quen nhịp cardio & cắt nước ngọt có gas'],
    [76.9, 23.4, 32.3, 97.0, 85.8, 96.8, 'Tuần 4: Tăng mức tạ Squat & Deadlift thêm 10kg'],
    [76.1, 22.7, 32.7, 97.5, 84.5, 96.5, 'Tuần 6: Giảm rõ mỡ vùng bụng, cơ ngực bắt đầu dày hơn'],
    [75.5, 22.1, 33.0, 98.2, 83.2, 96.2, 'Tuần 8: Duy trì ăn giàu đạm 155g/ngày theo gợi ý AI'],
    [74.6, 21.3, 33.4, 98.8, 82.0, 96.0, 'Tuần 10: Thể lực bền bỉ, hoàn thành HIIT 45 phút không hụt hơi'],
    [73.9, 20.6, 33.8, 99.4, 80.8, 95.8, 'Tuần 11: Siết nét cơ vai & lưng xô, vòng eo giảm gần 8cm'],
    [73.2, 19.9, 34.2, 100.0, 79.5, 95.5, 'Hiện tại: Đạt mốc dưới 20% mỡ cơ thể, chuẩn bị chu kỳ Lean Bulk'],
  ];
  series.forEach(([w, f, mm, ch, wa, hi, note], i) =>
    db.bodyMetrics.push({
      id: id('bm'),
      memberId: 'm1',
      date: addDays(T, -84 + i * 12),
      weight: w,
      height: 172,
      bmi: +(w / 1.72 ** 2).toFixed(1),
      bodyFat: f,
      muscleMass: mm,
      chest: ch,
      waist: wa,
      hips: hi,
      note,
    }),
  );
  (
    [
      [58.2, 28.1, 22.0, 85.0, 72.0, 93.0, 'Đo InBody đầu kỳ'],
      [57.5, 27.2, 22.3, 85.5, 70.2, 93.5, 'Sau 1 tháng tập Yoga & Pilates'],
      [56.8, 26.5, 22.6, 86.0, 68.5, 94.2, 'Cải thiện rõ vòng eo & vòng 3'],
    ] as [number, number, number, number, number, number, string][]
  ).forEach(([w, f, mm, ch, wa, hi, note], i) =>
    db.bodyMetrics.push({
      id: id('bm'),
      memberId: 'm2',
      date: addDays(T, -60 + i * 25),
      weight: w,
      height: 160,
      bmi: +(w / 1.6 ** 2).toFixed(1),
      bodyFat: f,
      muscleMass: mm,
      chest: ch,
      waist: wa,
      hips: hi,
      note,
    }),
  );

  /* ---------------- equipment ---------------- */
  const eqTemplates: [string, string][] = [
    ['Máy chạy bộ Life Fitness T5', 'Cardio'],
    ['Máy chạy bộ Technogym Run', 'Cardio'],
    ['Xe đạp Spin Keiser M3', 'Cardio'],
    ['Máy Elliptical Precor', 'Cardio'],
    ['Giàn Smith Machine', 'Sức mạnh'],
    ['Máy ép ngực Hammer', 'Sức mạnh'],
    ['Máy kéo xô Lat Pulldown', 'Sức mạnh'],
    ['Ghế đẩy tạ điều chỉnh', 'Tạ tự do'],
    ['Bộ tạ đơn 2–40kg', 'Tạ tự do'],
    ['Máy đạp đùi Leg Press', 'Sức mạnh'],
  ];
  db.branches.forEach((b, bi) =>
    eqTemplates.forEach(([name, cat], i) => {
      const e: Equipment = { id: id('eq'), branchId: b.id, name, category: cat, code: `${b.id.toUpperCase()}-${String(i + 1).padStart(3, '0')}`, status: 'active', addedAt: addDays(T, -500 + i * 20 + bi * 7) };
      db.equipment.push(e);
    }),
  );
  const eqBy = (br: string, i: number) => db.equipment.filter((e) => e.branchId === br)[i];
  const e1 = eqBy('br1', 0);
  e1.status = 'broken';
  db.equipmentReports.push({ id: id('er'), equipmentId: e1.id, branchId: 'br1', reporterId: 'm2', description: 'Băng chạy bị trượt và phát tiếng kêu lớn khi chạy trên 10km/h', status: 'pending', createdAt: iso(T, '06:40'), updates: [{ at: iso(T, '06:40'), by: 'm2', note: 'Băng chạy bị trượt và phát tiếng kêu lớn', status: 'pending' }] });
  const e2 = eqBy('br1', 5);
  e2.status = 'repairing';
  db.equipmentReports.push({ id: id('er'), equipmentId: e2.id, branchId: 'br1', reporterId: 'm1', description: 'Tay cầm bên trái bị lỏng', status: 'in_progress', createdAt: iso(addDays(T, -3), '18:00'), updates: [{ at: iso(addDays(T, -3), '18:00'), by: 'm1', note: 'Tay cầm bên trái bị lỏng', status: 'pending' }, { at: iso(addDays(T, -2), '09:00'), by: 'rc1', note: 'Đã liên hệ kỹ thuật, chờ linh kiện', status: 'in_progress' }] });
  const e3 = eqBy('br2', 2);
  db.equipmentReports.push({ id: id('er'), equipmentId: e3.id, branchId: 'br2', reporterId: 'm7', description: 'Màn hình không hiển thị', status: 'resolved', createdAt: iso(addDays(T, -10), '19:00'), updates: [{ at: iso(addDays(T, -10), '19:00'), by: 'm7', note: 'Màn hình không hiển thị', status: 'pending' }, { at: iso(addDays(T, -9), '10:00'), by: 'rc2', note: 'Thay pin cảm biến', status: 'in_progress' }, { at: iso(addDays(T, -8), '15:00'), by: 'rc2', note: 'Đã sửa xong', status: 'resolved' }] });
  const e4 = eqBy('br3', 4);
  e4.status = 'broken';
  db.equipmentReports.push({ id: id('er'), equipmentId: e4.id, branchId: 'br3', reporterId: 'rc3', description: 'Thanh trượt kẹt, không an toàn', status: 'pending', createdAt: iso(addDays(T, -1), '11:00'), updates: [{ at: iso(addDays(T, -1), '11:00'), by: 'rc3', note: 'Thanh trượt kẹt', status: 'pending' }] });
  eqBy('br2', 9).status = 'retired';

  /* ---------------- notifications ---------------- */
  const ntf = (userId: string, title: string, message: string, type: 'info' | 'success' | 'warning' | 'danger', hoursAgo: number, link?: string, read = false) =>
    db.notifications.push({ id: id('ntf'), userId, title, message, type, read, createdAt: new Date(now - hoursAgo * 3600000).toISOString(), link });
  ntf('m1', 'Lịch PT đã được xác nhận', 'HLV Hoàng Đức Minh đã xác nhận buổi tập sắp tới của bạn.', 'success', 3, '/member/bookings');
  ntf('m1', 'Thanh toán thất bại', 'Giao dịch gói PT Starter 5 buổi không thành công. Bạn có thể thanh toán lại.', 'danger', 24 * 9, '/member/memberships', true);
  ntf('m1', 'Thanh toán thành công', 'Gói PT Pro 10 buổi đã được kích hoạt.', 'success', 24 * 8, '/member/memberships', true);
  ntf('m1', 'Cập nhật phản ánh thiết bị', 'Máy ép ngực Hammer đang được sửa chữa.', 'info', 24 * 2, '/member/equipment');
  ntf('tr1', 'Yêu cầu đặt lịch PT mới', 'Phạm Minh Chi muốn đặt buổi tập giảm mỡ bụng.', 'info', 5, '/trainer/requests');
  ntf('tr1', 'Yêu cầu đặt lịch PT mới', 'Nguyễn Văn An muốn kiểm tra form deadlift.', 'info', 2, '/trainer/requests');
  ntf('rc1', 'Yêu cầu freeze mới', 'Ngô Đăng Khoa yêu cầu tạm ngưng gói Standard 3 tháng 7 ngày.', 'warning', 16, '/staff/freeze');
  ntf('rc1', 'Phản ánh thiết bị mới', 'Lê Thị Bình báo Máy chạy bộ Life Fitness T5 gặp sự cố.', 'warning', 1, '/staff/equipment');
  ntf('admin', 'Báo cáo tháng sẵn sàng', 'Doanh thu và chỉ số vận hành tháng trước đã được tổng hợp.', 'info', 30, '/admin/reports');

  db.payments.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  db.checkins.sort((a, b) => b.checkInAt.localeCompare(a.checkInAt));
  db.notifications.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  void toDateStr;
  return db;
}
