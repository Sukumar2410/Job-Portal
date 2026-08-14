import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { API } from '../constants/api.constants';
import { Application, ApplyPayload, MatchScoreResponse } from '../models/application.model';
import { PaginatedResponse } from '../models/common.model';

@Injectable({ providedIn: 'root' })
export class ApplicationsService {
  private api = inject(ApiService);

  applyToJob(payload: ApplyPayload): Observable<Application> {
    return this.api.post<Application>(API.APPLICATIONS.LIST, payload);
  }

  getMyApplications(): Observable<PaginatedResponse<Application>> {
    return this.api.get<PaginatedResponse<Application>>(API.APPLICATIONS.MY_APPLICATIONS);
  }

  getApplication(id: number): Observable<Application> {
    return this.api.get<Application>(API.APPLICATIONS.DETAIL(id));
  }

  withdraw(id: number, reason?: string): Observable<{ message: string }> {
    return this.api.post<{ message: string }>(API.APPLICATIONS.WITHDRAW(id), { reason });
  }

  getMatchScore(jobId: number): Observable<MatchScoreResponse> {
    return this.api.get<MatchScoreResponse>(API.AI.MATCH_SCORE(jobId));
  }
}