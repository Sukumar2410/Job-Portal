import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { API } from '../constants/api.constants';

// TypeScript interfaces matching backend response
export interface CandidateDashboardData {
  total_applications: number;
  active_applications: number;
  shortlisted_count: number;
  interviews_scheduled: number;
  offers_received: number;
  rejected_count: number;
  saved_jobs_count: number;
  profile_completion: number;
  application_status_breakdown: Record<string, number>;
  recent_applications: RecentApplication[];
}

export interface RecentApplication {
  id: number;
  job_title: string;
  company_name: string;
  status: string;
  applied_at: string;
}

export interface HRDashboardData {
  total_jobs: number;
  active_jobs: number;
  draft_jobs: number;
  closed_jobs: number;
  total_applications: number;
  new_applications_this_week: number;
  interviews_scheduled: number;
  hired_count: number;
  total_job_views: number;
  hiring_funnel: Record<string, number>;
  applications_over_time: { date: string; count: number }[];
  top_jobs_by_applications: {
    id: number;
    title: string;
    applications: number;
    views: number;
  }[];
}

export interface AdminDashboardData {
  total_users: number;
  total_candidates: number;
  total_hr: number;
  total_companies: number;
  verified_companies: number;
  total_jobs: number;
  active_jobs: number;
  total_applications: number;
  total_hires: number;
  signups_over_time: { date: string; count: number }[];
  jobs_over_time: { date: string; count: number }[];
  top_companies_by_jobs: {
    id: number;
    name: string;
    jobs: number;
    is_verified: boolean;
  }[];
  role_distribution: Record<string, number>;
}

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private api = inject(ApiService);

  getCandidateDashboard(): Observable<CandidateDashboardData> {
    return this.api.get<CandidateDashboardData>(API.ANALYTICS.CANDIDATE_DASHBOARD);
  }

  getHRDashboard(): Observable<HRDashboardData> {
    return this.api.get<HRDashboardData>(API.ANALYTICS.HR_DASHBOARD);
  }

  getAdminDashboard(): Observable<AdminDashboardData> {
    return this.api.get<AdminDashboardData>(API.ANALYTICS.ADMIN_DASHBOARD);
  }
}