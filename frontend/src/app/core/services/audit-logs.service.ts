import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { API } from '../constants/api.constants';
import { PaginatedResponse } from '../models/common.model';

export interface AuditLog {
  id: number;
  action: string;
  action_display: string;
  severity: string;
  severity_display: string;
  actor: number | null;
  actor_email: string;
  actor_role: string;
  actor_name: string;
  target_type: string;
  target_id: number | null;
  target_repr: string;
  description: string;
  changes: any;
  metadata: any;
  ip_address: string | null;
  user_agent: string;
  created_at: string;
  time_since: string;
}

export interface AuditLogStats {
  total_logs: number;
  logs_today: number;
  logs_this_week: number;
  critical_count: number;
  warning_count: number;
  top_actions: { action: string; count: number }[];
  top_actors: { actor_email: string; actor_role: string; count: number }[];
}

export interface AuditLogFilters {
  action?: string;
  severity?: string;
  actor_role?: string;
  search?: string;
  ordering?: string;
  page?: number;
}

export interface AuditActionOption {
  value: string;
  label: string;
}

@Injectable({ providedIn: 'root' })
export class AuditLogsService {
  private api = inject(ApiService);

  listLogs(filters?: AuditLogFilters): Observable<PaginatedResponse<AuditLog>> {
    return this.api.get<PaginatedResponse<AuditLog>>(API.AUDIT.LIST, filters);
  }

  getStats(): Observable<AuditLogStats> {
    return this.api.get<AuditLogStats>(API.AUDIT.STATS);
  }

  getActions(): Observable<AuditActionOption[]> {
    return this.api.get<AuditActionOption[]>(API.AUDIT.ACTIONS);
  }
}