import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import { API } from '../constants/api.constants';
import {
  MockInterviewQuestion,
  MockInterviewEvaluation,
  TopCandidatesResponse,
  RecommendedJobsResponse
} from '../models/ai.model';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AIService {
  private api = inject(ApiService);

  getMockInterviewQuestions(sessionSlug: string): Observable<MockInterviewQuestion[]> {
    return this.api.get<MockInterviewQuestion[]>(API.AI.MOCK_INTERVIEW_QUESTIONS(sessionSlug));
  }

  evaluateMockInterviewAnswers(
    sessionSlug: string,
    responses: Array<{ question: string; answer: string }>
  ): Observable<MockInterviewEvaluation> {
    return this.api.post<MockInterviewEvaluation>(API.AI.MOCK_INTERVIEW_EVALUATE(sessionSlug), {
      responses,
    });
  }

    // ==========================================================
  // AI Recommended Jobs
  // ==========================================================

  getRecommendedJobs(
    limit: number = 10
  ): Observable<RecommendedJobsResponse> {

    return this.api.get<RecommendedJobsResponse>(
      API.AI.RECOMMENDED_JOBS,
      { limit }
    );

  }

  getTopCandidates(
    jobId: number,
    limit: number = 10
  ): Observable<TopCandidatesResponse> {

    return this.api.get<TopCandidatesResponse>(
      `${API.AI.TOP_CANDIDATES(jobId)}?limit=${limit}`
    );

  }
}

