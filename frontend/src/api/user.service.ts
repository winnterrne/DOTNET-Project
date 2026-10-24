import { request } from './apiClient';
import type { ApiUserDto } from './auth.service';

export interface UpdateMemberProfilePayload {
  fullName: string;
  phone?: string;
  address?: string;
  dateOfBirth?: string;
  gender?: string;
  specialty?: string;
  experienceYears?: number;
  bio?: string;
}

export interface CreateStaffPayload {
  email: string;
  userName?: string;
  fullName: string;
  password?: string;
  phone?: string;
  role: 'STAFF' | 'TRAINER' | 'ADMIN';
  branchId?: string;
  position?: string;
  specialty?: string;
  experienceYears?: number;
  bio?: string;
}

export interface UpdateUserStatusPayload {
  status?: 'ACTIVE' | 'LOCKED';
  locked?: boolean;
}

export interface ApiMemberDto {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  phone?: string;
  cardCode?: string;
  address?: string;
  dateOfBirth?: string;
  gender?: string;
  userStatus: 'ACTIVE' | 'LOCKED';
  createdAt: string;
  currentPlanName?: string;
  membershipStatus?: string;
  startDate?: string;
  endDate?: string;
  remainingSessions: number;
}

export const userService = {
  async getMe(): Promise<ApiUserDto> {
    return request<ApiUserDto>('/users/me');
  },

  async updateMe(payload: UpdateMemberProfilePayload): Promise<ApiUserDto> {
    return request<ApiUserDto>('/users/me', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  async getAllUsers(role?: string, search?: string): Promise<ApiUserDto[]> {
    const params = new URLSearchParams();
    if (role && role !== 'all') params.set('role', role);
    if (search) params.set('search', search);
    const qs = params.toString();
    return request<ApiUserDto[]>(`/users${qs ? `?${qs}` : ''}`);
  },

  async createStaff(payload: CreateStaffPayload): Promise<ApiUserDto> {
    return request<ApiUserDto>('/users/staff', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async updateUserStatus(id: string, payload: UpdateUserStatusPayload): Promise<ApiUserDto> {
    return request<ApiUserDto>(`/users/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  async searchMembers(search?: string): Promise<ApiMemberDto[]> {
    const qs = search ? `?search=${encodeURIComponent(search)}` : '';
    return request<ApiMemberDto[]>(`/members${qs}`);
  },
};
