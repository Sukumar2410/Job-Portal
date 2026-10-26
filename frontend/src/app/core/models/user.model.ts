export type UserRole =
  | 'CANDIDATE'
  | 'HR'
  | 'SUPER_ADMIN';


export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  full_name?: string;
  phone?: string | null;
  role: UserRole;
  profile_picture?: string | null;
  is_verified: boolean;
  is_active?: boolean;
  date_joined?: string;
}


export interface AdminResume {
  id: number;
  title: string;
  file_url: string | null;
  visibility: string;
  is_default: boolean;
  is_boosted: boolean;
  ats_score: number | null;
  download_count: number;
  created_at: string;
  updated_at: string;
}


export interface AdminCandidateProfile {
  headline: string;
  summary: string;
  skills: string;
  experience_years: number;
  current_location: string;
  expected_salary: string | null;

  linkedin_url: string;
  github_url: string;
  portfolio_url: string;

  legacy_resume_url: string | null;

  resumes: AdminResume[];

  created_at: string;
  updated_at: string;
}


export interface AdminHRProfile {
  designation: string;
  department: string;

  company_id: number | null;
  company_name: string | null;

  created_at: string;
  updated_at: string;
}


export interface AdminUserDetails extends User {

  is_staff: boolean;
  is_superuser: boolean;

  last_login: string | null;

  profile:
    | AdminCandidateProfile
    | AdminHRProfile
    | null;
}


export interface AdminUserStats {
  total_users: number;
  candidates: number;
  recruiters: number;
  admins: number;
  verified: number;
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