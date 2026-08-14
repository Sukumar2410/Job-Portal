import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

import { TopNavComponent } from '../../shared/top-nav/top-nav.component';
import { JobsService } from '../../core/services/jobs.service';
import { Job } from '../../core/models/job.model';

@Component({
  selector: 'app-hr-jobs',
  standalone: true,
  imports: [CommonModule, RouterLink, TopNavComponent],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50 to-teal-50">
      <app-top-nav portalName="HR Portal"></app-top-nav>

      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        <!-- Header -->
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 animate-fade-in">
          <div>
            <h1 class="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">My Job Postings 💼</h1>
            <p class="text-gray-600">Manage all your company's job listings.</p>
          </div>
          <a routerLink="/hr/jobs/new"
            class="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
            </svg>
            Post New Job
          </a>
        </div>

        <!-- Stats -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6 animate-slide-up">
          <div class="bg-white rounded-xl p-4 shadow-soft">
            <div class="text-2xl font-bold text-gray-900">{{ jobs().length }}</div>
            <div class="text-xs text-gray-500">Total</div>
          </div>
          <div class="bg-white rounded-xl p-4 shadow-soft">
            <div class="text-2xl font-bold text-emerald-600">{{ getCountByStatus('ACTIVE') }}</div>
            <div class="text-xs text-gray-500">Active</div>
          </div>
          <div class="bg-white rounded-xl p-4 shadow-soft">
            <div class="text-2xl font-bold text-amber-600">{{ getCountByStatus('DRAFT') }}</div>
            <div class="text-xs text-gray-500">Draft</div>
          </div>
          <div class="bg-white rounded-xl p-4 shadow-soft">
            <div class="text-2xl font-bold text-gray-500">{{ getCountByStatus('CLOSED') }}</div>
            <div class="text-xs text-gray-500">Closed</div>
          </div>
        </div>

        <!-- Filter tabs -->
        <div class="bg-white rounded-2xl shadow-soft p-2 mb-6 flex flex-wrap gap-1 animate-slide-up">
          <button *ngFor="let tab of tabs"
            (click)="activeTab.set(tab.value)"
            class="px-4 py-2 rounded-lg text-sm font-semibold transition-all"
            [ngClass]="activeTab() === tab.value
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
              : 'text-gray-600 hover:bg-gray-50'">
            {{ tab.label }}
          </button>
        </div>

        <!-- Loading -->
        <div *ngIf="loading()" class="flex justify-center py-20">
          <svg class="animate-spin w-10 h-10 text-emerald-600" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
          </svg>
        </div>

        <!-- Empty -->
        <div *ngIf="!loading() && filteredJobs().length === 0"
          class="bg-white rounded-2xl shadow-soft p-12 text-center animate-fade-in">
          <div class="w-24 h-24 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <span class="text-5xl">💼</span>
          </div>
          <h3 class="text-xl font-bold text-gray-900 mb-2">
            {{ activeTab() === 'ALL' ? 'No jobs posted yet' : 'No jobs in this category' }}
          </h3>
          <p class="text-gray-500 mb-6">Get started by posting your first job.</p>
          <a routerLink="/hr/jobs/new"
            class="inline-block px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-sm font-semibold rounded-xl shadow-md hover:shadow-lg transition-all">
            Post Your First Job →
          </a>
        </div>

        <!-- Jobs List -->
        <div *ngIf="!loading() && filteredJobs().length > 0" class="space-y-4">
          <div *ngFor="let job of filteredJobs(); let i = index"
            class="bg-white rounded-2xl shadow-soft hover:shadow-lg transition-all animate-slide-up p-5"
            [style.animation-delay]="(i * 0.05) + 's'">

            <div class="flex flex-col lg:flex-row lg:items-start gap-4">
              <!-- Content -->
              <div class="flex-1 min-w-0">
                <div class="flex items-start justify-between gap-2">
                  <div class="min-w-0">
                    <h3 class="text-lg font-bold text-gray-900 truncate">{{ job.title }}</h3>
                    <div class="text-sm text-gray-500 mt-1">
                      Posted {{ timeSince(job.posted_at || job.created_at) }} · {{ job.views_count }} views · {{ job.applications_count }} applicants
                    </div>
                  </div>
                  <span class="inline-flex items-center px-2.5 py-1 text-xs font-bold rounded-full flex-shrink-0"
                    [style.background]="getStatusBg(job.status)"
                    [style.color]="getStatusColor(job.status)">
                    {{ job.status }}
                  </span>
                </div>

                <div class="mt-3 flex flex-wrap gap-2 text-xs">
                  <span class="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-md">
                    📍 {{ job.location }}
                  </span>
                  <span class="inline-flex items-center gap-1 px-2 py-1 bg-purple-50 text-purple-700 rounded-md">
                    {{ formatWorkMode(job.work_mode) }}
                  </span>
                  <span class="inline-flex items-center gap-1 px-2 py-1 bg-emerald-50 text-emerald-700 rounded-md">
                    {{ formatJobType(job.job_type) }}
                  </span>
                  <span class="inline-flex items-center gap-1 px-2 py-1 bg-amber-50 text-amber-700 rounded-md">
                    ⭐ {{ formatExperience(job.experience_level) }}
                  </span>
                </div>
              </div>

              <!-- Actions -->
              <div class="flex flex-wrap gap-2 lg:flex-col lg:w-40">
                <a [routerLink]="['/hr/jobs/edit', job.slug]"
                  class="px-3 py-2 text-sm font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-all text-center">
                  ✏️ Edit
                </a>

                <button *ngIf="job.status === 'DRAFT' || job.status === 'PAUSED' || job.status === 'CLOSED'"
                  (click)="activateJob(job)"
                  class="px-3 py-2 text-sm font-semibold text-green-700 bg-green-50 hover:bg-green-100 rounded-lg transition-all">
                  ▶️ Activate
                </button>

                <button *ngIf="job.status === 'ACTIVE'"
                  (click)="pauseJob(job)"
                  class="px-3 py-2 text-sm font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg transition-all">
                  ⏸️ Pause
                </button>

                <button *ngIf="job.status === 'ACTIVE' || job.status === 'PAUSED'"
                  (click)="closeJob(job)"
                  class="px-3 py-2 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all">
                  🔒 Close
                </button>

                <button (click)="deleteJob(job)"
                  class="px-3 py-2 text-sm font-semibold text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-all">
                  🗑️ Delete
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  `
})
export class HrJobsComponent implements OnInit {
  private jobsService = inject(JobsService);

  jobs = signal<Job[]>([]);
  loading = signal(true);
  activeTab = signal<string>('ALL');

  tabs = [
    { label: 'All', value: 'ALL' },
    { label: 'Active', value: 'ACTIVE' },
    { label: 'Draft', value: 'DRAFT' },
    { label: 'Paused', value: 'PAUSED' },
    { label: 'Closed', value: 'CLOSED' },
  ];

  filteredJobs = computed(() => {
    const tab = this.activeTab();
    if (tab === 'ALL') return this.jobs();
    return this.jobs().filter(j => j.status === tab);
  });

  private statusColors: Record<string, { bg: string; color: string }> = {
    DRAFT:    { bg: '#fef3c7', color: '#b45309' },
    ACTIVE:   { bg: '#d1fae5', color: '#065f46' },
    PAUSED:   { bg: '#fed7aa', color: '#9a3412' },
    CLOSED:   { bg: '#f3f4f6', color: '#4b5563' },
    EXPIRED:  { bg: '#fee2e2', color: '#b91c1c' },
  };

  ngOnInit(): void {
    this.loadJobs();
  }

  loadJobs(): void {
    this.loading.set(true);
    // HR sees only their own jobs (backend handles this automatically)
    this.jobsService.listJobs({ page: 1 }).subscribe({
      next: (res) => {
        this.jobs.set(res.results || []);
        this.loading.set(false);
      },
      error: () => {
        this.jobs.set([]);
        this.loading.set(false);
      }
    });
  }

  getCountByStatus(status: string): number {
    return this.jobs().filter(j => j.status === status).length;
  }

  activateJob(job: Job): void {
    this.jobsService.activateJob(job.slug).subscribe({
      next: () => this.loadJobs(),
      error: (err) => alert(err.error?.detail || err.error?.quota || 'Failed to activate.')
    });
  }

  pauseJob(job: Job): void {
    this.jobsService.pauseJob(job.slug).subscribe({
      next: () => this.loadJobs(),
      error: () => alert('Failed to pause.')
    });
  }

  closeJob(job: Job): void {
    if (!confirm('Close "' + job.title + '"? Candidates will no longer see it.')) return;
    this.jobsService.closeJob(job.slug).subscribe({
      next: () => this.loadJobs(),
      error: () => alert('Failed to close.')
    });
  }

  deleteJob(job: Job): void {
    if (!confirm('Delete "' + job.title + '" permanently? This cannot be undone.')) return;
    this.jobsService.deleteJob(job.slug).subscribe({
      next: () => this.loadJobs(),
      error: () => alert('Failed to delete.')
    });
  }

  getStatusColor(status: string): string {
    return this.statusColors[status]?.color || '#6b7280';
  }

  getStatusBg(status: string): string {
    return this.statusColors[status]?.bg || '#f3f4f6';
  }

  formatWorkMode(mode: string): string {
    const map: Record<string, string> = { ONSITE: '🏢 On-site', REMOTE: '🌍 Remote', HYBRID: '🔄 Hybrid' };
    return map[mode] || mode;
  }

  formatJobType(type: string): string {
    const map: Record<string, string> = {
      FULL_TIME: 'Full Time', PART_TIME: 'Part Time', CONTRACT: 'Contract',
      INTERNSHIP: 'Internship', FREELANCE: 'Freelance'
    };
    return map[type] || type;
  }

  formatExperience(level: string): string {
    const map: Record<string, string> = { ENTRY: 'Entry', MID: 'Mid', SENIOR: 'Senior', LEAD: 'Lead' };
    return map[level] || level;
  }

  timeSince(dateStr: string | null): string {
    if (!dateStr) return 'Recently';
    const diff = Date.now() - new Date(dateStr).getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0) return 'today';
    if (days === 1) return 'yesterday';
    if (days < 30) return days + ' days ago';
    return new Date(dateStr).toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
  }
}