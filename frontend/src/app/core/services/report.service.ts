import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

const API = 'http://127.0.0.1:8000/api/reports/';

export interface Report {
  id: number;
  subject: string;
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
  admin_remarks?: string;
  created_at: string;
  resolved_at?: string;
}

export interface CreateReportRequest {
  subject: string;
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface PaginatedReports {
  count: number;
  next: string | null;
  previous: string | null;
  results: Report[];
}

export interface AdminReport {
  id: number;
  reporter_name: string;
  reporter_email: string;
  reporter_role: string;
  subject: string;
  description: string;
  priority: string;
  status: string;
  admin_remarks: string;
  created_at: string;
  resolved_at: string;
}

export interface PaginatedAdminReports {
  count: number;
  results: AdminReport[];
}

@Injectable({
  providedIn: 'root'
})
export class ReportService {

  private http = inject(HttpClient);

  createReport(data: CreateReportRequest): Observable<Report> {
    return this.http.post<Report>(API, data);
  }

  myReports(): Observable<PaginatedReports> {
    return this.http.get<PaginatedReports>(`${API}my/`);
  }

  adminReports(): Observable<PaginatedAdminReports> {
    return this.http.get<PaginatedAdminReports>(`${API}admin/`);
  }

  resolveReport(id: number, payload: any): Observable<any> {
    return this.http.patch(`${API}admin/${id}/`, payload);
  }
}