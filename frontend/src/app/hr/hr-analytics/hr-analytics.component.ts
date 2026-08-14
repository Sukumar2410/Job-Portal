import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TopNavComponent } from '../../shared/top-nav/top-nav.component';
import { AnalyticsService, HRDashboardData } from '../../core/services/analytics.service';

@Component({
  selector: 'app-hr-analytics',
  standalone: true,
  imports: [CommonModule, TopNavComponent],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50 to-teal-50">
      <app-top-nav portalName="HR Portal"></app-top-nav>

      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        <div class="mb-8 animate-fade-in">
          <h1 class="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">Analytics 📊</h1>
          <p class="text-gray-600">Visualize your recruitment performance.</p>
        </div>

        <!-- Loading -->
        <div *ngIf="loading()" class="flex justify-center py-20">
          <svg class="animate-spin w-10 h-10 text-emerald-600" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
          </svg>
        </div>

        <ng-container *ngIf="!loading() && data() as d">

          <!-- KPI Cards -->
          <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div class="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl shadow-lg p-6 text-white animate-slide-up">
              <div class="text-4xl mb-2">💼</div>
              <div class="text-3xl font-bold">{{ d.active_jobs }}</div>
              <div class="text-sm opacity-90">Active Jobs</div>
            </div>
            <div class="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg p-6 text-white animate-slide-up" style="animation-delay: 0.1s;">
              <div class="text-4xl mb-2">👥</div>
              <div class="text-3xl font-bold">{{ d.total_applications }}</div>
              <div class="text-sm opacity-90">Total Applicants</div>
            </div>
            <div class="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl shadow-lg p-6 text-white animate-slide-up" style="animation-delay: 0.2s;">
              <div class="text-4xl mb-2">📅</div>
              <div class="text-3xl font-bold">{{ d.interviews_scheduled }}</div>
              <div class="text-sm opacity-90">Interviews</div>
            </div>
            <div class="bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl shadow-lg p-6 text-white animate-slide-up" style="animation-delay: 0.3s;">
              <div class="text-4xl mb-2">✅</div>
              <div class="text-3xl font-bold">{{ d.hired_count }}</div>
              <div class="text-sm opacity-90">Hires</div>
            </div>
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">

            <!-- Hiring Funnel Chart (Horizontal Bar) -->
            <div class="bg-white rounded-2xl shadow-soft p-6 animate-slide-up" style="animation-delay: 0.4s;">
              <h3 class="text-lg font-bold text-gray-900 mb-1">Hiring Funnel</h3>
              <p class="text-xs text-gray-500 mb-6">Candidates at each stage</p>

              <div class="space-y-3">
                <div *ngFor="let stage of funnelData(); let i = index" class="animate-slide-in-right" [style.animation-delay]="(i * 0.05) + 's'">
                  <div class="flex justify-between text-sm mb-1">
                    <span class="font-semibold text-gray-700">{{ stage.label }}</span>
                    <span class="font-bold text-gray-900">{{ stage.count }}</span>
                  </div>
                  <div class="h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div class="h-full rounded-full transition-all duration-1000"
                      [style.width.%]="(stage.count / maxFunnelValue()) * 100"
                      [style.background]="stage.color"></div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Job Status Distribution (Donut Chart) -->
            <div class="bg-white rounded-2xl shadow-soft p-6 animate-slide-up" style="animation-delay: 0.5s;">
              <h3 class="text-lg font-bold text-gray-900 mb-1">Job Status Distribution</h3>
              <p class="text-xs text-gray-500 mb-6">Breakdown of your job postings</p>

              <div class="flex items-center justify-center gap-6">
                <!-- Donut Chart (SVG) -->
                <div class="relative w-40 h-40">
                  <svg viewBox="0 0 100 100" class="transform -rotate-90 w-full h-full">
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#f3f4f6" stroke-width="15"/>
                    <circle *ngFor="let seg of donutSegments(); let i = index"
                      cx="50" cy="50" r="40" fill="none"
                      [attr.stroke]="seg.color" stroke-width="15"
                      [attr.stroke-dasharray]="seg.dashArray"
                      [attr.stroke-dashoffset]="seg.dashOffset"
                      class="transition-all duration-1000"/>
                  </svg>
                  <div class="absolute inset-0 flex flex-col items-center justify-center">
                    <div class="text-2xl font-bold text-gray-900">{{ d.total_jobs }}</div>
                    <div class="text-xs text-gray-500">Total</div>
                  </div>
                </div>

                <!-- Legend -->
                <div class="space-y-2 flex-1">
                  <div *ngFor="let seg of donutSegments()" class="flex items-center gap-2 text-sm">
                    <span class="w-3 h-3 rounded-sm" [style.background]="seg.color"></span>
                    <span class="text-gray-700 flex-1">{{ seg.label }}</span>
                    <span class="font-bold text-gray-900">{{ seg.value }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Applications Over Time (Line Chart) -->
          <div class="bg-white rounded-2xl shadow-soft p-6 mt-6 animate-slide-up" style="animation-delay: 0.6s;">
            <h3 class="text-lg font-bold text-gray-900 mb-1">Applications Over Last 30 Days</h3>
            <p class="text-xs text-gray-500 mb-6">Daily application trend</p>

            <div *ngIf="d.applications_over_time && d.applications_over_time.length > 0; else noTimeData">
              <div class="relative h-64">
                <svg [attr.viewBox]="'0 0 ' + chartWidth + ' 200'" preserveAspectRatio="none" class="w-full h-full">
                  <!-- Grid lines -->
                  <line *ngFor="let y of [0, 50, 100, 150, 200]" x1="0" [attr.x2]="chartWidth" [attr.y1]="y" [attr.y2]="y" stroke="#f3f4f6" stroke-width="1"/>

                  <!-- Gradient fill -->
                  <defs>
                    <linearGradient id="lineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" style="stop-color:#10b981;stop-opacity:0.4"/>
                      <stop offset="100%" style="stop-color:#10b981;stop-opacity:0"/>
                    </linearGradient>
                  </defs>

                  <!-- Area fill under line -->
                  <path [attr.d]="areaPath()" fill="url(#lineGradient)"/>

                  <!-- Line -->
                  <path [attr.d]="linePath()" fill="none" stroke="#10b981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>

                  <!-- Data points -->
                  <circle *ngFor="let pt of chartPoints(); let i = index"
                    [attr.cx]="pt.x" [attr.cy]="pt.y" r="3" fill="#10b981" stroke="white" stroke-width="2"/>
                </svg>
              </div>

              <div class="flex justify-between text-xs text-gray-500 mt-2">
                <span>{{ getFirstDate() }}</span>
                <span>{{ getLastDate() }}</span>
              </div>

              <div class="mt-4 grid grid-cols-3 gap-4 text-center">
                <div class="p-3 bg-emerald-50 rounded-lg">
                  <div class="text-xl font-bold text-emerald-700">{{ getTotalApplications() }}</div>
                  <div class="text-xs text-gray-600">Total (30 days)</div>
                </div>
                <div class="p-3 bg-blue-50 rounded-lg">
                  <div class="text-xl font-bold text-blue-700">{{ getPeakDay() }}</div>
                  <div class="text-xs text-gray-600">Peak Day</div>
                </div>
                <div class="p-3 bg-purple-50 rounded-lg">
                  <div class="text-xl font-bold text-purple-700">{{ getAvgPerDay() }}</div>
                  <div class="text-xs text-gray-600">Avg per Day</div>
                </div>
              </div>
            </div>

            <ng-template #noTimeData>
              <div class="text-center py-12 text-gray-500">
                <div class="text-4xl mb-2">📊</div>
                <p>No application data yet</p>
              </div>
            </ng-template>
          </div>

          <div class="flex items-center justify-between mt-6">
            <div>
              <h3 class="text-lg font-bold text-gray-900">Export & Reports</h3>
              <p class="text-xs text-gray-500 mt-1">Download a quick report for stakeholders.</p>
            </div>
            <button (click)="exportSummary()" class="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
              Export CSV
            </button>
          </div>

          <!-- Top Performing Jobs -->
          <div class="bg-white rounded-2xl shadow-soft p-6 mt-6 animate-slide-up" style="animation-delay: 0.7s;">
            <h3 class="text-lg font-bold text-gray-900 mb-1">Top Performing Jobs</h3>
            <p class="text-xs text-gray-500 mb-6">Jobs ranked by applications received</p>

            <div *ngIf="d.top_jobs_by_applications && d.top_jobs_by_applications.length > 0; else noTopJobs" class="space-y-3">
              <div *ngFor="let job of d.top_jobs_by_applications; let i = index"
                class="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-all animate-slide-in-right"
                [style.animation-delay]="(i * 0.05) + 's'">
                <div class="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0"
                  [style.background]="getRankColor(i)">
                  {{ i + 1 }}
                </div>
                <div class="flex-1 min-w-0">
                  <div class="font-semibold text-gray-900 truncate">{{ job.title }}</div>
                  <div class="text-xs text-gray-500">{{ job.views }} views · {{ job.applications }} applications</div>
                </div>
                <div class="w-32 h-2 bg-gray-200 rounded-full overflow-hidden flex-shrink-0">
                  <div class="h-full bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full transition-all duration-1000"
                    [style.width.%]="getJobBarWidth(job.applications)"></div>
                </div>
                <div class="text-right w-16 flex-shrink-0">
                  <div class="text-xl font-bold text-emerald-600">{{ job.applications }}</div>
                </div>
              </div>
            </div>

            <ng-template #noTopJobs>
              <div class="text-center py-12 text-gray-500">
                <div class="text-4xl mb-2">💼</div>
                <p>No job data yet</p>
              </div>
            </ng-template>
          </div>

        </ng-container>

      </div>
    </div>
  `,
  styles: []
})
export class HrAnalyticsComponent implements OnInit {
  private analyticsService = inject(AnalyticsService);

  data = signal<HRDashboardData | null>(null);
  loading = signal(true);
  chartWidth = 600;

  funnelData = computed(() => {
    const d = this.data();
    if (!d) return [];
    const f = d.hiring_funnel || {};
    return [
      { label: 'Applied', count: f['applied'] || 0, color: '#3b82f6' },
      { label: 'Under Review', count: f['under_review'] || 0, color: '#f59e0b' },
      { label: 'Shortlisted', count: f['shortlisted'] || 0, color: '#a855f7' },
      { label: 'Interview Scheduled', count: f['interview_scheduled'] || 0, color: '#6366f1' },
      { label: 'Interviewed', count: f['interviewed'] || 0, color: '#06b6d4' },
      { label: 'Offered', count: f['offered'] || 0, color: '#22c55e' },
      { label: 'Hired', count: f['hired'] || 0, color: '#10b981' },
      { label: 'Rejected', count: f['rejected'] || 0, color: '#ef4444' },
    ];
  });

  maxFunnelValue = computed(() => {
    const max = Math.max(...this.funnelData().map(s => s.count), 1);
    return max;
  });

  donutSegments = computed(() => {
    const d = this.data();
    if (!d) return [];
    const total = d.total_jobs || 1;

    const parts = [
      { label: 'Active', value: d.active_jobs, color: '#10b981' },
      { label: 'Draft', value: d.draft_jobs, color: '#f59e0b' },
      { label: 'Closed', value: d.closed_jobs, color: '#6b7280' },
    ];

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

  chartPoints = computed(() => {
    const d = this.data();
    const points = d?.applications_over_time || [];
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

  linePath = computed(() => {
    const points = this.chartPoints();
    if (points.length === 0) return '';
    return points.map((p, i) => (i === 0 ? 'M' : 'L') + p.x + ',' + p.y).join(' ');
  });

  areaPath = computed(() => {
    const points = this.chartPoints();
    if (points.length === 0) return '';
    const path = points.map((p, i) => (i === 0 ? 'M' : 'L') + p.x + ',' + p.y).join(' ');
    return path + ' L' + points[points.length - 1].x + ',200 L0,200 Z';
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.analyticsService.getHRDashboard().subscribe({
      next: (res) => {
        this.data.set(res);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  getRankColor(index: number): string {
    const colors = ['#fbbf24', '#a3a3a3', '#c2831c', '#10b981', '#10b981'];
    return colors[index] || '#10b981';
  }

  getJobBarWidth(applications: number): number {
    const jobs = this.data()?.top_jobs_by_applications || [];
    const max = Math.max(...jobs.map(j => j.applications), 1);
    return (applications / max) * 100;
  }

  getFirstDate(): string {
    const points = this.data()?.applications_over_time || [];
    if (points.length === 0) return '';
    return new Date(points[0].date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
  }

  getLastDate(): string {
    const points = this.data()?.applications_over_time || [];
    if (points.length === 0) return '';
    return new Date(points[points.length - 1].date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
  }

  getTotalApplications(): number {
    const points = this.data()?.applications_over_time || [];
    return points.reduce((sum, p) => sum + p.count, 0);
  }

  getPeakDay(): number {
    const points = this.data()?.applications_over_time || [];
    return Math.max(...points.map(p => p.count), 0);
  }

  getAvgPerDay(): number {
    const points = this.data()?.applications_over_time || [];
    if (points.length === 0) return 0;
    return Math.round(this.getTotalApplications() / points.length);
  }

  exportSummary(): void {
    const d = this.data();
    if (!d) return;

    const rows = [
      ['Metric', 'Value'],
      ['Active Jobs', d.active_jobs],
      ['Total Applications', d.total_applications],
      ['Interviews Scheduled', d.interviews_scheduled],
      ['Hired Count', d.hired_count],
      ['Total Jobs', d.total_jobs],
    ];

    const csv = rows.map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'hr-analytics-summary.csv';
    link.click();
    URL.revokeObjectURL(url);
  }
}