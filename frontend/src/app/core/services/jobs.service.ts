import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { API } from '../constants/api.constants';
import { Job } from '../models/job.model';
import { PaginatedResponse } from '../models/common.model';

export interface JobFilters {
  search?: string;
  job_type?: string;
  work_mode?: string;
  experience_level?: string;
  status?: string;
  ordering?: string;
  page?: number;
}

@Injectable({ providedIn: 'root' })
export class JobsService {
  private api = inject(ApiService);

  listJobs(filters?: JobFilters): Observable<PaginatedResponse<Job>> {
    return this.api.get<PaginatedResponse<Job>>(API.JOBS.LIST, filters);
  }

  getJob(slug: string): Observable<Job> {
    return this.api.get<Job>(API.JOBS.DETAIL(slug));
  }

  createJob(payload: any): Observable<Job> {
    return this.api.post<Job>(API.JOBS.LIST, payload);
  }

  updateJob(slug: string, payload: any): Observable<Job> {
    return this.api.patch<Job>(API.JOBS.DETAIL(slug), payload);
  }

  deleteJob(slug: string): Observable<any> {
    return this.api.delete(API.JOBS.DETAIL(slug));
  }

  saveJob(slug: string): Observable<{ message: string }> {
    return this.api.post<{ message: string }>(API.JOBS.SAVE(slug), {});
  }

  unsaveJob(slug: string): Observable<{ message: string }> {
    return this.api.delete<{ message: string }>(API.JOBS.UNSAVE(slug));
  }

  getSavedJobs(): Observable<any[]> {
    return this.api.get<any[]>(API.JOBS.SAVED);
  }

  // HR status actions
  activateJob(slug: string): Observable<any> {
    return this.api.post(API.JOBS.ACTIVATE(slug), {});
  }

  pauseJob(slug: string): Observable<any> {
    return this.api.post(API.JOBS.PAUSE(slug), {});
  }

  closeJob(slug: string): Observable<any> {
    return this.api.post(API.JOBS.CLOSE(slug), {});
  }
}