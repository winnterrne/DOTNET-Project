import { request } from './apiClient';
import type { MembershipPlan, PTPlan } from '../types';

export const membershipPlansApi = {
  getAllPlans: () => request<MembershipPlan[]>('/membershipplans'),
  getPTPlans: () => request<PTPlan[]>('/membershipplans/pt'),
  createPlan: (data: Partial<MembershipPlan>) => request<MembershipPlan>('/membershipplans', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
};
