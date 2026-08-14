import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, of } from 'rxjs';

import { API, STORAGE_KEYS } from '../constants/api.constants';
import { User, UserRole, AuthResponse, RegisterResponse } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  // Signal-based reactive user state
  private _currentUser = signal<User | null>(this.loadUserFromStorage());

  // Public read-only signals
  currentUser = this._currentUser.asReadonly();
  isAuthenticated = computed(() => this._currentUser() !== null);
  userRole = computed(() => this._currentUser()?.role ?? null);

  // ==================== Register ====================
  register(payload: any): Observable<RegisterResponse> {
    return this.http.post<RegisterResponse>(API.AUTH.REGISTER, payload).pipe(
      tap((res) => {
        this.setSession(res.tokens.access, res.tokens.refresh, res.user);
      })
    );
  }

  // ==================== Login ====================
  login(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(API.AUTH.LOGIN, { email, password }).pipe(
      tap((res) => {
        this.setSession(res.access, res.refresh, res.user);
      })
    );
  }

  // ==================== Logout ====================
  logout(): void {
    const refresh = this.getRefreshToken();
    if (refresh) {
      this.http.post(API.AUTH.LOGOUT, { refresh })
        .pipe(catchError(() => of(null)))
        .subscribe();
    }
    this.clearSession();
    this.router.navigate(['/login']);
  }

  // ==================== Refresh Token ====================
  refreshToken(): Observable<{ access: string; refresh?: string }> {
    const refresh = this.getRefreshToken();
    return this.http.post<{ access: string; refresh?: string }>(API.AUTH.REFRESH, { refresh }).pipe(
      tap((res) => {
        localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, res.access);
        if (res.refresh) {
          localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, res.refresh);
        }
      })
    );
  }

  // ==================== Fetch Current User ====================
  fetchCurrentUser(): Observable<User> {
    return this.http.get<User>(API.AUTH.ME).pipe(
      tap((user) => {
        this._currentUser.set(user);
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
      })
    );
  }

  // ==================== Token Getters ====================
  getAccessToken(): string | null {
    return localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
  }

  // ==================== Role Helpers ====================
  hasRole(role: UserRole): boolean {
    return this._currentUser()?.role === role;
  }

  getDashboardRoute(): string {
    const role = this._currentUser()?.role;
    if (role === 'CANDIDATE') return '/candidate-dashboard';
    if (role === 'HR') return '/hr-dashboard';
    if (role === 'SUPER_ADMIN') return '/admin-dashboard';
    return '/login';
  }

  // ==================== Session Helpers ====================
  private setSession(access: string, refresh: string, user: User): void {
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, access);
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refresh);
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    this._currentUser.set(user);
  }

  private clearSession(): void {
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER);
    this._currentUser.set(null);
  }

  private loadUserFromStorage(): User | null {
    const userJson = localStorage.getItem(STORAGE_KEYS.USER);
    if (!userJson) return null;
    try {
      return JSON.parse(userJson);
    } catch {
      return null;
    }
  }
}