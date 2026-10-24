import { request, setAuthToken } from './apiClient';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  userName?: string;
  fullName: string;
  password: string;
  phone?: string;
  role: 'MEMBER' | 'TRAINER';
  branchId?: string;
  address?: string;
  dateOfBirth?: string;
  gender?: string;
  specialty?: string;
  experienceYears?: number;
  bio?: string;
}

export interface ApiUserDto {
  id: string;
  email: string;
  userName: string;
  fullName: string;
  phone?: string;
  role: 'member' | 'trainer' | 'receptionist' | 'admin';
  status: 'ACTIVE' | 'LOCKED';
  locked: boolean;
  createdAt: string;
  memberId?: string;
  cardCode?: string;
  address?: string;
  dateOfBirth?: string;
  gender?: string;
  branchId?: string;
  branchName?: string;
  position?: string;
  specialty?: string;
  experienceYears?: number;
  bio?: string;
}

export interface AuthResponseDto {
  token: string;
  expiresAt: string;
  user: ApiUserDto;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
  confirmPassword?: string;
}

export const authService = {
  async login(payload: LoginPayload): Promise<AuthResponseDto> {
    const res = await request<AuthResponseDto>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    setAuthToken(res.token);
    return res;
  },

  async register(payload: RegisterPayload): Promise<AuthResponseDto> {
    const res = await request<AuthResponseDto>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    setAuthToken(res.token);
    return res;
  },

  async changePassword(payload: ChangePasswordPayload): Promise<{ message: string }> {
    return request<{ message: string }>('/auth/change-password', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  logout(): void {
    setAuthToken(null);
  },
};
