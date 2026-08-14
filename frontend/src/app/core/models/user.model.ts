export type UserRole = 'CANDIDATE' | 'HR' | 'SUPER_ADMIN';

export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  full_name?: string;
  phone?: string;
  role: UserRole;
  profile_picture?: string | null;
  is_verified: boolean;
  is_active?: boolean;
  date_joined?: string;
}

export interface AuthResponse {
  access: string;
  refresh: string;
  user: User;
}

export interface RegisterResponse {
  message: string;
  user: User;
  tokens: {
    access: string;
    refresh: string;
  };
}