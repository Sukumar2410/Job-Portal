import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../core/services/auth.service';
import { AnalyticsService, CandidateDashboardData } from '../core/services/analytics.service';
import { TopNavComponent } from '../shared/top-nav/top-nav.component';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-candidate-dashboard',
  standalone: true,
  imports: [CommonModule, TopNavComponent, RouterLink],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">

      <!-- Top Navigation -->
      <app-top-nav portalName="Job Portal"></app-top-nav>

      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        <!-- Hero Card -->
        <div class="relative overflow-hidden bg-gradient-to-br from-primary-600 via-indigo-700 to-purple-700 rounded-3xl shadow-2xl mb-8 animate-fade-in">
          <div class="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
          <div class="absolute bottom-0 left-1/2 w-64 h-64 bg-purple-400/20 rounded-full blur-3xl"></div>

          <div class="relative p-8 sm:p-10">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div class="text-white">
                <div class="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur rounded-full text-xs font-semibold mb-3">
                  <span class="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
                  {{ getGreeting() }}
                </div>
                <h1 class="text-3xl sm:text-4xl font-bold mb-2">
                  Welcome back, {{ user?.first_name }}! 👋
                </h1>
                <p class="text-white/80 text-lg">
                  You have <span class="font-bold">{{ data()?.active_applications ?? 0 }}</span> active applications.
                </p>
              </div>
              <div class="flex gap-3">
                <button routerLink="/jobs"
                  class="px-6 py-3 bg-white text-primary-700 font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all">
                  Browse Jobs
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Loading Spinner -->
        <div *ngIf="loading()" class="flex justify-center py-20">
          <div class="flex flex-col items-center gap-3">
            <svg class="animate-spin w-10 h-10 text-primary-600" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
            </svg>
            <p class="text-sm text-gray-500">Loading your dashboard...</p>
          </div>
        </div>

        <!-- Error State -->
        <div *ngIf="error()" class="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
          <p class="text-red-700 font-semibold">Failed to load dashboard data.</p>
          <p class="text-sm text-red-600 mt-1">{{ error() }}</p>
          <button (click)="loadDashboard()" class="mt-3 px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-all">
            Try Again
          </button>
        </div>

        <!-- Dashboard Content (Real Data) -->
        <div *ngIf="!loading() && !error() && data()">

          <!-- Stats Grid -->
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <!-- Total Applications -->
            <div class="bg-white rounded-2xl p-6 shadow-soft hover:shadow-lg transition-all animate-slide-up group cursor-pointer">
              <div class="flex items-start justify-between mb-4">
                <div class="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                  </svg>
                </div>
                <span class="text-xs text-blue-600 font-semibold bg-blue-50 px-2 py-1 rounded-full">Total</span>
              </div>
              <div class="text-3xl font-bold text-gray-900 mb-1">{{ data()?.total_applications }}</div>
              <div class="text-sm text-gray-500">Total Applications</div>
            </div>

            <!-- Shortlisted -->
            <div class="bg-white rounded-2xl p-6 shadow-soft hover:shadow-lg transition-all animate-slide-up group cursor-pointer" style="animation-delay: 0.1s;">
              <div class="flex items-start justify-between mb-4">
                <div class="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"/>
                  </svg>
                </div>
                <span class="text-xs text-purple-600 font-semibold bg-purple-50 px-2 py-1 rounded-full">Great!</span>
              </div>
              <div class="text-3xl font-bold text-gray-900 mb-1">{{ data()?.shortlisted_count }}</div>
              <div class="text-sm text-gray-500">Shortlisted</div>
            </div>

            <!-- Interviews -->
            <div class="bg-white rounded-2xl p-6 shadow-soft hover:shadow-lg transition-all animate-slide-up group cursor-pointer" style="animation-delay: 0.2s;">
              <div class="flex items-start justify-between mb-4">
                <div class="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                  </svg>
                </div>
                <span class="text-xs text-amber-600 font-semibold bg-amber-50 px-2 py-1 rounded-full">Scheduled</span>
              </div>
              <div class="text-3xl font-bold text-gray-900 mb-1">{{ data()?.interviews_scheduled }}</div>
              <div class="text-sm text-gray-500">Interviews</div>
            </div>

            <!-- Saved Jobs -->
            <div class="bg-white rounded-2xl p-6 shadow-soft hover:shadow-lg transition-all animate-slide-up group cursor-pointer" style="animation-delay: 0.3s;">
              <div class="flex items-start justify-between mb-4">
                <div class="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
                  </svg>
                </div>
                <span class="text-xs text-emerald-600 font-semibold bg-emerald-50 px-2 py-1 rounded-full">Saved</span>
              </div>
              <div class="text-3xl font-bold text-gray-900 mb-1">{{ data()?.saved_jobs_count }}</div>
              <div class="text-sm text-gray-500">Saved Jobs</div>
            </div>
          </div>

          <!-- Two-Column Layout -->
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">

            <!-- Left: Profile + Quick Info -->
            <div class="lg:col-span-1 space-y-6">
              <!-- Profile Card -->
              <div class="bg-white rounded-2xl shadow-soft overflow-hidden animate-slide-up" style="animation-delay: 0.4s;">
                <div class="h-24 bg-gradient-to-r from-primary-500 to-purple-600"></div>
                <div class="px-6 pb-6">
                  <div class="w-20 h-20 bg-gradient-to-br from-primary-500 to-purple-600 rounded-full border-4 border-white -mt-10 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                    {{ getInitials() }}
                  </div>
                  <h3 class="mt-4 text-lg font-bold text-gray-900">{{ user?.first_name }} {{ user?.last_name }}</h3>
                  <p class="text-sm text-gray-500">{{ user?.email }}</p>

                  <div class="mt-4 flex items-center gap-2 flex-wrap">
                    <span *ngIf="user?.is_verified" class="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                      ✓ Verified
                    </span>
                    <span *ngIf="!user?.is_verified" class="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-700 text-xs font-semibold rounded-full">
                      ⚠️ Unverified
                    </span>
                    <span class="inline-flex items-center px-2 py-1 bg-primary-100 text-primary-700 text-xs font-semibold rounded-full">
                      Job Seeker
                    </span>
                  </div>

                  <!-- Profile Completion -->
                  <div class="mt-5">
                    <div class="flex justify-between text-xs mb-1">
                      <span class="text-gray-600 font-medium">Profile Completion</span>
                      <span class="text-primary-600 font-bold">{{ data()?.profile_completion }}%</span>
                    </div>
                    <div class="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div class="h-full bg-gradient-to-r from-primary-500 to-purple-600 rounded-full transition-all"
                        [style.width.%]="data()?.profile_completion || 0"></div>
                    </div>
                    <p class="text-xs text-gray-500 mt-2" *ngIf="(data()?.profile_completion || 0) < 100">
                      Complete your profile to get better matches
                    </p>
                    <p class="text-xs text-green-600 mt-2 font-semibold" *ngIf="(data()?.profile_completion || 0) === 100">
                      🎉 Profile fully complete!
                    </p>
                  </div>

                  <button routerLink="/profile"
                    class="mt-5 w-full py-2.5 bg-gradient-to-r from-primary-600 to-purple-600 text-white text-sm font-semibold rounded-xl shadow-md hover:shadow-lg transition-all">
                    Complete Profile
                  </button>
                </div>
              </div>

              <!-- Application Status Breakdown -->
              <div *ngIf="hasStatusBreakdown()" class="bg-white rounded-2xl shadow-soft p-6 animate-slide-up" style="animation-delay: 0.5s;">
                <h3 class="text-sm font-bold text-gray-900 mb-4">Application Status</h3>
                <div class="space-y-3">
                  <div *ngFor="let entry of getStatusEntries()" class="flex items-center justify-between">
                    <div class="flex items-center gap-2">
                      <span class="w-2 h-2 rounded-full" [style.background]="getStatusColor(entry.status)"></span>
                      <span class="text-sm text-gray-700">{{ formatStatus(entry.status) }}</span>
                    </div>
                    <span class="text-sm font-bold text-gray-900">{{ entry.count }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Right: Recent Applications -->
            <div class="lg:col-span-2 space-y-6">
              <div class="bg-white rounded-2xl shadow-soft p-6 animate-slide-up" style="animation-delay: 0.4s;">
                <div class="flex items-center justify-between mb-5">
                  <div>
                    <h3 class="text-lg font-bold text-gray-900">Recent Applications</h3>
                    <p class="text-xs text-gray-500 mt-0.5">Your latest 5 applications</p>
                  </div>
                  <button class="text-sm text-primary-600 hover:text-primary-700 font-semibold">
                    View all →
                  </button>
                </div>

                <!-- Empty state -->
                <div *ngIf="!data()?.recent_applications?.length" class="py-12 text-center">
                  <div class="w-20 h-20 bg-gradient-to-br from-primary-100 to-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <svg class="w-10 h-10 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                    </svg>
                  </div>
                  <h4 class="text-lg font-bold text-gray-900 mb-2">No applications yet</h4>
                  <p class="text-sm text-gray-500 mb-4">Start applying to jobs to see your applications here.</p>
                  <button routerLink="/jobs"
                    class="px-6 py-2.5 bg-gradient-to-r from-primary-600 to-purple-600 text-white text-sm font-semibold rounded-xl shadow-md hover:shadow-lg transition-all">
                    Browse Jobs →
                  </button>
                </div>

                <!-- Applications list -->
                <div *ngIf="(data()?.recent_applications?.length ?? 0) > 0" class="space-y-3">
                  <div *ngFor="let app of data()?.recent_applications"
                    class="group flex items-center justify-between p-4 border-2 border-gray-100 rounded-xl hover:border-primary-300 hover:bg-primary-50/30 transition-all cursor-pointer">
                    <div class="flex items-center gap-4 min-w-0">
                      <div class="w-12 h-12 bg-gradient-to-br from-primary-100 to-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <svg class="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                        </svg>
                      </div>
                      <div class="min-w-0">
                        <div class="font-semibold text-gray-900 truncate">{{ app.job_title }}</div>
                        <div class="text-sm text-gray-500 truncate">{{ app.company_name }}</div>
                        <div class="text-xs text-gray-400 mt-0.5">{{ formatDate(app.applied_at) }}</div>
                      </div>
                    </div>
                    <span class="ml-3 px-3 py-1 text-xs font-semibold rounded-full flex-shrink-0"
                      [style.background]="getStatusBg(app.status)"
                      [style.color]="getStatusColor(app.status)">
                      {{ formatStatus(app.status) }}
                    </span>
                  </div>
                </div>
              </div>

              <!-- Quick Actions -->
              <div class="bg-white rounded-2xl shadow-soft p-6 animate-slide-up" style="animation-delay: 0.5s;">
                <h3 class="text-lg font-bold text-gray-900 mb-4">Quick Actions</h3>
                <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <button *ngFor="let action of quickActions"
                      [routerLink]="action.route"
                      class="group flex flex-col items-center p-4 rounded-xl border-2 border-gray-100 hover:border-primary-300 hover:bg-primary-50 transition-all">
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
export class CandidateDashboardComponent implements OnInit {
  private auth = inject(AuthService);
  private router = inject(Router);
  private analyticsService = inject(AnalyticsService);

  user: any = null;
  loading = signal(true);
  error = signal<string | null>(null);
  data = signal<CandidateDashboardData | null>(null);

      quickActions = [
    { icon: '🔍', label: 'Browse Jobs', bg: 'linear-gradient(135deg, #dbeafe, #bfdbfe)', route: '/jobs' },
    { icon: '💼', label: 'Applications', bg: 'linear-gradient(135deg, #fef3c7, #fde68a)', route: '/my-applications' },
    { icon: '❤️', label: 'Saved Jobs', bg: 'linear-gradient(135deg, #fce7f3, #fbcfe8)', route: '/saved-jobs' },
    { icon: '📊', label: 'My Analytics', bg: 'linear-gradient(135deg, #d1fae5, #a7f3d0)', route: '/candidate/analytics' },
    { icon: '📄', label: 'My Profile', bg: 'linear-gradient(135deg, #f3e8ff, #e9d5ff)', route: '/profile' },
    { icon: '🔗', label: 'Connect', bg: 'linear-gradient(135deg, #e0f2fe, #bae6fd)', route: '/social' },
    { icon: '💬', label: 'Messaging', bg: 'linear-gradient(135deg, #fef3c7, #fde68a)', route: '/messages' },
    { icon: '🔔', label: 'Notifications', bg: 'linear-gradient(135deg, #e0e7ff, #c7d2fe)', route: '/notifications' },
    { icon: '✨', label: 'AI Recommended Jobs', bg: 'linear-gradient(135deg, #e0e7ff, #c7d2fe)', route: '/ai-recommended-jobs' },
    { icon: '🤖', label: 'AI Career Center', bg: 'linear-gradient(135deg, #ede9fe, #c4b5fd)', route: '/ai-career-center'},
    { icon: '💳', label: 'Billing', bg: 'linear-gradient(135deg, #fef3c7, #fde68a)', route: '/billing' },
  ];

  private statusColors: Record<string, { bg: string; color: string }> = {
    APPLIED:              { bg: '#dbeafe', color: '#1d4ed8' },
    UNDER_REVIEW:         { bg: '#fef3c7', color: '#b45309' },
    SHORTLISTED:          { bg: '#f3e8ff', color: '#7e22ce' },
    INTERVIEW_SCHEDULED:  { bg: '#e0e7ff', color: '#4338ca' },
    INTERVIEWED:          { bg: '#cffafe', color: '#0e7490' },
    OFFERED:              { bg: '#dcfce7', color: '#15803d' },
    HIRED:                { bg: '#d1fae5', color: '#065f46' },
    REJECTED:             { bg: '#fee2e2', color: '#b91c1c' },
    WITHDRAWN:            { bg: '#f3f4f6', color: '#4b5563' },
  };

  ngOnInit(): void {
    this.user = this.auth.currentUser();
    this.loadDashboard();
  }

  loadDashboard(): void {
    this.loading.set(true);
    this.error.set(null);

    this.analyticsService.getCandidateDashboard().subscribe({
      next: (res) => {
        this.data.set(res);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err?.error?.detail || 'Something went wrong.');
        this.loading.set(false);
      }
    });
  }

  hasStatusBreakdown(): boolean {
    const breakdown = this.data()?.application_status_breakdown;
    return breakdown ? Object.keys(breakdown).length > 0 : false;
  }

  getStatusEntries(): { status: string; count: number }[] {
    const breakdown = this.data()?.application_status_breakdown || {};
    return Object.entries(breakdown).map(([status, count]) => ({ status, count }));
  }

  getStatusColor(status: string): string {
    return this.statusColors[status]?.color || '#6b7280';
  }

  getStatusBg(status: string): string {
    return this.statusColors[status]?.bg || '#f3f4f6';
  }

  formatStatus(status: string): string {
    return status.split('_').map(w => w[0] + w.slice(1).toLowerCase()).join(' ');
  }

  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
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