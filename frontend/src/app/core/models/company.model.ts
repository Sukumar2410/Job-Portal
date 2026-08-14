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