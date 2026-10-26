export interface Company {

  id: number;

  name: string;

  slug: string;

  description: string;

  website: string;

  logo: string | null;

  cover_image?: string | null;

  industry: string;

  company_size: string;

  headquarters: string;

  founded_year: number | null;

  contact_email: string;

  contact_phone: string;

  linkedin_url: string;

  twitter_url: string;

  subscription_tier: string;

  job_post_quota: number;

  is_verified: boolean;

  is_active: boolean;

  active_job_count?: number;

  created_at: string;

  updated_at: string;
}


/* =====================================================
   Admin Company Details
   ===================================================== */

export interface CompanyRecentJob {

  id: number;

  title: string;

  slug: string;

  location: string;

  job_type: string;

  work_mode: string;

  experience_level: string;

  status: string;

  status_display: string;

  views_count: number;

  applications_count: number;

  posted_at: string | null;

  created_at: string;
}


/* =====================================================
   Complete Company Details
   Returned by:
   GET /api/companies/admin/.../
   ===================================================== */

export interface CompanyAdminDetails
  extends Company {

  /* ===================================================
     Company Creator
     =================================================== */

  created_by: number | null;


  /* ===================================================
     Job Statistics
     =================================================== */

  total_job_count: number;

  active_job_count: number;

  closed_job_count: number;


  /* ===================================================
     Application Statistics
     =================================================== */

  total_application_count: number;

  unique_candidate_count: number;


  /* ===================================================
     Application Pipeline
     =================================================== */

  applied_count: number;

  under_review_count: number;

  shortlisted_count: number;

  interview_count: number;

  offered_count: number;

  hired_count: number;

  rejected_count: number;


  /* ===================================================
     Job Quota
     =================================================== */

  jobs_used: number;

  jobs_remaining: number;


  /* ===================================================
     Recent Jobs
     =================================================== */

  recent_jobs: CompanyRecentJob[];
}