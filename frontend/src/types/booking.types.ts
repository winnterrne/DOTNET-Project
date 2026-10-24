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
