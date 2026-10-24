import { request } from './apiClient';
import type { Equipment, EquipmentReport } from '../types';

export const equipmentsApi = {
  getAll: (branchId?: string) => request<Equipment[]>(`/equipments${branchId ? `?branchId=${branchId}` : ''}`),
  getById: (id: string) => request<Equipment>(`/equipments/${id}`),
  create: (data: Partial<Equipment>) => request<Equipment>('/equipments', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  updateStatus: (id: string, status: string) => request<Equipment>(`/equipments/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  }),
  getReports: (equipmentId?: string) => request<EquipmentReport[]>(`/equipments/reports${equipmentId ? `?equipmentId=${equipmentId}` : ''}`),
  createReport: (data: Partial<EquipmentReport>) => request<EquipmentReport>('/equipments/reports', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
};
