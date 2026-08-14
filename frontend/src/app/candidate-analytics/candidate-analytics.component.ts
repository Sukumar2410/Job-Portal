import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

import { TopNavComponent } from '../shared/top-nav/top-nav.component';
import { AnalyticsService, CandidateDashboardData } from '../core/services/analytics.service';

@Component({
  selector: 'app-candidate-analytics',
  standalone: true,
  imports: [CommonModule, RouterLink, TopNavComponent],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <app-top-nav portalName="Job Portal"></app-top-nav>

      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        <div class="mb-8 animate-fade-in">
          <h1 class="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">My Analytics 📊</h1>
          <p class="text-gray-600">Visualize your job hunt progress and performance.</p>
        </div>

        <!-- Loading -->
        <div *ngIf="loading()" class="flex justify-center py-20">
          <svg class="animate-spin w-10 h-10 text-primary-600" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
          </svg>
        </div>

        <ng-container *ngIf="!loading() && data() as d">

          <!-- Empty state (no applications yet) -->
          <div *ngIf="d.total_applications === 0"
            class="bg-white rounded-2xl shadow-soft p-12 text-center animate-fade-in">
            <div class="w-24 h-24 bg-gradient-to-br from-primary-100 to-purple-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <span class="text-5xl">📊</span>
            </div>
            <h3 class="text-xl font-bold text-gray-900 mb-2">No data to analyze yet</h3>
            <p class="text-gray-500 mb-6">Apply to jobs to unlock your personal analytics dashboard.</p>
            <a routerLink="/jobs"
              class="inline-block px-6 py-2.5 bg-gradient-to-r from-primary-600 to-purple-600 text-white text-sm font-semibold rounded-xl shadow-md hover:shadow-lg transition-all">
              Browse Jobs →
            </a>
          </div>

          <!-- Main Analytics (has applications) -->
          <div *ngIf="d.total_applications > 0">

            <!-- KPI Cards -->
            <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <div class="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg p-6 text-white animate-slide-up">
                <div class="text-4xl mb-2">📝</div>
                <div class="text-3xl font-bold">{{ d.total_applications }}</div>
                <div class="text-sm opacity-90">Total Applications</div>
              </div>
              <div class="bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl shadow-lg p-6 text-white animate-slide-up" style="animation-delay: 0.1s;">
                <div class="text-4xl mb-2">⭐</div>
                <div class="text-3xl font-bold">{{ d.shortlisted_count }}</div>
                <div class="text-sm opacity-90">Shortlisted</div>
              </div>
              <div class="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl shadow-lg p-6 text-white animate-slide-up" style="animation-delay: 0.2s;">
                <div class="text-4xl mb-2">📅</div>
                <div class="text-3xl font-bold">{{ d.interviews_scheduled }}</div>
                <div class="text-sm opacity-90">Interviews</div>
              </div>
              <div class="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl shadow-lg p-6 text-white animate-slide-up" style="animation-delay: 0.3s;">
                <div class="text-4xl mb-2">🎉</div>
                <div class="text-3xl font-bold">{{ d.offers_received }}</div>
                <div class="text-sm opacity-90">Offers</div>
              </div>
            </div>

            <!-- Success Rate Insights -->
            <div class="bg-gradient-to-br from-primary-600 via-indigo-700 to-purple-700 rounded-2xl shadow-2xl p-6 mb-8 text-white animate-slide-up relative overflow-hidden" style="animation-delay: 0.4s;">
              <div class="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
              <div class="relative">
                <h3 class="text-lg font-bold mb-4">💡 Your Success Insights</h3>
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <div class="text-4xl font-bold">{{ shortlistRate() }}%</div>
                    <div class="text-sm opacity-90">Shortlist Rate</div>
                    <div class="text-xs opacity-70 mt-1">{{ d.shortlisted_count }} of {{ d.total_applications }}</div>
                  </div>
                  <div>
                    <div class="text-4xl font-bold">{{ interviewRate() }}%</div>
                    <div class="text-sm opacity-90">Interview Rate</div>
                    <div class="text-xs opacity-70 mt-1">{{ d.interviews_scheduled }} interviews</div>
                  </div>
                  <div>
                    <div class="text-4xl font-bold">{{ offerRate() }}%</div>
                    <div class="text-sm opacity-90">Offer Rate</div>
                    <div class="text-xs opacity-70 mt-1">{{ d.offers_received }} offers</div>
                  </div>
                </div>
              </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">

              <!-- Profile Completion Ring -->
              <div class="bg-white rounded-2xl shadow-soft p-6 animate-slide-up" style="animation-delay: 0.5s;">
                <h3 class="text-lg font-bold text-gray-900 mb-1">Profile Completion</h3>
                <p class="text-xs text-gray-500 mb-4">Higher = better matches</p>

                <div class="flex items-center justify-center py-4">
                  <div class="relative w-48 h-48">
                    <svg viewBox="0 0 100 100" class="transform -rotate-90 w-full h-full">
                      <circle cx="50" cy="50" r="42" fill="none" stroke="#e5e7eb" stroke-width="10"/>
                      <circle cx="50" cy="50" r="42" fill="none"
                        [attr.stroke]="getCompletionColor(d.profile_completion)"
                        stroke-width="10" stroke-linecap="round"
                        [attr.stroke-dasharray]="getCircumference()"
                        [attr.stroke-dashoffset]="getDashOffset(d.profile_completion)"
                        class="transition-all duration-1000"/>
                    </svg>
                    <div class="absolute inset-0 flex flex-col items-center justify-center">
                      <div class="text-4xl font-bold" [style.color]="getCompletionColor(d.profile_completion)">
                        {{ d.profile_completion }}%
                      </div>
                      <div class="text-xs text-gray-500 mt-1">Complete</div>
                    </div>
                  </div>
                </div>

                <div class="mt-4 text-center">
                  <p class="text-sm" [style.color]="getCompletionColor(d.profile_completion)">
                    <strong>{{ getCompletionLabel(d.profile_completion) }}</strong>
                  </p>
                  <a *ngIf="d.profile_completion < 100" routerLink="/profile"
                    class="inline-block mt-3 px-4 py-2 bg-gradient-to-r from-primary-600 to-purple-600 text-white text-sm font-semibold rounded-xl shadow-md hover:shadow-lg transition-all">
                    Complete Profile →
                  </a>
                </div>
              </div>

              <!-- Application Status Donut -->
              <div class="bg-white rounded-2xl shadow-soft p-6 lg:col-span-2 animate-slide-up" style="animation-delay: 0.6s;">
                <h3 class="text-lg font-bold text-gray-900 mb-1">Application Status Breakdown</h3>
                <p class="text-xs text-gray-500 mb-4">Where are your applications now?</p>

                <div class="flex flex-col sm:flex-row items-center gap-6">
                  <!-- Donut Chart -->
                  <div class="relative w-40 h-40 flex-shrink-0">
                    <svg viewBox="0 0 100 100" class="transform -rotate-90 w-full h-full">
                      <circle cx="50" cy="50" r="40" fill="none" stroke="#f3f4f6" stroke-width="15"/>
                      <circle *ngFor="let seg of statusDonut()"
                        cx="50" cy="50" r="40" fill="none"
                        [attr.stroke]="seg.color" stroke-width="15"
                        [attr.stroke-dasharray]="seg.dashArray"
                        [attr.stroke-dashoffset]="seg.dashOffset"
                        class="transition-all duration-1000"/>
                    </svg>
                    <div class="absolute inset-0 flex flex-col items-center justify-center">
                      <div class="text-2xl font-bold text-gray-900">{{ d.total_applications }}</div>
                      <div class="text-xs text-gray-500">Total</div>
                    </div>
                  </div>

                  <!-- Legend -->
                  <div class="space-y-2 flex-1 w-full">
                    <div *ngFor="let seg of statusDonut()" class="flex items-center gap-2 text-sm">
                      <span class="w-3 h-3 rounded-sm flex-shrink-0" [style.background]="seg.color"></span>
                      <span class="text-gray-700 flex-1 truncate">{{ seg.label }}</span>
                      <span class="font-bold text-gray-900">{{ seg.value }}</span>
                      <span class="text-xs text-gray-500 w-12 text-right">({{ seg.percentage }}%)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Application Journey Funnel -->
            <div class="bg-white rounded-2xl shadow-soft p-6 mb-6 animate-slide-up" style="animation-delay: 0.7s;">
              <h3 class="text-lg font-bold text-gray-900 mb-1">Your Application Journey</h3>
              <p class="text-xs text-gray-500 mb-6">How your applications progress through stages</p>

              <div class="space-y-3">
                <div *ngFor="let stage of journeyData(); let i = index" class="animate-slide-in-right" [style.animation-delay]="(i * 0.1) + 's'">
                  <div class="flex justify-between text-sm mb-1">
                    <span class="font-semibold text-gray-700 flex items-center gap-2">
                      <span>{{ stage.icon }}</span>
                      {{ stage.label }}
                    </span>
                    <span class="font-bold text-gray-900">{{ stage.count }}</span>
                  </div>
                  <div class="h-4 bg-gray-100 rounded-full overflow-hidden">
                    <div class="h-full rounded-full transition-all duration-1000 flex items-center justify-end pr-2 text-white text-xs font-bold"
                      [style.width.%]="(stage.count / maxJourney()) * 100"
                      [style.background]="stage.color">
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Recent Applications Timeline -->
            <div class="bg-white rounded-2xl shadow-soft p-6 animate-slide-up" style="animation-delay: 0.8s;">
              <div class="flex items-center justify-between mb-5">
                <div>
                  <h3 class="text-lg font-bold text-gray-900">Recent Activity</h3>
                  <p class="text-xs text-gray-500 mt-0.5">Your last 5 applications</p>
                </div>
                <a routerLink="/my-applications" class="text-sm text-primary-600 hover:text-primary-700 font-semibold">
                  View all →
                </a>
              </div>

              <div *ngIf="d.recent_applications && d.recent_applications.length > 0" class="space-y-3">
                <div *ngFor="let app of d.recent_applications; let i = index"
                  class="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-all animate-slide-in-right"
                  [style.animation-delay]="(i * 0.05) + 's'">
                  <div class="w-10 h-10 bg-gradient-to-br from-primary-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold flex-shrink-0">
                    {{ getFirstChar(app.company_name) }}
                  </div>
                  <div class="flex-1 min-w-0">
                    <div class="font-semibold text-gray-900 truncate">{{ app.job_title }}</div>
                    <div class="text-xs text-gray-500">{{ app.company_name }} · Applied {{ timeSince(app.applied_at) }}</div>
                  </div>
                  <span class="inline-flex items-center px-2.5 py-1 text-xs font-bold rounded-full flex-shrink-0"
                    [style.background]="getStatusBg(app.status)"
                    [style.color]="getStatusColor(app.status)">
                    {{ formatStatus(app.status) }}
                  </span>
                </div>
              </div>
            </div>

          </div>

        </ng-container>

      </div>
    </div>
  `
})
export class CandidateAnalyticsComponent implements OnInit {
  private analyticsService = inject(AnalyticsService);

  data = signal<CandidateDashboardData | null>(null);
  loading = signal(true);

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

  shortlistRate = computed(() => {
    const d = this.data();
    if (!d || d.total_applications === 0) return 0;
    return Math.round((d.shortlisted_count / d.total_applications) * 100);
  });

  interviewRate = computed(() => {
    const d = this.data();
    if (!d || d.total_applications === 0) return 0;
    return Math.round((d.interviews_scheduled / d.total_applications) * 100);
  });

  offerRate = computed(() => {
    const d = this.data();
    if (!d || d.total_applications === 0) return 0;
    return Math.round((d.offers_received / d.total_applications) * 100);
  });

  statusDonut = computed(() => {
    const d = this.data();
    if (!d) return [];

    const breakdown = d.application_status_breakdown || {};
    const total = d.total_applications || 1;

    const entries = Object.entries(breakdown)
      .filter(([_, count]) => count > 0)
      .map(([status, count]) => ({
        label: this.formatStatus(status),
        value: count,
        color: this.statusColors[status]?.color || '#6b7280',
        percentage: Math.round((count / total) * 100),
      }));

    const circumference = 2 * Math.PI * 40;
    let offset = 0;

    return entries.map(e => {
      const percentage = e.value / total;
      const length = percentage * circumference;
      const dashArray = `${length} ${circumference}`;
      const dashOffset = -offset;
      offset += length;
      return { ...e, dashArray, dashOffset };
    });
  });

  journeyData = computed(() => {
    const d = this.data();
    if (!d) return [];
    const b = d.application_status_breakdown || {};
    return [
      { label: 'Applied', count: b['APPLIED'] || 0, color: '#3b82f6', icon: '📝' },
      { label: 'Under Review', count: b['UNDER_REVIEW'] || 0, color: '#f59e0b', icon: '👀' },
      { label: 'Shortlisted', count: b['SHORTLISTED'] || 0, color: '#a855f7', icon: '⭐' },
      { label: 'Interview Scheduled', count: b['INTERVIEW_SCHEDULED'] || 0, color: '#6366f1', icon: '📅' },
      { label: 'Interviewed', count: b['INTERVIEWED'] || 0, color: '#06b6d4', icon: '💬' },
      { label: 'Offered', count: b['OFFERED'] || 0, color: '#22c55e', icon: '🎉' },
      { label: 'Hired', count: b['HIRED'] || 0, color: '#10b981', icon: '🏆' },
      { label: 'Rejected', count: b['REJECTED'] || 0, color: '#ef4444', icon: '❌' },
    ].filter(s => s.count > 0);
  });

  maxJourney = computed(() => {
    return Math.max(...this.journeyData().map(s => s.count), 1);
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.analyticsService.getCandidateDashboard().subscribe({
      next: (res) => {
        this.data.set(res);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  getCircumference(): number {
    return 2 * Math.PI * 42;
  }

  getDashOffset(percent: number): number {
    const circ = this.getCircumference();
    return circ - (percent / 100) * circ;
  }

  getCompletionColor(pct: number): string {
    if (pct >= 80) return '#10b981';   // green
    if (pct >= 50) return '#3b82f6';   // blue
    if (pct >= 30) return '#f59e0b';   // amber
    return '#ef4444';                   // red
  }

  getCompletionLabel(pct: number): string {
    if (pct >= 100) return '🎉 Perfect! Fully complete';
    if (pct >= 80) return '👍 Great! Almost there';
    if (pct >= 50) return '⚡ Good progress';
    if (pct >= 30) return '⚠️ Needs work';
    return '❗ Complete your profile';
  }

  getFirstChar(name: string): string {
    return name && name.length > 0 ? name[0].toUpperCase() : '?';
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

  timeSince(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0) return 'today';
    if (days === 1) return 'yesterday';
    if (days < 30) return days + ' days ago';
    return new Date(dateStr).toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
  }
}