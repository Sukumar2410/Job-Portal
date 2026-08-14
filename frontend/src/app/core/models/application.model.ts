import { Job } from './job.model';

export interface Application {
  id: number;
  job: Job;
  candidate?: any;
  candidate_profile?: any;   // ← MUST HAVE THIS LINE
  candidate_email?: string;
  candidate_name?: string;
  cover_letter: string;
  resume_snapshot: string | null;
  expected_salary: number | null;
  notice_period_days: number | null;
  status: string;
  status_display: string;
  hr_notes?: string;
  rating?: number | null;
  rejection_reason?: string;
  applied_at: string;
  updated_at: string;
  status_history?: StatusHistoryItem[];
  interviews?: Interview[];
}

export interface StatusHistoryItem {
  id: number;
  from_status: string;
  to_status: string;
  to_status_display: string;
  changed_by_email: string;
  note: string;
  changed_at: string;
}

export interface Interview {
  id: number;
  application: number;
  round_name: string;
  mode: string;
  scheduled_at: string;
  duration_minutes: number;
  meeting_link: string;
  location: string;
  interviewer_name: string;
  interviewer_email: string;
  instructions: string;
  is_completed: boolean;
  feedback: string;
  rating: number | null;
}

export interface ApplyPayload {
  job: number;
  cover_letter?: string;
  expected_salary?: number;
  notice_period_days?: number;
}

export interface MatchScoreResponse {
  total_score: number;
  breakdown: {
    skills: number;
    experience: number;
    location: number;
    salary: number;
  };
  matched_skills: string[];
  missing_skills: string[];
  job_id: number;
  job_title: string;
}