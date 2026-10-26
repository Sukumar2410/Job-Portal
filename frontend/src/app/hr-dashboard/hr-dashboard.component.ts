import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../core/services/auth.service';
import { AnalyticsService, HRDashboardData } from '../core/services/analytics.service';
import { PaymentsService } from '../core/services/payments.service';
import { TopNavComponent } from '../shared/top-nav/top-nav.component';
import { RouterLink } from '@angular/router';
import { SubscriptionPlan, Subscription } from '../core/models/payment.model';
import { FormsModule } from '@angular/forms';
import { ReportService } from '../core/services/report.service';
import { ToastService } from '../core/services/toast.service';

@Component({
  selector: 'app-hr-dashboard',
  standalone: true,
    imports: [CommonModule, TopNavComponent, RouterLink, FormsModule],
  template: `
    <div class="min-h-screen overflow-y-auto bg-gradient-to-br from-slate-50 via-emerald-50 to-teal-50">

      <app-top-nav portalName="HR Portal"></app-top-nav>

      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        <!-- Hero -->
        <div class="relative overflow-hidden bg-gradient-to-br from-emerald-600 via-teal-700 to-cyan-700 rounded-3xl shadow-2xl mb-8 animate-fade-in">
          <div class="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
          <div class="relative p-8 sm:p-10">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div class="text-white">
                <div class="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur rounded-full text-xs font-semibold mb-3">
                  <span class="w-1.5 h-1.5 bg-green-300 rounded-full animate-pulse"></span>
                  {{ getGreeting() }}, Recruiter
                </div>
                <h1 class="text-3xl sm:text-4xl font-bold mb-2">
                  Welcome, {{ user?.first_name }}! 💼
                </h1>
                <p class="text-white/80 text-lg">
                  <span class="font-bold">{{ data()?.new_applications_this_week ?? 0 }}</span> new applications this week.
                </p>
              </div>
              <div class="flex gap-3">
                <button
                  (click)="openCreateJob()"
                  [disabled]="!canPostJob()"
                  class="rounded-xl px-5 py-2 font-semibold transition-all"
                  [ngClass]="
                    canPostJob()
                      ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                      : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  "
                >
                  {{ canPostJob() ? '+ Post New Job' : 'Job Limit Reached' }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Loading -->
        <div *ngIf="loading()" class="flex justify-center py-20">
          <div class="flex flex-col items-center gap-3">
            <svg class="animate-spin w-10 h-10 text-emerald-600" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
            </svg>
            <p class="text-sm text-gray-500">Loading your dashboard...</p>
          </div>
        </div>

        <!-- Error -->
        <div *ngIf="error()" class="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
          <p class="text-red-700 font-semibold">{{ error() }}</p>
          <button (click)="loadDashboard()" class="mt-3 px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-all">
            Try Again
          </button>
        </div>

        <!-- Content -->
        <div *ngIf="!loading() && !error() && data()">

          <!-- Stats -->
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div class="bg-white rounded-2xl p-6 shadow-soft hover:shadow-lg transition-all animate-slide-up group cursor-pointer">
              <div class="flex items-start justify-between mb-4">
                <div class="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                  </svg>
                </div>
                <span class="text-xs text-emerald-600 font-semibold bg-emerald-50 px-2 py-1 rounded-full">Active</span>
              </div>
              <div class="text-3xl font-bold text-gray-900 mb-1">{{ data()?.active_jobs }}</div>
              <div class="text-sm text-gray-500">Active Jobs</div>
            </div>

            <div class="bg-white rounded-2xl p-6 shadow-soft hover:shadow-lg transition-all animate-slide-up group cursor-pointer" style="animation-delay: 0.1s;">
              <div class="flex items-start justify-between mb-4">
                <div class="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
                  </svg>
                </div>
                <span class="text-xs text-blue-600 font-semibold bg-blue-50 px-2 py-1 rounded-full">Total</span>
              </div>
              <div class="text-3xl font-bold text-gray-900 mb-1">{{ data()?.total_applications }}</div>
              <div class="text-sm text-gray-500">Applicants</div>
            </div>

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

            <div class="bg-white rounded-2xl p-6 shadow-soft hover:shadow-lg transition-all animate-slide-up group cursor-pointer" style="animation-delay: 0.3s;">
              <div class="flex items-start justify-between mb-4">
                <div class="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                  </svg>
                </div>
                <span class="text-xs text-purple-600 font-semibold bg-purple-50 px-2 py-1 rounded-full">Success</span>
              </div>
              <div class="text-3xl font-bold text-gray-900 mb-1">{{ data()?.hired_count }}</div>
              <div class="text-sm text-gray-500">Hires</div>
            </div>
          </div>

          <!-- Two-Column -->
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">

            <!-- Left: Profile + Hiring Funnel -->
            <div class="lg:col-span-1 space-y-6">
              <!-- Profile -->
              <div class="bg-white rounded-2xl shadow-soft overflow-hidden animate-slide-up" style="animation-delay: 0.4s;">
                <div class="h-24 bg-gradient-to-r from-emerald-500 to-teal-600"></div>
                <div class="px-6 pb-6">
                  <div class="w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full border-4 border-white -mt-10 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                    {{ getInitials() }}
                  </div>
                  <h3 class="mt-4 text-lg font-bold text-gray-900">{{ user?.first_name }} {{ user?.last_name }}</h3>
                  <p class="text-sm text-gray-500">{{ user?.email }}</p>
                  <div class="mt-4 flex flex-wrap gap-2">
                    <span *ngIf="user?.is_verified" class="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                      ✓ Verified
                    </span>
                    <span class="inline-flex items-center px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-full">
                      HR / Recruiter
                    </span>
                  </div>
                  <button routerLink="/hr/company"
                    class="mt-5 w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-sm font-semibold rounded-xl shadow-md hover:shadow-lg transition-all">
                    Manage Company
                  </button>
                </div>
              </div>

              <!-- Hiring Funnel -->
              <div *ngIf="data()?.hiring_funnel" class="bg-white rounded-2xl shadow-soft p-6 animate-slide-up" style="animation-delay: 0.5s;">
                <h3 class="text-sm font-bold text-gray-900 mb-4">Hiring Funnel</h3>
                <div class="space-y-3">
                  <div *ngFor="let entry of getFunnelEntries()" class="flex items-center justify-between">
                    <div class="flex items-center gap-2">
                      <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
                      <span class="text-sm text-gray-700 capitalize">{{ entry.stage.replace('_', ' ') }}</span>
                    </div>
                    <span class="text-sm font-bold text-gray-900">{{ entry.count }}</span>
                  </div>
                </div>
              </div>
            </div>
  
            <!-- Right: Top Jobs + Quick Actions -->
            <div class="lg:col-span-2 space-y-6">
              <div class="bg-white rounded-2xl shadow-soft p-6 animate-slide-up" style="animation-delay: 0.4s;">
                <div class="flex items-center justify-between mb-5">
                  <div>
                    <h3 class="text-lg font-bold text-gray-900">Top Performing Jobs</h3>
                    <p class="text-xs text-gray-500 mt-0.5">Ranked by applications received</p>
                  </div>
                </div>

                <div *ngIf="!data()?.top_jobs_by_applications?.length" class="py-12 text-center">
                  <div class="w-20 h-20 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <svg class="w-10 h-10 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 4v16m8-8H4"/>
                    </svg>
                  </div>
                  <h4 class="text-lg font-bold text-gray-900 mb-2">No jobs posted yet</h4>
                  <p class="text-sm text-gray-500 mb-4">Post your first job to start attracting candidates.</p>
                  <button routerLink="/hr/jobs/new"
                    class="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-sm font-semibold rounded-xl shadow-md hover:shadow-lg transition-all">
                    Post Your First Job →
                  </button>
                </div>

                <div *ngIf="(data()?.top_jobs_by_applications?.length ?? 0) > 0" class="space-y-3">
                  <div *ngFor="let job of data()?.top_jobs_by_applications; let i = index"
                    class="flex items-center justify-between p-4 border-2 border-gray-100 rounded-xl hover:border-emerald-300 hover:bg-emerald-50/30 transition-all cursor-pointer">
                    <div class="flex items-center gap-4 min-w-0">
                      <div class="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center text-white font-bold flex-shrink-0">
                        {{ i + 1 }}
                      </div>
                      <div class="min-w-0">
                        <div class="font-semibold text-gray-900 truncate">{{ job.title }}</div>
                        <div class="text-xs text-gray-500">{{ job.views }} views</div>
                      </div>
                    </div>
                    <div class="text-right flex-shrink-0">
                      <div class="text-2xl font-bold text-emerald-600">{{ job.applications }}</div>
                      <div class="text-xs text-gray-500">applicants</div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Quick Actions -->
              <div class="bg-white rounded-2xl shadow-soft p-6 animate-slide-up" style="animation-delay: 0.5s;">
                <h3 class="text-lg font-bold text-gray-900 mb-4">Quick Actions</h3>
                <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <button
                    *ngFor="let action of quickActions"
                    (click)="handleQuickAction(action)"
                    class="group flex flex-col items-center p-4 rounded-xl border-2 border-gray-100 hover:border-emerald-300 hover:bg-emerald-50 transition-all">
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

      <!-- REPORT MODAL -->
      <div *ngIf="showReportModal()"
        class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">

        <div class="bg-white rounded-2xl w-full max-w-lg shadow-2xl">

          <div class="flex items-center justify-between p-6 border-b">
            <h2 class="text-xl font-bold">🚩 Report an Issue</h2>

            <button (click)="closeReportModal()"
              class="text-gray-500 hover:text-black text-xl">
              ✕
            </button>
          </div>

          <div class="p-6 space-y-4">

            <div>
              <label class="text-sm font-semibold">Subject *</label>

              <input
                [(ngModel)]="reportForm.subject"
                class="w-full mt-1 border rounded-lg px-3 py-2"
                placeholder="Example: Unable to apply for jobs">
            </div>

            <div>
              <label class="text-sm font-semibold">Priority</label>

              <select
                [(ngModel)]="reportForm.priority"
                class="w-full mt-1 border rounded-lg px-3 py-2">

                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>

              </select>
            </div>

            <div>
              <label class="text-sm font-semibold">Description *</label>

              <textarea
                [(ngModel)]="reportForm.description"
                rows="5"
                class="w-full mt-1 border rounded-lg px-3 py-2"
                placeholder="Describe your issue...">
              </textarea>
            </div>

          </div>

          <div class="flex justify-end gap-3 p-6 border-t">

            <button
              (click)="closeReportModal()"
              class="px-4 py-2 border rounded-lg">
              Cancel
            </button>

            <button
              (click)="submitReport()"
              [disabled]="reportLoading()"
              class="px-5 py-2 bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg">

              {{ reportLoading() ? 'Submitting...' : 'Submit Report' }}

            </button>

          </div>

        </div>
      </div>
    </div>
  `
})
export class HrDashboardComponent implements OnInit {
  private auth = inject(AuthService);
  private router = inject(Router);
  private analyticsService = inject(AnalyticsService);
  private paymentsService = inject(PaymentsService);
  private reportService = inject(ReportService);
  private toast = inject(ToastService);

  showReportModal = signal(false);
  reportLoading = signal(false);
  

  reportForm = {
    subject: '',
    priority: 'MEDIUM' as 'LOW' | 'MEDIUM' | 'HIGH',
    description: ''
  };

  user: any = null;
  loading = signal(true);
  error = signal<string | null>(null);
  data = signal<HRDashboardData | null>(null);
  subscription = signal<Subscription | null>(null);
  subscriptionMessage = signal('');
  plans = signal<SubscriptionPlan[]>([]);
  selectedPlan = signal<SubscriptionPlan | null>(null);

    quickActions = [
    { icon:'📝', label:'Post Job', bg:'linear-gradient(135deg,#d1fae5,#a7f3d0)', route:'/hr/jobs/new' },
    { icon:'💼', label:'My Jobs', bg:'linear-gradient(135deg,#dbeafe,#bfdbfe)', route:'/hr/jobs' },
    { icon:'👥', label:'Applicants', bg:'linear-gradient(135deg,#fef3c7,#fde68a)', route:'/hr/applicants' },
    { icon:'🤖', label:'AI Recommended Candidates', bg:'linear-gradient(135deg,#d1fae5,#a7f3d0)', route:'/hr-ai-recommended-candidates' },
    { icon:'📊', label:'Analytics', bg:'linear-gradient(135deg,#f3e8ff,#e9d5ff)', route:'/hr/analytics' },
    { icon:'🔔', label:'Notifications', bg:'linear-gradient(135deg,#fce7f3,#fbcfe8)', route:'/notifications' },
    { icon:'🏢', label:'Company', bg:'linear-gradient(135deg,#e0e7ff,#c7d2fe)', route:'/hr/company' },
    { icon:'💳', label:'Billing', bg:'linear-gradient(135deg,#ede9fe,#ddd6fe)', route:'/billing' },

    // NEW
    { icon:'📋', label:'My Reports', bg:'linear-gradient(135deg,#dbeafe,#bfdbfe)', route:'/my-reports' },

    // NEW
    { icon:'🚩', label:'Report Issue', bg:'linear-gradient(135deg,#fee2e2,#fecaca)', route:'' }
  ];

  ngOnInit(): void {
    this.user = this.auth.currentUser();
    this.loadDashboard();
    this.loadBillingData();
    this.loadSubscription();
  }

  openCreateJob(): void {
    if (!this.canPostJob()) {
      return;
    }

    this.router.navigate(['/hr/jobs/new']);
  }

  loadSubscription(): void {
    this.paymentsService.getMySubscription().subscribe({
      next: (sub: any) => {

        this.subscription.set(sub);

        if (!sub || sub.status !== 'ACTIVE') {
          this.subscriptionMessage.set(
            'Your subscription is inactive. Upgrade your plan to post jobs.'
          );
          return;
        }

        const quota = sub.plan?.job_post_quota ?? 0;
        const used = sub.job_posts_used ?? 0;

        if (used >= quota) {
          this.subscriptionMessage.set(
            `Job posting limit reached (${used}/${quota}). Upgrade your plan.`
          );
          return;
        }

        this.subscriptionMessage.set('');
      },

      error: () => {
        this.subscriptionMessage.set(
          'Unable to verify subscription.'
        );
      }
    });
  }

  loadDashboard(): void {
    this.loading.set(true);
    this.error.set(null);
    this.analyticsService.getHRDashboard().subscribe({
      next: (res) => { this.data.set(res); this.loading.set(false); },
      error: (err) => {
        this.error.set(err?.error?.detail || 'Failed to load dashboard.');
        this.loading.set(false);
      }
    });
  }

  loadBillingData(): void {
    this.paymentsService.listPlans().subscribe({
      next: (plans) => {
        this.plans.set(plans);
        if (plans.length) {
          this.selectedPlan.set(plans[0]);
        }
      },
      error: () => null,
    });

    this.paymentsService.getMySubscription().subscribe({
      next: (sub) => this.subscription.set(sub),
      error: () => null,
    });
  }

  canPostJob(): boolean {
    const sub = this.subscription();

    if (!sub || sub.status !== 'ACTIVE') {
      return false;
    }

    const quota = sub.plan?.job_post_quota ?? 0;

    // Enterprise / Unlimited
    if (quota >= 999) {
      return true;
    }

    const used = sub.jobs_posted_used ?? 0;

    return used < quota;
  }

  getFunnelEntries(): { stage: string; count: number }[] {
    const funnel = this.data()?.hiring_funnel || {};
    return Object.entries(funnel).map(([stage, count]) => ({ stage, count }));
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

  handleQuickAction(action:any): void {

    if (action.label === 'Report Issue') {
      this.openReportModal();
      return;
    }

    this.router.navigate([action.route]);
  }

  openReportModal(): void {
    this.showReportModal.set(true);
  }

  closeReportModal(): void {

    this.showReportModal.set(false);

    this.reportForm = {
      subject: '',
      priority: 'MEDIUM',
      description: ''
    };

  }

  submitReport(): void {

    if (
      !this.reportForm.subject.trim() ||
      !this.reportForm.description.trim()
    ) {
      this.toast.warning('Please fill all required fields.');
      return;
    }

    this.reportLoading.set(true);

    this.reportService.createReport(this.reportForm).subscribe({
      next: () => {

        this.reportLoading.set(false);

        this.toast.success('Report submitted successfully!');

        setTimeout(() => {
          this.closeReportModal();
        }, 500);

      },

      error: () => {

        this.reportLoading.set(false);

        this.toast.error('Failed to submit report.');

      }

    });

  }
  
}