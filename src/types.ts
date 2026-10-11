export type Role = 'member' | 'trainer' | 'receptionist' | 'admin';

export interface TrainerProfile {
  specialties: string[];
  experienceYears: number;
  certifications: string[];
  bio: string;
  branchIds: string[];
}

export interface User {
  id: string;
  role: Role;
  email: string;
  password: string;
  fullName: string;
  phone: string;
  gender: 'male' | 'female' | 'other';
  dob: string;
  address: string;
  avatarColor: string;
  locked: boolean;
  createdAt: string;
  branchId?: string; // receptionist work branch
  cardCode?: string; // member card / QR code
  trainer?: TrainerProfile;
}

export interface Branch {
  id: string;
  name: string;
  address: string;
  phone: string;
  openTime: string; // HH:mm
  closeTime: string; // HH:mm
  rooms: string[];
  active: boolean;
}

export type EquipmentStatus = 'active' | 'broken' | 'repairing' | 'retired';

export interface Equipment {
  id: string;
  branchId: string;
  name: string;
  category: string;
  code: string;
  status: EquipmentStatus;
  addedAt: string;
}

export type ReportStatus = 'pending' | 'in_progress' | 'resolved' | 'rejected';

export interface EquipmentReport {
  id: string;
  equipmentId: string;
  branchId: string;
  reporterId: string;
  description: string;
  status: ReportStatus;
  createdAt: string;
  updates: { at: string; by: string; note: string; status: ReportStatus }[];
}

/** 'all' = áp dụng chung mọi chi nhánh */
export type BranchScope = 'all' | string[];

export interface MembershipPlan {
  id: string;
  name: string;
  durationMonths: number;
  price: number;
  priority: number; // độ ưu tiên waitlist (cao hơn = ưu tiên)
  branchScope: BranchScope;
  freePTSessions: number;
  maxFreezeTimes: number;
  maxFreezeDays: number;
  classBookingsPerWeek: number; // 0 = không giới hạn
  description: string;
  benefits: string[];
  color: string;
  active: boolean;
}

export interface PTPlan {
  id: string;
  name: string;
  sessions: number;
  validityDays: number;
  price: number;
  branchScope: BranchScope;
  description: string;
  active: boolean;
}

export type PaidStatus = 'pending_payment' | 'paid' | 'cancelled';

export interface MemberMembership {
  id: string;
  memberId: string;
  planId: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  payStatus: PaidStatus;
  freeSessionsTotal: number;
  freeSessionsUsed: number;
  freezeCountUsed: number;
  freezeDaysUsed: number;
  isRenewal: boolean;
  createdAt: string;
}

export interface MemberPTPackage {
  id: string;
  memberId: string;
  ptPlanId: string;
  sessionsTotal: number;
  sessionsUsed: number;
  startDate: string;
  endDate: string;
  payStatus: PaidStatus;
  createdAt: string;
}

export type RequestStatus = 'pending' | 'approved' | 'rejected';

export interface FreezeRequest {
  id: string;
  memberId: string;
  membershipId: string;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: RequestStatus;
  createdAt: string;
  handledBy?: string;
  handledAt?: string;
  note?: string;
}

export type PaymentMethod = 'momo' | 'vnpay' | 'card' | 'banking';

export interface Payment {
  id: string;
  memberId: string;
  kind: 'membership' | 'renewal' | 'pt';
  refId: string;
  amount: number;
  method: PaymentMethod;
  status: 'success' | 'failed';
  branchId: string;
  description: string;
  createdAt: string;
}

export interface GroupClass {
  id: string;
  name: string;
  category: string;
  description: string;
  trainerId: string;
  branchId: string;
  room: string;
  daysOfWeek: number[]; // 0 = CN
  startTime: string; // HH:mm
  durationMin: number;
  capacity: number;
  color: string;
  active: boolean;
}

export interface ClassSession {
  id: string;
  classId: string;
  date: string;
  startAt: string;
  endAt: string;
  trainerId: string;
  room: string;
  status: 'scheduled' | 'cancelled' | 'completed';
  attendanceConfirmed: boolean;
  note?: string;
}

export type ClassBookingStatus =
  | 'booked'
  | 'waitlist'
  | 'cancelled'
  | 'late_cancelled'
  | 'attended'
  | 'no_show'
  | 'waitlist_expired'
  | 'auto_cancelled';

export interface ClassBooking {
  id: string;
  sessionId: string;
  memberId: string;
  membershipId: string;
  status: ClassBookingStatus;
  priority: number;
  checkedIn: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TrainerSlot {
  id: string;
  trainerId: string;
  branchId: string;
  startAt: string;
  endAt: string;
}

export type PTBookingStatus =
  | 'pending'
  | 'confirmed'
  | 'rejected'
  | 'cancelled'
  | 'late_cancelled'
  | 'completed'
  | 'no_show'
  | 'auto_cancelled';

export interface PTBooking {
  id: string;
  memberId: string;
  trainerId: string;
  slotId: string;
  branchId: string;
  startAt: string;
  endAt: string;
  source: { type: 'membership_free' | 'pt_package'; id: string };
  status: PTBookingStatus;
  note: string;
  checkedIn: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CheckIn {
  id: string;
  memberId: string;
  branchId: string;
  checkInAt: string;
  checkOutAt?: string;
  method: 'card' | 'manual';
  checkoutMethod?: 'card' | 'manual' | 'auto';
  staffId?: string;
  reason?: string;
  result: 'success' | 'denied';
  denyReason?: string;
}

export interface BodyMetric {
  id: string;
  memberId: string;
  date: string;
  weight: number;
  height: number;
  bmi: number;
  bodyFat?: number;
  muscleMass?: number;
  note?: string;
}

export interface Review {
  id: string;
  memberId: string;
  targetType: 'trainer' | 'class';
  trainerId: string;
  classId?: string;
  bookingId: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'danger';
  read: boolean;
  createdAt: string;
  link?: string;
  key?: string;
}

export interface Settings {
  reminderHours: number;
  cancelDeadlineHours: number;
  waitlistCutoffHours: number;
  expiryWarningDays: number;
  ptLowSessions: number;
}

export interface DB {
  version: number;
  users: User[];
  branches: Branch[];
  equipment: Equipment[];
  equipmentReports: EquipmentReport[];
  membershipPlans: MembershipPlan[];
  ptPlans: PTPlan[];
  memberships: MemberMembership[];
  ptPackages: MemberPTPackage[];
  freezeRequests: FreezeRequest[];
  payments: Payment[];
  classes: GroupClass[];
  sessions: ClassSession[];
  classBookings: ClassBooking[];
  trainerSlots: TrainerSlot[];
  ptBookings: PTBooking[];
  checkins: CheckIn[];
  bodyMetrics: BodyMetric[];
  reviews: Review[];
  notifications: Notification[];
  settings: Settings;
}
