import { request } from './apiClient';
import type { CheckIn } from '../types';

export const checkinsApi = {
  getRecent: (branchId?: string) => request<CheckIn[]>(`/checkins${branchId ? `?branchId=${branchId}` : ''}`),
  checkInByCard: (cardCode: string, branchId: string) => request<CheckIn>('/checkins/card', {
    method: 'POST',
    body: JSON.stringify({ cardCode, branchId }),
  }),
  checkInManual: (memberId: string, branchId: string, staffId: string) => request<CheckIn>('/checkins/manual', {
    method: 'POST',
    body: JSON.stringify({ memberId, branchId, staffId }),
  }),
  checkOut: (checkInId: string) => request<CheckIn>(`/checkins/${checkInId}/checkout`, {
    method: 'POST',
  }),
};
