import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { TopNavComponent } from '../../shared/top-nav/top-nav.component';
import { JobsService } from '../../core/services/jobs.service';
import { ApplicationsService } from '../../core/services/applications.service';
import { Job } from '../../core/models/job.model';
import { MatchScoreResponse } from '../../core/models/application.model';

@Component({
  selector: 'app-job-details',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, TopNavComponent],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <app-top-nav portalName="Job Portal"></app-top-nav>

      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        <a routerLink="/jobs" class="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-primary-600 mb-6 font-medium">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
          </svg>
          Back to Jobs
        </a>

        <!-- Loading -->
        <div *ngIf="loading()" class="flex justify-center py-20">
          <svg class="animate-spin w-10 h-10 text-primary-600" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
          </svg>
        </div>

        <!-- Error -->
        <div *ngIf="error()" class="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
          <p class="text-red-700 font-semibold">{{ error() }}</p>
          <a routerLink="/jobs" class="inline-block mt-3 px-4 py-2 bg-red-600 text-white text-sm rounded-lg">Back to Jobs</a>
        </div>

        <!-- Content -->
        <ng-container *ngIf="!loading() && !error() && job() as j">
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">

            <!-- LEFT: Job Content -->
            <div class="lg:col-span-2 space-y-6">

              <!-- Hero Card -->
              <div class="bg-white rounded-2xl shadow-soft overflow-hidden">
                <div class="h-32 bg-gradient-to-br from-primary-600 via-indigo-700 to-purple-700 relative">
                  <div class="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-8 -mt-8"></div>
                </div>
                <div class="px-6 pb-6">
                  <div class="flex items-start gap-4 -mt-12">
                    <div class="relative z-10 w-24 h-24 bg-gradient-to-br from-primary-500 to-purple-600 rounded-2xl shadow-lg flex items-center justify-center text-3xl font-bold text-white flex-shrink-0 border-4 border-white">
                        {{ getFirstChar(j.company?.name) }}
                    </div>
                    <div class="flex-1 min-w-0 pt-12">
                      <h1 class="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">{{ j.title }}</h1>
                      <p class="text-lg text-gray-700 font-semibold flex items-center gap-2">
                        {{ j.company?.name }}
                        <span *ngIf="j.company?.is_verified" class="text-blue-500 text-sm" title="Verified">✓</span>
                      </p>
                      <p class="text-sm text-gray-500">{{ j.company?.industry }} · {{ j.company?.headquarters }}</p>
                    </div>
                  </div>

                  <div class="flex flex-wrap gap-2 mt-5">
                    <span class="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium">
                      📍 {{ j.location }}
                    </span>
                    <span class="inline-flex items-center gap-1 px-3 py-1.5 bg-purple-50 text-purple-700 rounded-lg text-sm font-medium">
                      {{ formatWorkMode(j.work_mode) }}
                    </span>
                    <span class="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-sm font-medium">
                      {{ formatJobType(j.job_type) }}
                    </span>
                    <span class="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-50 text-amber-700 rounded-lg text-sm font-medium">
                      ⭐ {{ formatExperience(j.experience_level) }}
                    </span>
                  </div>

                  <div *ngIf="j.show_salary && (j.min_salary || j.max_salary)"
                    class="mt-5 flex items-center gap-2 text-lg font-bold text-gray-900">
                    <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    {{ formatSalary(j.min_salary, j.max_salary, j.currency) }}
                    <span class="text-sm text-gray-500 font-normal">per year</span>
                  </div>
                </div>
              </div>

              <!-- Description -->
              <div *ngIf="j.description" class="bg-white rounded-2xl shadow-soft p-6">
                <h2 class="text-xl font-bold text-gray-900 mb-4">📝 About the Role</h2>
                <div class="text-gray-700 whitespace-pre-line">{{ j.description }}</div>
              </div>

              <!-- Responsibilities -->
              <div *ngIf="j.responsibilities" class="bg-white rounded-2xl shadow-soft p-6">
                <h2 class="text-xl font-bold text-gray-900 mb-4">🎯 Responsibilities</h2>
                <div class="text-gray-700 whitespace-pre-line">{{ j.responsibilities }}</div>
              </div>

              <!-- Requirements -->
              <div *ngIf="j.requirements" class="bg-white rounded-2xl shadow-soft p-6">
                <h2 class="text-xl font-bold text-gray-900 mb-4">✅ Requirements</h2>
                <div class="text-gray-700 whitespace-pre-line">{{ j.requirements }}</div>
              </div>

              <!-- Benefits -->
              <div *ngIf="j.benefits" class="bg-white rounded-2xl shadow-soft p-6">
                <h2 class="text-xl font-bold text-gray-900 mb-4">🎁 Benefits</h2>
                <div class="text-gray-700 whitespace-pre-line">{{ j.benefits }}</div>
              </div>

              <!-- Skills -->
              <div *ngIf="j.skills_list && j.skills_list.length" class="bg-white rounded-2xl shadow-soft p-6">
                <h2 class="text-xl font-bold text-gray-900 mb-4">🛠️ Skills Required</h2>
                <div class="flex flex-wrap gap-2">
                  <span *ngFor="let skill of j.skills_list"
                    class="px-3 py-1.5 bg-gradient-to-r from-primary-50 to-purple-50 text-primary-700 rounded-lg text-sm font-medium border border-primary-100">
                    {{ skill }}
                  </span>
                </div>
              </div>
            </div>

            <!-- RIGHT: Sidebar -->
            <div class="lg:col-span-1 space-y-6">

              <!-- Apply Card -->
              <div class="bg-white rounded-2xl shadow-soft p-6 sticky top-24">
                <div *ngIf="!j.has_applied">
                  <button
                    (click)="openApplyModal()"
                    class="w-full py-3.5 bg-gradient-to-r from-primary-600 to-purple-600 hover:from-primary-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all">
                    Apply Now
                  </button>
                </div>

                <div *ngIf="j.has_applied" class="text-center p-4 bg-green-50 rounded-xl border border-green-200">
                  <div class="text-3xl mb-2">✅</div>
                  <div class="font-bold text-green-800">Application Submitted</div>
                  <p class="text-xs text-green-700 mt-1">Track it in "My Applications"</p>
                  <a routerLink="/my-applications" class="inline-block mt-3 text-sm font-semibold text-green-700 hover:underline">
                    View Applications →
                  </a>
                </div>

                <button (click)="toggleSave()"
                  class="w-full mt-3 py-3 border-2 rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
                  [ngClass]="j.is_saved ? 'border-pink-500 bg-pink-50 text-pink-600' : 'border-gray-300 text-gray-700 hover:border-pink-500 hover:text-pink-600'">
                  <svg class="w-5 h-5" [attr.fill]="j.is_saved ? 'currentColor' : 'none'" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
                  </svg>
                  {{ j.is_saved ? 'Saved' : 'Save Job' }}
                </button>

                <div class="mt-5 pt-5 border-t border-gray-100 space-y-2 text-sm">
                  <div class="flex justify-between">
                    <span class="text-gray-500">Views</span>
                    <span class="font-semibold text-gray-900">{{ j.views_count }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-500">Applications</span>
                    <span class="font-semibold text-gray-900">{{ j.applications_count }}</span>
                  </div>
                  <div class="flex justify-between" *ngIf="j.application_deadline">
                    <span class="text-gray-500">Deadline</span>
                    <span class="font-semibold text-gray-900">{{ formatDate(j.application_deadline) }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-500">Posted</span>
                    <span class="font-semibold text-gray-900">{{ timeSince(j.posted_at) }}</span>
                  </div>
                </div>
              </div>

              <!-- AI Match Score -->
              <div *ngIf="matchScore() as ms" class="bg-gradient-to-br from-purple-600 via-primary-600 to-indigo-600 rounded-2xl shadow-lg p-6 text-white">
                <div class="flex items-center gap-2 mb-3">
                  <span class="text-lg">🤖</span>
                  <span class="font-bold">AI Match Score</span>
                </div>
                <div class="text-5xl font-bold mb-1">{{ ms.total_score }}<span class="text-2xl opacity-70">/100</span></div>
                <div class="text-sm text-white/80 mb-4">{{ matchScoreLabel(ms.total_score) }}</div>

                <div class="space-y-2 text-xs">
                  <div>
                    <div class="flex justify-between mb-1">
                      <span>Skills</span>
                      <span class="font-semibold">{{ ms.breakdown.skills }}/50</span>
                    </div>
                    <div class="h-1.5 bg-white/20 rounded-full overflow-hidden">
                      <div class="h-full bg-white rounded-full" [style.width.%]="(ms.breakdown.skills/50)*100"></div>
                    </div>
                  </div>
                  <div>
                    <div class="flex justify-between mb-1">
                      <span>Experience</span>
                      <span class="font-semibold">{{ ms.breakdown.experience }}/20</span>
                    </div>
                    <div class="h-1.5 bg-white/20 rounded-full overflow-hidden">
                      <div class="h-full bg-white rounded-full" [style.width.%]="(ms.breakdown.experience/20)*100"></div>
                    </div>
                  </div>
                </div>

                <div *ngIf="ms.matched_skills && ms.matched_skills.length" class="mt-4">
                  <div class="text-xs font-semibold mb-2">✓ Your Matching Skills:</div>
                  <div class="flex flex-wrap gap-1">
                    <span *ngFor="let s of ms.matched_skills.slice(0, 5)" class="text-xs px-2 py-0.5 bg-white/20 rounded">
                      {{ s }}
                    </span>
                  </div>
                </div>

                <div *ngIf="ms.missing_skills && ms.missing_skills.length" class="mt-3">
                  <div class="text-xs font-semibold mb-2">⚠️ Skills to Learn:</div>
                  <div class="flex flex-wrap gap-1">
                    <span *ngFor="let s of ms.missing_skills.slice(0, 5)" class="text-xs px-2 py-0.5 bg-red-500/30 rounded">
                      {{ s }}
                    </span>
                  </div>
                </div>
              </div>

              <!-- Company Card -->
              <div class="bg-white rounded-2xl shadow-soft p-6">
                <h3 class="font-bold text-gray-900 mb-3">About the Company</h3>
                <div class="flex items-center gap-3 mb-3">
                  <div class="w-12 h-12 bg-gradient-to-br from-primary-500 to-purple-600 rounded-xl flex items-center justify-center text-xl font-bold text-white">
                    {{ getFirstChar(j.company?.name) }}
                  </div>
                  <div>
                    <div class="font-semibold text-gray-900">{{ j.company?.name }}</div>
                    <div class="text-xs text-gray-500">{{ j.company?.industry }}</div>
                  </div>
                </div>
                <div class="text-sm text-gray-600 space-y-1">
                  <div *ngIf="j.company?.headquarters">📍 {{ j.company?.headquarters }}</div>
                  <div *ngIf="j.company?.company_size">🏢 {{ formatCompanySize(j.company?.company_size || '') }}</div>
                </div>
              </div>
            </div>
          </div>
        </ng-container>
      </div>

      <!-- Apply Modal -->
      <div *ngIf="showApplyModal()"
        class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
        (click)="closeApplyModal()">
        <div class="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 animate-scale-in" (click)="$event.stopPropagation()">
          <div class="flex items-start justify-between mb-4">
            <div>
              <h3 class="text-xl font-bold text-gray-900">Apply to {{ job()?.title }}</h3>
              <p class="text-sm text-gray-500">{{ job()?.company?.name }}</p>
            </div>
            <button (click)="closeApplyModal()" class="text-gray-400 hover:text-gray-600">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>

          <form (submit)="submitApplication($event)" class="space-y-4">
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-2">Cover Letter</label>
              <textarea [(ngModel)]="applyForm.cover_letter" name="cover_letter" rows="5"
                placeholder="Introduce yourself and explain why you're a great fit..."
                class="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:bg-white focus:border-primary-500 focus:ring-4 focus:ring-primary-100 outline-none transition-all resize-none"></textarea>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2">Expected Salary</label>
                <input type="number" [(ngModel)]="applyForm.expected_salary" name="expected_salary" placeholder="800000"
                  class="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:bg-white focus:border-primary-500 focus:ring-4 focus:ring-primary-100 outline-none transition-all" />
              </div>
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2">Notice Period (days)</label>
                <input type="number" [(ngModel)]="applyForm.notice_period_days" name="notice_period_days" placeholder="30"
                  class="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:bg-white focus:border-primary-500 focus:ring-4 focus:ring-primary-100 outline-none transition-all" />
              </div>
            </div>

            <div class="bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm text-blue-800">
              💡 Your profile resume will be automatically attached to this application.
              <a routerLink="/profile" class="underline font-semibold">Upload resume →</a>
            </div>

            <div *ngIf="applyError()" class="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">
              {{ applyError() }}
            </div>

            <div class="flex gap-3">
              <button type="button" (click)="closeApplyModal()"
                class="flex-1 py-3 border-2 border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-all">
                Cancel
              </button>
              <button type="submit" [disabled]="applying()"
                class="flex-1 py-3 bg-gradient-to-r from-primary-600 to-purple-600 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all disabled:opacity-50">
                {{ applying() ? 'Submitting...' : 'Submit Application' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `
})
export class JobDetailsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private jobsService = inject(JobsService);
  private applicationsService = inject(ApplicationsService);

  job = signal<Job | null>(null);
  matchScore = signal<MatchScoreResponse | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);
  showApplyModal = signal(false);
  applying = signal(false);
  applyError = signal<string | null>(null);

  applyForm = {
    cover_letter: '',
    expected_salary: null as number | null,
    notice_period_days: null as number | null,
  };

  ngOnInit(): void {
    const slug = this.route.snapshot.paramMap.get('slug');
    if (!slug) {
      this.error.set('Invalid job URL.');
      this.loading.set(false);
      return;
    }
    this.loadJob(slug);
  }

  loadJob(slug: string): void {
    this.loading.set(true);
    this.jobsService.getJob(slug).subscribe({
      next: (job) => {
        this.job.set(job);
        this.loading.set(false);
        this.loadMatchScore(job.id);
      },
      error: (err) => {
        this.error.set(err?.error?.detail || 'Job not found.');
        this.loading.set(false);
      }
    });
  }

  loadMatchScore(jobId: number): void {
    this.applicationsService.getMatchScore(jobId).subscribe({
      next: (score) => this.matchScore.set(score),
      error: () => { }
    });
  }

  matchScoreLabel(score: number): string {
    if (score >= 80) return '🌟 Excellent match!';
    if (score >= 60) return '✨ Strong match';
    if (score >= 40) return '👍 Decent match';
    return '💡 Some skills gap';
  }

  openApplyModal(): void {
    this.applyError.set(null);
    this.showApplyModal.set(true);
  }

  closeApplyModal(): void {
    this.showApplyModal.set(false);
  }

  submitApplication(event: Event): void {
    event.preventDefault();
    const j = this.job();
    if (!j) return;

    this.applying.set(true);
    this.applyError.set(null);

    const payload: any = { job: j.id };
    if (this.applyForm.cover_letter) payload.cover_letter = this.applyForm.cover_letter;
    if (this.applyForm.expected_salary) payload.expected_salary = this.applyForm.expected_salary;
    if (this.applyForm.notice_period_days) payload.notice_period_days = this.applyForm.notice_period_days;

    this.applicationsService.applyToJob(payload).subscribe({
      next: () => {
        this.applying.set(false);
        this.showApplyModal.set(false);
        this.job.set({ ...j, has_applied: true, applications_count: j.applications_count + 1 });
      },
      error: (err) => {
        this.applying.set(false);
        const errObj = err.error || {};
        this.applyError.set(errObj.detail || errObj.non_field_errors?.[0] || 'Application failed.');
      }
    });
  }

  toggleSave(): void {
    const j = this.job();
    if (!j) return;

    const action = j.is_saved
      ? this.jobsService.unsaveJob(j.slug)
      : this.jobsService.saveJob(j.slug);

    action.subscribe({
      next: () => this.job.set({ ...j, is_saved: !j.is_saved })
    });
  }

  formatWorkMode(mode: string): string {
    return ({ ONSITE: '🏢 On-site', REMOTE: '🌍 Remote', HYBRID: '🔄 Hybrid' } as any)[mode] || mode;
  }

  getFirstChar(name: string | undefined): string {
    return name && name.length > 0 ? name[0].toUpperCase() : '?';
  }

  formatJobType(type: string): string {
    return ({ FULL_TIME: 'Full Time', PART_TIME: 'Part Time', CONTRACT: 'Contract', INTERNSHIP: 'Internship', FREELANCE: 'Freelance' } as any)[type] || type;
  }

  formatExperience(level: string): string {
    return ({ ENTRY: 'Entry Level', MID: 'Mid Level', SENIOR: 'Senior', LEAD: 'Lead' } as any)[level] || level;
  }

  formatCompanySize(size: string): string {
    return ({ STARTUP: '1-10 employees', SMALL: '11-50', MEDIUM: '51-200', LARGE: '201-1000', ENTERPRISE: '1000+' } as any)[size] || size;
  }

  formatSalary(min: number | null, max: number | null, currency: string): string {
    const format = (n: number): string => {
      if (n >= 100000) {
        return (n / 100000).toFixed(1) + 'L';
      }

      if (n >= 1000) {
        return (n / 1000).toFixed(0) + 'K';
      }

      return n.toString();
    };

    const cur = currency === 'INR' ? '₹' : currency + ' ';

    // Only accept positive integers
    const validMin =
      min !== null &&
      Number.isInteger(Number(min)) &&
      Number(min) > 0
        ? Number(min)
        : null;

    const validMax =
      max !== null &&
      Number.isInteger(Number(max)) &&
      Number(max) > 0
        ? Number(max)
        : null;

    // Valid salary range
    if (validMin !== null && validMax !== null && validMax > validMin) {
      return `${cur}${format(validMin)} - ${cur}${format(validMax)}`;
    }

    // Only valid minimum salary
    if (validMin !== null) {
      return `From ${cur}${format(validMin)}`;
    }

    // Only valid maximum salary
    if (validMax !== null) {
      return `Up to ${cur}${format(validMax)}`;
    }

    return '';
  }

  formatDate(dateStr: string | null): string {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  timeSince(dateStr: string | null): string {
    if (!dateStr) return 'Recently';
    const diff = Date.now() - new Date(dateStr).getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 30) return `${days} days ago`;
    return this.formatDate(dateStr);
  }
}