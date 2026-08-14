import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged, switchMap } from 'rxjs';

import { TopNavComponent } from '../../shared/top-nav/top-nav.component';
import { JobsService, JobFilters } from '../../core/services/jobs.service';
import { Job } from '../../core/models/job.model';

@Component({
  selector: 'app-jobs-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, TopNavComponent],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <app-top-nav portalName="Job Portal"></app-top-nav>

      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        <!-- Header -->
        <div class="mb-8 animate-fade-in">
          <h1 class="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">Browse Jobs 🔍</h1>
          <p class="text-gray-600">Discover opportunities that match your skills.</p>
        </div>

        <!-- Search + Filters Bar -->
        <div class="bg-white rounded-2xl shadow-soft p-4 sm:p-6 mb-6 animate-slide-up">
          <!-- Search -->
          <div class="relative mb-4">
            <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
              </svg>
            </div>
            <input
              type="text"
              [(ngModel)]="searchQuery"
              (ngModelChange)="onSearchChange($event)"
              placeholder="Search by title, company, skills, or location..."
              class="w-full pl-11 pr-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:bg-white focus:border-primary-500 focus:ring-4 focus:ring-primary-100 outline-none transition-all"
            />
          </div>

          <!-- Filter Chips -->
          <div class="flex flex-wrap gap-3">
            <!-- Job Type -->
            <select [(ngModel)]="filters.job_type" (ngModelChange)="applyFilters()"
              class="px-4 py-2 bg-gray-50 border-2 border-gray-100 rounded-lg text-sm font-medium focus:border-primary-500 focus:bg-white outline-none transition-all cursor-pointer">
              <option value="">All Types</option>
              <option value="FULL_TIME">Full Time</option>
              <option value="PART_TIME">Part Time</option>
              <option value="CONTRACT">Contract</option>
              <option value="INTERNSHIP">Internship</option>
              <option value="FREELANCE">Freelance</option>
            </select>

            <!-- Work Mode -->
            <select [(ngModel)]="filters.work_mode" (ngModelChange)="applyFilters()"
              class="px-4 py-2 bg-gray-50 border-2 border-gray-100 rounded-lg text-sm font-medium focus:border-primary-500 focus:bg-white outline-none transition-all cursor-pointer">
              <option value="">All Work Modes</option>
              <option value="ONSITE">On-site</option>
              <option value="REMOTE">Remote</option>
              <option value="HYBRID">Hybrid</option>
            </select>

            <!-- Experience -->
            <select [(ngModel)]="filters.experience_level" (ngModelChange)="applyFilters()"
              class="px-4 py-2 bg-gray-50 border-2 border-gray-100 rounded-lg text-sm font-medium focus:border-primary-500 focus:bg-white outline-none transition-all cursor-pointer">
              <option value="">All Experience</option>
              <option value="ENTRY">Entry Level (0-2 yr)</option>
              <option value="MID">Mid Level (2-5 yr)</option>
              <option value="SENIOR">Senior (5-10 yr)</option>
              <option value="LEAD">Lead (10+ yr)</option>
            </select>

            <!-- Sort -->
            <select [(ngModel)]="filters.ordering" (ngModelChange)="applyFilters()"
              class="px-4 py-2 bg-gray-50 border-2 border-gray-100 rounded-lg text-sm font-medium focus:border-primary-500 focus:bg-white outline-none transition-all cursor-pointer">
              <option value="-posted_at">Latest First</option>
              <option value="posted_at">Oldest First</option>
              <option value="-applications_count">Most Popular</option>
              <option value="-views_count">Most Viewed</option>
            </select>

            <button *ngIf="hasActiveFilters()" (click)="clearFilters()"
              class="px-4 py-2 bg-red-50 text-red-600 border-2 border-red-200 rounded-lg text-sm font-medium hover:bg-red-100 transition-all">
              ✕ Clear
            </button>

            <div class="ml-auto flex items-center text-sm text-gray-500">
              <strong class="text-gray-900 mr-1">{{ totalCount() }}</strong> jobs found
            </div>
          </div>
        </div>

        <!-- Loading -->
        <div *ngIf="loading()" class="flex justify-center py-20">
          <div class="flex flex-col items-center gap-3">
            <svg class="animate-spin w-10 h-10 text-primary-600" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
            </svg>
            <p class="text-sm text-gray-500">Loading jobs...</p>
          </div>
        </div>

        <!-- Empty state -->
        <div *ngIf="!loading() && jobs().length === 0"
          class="bg-white rounded-2xl shadow-soft p-12 text-center animate-fade-in">
          <div class="w-24 h-24 bg-gradient-to-br from-primary-100 to-purple-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <svg class="w-12 h-12 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
          </div>
          <h3 class="text-xl font-bold text-gray-900 mb-2">No jobs found</h3>
          <p class="text-gray-500 mb-6 max-w-md mx-auto">
            Try adjusting your search or filters to find more opportunities.
          </p>
          <button (click)="clearFilters()"
            class="px-6 py-2.5 bg-gradient-to-r from-primary-600 to-purple-600 text-white text-sm font-semibold rounded-xl shadow-md hover:shadow-lg transition-all">
            Clear all filters
          </button>
        </div>

        <!-- Jobs Grid -->
        <div *ngIf="!loading() && jobs().length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <div *ngFor="let job of jobs(); let i = index"
            class="group bg-white rounded-2xl shadow-soft hover:shadow-xl transition-all overflow-hidden animate-slide-up cursor-pointer border-2 border-transparent hover:border-primary-200"
            [style.animation-delay]="(i * 0.05) + 's'"
            [routerLink]="['/jobs', job.slug]">

            <div class="p-5">
              <!-- Header -->
              <div class="flex items-start justify-between mb-3">
                <div class="flex items-center gap-3 min-w-0 flex-1">
                  <div class="w-12 h-12 bg-gradient-to-br from-primary-100 to-purple-100 rounded-xl flex items-center justify-center flex-shrink-0 text-2xl font-bold text-primary-700">
                    {{ job.company.name[0] }}
                  </div>
                  <div class="min-w-0">
                    <div class="text-sm font-semibold text-gray-600 truncate flex items-center gap-1">
                      {{ job.company.name }}
                      <span *ngIf="job.company.is_verified" class="text-blue-500 text-xs" title="Verified">✓</span>
                    </div>
                    <div class="text-xs text-gray-400">{{ job.company.industry }}</div>
                  </div>
                </div>

                <!-- Save button -->
                <button (click)="toggleSave(job, $event)"
                  class="p-2 rounded-lg hover:bg-gray-100 transition-all"
                  [class.text-pink-500]="job.is_saved"
                  [class.text-gray-400]="!job.is_saved">
                  <svg class="w-5 h-5" [attr.fill]="job.is_saved ? 'currentColor' : 'none'" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
                  </svg>
                </button>
              </div>

              <!-- Title -->
              <h3 class="text-lg font-bold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors line-clamp-2">
                {{ job.title }}
              </h3>

              <!-- Meta Info -->
              <div class="flex flex-wrap gap-2 mb-4 text-xs">
                <span class="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-full font-medium">
                  <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                  {{ job.location }}
                </span>
                <span class="inline-flex items-center gap-1 px-2 py-1 bg-purple-50 text-purple-700 rounded-full font-medium">
                  {{ formatWorkMode(job.work_mode) }}
                </span>
                <span class="inline-flex items-center gap-1 px-2 py-1 bg-emerald-50 text-emerald-700 rounded-full font-medium">
                  {{ formatJobType(job.job_type) }}
                </span>
              </div>

              <!-- Skills -->
              <div *ngIf="job.skills_list?.length" class="flex flex-wrap gap-1.5 mb-4">
                <span *ngFor="let skill of job.skills_list.slice(0, 4)"
                  class="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded-md font-medium">
                  {{ skill }}
                </span>
                <span *ngIf="job.skills_list.length > 4"
                  class="text-xs px-2 py-1 bg-gray-100 text-gray-500 rounded-md">
                  +{{ job.skills_list.length - 4 }} more
                </span>
              </div>

              <!-- Salary -->
              <div *ngIf="job.show_salary && (job.min_salary || job.max_salary)"
                class="flex items-center gap-1 text-sm font-semibold text-gray-900 mb-3">
                <svg class="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                {{ formatSalary(job.min_salary, job.max_salary, job.currency) }}
              </div>

              <!-- Footer -->
              <div class="pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                <span>{{ formatDate(job.posted_at) }}</span>
                <div class="flex items-center gap-3">
                  <span *ngIf="job.has_applied" class="text-green-600 font-semibold">✓ Applied</span>
                  <span class="flex items-center gap-1">
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                    {{ job.views_count }}
                  </span>
                  <span class="flex items-center gap-1">
                    👥 {{ job.applications_count }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Pagination -->
        <div *ngIf="!loading() && jobs().length > 0 && totalPages() > 1" class="mt-8 flex justify-center gap-2">
          <button
            (click)="goToPage(currentPage() - 1)"
            [disabled]="currentPage() === 1"
            class="px-4 py-2 bg-white border-2 border-gray-200 rounded-lg text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:border-primary-500 hover:text-primary-600 transition-all">
            ← Previous
          </button>
          <span class="px-4 py-2 text-sm text-gray-600">
            Page <strong>{{ currentPage() }}</strong> of <strong>{{ totalPages() }}</strong>
          </span>
          <button
            (click)="goToPage(currentPage() + 1)"
            [disabled]="currentPage() === totalPages()"
            class="px-4 py-2 bg-white border-2 border-gray-200 rounded-lg text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:border-primary-500 hover:text-primary-600 transition-all">
            Next →
          </button>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .line-clamp-2 {
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
  `]
})
export class JobsListComponent implements OnInit {
  private jobsService = inject(JobsService);

  jobs = signal<Job[]>([]);
  loading = signal(false);
  totalCount = signal(0);
  currentPage = signal(1);
  pageSize = 10;

  searchQuery = '';
  filters: JobFilters = {
    search: '',
    job_type: '',
    work_mode: '',
    experience_level: '',
    ordering: '-posted_at',
    page: 1,
  };

  private searchSubject = new Subject<string>();

  totalPages = computed(() => Math.ceil(this.totalCount() / this.pageSize));

  ngOnInit(): void {
    // Debounce search input
    this.searchSubject.pipe(
      debounceTime(400),
      distinctUntilChanged(),
    ).subscribe((query) => {
      this.filters.search = query;
      this.filters.page = 1;
      this.currentPage.set(1);
      this.loadJobs();
    });

    this.loadJobs();
  }

  loadJobs(): void {
    this.loading.set(true);
    this.jobsService.listJobs(this.filters).subscribe({
      next: (res) => {
        this.jobs.set(res.results);
        this.totalCount.set(res.count);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  onSearchChange(query: string): void {
    this.searchSubject.next(query);
  }

  applyFilters(): void {
    this.filters.page = 1;
    this.currentPage.set(1);
    this.loadJobs();
  }

  clearFilters(): void {
    this.searchQuery = '';
    this.filters = {
      search: '',
      job_type: '',
      work_mode: '',
      experience_level: '',
      ordering: '-posted_at',
      page: 1,
    };
    this.currentPage.set(1);
    this.loadJobs();
  }

  hasActiveFilters(): boolean {
    return !!(this.filters.search || this.filters.job_type ||
              this.filters.work_mode || this.filters.experience_level);
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages()) return;
    this.currentPage.set(page);
    this.filters.page = page;
    this.loadJobs();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  toggleSave(job: Job, event: Event): void {
    event.stopPropagation();
    event.preventDefault();

    const action = job.is_saved
      ? this.jobsService.unsaveJob(job.slug)
      : this.jobsService.saveJob(job.slug);

    action.subscribe({
      next: () => {
        // Optimistically update UI
        job.is_saved = !job.is_saved;
      },
      error: () => {
        alert('Failed to update saved status.');
      }
    });
  }

  formatWorkMode(mode: string): string {
    const map: Record<string, string> = {
      ONSITE: '🏢 On-site',
      REMOTE: '🌍 Remote',
      HYBRID: '🔄 Hybrid',
    };
    return map[mode] || mode;
  }

  formatJobType(type: string): string {
    const map: Record<string, string> = {
      FULL_TIME: 'Full Time',
      PART_TIME: 'Part Time',
      CONTRACT: 'Contract',
      INTERNSHIP: 'Internship',
      FREELANCE: 'Freelance',
    };
    return map[type] || type;
  }

  formatSalary(min: number | null, max: number | null, currency: string): string {
    const format = (n: number) => {
      if (n >= 100000) return (n / 100000).toFixed(1) + 'L';
      if (n >= 1000) return (n / 1000).toFixed(0) + 'K';
      return n.toString();
    };

    const cur = currency === 'INR' ? '₹' : currency + ' ';
    if (min && max) return `${cur}${format(min)} - ${cur}${format(max)}`;
    if (min) return `From ${cur}${format(min)}`;
    if (max) return `Up to ${cur}${format(max)}`;
    return '';
  }

  formatDate(dateStr: string | null): string {
    if (!dateStr) return 'Recently';
    const date = new Date(dateStr);
    const diff = Date.now() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
  }
}