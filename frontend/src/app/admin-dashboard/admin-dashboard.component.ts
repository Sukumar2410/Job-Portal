import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, } from '@angular/router';
import { RouterLink } from '@angular/router';
import { AuthService } from '../core/services/auth.service';
import { AnalyticsService, AdminDashboardData } from '../core/services/analytics.service';
import { TopNavComponent } from '../shared/top-nav/top-nav.component';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, TopNavComponent, RouterLink],  
  template: `
    <div class="min-h-screen bg-gradient-to-br from-slate-50 via-rose-50 to-red-50">

      <app-top-nav portalName="Admin Console"></app-top-nav>

      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        <div class="relative overflow-hidden bg-gradient-to-br from-rose-600 via-red-700 to-pink-700 rounded-3xl shadow-2xl mb-8 animate-fade-in">
          <div class="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
          <div class="relative p-8 sm:p-10">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div class="text-white">
                <div class="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur rounded-full text-xs font-semibold mb-3">
                  <span class="w-1.5 h-1.5 bg-green-300 rounded-full animate-pulse"></span>
                  {{ getGreeting() }}, Admin
                </div>
                <h1 class="text-3xl sm:text-4xl font-bold mb-2">
                  Platform Control Center 🛡️
                </h1>
                <p class="text-white/80 text-lg">
                  <span class="font-bold">{{ data()?.total_users ?? 0 }}</span> users registered on the platform.
                </p>
              </div>
              <div class="flex gap-3">
                <button routerLink="/admin/broadcast"
                  class="px-6 py-3 bg-white text-rose-700 font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all">
                  📢 Broadcast
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Loading -->
        <div *ngIf="loading()" class="flex justify-center py-20">
          <svg class="animate-spin w-10 h-10 text-rose-600" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
          </svg>
        </div>

        <!-- Error -->
        <div *ngIf="error()" class="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
          <p class="text-red-700 font-semibold">{{ error() }}</p>
          <button (click)="loadDashboard()" class="mt-3 px-4 py-2 bg-red-600 text-white text-sm rounded-lg">Try Again</button>
        </div>

        <div *ngIf="!loading() && !error() && data()">

          <!-- Stats -->
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div class="bg-white rounded-2xl p-6 shadow-soft hover:shadow-lg transition-all animate-slide-up">
              <div class="flex items-start justify-between mb-4">
                <div class="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                  <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
                  </svg>
                </div>
              </div>
              <div class="text-3xl font-bold text-gray-900 mb-1">{{ data()?.total_users }}</div>
              <div class="text-sm text-gray-500">Total Users</div>
              <div class="mt-2 text-xs text-gray-400">{{ data()?.total_candidates }} candidates · {{ data()?.total_hr }} recruiters</div>
            </div>

            <div class="bg-white rounded-2xl p-6 shadow-soft hover:shadow-lg transition-all animate-slide-up" style="animation-delay: 0.1s;">
              <div class="flex items-start justify-between mb-4">
                <div class="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg">
                  <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                  </svg>
                </div>
                <span class="text-xs text-emerald-600 font-semibold bg-emerald-50 px-2 py-1 rounded-full">{{ data()?.verified_companies }} verified</span>
              </div>
              <div class="text-3xl font-bold text-gray-900 mb-1">{{ data()?.total_companies }}</div>
              <div class="text-sm text-gray-500">Companies</div>
            </div>

            <div class="bg-white rounded-2xl p-6 shadow-soft hover:shadow-lg transition-all animate-slide-up" style="animation-delay: 0.2s;">
              <div class="flex items-start justify-between mb-4">
                <div class="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
                  <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                  </svg>
                </div>
                <span class="text-xs text-purple-600 font-semibold bg-purple-50 px-2 py-1 rounded-full">{{ data()?.active_jobs }} active</span>
              </div>
              <div class="text-3xl font-bold text-gray-900 mb-1">{{ data()?.total_jobs }}</div>
              <div class="text-sm text-gray-500">Jobs Posted</div>
            </div>

            <div class="bg-white rounded-2xl p-6 shadow-soft hover:shadow-lg transition-all animate-slide-up" style="animation-delay: 0.3s;">
              <div class="flex items-start justify-between mb-4">
                <div class="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
                  <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                  </svg>
                </div>
                <span class="text-xs text-amber-600 font-semibold bg-amber-50 px-2 py-1 rounded-full">{{ data()?.total_hires }} hires</span>
              </div>
              <div class="text-3xl font-bold text-gray-900 mb-1">{{ data()?.total_applications }}</div>
              <div class="text-sm text-gray-500">Applications</div>
            </div>
          </div>

          <!-- Two-Column -->
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">

            <div class="lg:col-span-1 space-y-6">
              <!-- Role distribution -->
              <div class="bg-white rounded-2xl shadow-soft p-6 animate-slide-up" style="animation-delay: 0.4s;">
                <h3 class="text-sm font-bold text-gray-900 mb-4">User Distribution</h3>
                <div class="space-y-3">
                  <div *ngFor="let entry of getRoleEntries()" class="flex items-center justify-between">
                    <div class="flex items-center gap-2">
                      <span class="w-2 h-2 rounded-full bg-rose-500"></span>
                      <span class="text-sm text-gray-700">{{ formatRole(entry.role) }}</span>
                    </div>
                    <span class="text-sm font-bold text-gray-900">{{ entry.count }}</span>
                  </div>
                </div>
              </div>

              <div class="bg-gradient-to-br from-rose-50 to-red-50 border border-rose-200 rounded-2xl p-6 animate-slide-up" style="animation-delay: 0.5s;">
                <div class="flex items-start gap-3">
                  <div class="w-10 h-10 bg-rose-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <span class="text-xl">🛡️</span>
                  </div>
                  <div>
                    <h4 class="font-bold text-rose-900 mb-1">Admin Notice</h4>
                    <p class="text-sm text-rose-800">All actions are logged in the audit trail.</p>
                  </div>
                </div>
              </div>
            </div>

            <div class="lg:col-span-2 space-y-6">
              <!-- Top Companies -->
              <div class="bg-white rounded-2xl shadow-soft p-6 animate-slide-up" style="animation-delay: 0.4s;">
                <div class="flex items-center justify-between mb-5">
                  <h3 class="text-lg font-bold text-gray-900">Top Companies by Jobs</h3>
                </div>

                <div *ngIf="!data()?.top_companies_by_jobs?.length" class="py-8 text-center text-sm text-gray-500">
                  No companies with jobs yet.
                </div>

                <div *ngIf="(data()?.top_companies_by_jobs?.length ?? 0) > 0" class="space-y-3">
                  <div *ngFor="let comp of data()?.top_companies_by_jobs; let i = index"
                    class="flex items-center justify-between p-4 border-2 border-gray-100 rounded-xl hover:border-rose-300 hover:bg-rose-50/30 transition-all">
                    <div class="flex items-center gap-4 min-w-0">
                      <div class="w-10 h-10 bg-gradient-to-br from-rose-500 to-red-600 rounded-lg flex items-center justify-center text-white font-bold flex-shrink-0">
                        {{ i + 1 }}
                      </div>
                      <div class="min-w-0">
                        <div class="font-semibold text-gray-900 truncate flex items-center gap-2">
                          {{ comp.name }}
                          <span *ngIf="comp.is_verified" class="text-blue-500" title="Verified">✓</span>
                        </div>
                      </div>
                    </div>
                    <div class="text-right flex-shrink-0">
                      <div class="text-2xl font-bold text-rose-600">{{ comp.jobs }}</div>
                      <div class="text-xs text-gray-500">jobs</div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Quick Actions -->
              <div class="bg-white rounded-2xl shadow-soft p-6 animate-slide-up" style="animation-delay: 0.5s;">
                <h3 class="text-lg font-bold text-gray-900 mb-4">Admin Actions</h3>
                <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <button *ngFor="let action of quickActions"
                      [routerLink]="action.route"
                      class="group flex flex-col items-center p-4 rounded-xl border-2 border-gray-100 hover:border-rose-300 hover:bg-rose-50 transition-all">
                    <div class="w-12 h-12 rounded-xl flex items-center justify-center mb-2 group-hover:scale-110 transition-transform"
                      [style.background]="action.bg">
                      <span class="text-2xl">{{ action.icon }}</span>
                    </div>
                    <span class="text-sm font-semibold text-gray-700 text-center">{{ action.label }}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  `
})
export class AdminDashboardComponent implements OnInit {
  private auth = inject(AuthService);
  private router = inject(Router);
  private analyticsService = inject(AnalyticsService);

  user: any = null;
  loading = signal(true);
  error = signal<string | null>(null);
  data = signal<AdminDashboardData | null>(null);

    quickActions = [
    { icon: '📊', label: 'Analytics', bg: 'linear-gradient(135deg, #f3e8ff, #e9d5ff)', route: '/admin/analytics' },
    { icon: '👥', label: 'Users', bg: 'linear-gradient(135deg, #dbeafe, #bfdbfe)', route: '/admin/users' },
    { icon: '🏢', label: 'Companies', bg: 'linear-gradient(135deg, #d1fae5, #a7f3d0)', route: '/admin/companies' },
    { icon: '🔍', label: 'Audit Logs', bg: 'linear-gradient(135deg, #fef3c7, #fde68a)', route: '/admin/audit-logs' },
    { icon: '📢', label: 'Broadcast', bg: 'linear-gradient(135deg, #fce7f3, #fbcfe8)', route: '/admin/broadcast' },
    { icon: '🔔', label: 'Notifications', bg: 'linear-gradient(135deg, #e0e7ff, #c7d2fe)', route: '/notifications' },
  ];

  ngOnInit(): void {
    this.user = this.auth.currentUser();
    this.loadDashboard();
  }

  loadDashboard(): void {
    this.loading.set(true);
    this.error.set(null);
    this.analyticsService.getAdminDashboard().subscribe({
      next: (res) => { this.data.set(res); this.loading.set(false); },
      error: (err) => {
        this.error.set(err?.error?.detail || 'Failed to load dashboard.');
        this.loading.set(false);
      }
    });
  }

  getRoleEntries(): { role: string; count: number }[] {
    const roles = this.data()?.role_distribution || {};
    return Object.entries(roles).map(([role, count]) => ({ role, count }));
  }

  formatRole(role: string): string {
    const map: Record<string, string> = {
      CANDIDATE: 'Candidates',
      HR: 'HR / Recruiters',
      SUPER_ADMIN: 'Super Admins'
    };
    return map[role] || role;
  }

  getInitials(): string {
    if (!this.user) return '?';
    return (this.user.first_name?.[0] || '') + (this.user.last_name?.[0] || '');
  }

  getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  }

  logout(): void {
    this.auth.logout();
  }
}