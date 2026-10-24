export type Role = 'member' | 'trainer' | 'receptionist' | 'admin';

export interface TrainerProfile {
  specialties: string[];
  experienceYears: number;
  certifications: string[];
  bio: string;
  branchIds: string[];
}

export interface User {
  id: string;
  role: Role;
  email: string;
  password: string;
  fullName: string;
  phone: string;
  gender: 'male' | 'female' | 'other';
  dob: string;
  address: string;
  avatarColor: string;
  locked: boolean;
  createdAt: string;
  branchId?: string; // receptionist work branch
  cardCode?: string; // member card / QR code
  trainer?: TrainerProfile;
}
