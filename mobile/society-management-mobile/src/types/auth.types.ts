export type UserRole = 'SuperAdmin' | 'SocietyAdmin' | 'Resident' | 'SecurityGuard';

export interface User {
  id: number;
  email: string;
  fullName: string;
  role: UserRole;
  societyId: number | null;
  societyName: string | null;
  permissions: string[];
}

export interface LoginResponse {
  token: string;
  fullName: string;
  email: string;
  role: string;
  userId: number;
  societyId: number | null;
  societyName: string | null;
  expiration: string;
  permissions: string[];
}
