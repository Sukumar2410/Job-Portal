import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { API } from '../constants/api.constants';
import { User, AdminUserStats, AdminUserDetails } from '../models/user.model';
import { PaginatedResponse } from '../models/common.model';

export interface UserFilters {
  search?: string;
  role?: string;
  is_active?: boolean | string;
  is_verified?: boolean | string;
  ordering?: string;
  page?: number;
}

export interface AdminUsersResponse extends PaginatedResponse<User> {
  stats: AdminUserStats;
}

@Injectable({ providedIn: 'root' })
export class AdminUsersService {
  private api = inject(ApiService);

  listUsers(filters?: UserFilters): Observable<AdminUsersResponse> {
    return this.api.get<AdminUsersResponse>(
      API.AUTH.ADMIN_USERS,
      filters
    );
  }

  getUser(id: number): Observable<User> {
    return this.api.get<User>(API.AUTH.ADMIN_USER_DETAIL(id));
  }

  getUserDetails(id: number):
  Observable<AdminUserDetails> {
   return this.api.get<AdminUserDetails>(
    API.AUTH.ADMIN_USER_DETAILS(id)
   );
  }

  activate(id: number): Observable<any> {
    return this.api.post(
      API.AUTH.ADMIN_USER_ACTIVATE(id),
      {}
    );
  }

  deactivate(id: number): Observable<any> {
    return this.api.post(
      API.AUTH.ADMIN_USER_DEACTIVATE(id),
      {}
    );
  }

  verify(id: number): Observable<any> {
    return this.api.post(
      API.AUTH.ADMIN_USER_VERIFY(id),
      {}
    );
  }
}