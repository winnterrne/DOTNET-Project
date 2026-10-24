import { request } from './apiClient';
import type { ClassBooking, PTBooking } from '../types';

export const bookingsApi = {
  getClassBookings: (memberId?: string) => request<ClassBooking[]>(`/bookings/classes${memberId ? `?memberId=${memberId}` : ''}`),
  bookClass: (sessionId: string, memberId: string) => request<ClassBooking>('/bookings/classes', {
    method: 'POST',
    body: JSON.stringify({ sessionId, memberId }),
  }),
  cancelClassBooking: (bookingId: string) => request<void>(`/bookings/classes/${bookingId}/cancel`, {
    method: 'POST',
  }),

  getPTBookings: (memberId?: string, trainerId?: string) => {
    const params = new URLSearchParams();
    if (memberId) params.append('memberId', memberId);
    if (trainerId) params.append('trainerId', trainerId);
    return request<PTBooking[]>(`/bookings/pt?${params.toString()}`);
  },
  bookPT: (data: Partial<PTBooking>) => request<PTBooking>('/bookings/pt', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  updatePTStatus: (bookingId: string, status: string) => request<PTBooking>(`/bookings/pt/${bookingId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  }),
};
