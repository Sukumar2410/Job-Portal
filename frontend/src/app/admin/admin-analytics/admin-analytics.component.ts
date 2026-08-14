import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TopNavComponent } from '../../shared/top-nav/top-nav.component';
import { AnalyticsService, AdminDashboardData } from '../../core/services/analytics.service';

@Component({
  selector: 'app-admin-analytics',
  standalone: true,
  imports: [CommonModule, TopNavComponent],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-slate-50 via-rose-50 to-red-50">
      <app-top-nav portalName="Admin Console"></app-top-nav>

      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        <div class="mb-8 animate-fade-in">
          <h1 class="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">Platform Analytics 📊</h1>
          <p class="text-gray-600">Complete visibility into your entire platform.</p>
        </div>

        <!-- Loading -->
        <div *ngIf="loading()" class="flex justify-center py-20">
          <svg class="animate-spin w-10 h-10 text-rose-600" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
          </svg>
        </div>

        <ng-container *ngIf="!loading() && data() as d">

          <!-- KPI Cards -->
          <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div class="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg p-6 text-white animate-slide-up">
              <div class="text-4xl mb-2">👥</div>
              <div class="text-3xl font-bold">{{ d.total_users }}</div>
              <div class="text-sm opacity-90">Total Users</div>
              <div class="text-xs opacity-70 mt-1">{{ d.total_candidates }} candidates · {{ d.total_hr }} recruiters</div>
            </div>
            <div class="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl shadow-lg p-6 text-white animate-slide-up" style="animation-delay: 0.1s;">
              <div class="text-4xl mb-2">🏢</div>
              <div class="text-3xl font-bold">{{ d.total_companies }}</div>
              <div class="text-sm opacity-90">Companies</div>
              <div class="text-xs opacity-70 mt-1">{{ d.verified_companies }} verified</div>
            </div>
            <div class="bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl shadow-lg p-6 text-white animate-slide-up" style="animation-delay: 0.2s;">
              <div class="text-4xl mb-2">💼</div>
              <div class="text-3xl font-bold">{{ d.total_jobs }}</div>
              <div class="text-sm opacity-90">Jobs Posted</div>
              <div class="text-xs opacity-70 mt-1">{{ d.active_jobs }} active</div>
            </div>
            <div class="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl shadow-lg p-6 text-white animate-slide-up" style="animation-delay: 0.3s;">
              <div class="text-4xl mb-2">📝</div>
              <div class="text-3xl font-bold">{{ d.total_applications }}</div>
              <div class="text-sm opacity-90">Applications</div>
              <div class="text-xs opacity-70 mt-1">{{ d.total_hires }} hires</div>
            </div>
          </div>

          <!-- Success Rate Banner -->
          <div class="bg-gradient-to-br from-rose-600 via-red-700 to-pink-700 rounded-2xl shadow-2xl p-6 mb-8 text-white animate-slide-up relative overflow-hidden" style="animation-delay: 0.4s;">
            <div class="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
            <div class="relative">
              <h3 class="text-lg font-bold mb-4">🌐 Platform Health</h3>
              <div class="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div>
                  <div class="text-3xl font-bold">{{ hireRate() }}%</div>
                  <div class="text-sm opacity-90">Hire Rate</div>
                </div>
                <div>
                  <div class="text-3xl font-bold">{{ verificationRate() }}%</div>
                  <div class="text-sm opacity-90">Verified Cos</div>
                </div>
                <div>
                  <div class="text-3xl font-bold">{{ activeJobsPercent() }}%</div>
                  <div class="text-sm opacity-90">Active Jobs</div>
                </div>
                <div>
                  <div class="text-3xl font-bold">{{ avgAppsPerJob() }}</div>
                  <div class="text-sm opacity-90">Apps per Job</div>
                </div>
              </div>
            </div>
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">

            <!-- Role Distribution Donut -->
            <div class="bg-white rounded-2xl shadow-soft p-6 animate-slide-up" style="animation-delay: 0.5s;">
              <h3 class="text-lg font-bold text-gray-900 mb-1">User Roles</h3>
              <p class="text-xs text-gray-500 mb-4">Platform user distribution</p>

              <div class="flex items-center justify-center py-4">
                <div class="relative w-40 h-40">
                  <svg viewBox="0 0 100 100" class="transform -rotate-90 w-full h-full">
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#f3f4f6" stroke-width="15"/>
                    <circle *ngFor="let seg of roleDonut()"
                      cx="50" cy="50" r="40" fill="none"
                      [attr.stroke]="seg.color" stroke-width="15"
                      [attr.stroke-dasharray]="seg.dashArray"
                      [attr.stroke-dashoffset]="seg.dashOffset"
                      class="transition-all duration-1000"/>
                  </svg>
                  <div class="absolute inset-0 flex flex-col items-center justify-center">
                    <div class="text-2xl font-bold text-gray-900">{{ d.total_users }}</div>
                    <div class="text-xs text-gray-500">Users</div>
                  </div>
                </div>
              </div>

              <div class="space-y-2 mt-4">
                <div *ngFor="let seg of roleDonut()" class="flex items-center gap-2 text-sm">
                  <span class="w-3 h-3 rounded-sm" [style.background]="seg.color"></span>
                  <span class="text-gray-700 flex-1">{{ seg.label }}</span>
                  <span class="font-bold text-gray-900">{{ seg.value }}</span>
                </div>
              </div>
            </div>

            <!-- Top Companies Leaderboard -->
            <div class="bg-white rounded-2xl shadow-soft p-6 lg:col-span-2 animate-slide-up" style="animation-delay: 0.6s;">
              <h3 class="text-lg font-bold text-gray-900 mb-1">🏆 Top Companies</h3>
              <p class="text-xs text-gray-500 mb-4">Ranked by job postings</p>

              <div *ngIf="d.top_companies_by_jobs && d.top_companies_by_jobs.length > 0; else noCompanies" class="space-y-3">
                <div *ngFor="let comp of d.top_companies_by_jobs.slice(0, 5); let i = index"
                  class="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-all animate-slide-in-right"
                  [style.animation-delay]="(i * 0.05) + 's'">
                  <div class="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0"
                    [style.background]="getRankColor(i)">
                    {{ i + 1 }}
                  </div>
                  <div class="flex-1 min-w-0">
                    <div class="font-semibold text-gray-900 truncate flex items-center gap-2">
                      {{ comp.name }}
                      <span *ngIf="comp.is_verified" class="text-blue-500 text-xs" title="Verified">✓</span>
                    </div>
                  </div>
                  <div class="w-32 h-2 bg-gray-200 rounded-full overflow-hidden flex-shrink-0">
                    <div class="h-full bg-gradient-to-r from-rose-500 to-red-600 rounded-full transition-all duration-1000"
                      [style.width.%]="getBarWidth(comp.jobs)"></div>
                  </div>
                  <div class="text-right w-16 flex-shrink-0">
                    <div class="text-xl font-bold text-rose-600">{{ comp.jobs }}</div>
                    <div class="text-xs text-gray-500">jobs</div>
                  </div>
                </div>
              </div>

              <ng-template #noCompanies>
                <div class="text-center py-12 text-gray-500">
                  <div class="text-4xl mb-2">🏢</div>
                  <p>No companies yet</p>
                </div>
              </ng-template>
            </div>
          </div>

          <!-- Signups Over Time -->
          <div class="bg-white rounded-2xl shadow-soft p-6 mb-6 animate-slide-up" style="animation-delay: 0.7s;">
            <h3 class="text-lg font-bold text-gray-900 mb-1">📈 User Signups (Last 30 Days)</h3>
            <p class="text-xs text-gray-500 mb-6">Platform growth trend</p>

            <div *ngIf="signupPoints().length > 0; else noSignups">
              <div class="relative h-64">
                <svg [attr.viewBox]="'0 0 ' + chartWidth + ' 200'" preserveAspectRatio="none" class="w-full h-full">
                  <line *ngFor="let y of [0, 50, 100, 150, 200]" x1="0" [attr.x2]="chartWidth" [attr.y1]="y" [attr.y2]="y" stroke="#f3f4f6" stroke-width="1"/>
                  <defs>
                    <linearGradient id="signupGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" style="stop-color:#e11d48;stop-opacity:0.4"/>
                      <stop offset="100%" style="stop-color:#e11d48;stop-opacity:0"/>
                    </linearGradient>
                  </defs>
                  <path [attr.d]="signupAreaPath()" fill="url(#signupGrad)"/>
                  <path [attr.d]="signupLinePath()" fill="none" stroke="#e11d48" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <circle *ngFor="let pt of signupPoints()"
                    [attr.cx]="pt.x" [attr.cy]="pt.y" r="3" fill="#e11d48" stroke="white" stroke-width="2"/>
                </svg>
              </div>
              <div class="flex justify-between text-xs text-gray-500 mt-2">
                <span>{{ getSignupFirstDate() }}</span>
                <span>{{ getSignupLastDate() }}</span>
              </div>
              <div class="mt-4 grid grid-cols-3 gap-4 text-center">
                <div class="p-3 bg-rose-50 rounded-lg">
                  <div class="text-xl font-bold text-rose-700">{{ totalSignups() }}</div>
                  <div class="text-xs text-gray-600">Total Signups</div>
                </div>
                <div class="p-3 bg-blue-50 rounded-lg">
                  <div class="text-xl font-bold text-blue-700">{{ peakSignups() }}</div>
                  <div class="text-xs text-gray-600">Peak Day</div>
                </div>
                <div class="p-3 bg-purple-50 rounded-lg">
                  <div class="text-xl font-bold text-purple-700">{{ avgSignups() }}</div>
                  <div class="text-xs text-gray-600">Avg per Day</div>
                </div>
              </div>
            </div>

            <ng-template #noSignups>
              <div class="text-center py-12 text-gray-500">
                <div class="text-4xl mb-2">📊</div>
                <p>No signups in the last 30 days</p>
              </div>
            </ng-template>
          </div>

          <!-- Jobs Over Time -->
          <div class="bg-white rounded-2xl shadow-soft p-6 animate-slide-up" style="animation-delay: 0.8s;">
            <h3 class="text-lg font-bold text-gray-900 mb-1">💼 Jobs Created (Last 30 Days)</h3>
            <p class="text-xs text-gray-500 mb-6">Job posting activity</p>

            <div *ngIf="jobPoints().length > 0; else noJobs">
              <div class="relative h-64">
                <svg [attr.viewBox]="'0 0 ' + chartWidth + ' 200'" preserveAspectRatio="none" class="w-full h-full">
                  <line *ngFor="let y of [0, 50, 100, 150, 200]" x1="0" [attr.x2]="chartWidth" [attr.y1]="y" [attr.y2]="y" stroke="#f3f4f6" stroke-width="1"/>
                  <defs>
                    <linearGradient id="jobGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" style="stop-color:#a855f7;stop-opacity:0.4"/>
                      <stop offset="100%" style="stop-color:#a855f7;stop-opacity:0"/>
                    </linearGradient>
                  </defs>
                  <path [attr.d]="jobAreaPath()" fill="url(#jobGrad)"/>
                  <path [attr.d]="jobLinePath()" fill="none" stroke="#a855f7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <circle *ngFor="let pt of jobPoints()"
                    [attr.cx]="pt.x" [attr.cy]="pt.y" r="3" fill="#a855f7" stroke="white" stroke-width="2"/>
                </svg>
              </div>
              <div class="flex justify-between text-xs text-gray-500 mt-2">
                <span>{{ getJobFirstDate() }}</span>
                <span>{{ getJobLastDate() }}</span>
              </div>
              <div class="mt-4 grid grid-cols-3 gap-4 text-center">
                <div class="p-3 bg-purple-50 rounded-lg">
                  <div class="text-xl font-bold text-purple-700">{{ totalJobs() }}</div>
                  <div class="text-xs text-gray-600">Total Jobs</div>
                </div>
                <div class="p-3 bg-blue-50 rounded-lg">
                  <div class="text-xl font-bold text-blue-700">{{ peakJobs() }}</div>
                  <div class="text-xs text-gray-600">Peak Day</div>
                </div>
                <div class="p-3 bg-rose-50 rounded-lg">
                  <div class="text-xl font-bold text-rose-700">{{ avgJobs() }}</div>
                  <div class="text-xs text-gray-600">Avg per Day</div>
                </div>
              </div>
            </div>

            <ng-template #noJobs>
              <div class="text-center py-12 text-gray-500">
                <div class="text-4xl mb-2">💼</div>
                <p>No jobs created in the last 30 days</p>
              </div>
            </ng-template>
          </div>

        </ng-container>

      </div>
    </div>
  `
})
export class AdminAnalyticsComponent implements OnInit {
  private analyticsService = inject(AnalyticsService);

  data = signal<AdminDashboardData | null>(null);
  loading = signal(true);
  chartWidth = 600;

  hireRate = computed(() => {
    const d = this.data();
    if (!d || d.total_applications === 0) return 0;
    return Math.round((d.total_hires / d.total_applications) * 100);
  });

  verificationRate = computed(() => {
    const d = this.data();
    if (!d || d.total_companies === 0) return 0;
    return Math.round((d.verified_companies / d.total_companies) * 100);
  });

  activeJobsPercent = computed(() => {
    const d = this.data();
    if (!d || d.total_jobs === 0) return 0;
    return Math.round((d.active_jobs / d.total_jobs) * 100);
  });

  avgAppsPerJob = computed(() => {
    const d = this.data();
    if (!d || d.total_jobs === 0) return 0;
    return Math.round(d.total_applications / d.total_jobs);
  });

  roleDonut = computed(() => {
    const d = this.data();
    if (!d) return [];
    const roles = d.role_distribution || {};
    const total = d.total_users || 1;

    const parts = [
      { label: 'Candidates', value: roles['CANDIDATE'] || 0, color: '#3b82f6' },
      { label: 'Recruiters', value: roles['HR'] || 0, color: '#10b981' },
      { label: 'Admins', value: roles['SUPER_ADMIN'] || 0, color: '#e11d48' },
    ].filter(p => p.value > 0);

    const circumference = 2 * Math.PI * 40;
    let offset = 0;

    return parts.map(p => {
      const percentage = p.value / total;
      const length = percentage * circumference;
      const dashArray = `${length} ${circumference}`;
      const dashOffset = -offset;
      offset += length;
      return { ...p, dashArray, dashOffset };
    });
  });

  signupPoints = computed(() => {
    const d = this.data();
    const points = d?.signups_over_time || [];
    if (points.length === 0) return [];
    const maxCount = Math.max(...points.map(p => p.count), 1);
    const stepX = this.chartWidth / Math.max(points.length - 1, 1);
    return points.map((p, i) => ({
      x: i * stepX,
      y: 200 - (p.count / maxCount) * 180,
      count: p.count,
      date: p.date,
    }));
  });

  jobPoints = computed(() => {
    const d = this.data();
    const points = d?.jobs_over_time || [];
    if (points.length === 0) return [];
    const maxCount = Math.max(...points.map(p => p.count), 1);
    const stepX = this.chartWidth / Math.max(points.length - 1, 1);
    return points.map((p, i) => ({
      x: i * stepX,
      y: 200 - (p.count / maxCount) * 180,
      count: p.count,
      date: p.date,
    }));
  });

  signupLinePath = computed(() => {
    const p = this.signupPoints();
    if (p.length === 0) return '';
    return p.map((pt, i) => (i === 0 ? 'M' : 'L') + pt.x + ',' + pt.y).join(' ');
  });

  signupAreaPath = computed(() => {
    const p = this.signupPoints();
    if (p.length === 0) return '';
    const path = p.map((pt, i) => (i === 0 ? 'M' : 'L') + pt.x + ',' + pt.y).join(' ');
    return path + ' L' + p[p.length - 1].x + ',200 L0,200 Z';
  });

  jobLinePath = computed(() => {
    const p = this.jobPoints();
    if (p.length === 0) return '';
    return p.map((pt, i) => (i === 0 ? 'M' : 'L') + pt.x + ',' + pt.y).join(' ');
  });

  jobAreaPath = computed(() => {
    const p = this.jobPoints();
    if (p.length === 0) return '';
    const path = p.map((pt, i) => (i === 0 ? 'M' : 'L') + pt.x + ',' + pt.y).join(' ');
    return path + ' L' + p[p.length - 1].x + ',200 L0,200 Z';
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.analyticsService.getAdminDashboard().subscribe({
      next: (res) => {
        this.data.set(res);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  getRankColor(index: number): string {
    const colors = ['#fbbf24', '#a3a3a3', '#c2831c', '#e11d48', '#e11d48'];
    return colors[index] || '#e11d48';
  }

  getBarWidth(jobs: number): number {
    const top = this.data()?.top_companies_by_jobs || [];
    const max = Math.max(...top.map(c => c.jobs), 1);
    return (jobs / max) * 100;
  }

  totalSignups(): number {
    const pts = this.data()?.signups_over_time || [];
    return pts.reduce((sum, p) => sum + p.count, 0);
  }

  peakSignups(): number {
    const pts = this.data()?.signups_over_time || [];
    return Math.max(...pts.map(p => p.count), 0);
  }

  avgSignups(): number {
    const pts = this.data()?.signups_over_time || [];
    if (pts.length === 0) return 0;
    return Math.round(this.totalSignups() / pts.length);
  }

  totalJobs(): number {
    const pts = this.data()?.jobs_over_time || [];
    return pts.reduce((sum, p) => sum + p.count, 0);
  }

  peakJobs(): number {
    const pts = this.data()?.jobs_over_time || [];
    return Math.max(...pts.map(p => p.count), 0);
  }

  avgJobs(): number {
    const pts = this.data()?.jobs_over_time || [];
    if (pts.length === 0) return 0;
    return Math.round(this.totalJobs() / pts.length);
  }

  getSignupFirstDate(): string {
    const pts = this.data()?.signups_over_time || [];
    return pts.length > 0 ? this.formatDate(pts[0].date) : '';
  }

  getSignupLastDate(): string {
    const pts = this.data()?.signups_over_time || [];
    return pts.length > 0 ? this.formatDate(pts[pts.length - 1].date) : '';
  }

  getJobFirstDate(): string {
    const pts = this.data()?.jobs_over_time || [];
    return pts.length > 0 ? this.formatDate(pts[0].date) : '';
  }

  getJobLastDate(): string {
    const pts = this.data()?.jobs_over_time || [];
    return pts.length > 0 ? this.formatDate(pts[pts.length - 1].date) : '';
  }

  formatDate(d: string): string {
    return new Date(d).toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
  }
}