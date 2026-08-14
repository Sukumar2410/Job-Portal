import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { API } from '../constants/api.constants';
import { User } from '../models/user.model';
import { PaginatedResponse } from '../models/common.model';

export interface UserFilters {
  search?: string;
  role?: string;
  is_active?: boolean | string;
  is_verified?: boolean | string;
  ordering?: string;
  page?: number;
}

@Injectable({ providedIn: 'root' })
export class AdminUsersService {
  private api = inject(ApiService);

  listUsers(filters?: UserFilters): Observable<PaginatedResponse<User>> {
    return this.api.get<PaginatedResponse<User>>(API.AUTH.ADMIN_USERS, filters);
  }

  getUser(id: number): Observable<User> {
    return this.api.get<User>(API.AUTH.ADMIN_USER_DETAIL(id));
  }

  activate(id: number): Observable<any> {
    return this.api.post(API.AUTH.ADMIN_USER_ACTIVATE(id), {});
  }

  deactivate(id: number): Observable<any> {
    return this.api.post(API.AUTH.ADMIN_USER_DEACTIVATE(id), {});
  }

  verify(id: number): Observable<any> {
    return this.api.post(API.AUTH.ADMIN_USER_VERIFY(id), {});
  }
}