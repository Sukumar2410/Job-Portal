export interface Job {
  id: number;
  slug: string;
  title: string;
  description?: string;
  responsibilities?: string;
  requirements?: string;
  benefits?: string;
  company: Company;
  job_type: string;
  work_mode: string;
  experience_level: string;
  location: string;
  min_salary: number | null;
  max_salary: number | null;
  currency: string;
  show_salary: boolean;
  skills_required?: string;
  skills_list: string[];
  application_deadline: string | null;
  max_applications: number | null;
  status: string;
  is_featured: boolean;
  views_count: number;
  applications_count: number;
  posted_at: string | null;
  created_at: string;
  updated_at: string;
  is_saved?: boolean;
  has_applied?: boolean;
}

export interface Company {
  id: number;
  name: string;
  slug: string;
  logo: string | null;
  industry: string;
  company_size: string;
  headquarters: string;
  is_verified: boolean;
  active_job_count?: number;
}