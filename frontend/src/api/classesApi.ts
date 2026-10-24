import { request } from './apiClient';
import type { GroupClass, ClassSession } from '../types';

export const classesApi = {
  getAll: (branchId?: string) => request<GroupClass[]>(`/classes${branchId ? `?branchId=${branchId}` : ''}`),
  getById: (id: string) => request<GroupClass>(`/classes/${id}`),
  getSessions: (classId?: string, date?: string) => {
    const params = new URLSearchParams();
    if (classId) params.append('classId', classId);
    if (date) params.append('date', date);
    return request<ClassSession[]>(`/classes/sessions?${params.toString()}`);
  },
  create: (data: Partial<GroupClass>) => request<GroupClass>('/classes', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
};
