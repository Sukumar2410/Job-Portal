import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { TopNavComponent } from '../shared/top-nav/top-nav.component';
import { ApplicationsService } from '../core/services/applications.service';
import { Application } from '../core/models/application.model';

@Component({
  selector: 'app-my-applications',
  standalone: true,
  imports: [CommonModule, RouterLink, TopNavComponent],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <app-top-nav portalName="Job Portal"></app-top-nav>

      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        <div class="mb-8 animate-fade-in">
          <h1 class="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">My Applications 💼</h1>
          <p class="text-gray-600">Track the status of all your job applications.</p>
        </div>

        <!-- Status Filter Tabs -->
        <div class="bg-white rounded-2xl shadow-soft p-2 mb-6 flex flex-wrap gap-1 animate-slide-up">
          <button *ngFor="let tab of tabs"
            (click)="setActiveTab(tab.value)"
            class="px-4 py-2 rounded-lg text-sm font-semibold transition-all"
            [ngClass]="activeTab() === tab.value
              ? 'bg-gradient-to-r from-primary-600 to-purple-600 text-white shadow-md'
              : 'text-gray-600 hover:bg-gray-50'">
            {{ tab.label }}
            <span *ngIf="getTabCount(tab.value) as count"
              class="ml-1 px-1.5 py-0.5 text-xs rounded-full"
              [ngClass]="activeTab() === tab.value ? 'bg-white/20' : 'bg-gray-100'">
              {{ count }}
            </span>
          </button>
        </div>

        <!-- Loading -->
        <div *ngIf="loading()" class="flex justify-center py-20">
          <svg class="animate-spin w-10 h-10 text-primary-600" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
          </svg>
        </div>

        <!-- Empty -->
        <div *ngIf="!loading() && filteredApplications().length === 0"
          class="bg-white rounded-2xl shadow-soft p-12 text-center animate-fade-in">
          <div class="w-24 h-24 bg-gradient-to-br from-primary-100 to-purple-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <svg class="w-12 h-12 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
            </svg>
          </div>
          <h3 class="text-xl font-bold text-gray-900 mb-2">
            {{ activeTab() === 'ALL' ? 'No applications yet' : 'No applications in this category' }}
          </h3>
          <p class="text-gray-500 mb-6">Start applying to jobs to see them here.</p>
          <a routerLink="/jobs"
            class="inline-block px-6 py-2.5 bg-gradient-to-r from-primary-600 to-purple-600 text-white text-sm font-semibold rounded-xl shadow-md hover:shadow-lg transition-all">
            Browse Jobs →
          </a>
        </div>

        <!-- Applications List -->
        <div *ngFor="let app of filteredApplications(); let i = index"
          [id]="'application-' + app.id"
          class="bg-white rounded-2xl shadow-soft hover:shadow-lg transition-all animate-slide-up p-5"
          [ngClass]="selectedApplicationId() === app.id
            ? 'ring-2 ring-primary-500 shadow-xl'
            : ''"
          [style.animation-delay]="(i * 0.05) + 's'">

            <div class="flex flex-col sm:flex-row sm:items-start gap-4">
              <div
                *ngIf="selectedApplicationId() === app.id"
                class="absolute top-3 right-3 px-3 py-1 rounded-full
                      bg-primary-50 text-primary-700 text-xs font-semibold
                      flex items-center gap-1 shadow-sm">
                <span class="w-1.5 h-1.5 rounded-full bg-primary-600"></span>
                Opened from notification
              </div>
              <!-- Company Logo -->
              <div class="w-14 h-14 bg-gradient-to-br from-primary-500 to-purple-600 rounded-xl flex items-center justify-center text-2xl font-bold text-white flex-shrink-0 shadow-md">
                {{ getFirstChar(app.job.company?.name) }}
              </div>

              <!-- Content -->
              <div class="flex-1 min-w-0">
                <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                  <div class="min-w-0">
                    <a [routerLink]="['/jobs', app.job.slug]"
                      class="text-lg font-bold text-gray-900 hover:text-primary-600 transition-colors truncate block">
                      {{ app.job.title }}
                    </a>
                    <div class="text-sm text-gray-600 flex items-center gap-2">
                      {{ app.job.company?.name }}
                      <span *ngIf="app.job.company?.is_verified" class="text-blue-500 text-xs">✓</span>
                    </div>
                  </div>

                  <span class="inline-flex items-center px-3 py-1 text-xs font-bold rounded-full flex-shrink-0"
                    [style.background]="getStatusBg(app.status)"
                    [style.color]="getStatusColor(app.status)">
                    {{ formatStatus(app.status) }}
                  </span>
                </div>

                <div class="mt-3 flex flex-wrap gap-2 text-xs">
                  <span class="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-md">
                    📍 {{ app.job.location }}
                  </span>
                  <span class="inline-flex items-center gap-1 px-2 py-1 bg-purple-50 text-purple-700 rounded-md">
                    {{ formatWorkMode(app.job.work_mode) }}
                  </span>
                  <span *ngIf="app.expected_salary" class="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 rounded-md">
                    💰 Expected: ₹{{ formatK(app.expected_salary) }}
                  </span>
                </div>

                <div class="mt-3 pt-3 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2 text-xs text-gray-500">
                  <div class="flex items-center gap-3">
                    <span>Applied {{ timeSince(app.applied_at) }}</span>
                  </div>
                  <div class="flex gap-3">
                    <a [routerLink]="['/jobs', app.job.slug]"
                      class="text-primary-600 hover:text-primary-700 font-semibold">
                      View Job →
                    </a>
                    <button *ngIf="canWithdraw(app.status)"
                      (click)="withdrawApp(app)"
                      class="text-red-600 hover:text-red-700 font-semibold">
                      Withdraw
                    </button>
                  </div>
                </div>
              </div>
            </div>
        </div>

      </div>
    </div>
  `,
})
export class MyApplicationsComponent implements OnInit {
  private appsService = inject(ApplicationsService);
  private route = inject(ActivatedRoute);

  applications = signal<Application[]>([]);
  loading = signal(true);
  activeTab = signal('ALL');

  selectedApplicationId = signal<number | null>(null);
  selectedApplication = signal<Application | null>(null);

  tabs = [
    { label: 'All', value: 'ALL' },
    { label: 'Applied', value: 'APPLIED' },
    { label: 'Under Review', value: 'UNDER_REVIEW' },
    { label: 'Shortlisted', value: 'SHORTLISTED' },
    { label: 'Interview', value: 'INTERVIEW_SCHEDULED' },
    { label: 'Offered', value: 'OFFERED' },
    { label: 'Hired', value: 'HIRED' },
    { label: 'Rejected', value: 'REJECTED' },
  ];

  filteredApplications = computed(() => {
    const tab = this.activeTab();
    if (tab === 'ALL') return this.applications();
    return this.applications().filter(a => a.status === tab);
  });

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
    this.route.paramMap.subscribe(params => {
      const idParam = params.get('id');

      if (idParam) {
        const id = Number(idParam);

        if (Number.isFinite(id)) {
          this.selectedApplicationId.set(id);
        } else {
          this.selectedApplicationId.set(null);
        }
      } else {
        this.selectedApplicationId.set(null);
      }

      this.loadApplications();
    });
  }

  loadApplications(): void {
    this.loading.set(true);

    this.appsService.getMyApplications().subscribe({
      next: (res) => {
        const applications = res.results || [];

        this.applications.set(applications);

        // ------------------------------------------------------
        // Deep-link handling
        // ------------------------------------------------------

        const selectedId = this.selectedApplicationId();

        if (selectedId !== null) {
          const application = applications.find(
            app => app.id === selectedId
          );

          if (application) {
            this.selectedApplication.set(application);

            // Scroll to the selected application after rendering
            setTimeout(() => {
              const element = document.getElementById(
                `application-${selectedId}`
              );

              element?.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
              });
            }, 100);
          } else {
            this.selectedApplication.set(null);
          }
        } else {
          this.selectedApplication.set(null);
        }

        this.loading.set(false);
      },

      error: () => {
        this.applications.set([]);
        this.selectedApplication.set(null);
        this.loading.set(false);
      }
    });
  }

  setActiveTab(tab: string): void {
    this.activeTab.set(tab);
  }

  getTabCount(value: string): number {
    if (value === 'ALL') return this.applications().length;
    return this.applications().filter(a => a.status === value).length;
  }

  canWithdraw(status: string): boolean {
    return !['HIRED', 'REJECTED', 'WITHDRAWN'].includes(status);
  }

  withdrawApp(app: Application): void {
    if (!confirm('Withdraw your application for "' + app.job.title + '"?')) return;
    this.appsService.withdraw(app.id).subscribe({
      next: () => this.loadApplications(),
      error: () => alert('Failed to withdraw application.')
    });
  }

  getFirstChar(name: string | undefined): string {
    return name && name.length > 0 ? name[0].toUpperCase() : '?';
  }

  getStatusColor(status: string): string {
    return this.statusColors[status]?.color || '#6b7280';
  }

  getStatusBg(status: string): string {
    return this.statusColors[status]?.bg || '#f3f4f6';
  }

  formatStatus(status: string): string {
    return status.split('_')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');
  }

  formatWorkMode(mode: string): string {
    const map: Record<string, string> = {
      ONSITE: '🏢 On-site',
      REMOTE: '🌍 Remote',
      HYBRID: '🔄 Hybrid'
    };
    return map[mode] || mode;
  }

  formatK(n: number): string {
    if (n >= 100000) return (n / 100000).toFixed(1) + 'L';
    if (n >= 1000) return (n / 1000).toFixed(0) + 'K';
    return n.toString();
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