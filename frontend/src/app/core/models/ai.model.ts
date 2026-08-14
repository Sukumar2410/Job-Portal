import { Job } from './job.model';


// ==========================================================
// AI Mock Interview
// ==========================================================

export interface MockInterviewQuestion {

  prompt: string;

  category?: string;

}


export interface MockInterviewEvaluation {

  score: number;

  feedback: string;

  highlights?: string[];

}


// ==========================================================
// AI Recommended Jobs
// ==========================================================

export interface RecommendedJob {

  job_id: number;

  job_slug: string;

  job_title: string;

  company_name: string;

  company_logo: string | null;

  location: string;

  work_mode: string;

  job_type: string;

  min_salary: number | null;

  max_salary: number | null;

  match_score: number;

  matched_skills: string[];

  missing_skills: string[];

}

export interface RecommendedCandidate {
  candidate_id: number;
  email: string;
  full_name: string;
  headline: string;
  experience_years: number;
  current_location: string;
  match_score: number;
  matched_skills: string[];
  missing_skills: string[];
}

export interface TopCandidatesResponse {
  job_id: number;
  job_title: string;
  count: number;
  results: RecommendedCandidate[];
}

export interface RecommendedJobsResponse {

  count: number;

  results: RecommendedJob[];

}