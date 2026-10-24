import type { User } from './user.types';
import type { Branch } from './branch.types';
import type { Equipment, EquipmentReport } from './equipment.types';
import type { MembershipPlan, PTPlan, MemberMembership, MemberPTPackage, FreezeRequest, Payment } from './membership.types';
import type { GroupClass, ClassSession, ClassBooking, TrainerSlot, PTBooking, CheckIn } from './booking.types';

export interface BodyMetric {
  id: string;
  memberId: string;
  date: string;
  weight: number;
  height: number;
  bmi: number;
  bodyFat?: number;
  muscleMass?: number;
  waist?: number;
  chest?: number;
  hips?: number;
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
