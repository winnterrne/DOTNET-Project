import { request } from './apiClient';
import type { Branch } from '../types';

export const branchesApi = {
  getAll: () => request<Branch[]>('/branches'),
  getById: (id: string) => request<Branch>(`/branches/${id}`),
  create: (data: Partial<Branch>) => request<Branch>('/branches', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id: string, data: Partial<Branch>) => request<Branch>(`/branches/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id: string) => request<void>(`/branches/${id}`, {
    method: 'DELETE',
  }),
};
