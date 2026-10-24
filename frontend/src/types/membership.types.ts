import type { BranchScope } from './branch.types';

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
