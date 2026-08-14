import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { TopNavComponent } from '../../shared/top-nav/top-nav.component';
import { ApplicationsService } from '../../core/services/applications.service';
import { JobsService } from '../../core/services/jobs.service';
import { Application } from '../../core/models/application.model';
import { Job } from '../../core/models/job.model';
import { API } from '../../core/constants/api.constants';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-hr-applicants',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, TopNavComponent],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50 to-teal-50">
      <app-top-nav portalName="HR Portal"></app-top-nav>

      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        <div class="mb-8 animate-fade-in">
          <h1 class="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">Applicants 👥</h1>
          <p class="text-gray-600">Review and manage candidates who applied to your jobs.</p>
        </div>

        <!-- Filters -->
        <div class="bg-white rounded-2xl shadow-soft p-4 mb-6 animate-slide-up">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-semibold text-gray-600 mb-1">Filter by Job</label>
              <select [ngModel]="selectedJob()" (ngModelChange)="selectedJob.set($event)" ...>
                class="w-full px-4 py-2 bg-gray-50 border-2 border-gray-100 rounded-lg text-sm focus:bg-white focus:border-emerald-500 outline-none">
                <option value="">All Jobs</option>
                <option *ngFor="let job of jobs()" [value]="job.id">{{ job.title }}</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-semibold text-gray-600 mb-1">Filter by Status</label>
              <select [ngModel]="selectedStatus()" (ngModelChange)="selectedStatus.set($event)" ...>
                class="w-full px-4 py-2 bg-gray-50 border-2 border-gray-100 rounded-lg text-sm focus:bg-white focus:border-emerald-500 outline-none">
                <option value="">All Statuses</option>
                <option value="APPLIED">Applied</option>
                <option value="UNDER_REVIEW">Under Review</option>
                <option value="SHORTLISTED">Shortlisted</option>
                <option value="INTERVIEW_SCHEDULED">Interview Scheduled</option>
                <option value="INTERVIEWED">Interviewed</option>
                <option value="OFFERED">Offered</option>
                <option value="HIRED">Hired</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Stats -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div class="bg-white rounded-xl p-4 shadow-soft">
            <div class="text-2xl font-bold text-gray-900">{{ filteredApplications().length }}</div>
            <div class="text-xs text-gray-500">Total</div>
          </div>
          <div class="bg-white rounded-xl p-4 shadow-soft">
            <div class="text-2xl font-bold text-purple-600">{{ getCountByStatus('SHORTLISTED') }}</div>
            <div class="text-xs text-gray-500">Shortlisted</div>
          </div>
          <div class="bg-white rounded-xl p-4 shadow-soft">
            <div class="text-2xl font-bold text-indigo-600">{{ getCountByStatus('INTERVIEW_SCHEDULED') }}</div>
            <div class="text-xs text-gray-500">Interviews</div>
          </div>
          <div class="bg-white rounded-xl p-4 shadow-soft">
            <div class="text-2xl font-bold text-emerald-600">{{ getCountByStatus('HIRED') }}</div>
            <div class="text-xs text-gray-500">Hired</div>
          </div>
        </div>

        <!-- Loading -->
        <div *ngIf="loading()" class="flex justify-center py-20">
          <svg class="animate-spin w-10 h-10 text-emerald-600" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
          </svg>
        </div>

        <!-- Empty -->
        <div *ngIf="!loading() && filteredApplications().length === 0"
          class="bg-white rounded-2xl shadow-soft p-12 text-center animate-fade-in">
          <div class="w-24 h-24 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <span class="text-5xl">👥</span>
          </div>
          <h3 class="text-xl font-bold text-gray-900 mb-2">No applicants found</h3>
          <p class="text-gray-500">Try changing filters or wait for applications.</p>
        </div>

        <!-- Applicants List -->
        <div *ngIf="!loading() && filteredApplications().length > 0" class="space-y-3">
          <div *ngFor="let app of filteredApplications(); let i = index"
            class="bg-white rounded-2xl shadow-soft hover:shadow-lg transition-all animate-slide-up p-5 cursor-pointer"
            [style.animation-delay]="(i * 0.05) + 's'"
            (click)="openApplicant(app)">

            <div class="flex flex-col sm:flex-row sm:items-start gap-4">
              <!-- Avatar -->
              <div class="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center text-white text-lg font-bold flex-shrink-0 shadow-md">
                {{ getInitials(app.candidate_name || '') }}
              </div>

              <!-- Content -->
              <div class="flex-1 min-w-0">
                <div class="flex items-start justify-between gap-2">
                  <div class="min-w-0">
                    <h3 class="text-lg font-bold text-gray-900">{{ app.candidate_name || app.candidate_email }}</h3>
                    <div class="text-sm text-gray-500 truncate">{{ app.candidate_email }}</div>
                    <div class="text-xs text-gray-400 mt-1">Applied for: <strong class="text-gray-700">{{ app.job.title }}</strong></div>
                  </div>
                  <span class="inline-flex items-center px-3 py-1 text-xs font-bold rounded-full flex-shrink-0"
                    [style.background]="getStatusBg(app.status)"
                    [style.color]="getStatusColor(app.status)">
                    {{ formatStatus(app.status) }}
                  </span>
                </div>

                <div class="mt-3 flex flex-wrap gap-2 items-center text-xs">
                  <span class="text-gray-500">Applied {{ timeSince(app.applied_at) }}</span>
                  <span *ngIf="app.rating" class="inline-flex items-center gap-0.5 px-2 py-1 bg-amber-50 text-amber-700 rounded-md font-semibold">
                    ⭐ {{ app.rating }}/5
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      <!-- Applicant Details Modal -->
      <div *ngIf="selectedApp() as app"
        class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
        (click)="closeApplicant()">
        <div class="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto animate-scale-in" (click)="$event.stopPropagation()">

          <!-- Header -->
          <div class="sticky top-0 bg-white border-b border-gray-100 p-6 flex items-start justify-between z-10">
            <div class="flex items-center gap-4">
              <div class="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center text-white text-xl font-bold shadow-md">
                {{ getInitials(app.candidate_name || '') }}
              </div>
              <div>
                <h2 class="text-2xl font-bold text-gray-900">{{ app.candidate_name || 'Candidate' }}</h2>
                <p class="text-sm text-gray-500">{{ app.candidate_email }}</p>
                <p class="text-xs text-gray-400 mt-0.5">Applied for: <strong>{{ app.job.title }}</strong></p>
              </div>
            </div>
            <button (click)="closeApplicant()" class="text-gray-400 hover:text-gray-600">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>

          <div class="p-6 space-y-6">

            <!-- Status Bar -->
            <div class="flex items-center justify-between gap-4 flex-wrap p-4 bg-gray-50 rounded-xl">
              <div>
                <div class="text-xs text-gray-500 mb-1">Current Status</div>
                <span class="inline-flex items-center px-3 py-1 text-sm font-bold rounded-full"
                  [style.background]="getStatusBg(app.status)"
                  [style.color]="getStatusColor(app.status)">
                  {{ formatStatus(app.status) }}
                </span>
              </div>
              <div class="flex-1 min-w-[200px]">
                <label class="block text-xs font-semibold text-gray-600 mb-1">Update Status</label>
                <div class="flex gap-2">
                  <select [(ngModel)]="newStatus"
                    class="flex-1 px-3 py-2 bg-white border-2 border-gray-200 rounded-lg text-sm focus:border-emerald-500 outline-none">
                    <option value="APPLIED">Applied</option>
                    <option value="UNDER_REVIEW">Under Review</option>
                    <option value="SHORTLISTED">Shortlisted</option>
                    <option value="INTERVIEW_SCHEDULED">Interview Scheduled</option>
                    <option value="INTERVIEWED">Interviewed</option>
                    <option value="OFFERED">Offered</option>
                    <option value="HIRED">Hired</option>
                    <option value="REJECTED">Rejected</option>
                  </select>
                  <button (click)="updateStatus(app)" [disabled]="updating() || newStatus === app.status"
                    class="px-4 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-all">
                    {{ updating() ? 'Updating...' : 'Update' }}
                  </button>
                </div>
              </div>
            </div>

            <!-- Rating -->
            <div class="flex items-center gap-3">
              <span class="text-sm font-semibold text-gray-700">Rating:</span>
              <div class="flex gap-1">
                <button *ngFor="let n of [1,2,3,4,5]"
                  (click)="ratingValue = n"
                  class="text-2xl transition-all hover:scale-110"
                  [ngClass]="ratingValue >= n ? 'text-amber-400' : 'text-gray-300'">
                  ⭐
                </button>
              </div>
              <button *ngIf="ratingValue !== (app.rating || 0)" (click)="saveRating(app)"
                class="ml-2 px-3 py-1 bg-amber-500 text-white text-xs font-semibold rounded-lg hover:bg-amber-600">
                Save Rating
              </button>
            </div>

            <!-- Candidate Info -->
            <div *ngIf="app.candidate_profile" class="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <h3 class="font-bold text-blue-900 mb-2">👤 Candidate Profile</h3>
              <div class="space-y-2 text-sm">
                <div *ngIf="app.candidate_profile.headline"><strong>Headline:</strong> {{ app.candidate_profile.headline }}</div>
                <div *ngIf="app.candidate_profile.experience_years"><strong>Experience:</strong> {{ app.candidate_profile.experience_years }} years</div>
                <div *ngIf="app.candidate_profile.current_location"><strong>Location:</strong> {{ app.candidate_profile.current_location }}</div>
                <div *ngIf="app.candidate_profile.skills"><strong>Skills:</strong> {{ app.candidate_profile.skills }}</div>
                <div *ngIf="app.candidate_profile.linkedin_url">
                  <strong>LinkedIn:</strong> <a [href]="app.candidate_profile.linkedin_url" target="_blank" class="text-blue-600 hover:underline">{{ app.candidate_profile.linkedin_url }}</a>
                </div>
              </div>
            </div>

            <!-- Application Details -->
            <div>
              <h3 class="font-bold text-gray-900 mb-3">📋 Application Details</h3>
              <div class="grid grid-cols-2 gap-3 text-sm mb-3">
                <div class="p-3 bg-gray-50 rounded-lg">
                  <div class="text-xs text-gray-500">Expected Salary</div>
                  <div class="font-semibold text-gray-900">₹{{ formatK(app.expected_salary || 0) || 'N/A' }}</div>
                </div>
                <div class="p-3 bg-gray-50 rounded-lg">
                  <div class="text-xs text-gray-500">Notice Period</div>
                  <div class="font-semibold text-gray-900">{{ app.notice_period_days || 'N/A' }} days</div>
                </div>
              </div>

              <div *ngIf="app.cover_letter" class="p-4 bg-gray-50 rounded-xl">
                <div class="text-xs font-semibold text-gray-600 mb-2">💌 Cover Letter</div>
                <p class="text-sm text-gray-700 whitespace-pre-line">{{ app.cover_letter }}</p>
              </div>

              <!-- Resume Download -->
              <div *ngIf="app.resume_snapshot" class="mt-3">
                <button (click)="downloadResume(app)"
                  class="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-all">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
                  </svg>
                  Download Resume
                </button>
              </div>
              <div *ngIf="!app.resume_snapshot" class="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
                ⚠️ No resume attached to this application.
              </div>
            </div>

            <!-- HR Notes -->
            <div>
              <h3 class="font-bold text-gray-900 mb-3">📝 HR Notes <span class="text-xs text-gray-500 font-normal">(private)</span></h3>
              <div *ngIf="app.hr_notes" class="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-gray-700 whitespace-pre-line mb-3">
                {{ app.hr_notes }}
              </div>
              <div class="flex gap-2">
                <input type="text" [(ngModel)]="newNote" placeholder="Add a note..."
                  class="flex-1 px-3 py-2 bg-gray-50 border-2 border-gray-200 rounded-lg text-sm focus:border-emerald-500 outline-none" />
                <button (click)="addNote(app)" [disabled]="!newNote.trim()"
                  class="px-4 py-2 bg-yellow-500 text-white text-sm font-semibold rounded-lg hover:bg-yellow-600 disabled:opacity-50">
                  Add
                </button>
              </div>
            </div>

            <!-- Status History -->
            <div *ngIf="app.status_history && app.status_history.length > 0">
              <h3 class="font-bold text-gray-900 mb-3">📜 Status History</h3>
              <div class="space-y-2">
                <div *ngFor="let h of app.status_history" class="flex items-start gap-3 text-sm">
                  <span class="w-2 h-2 bg-emerald-500 rounded-full mt-1.5 flex-shrink-0"></span>
                  <div class="flex-1">
                    <div class="text-gray-900">
                      <span *ngIf="h.from_status">{{ h.from_status }} → </span>
                      <strong>{{ h.to_status_display || h.to_status }}</strong>
                    </div>
                    <div class="text-xs text-gray-500">{{ timeSince(h.changed_at) }} by {{ h.changed_by_email }}</div>
                    <div *ngIf="h.note" class="text-xs text-gray-600 mt-0.5 italic">{{ h.note }}</div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

    </div>
  `
})
export class HrApplicantsComponent implements OnInit {
  private appsService = inject(ApplicationsService);
  private jobsService = inject(JobsService);
  private api = inject(ApiService);

  applications = signal<Application[]>([]);
  jobs = signal<Job[]>([]);
  loading = signal(true);
  updating = signal(false);
  selectedApp = signal<Application | null>(null);

  selectedJob = signal('');
  selectedStatus = signal('');
  newStatus = '';
  newNote = '';
  ratingValue = 0;

    filteredApplications = computed(() => {
    let list = this.applications();
    const job = this.selectedJob();
    const status = this.selectedStatus();
    if (job) list = list.filter(a => a.job.id === +job);
    if (status) list = list.filter(a => a.status === status);
    return list;
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
    this.loadJobs();
    this.loadApplications();
  }

  loadJobs(): void {
    this.jobsService.listJobs({ page: 1 }).subscribe({
      next: (res) => this.jobs.set(res.results || [])
    });
  }

  loadApplications(): void {
    this.loading.set(true);
    this.api.get<any>(API.APPLICATIONS.LIST, { page_size: 100 }).subscribe({
      next: (res) => {
        this.applications.set(res.results || []);
        this.loading.set(false);
      },
      error: () => {
        this.applications.set([]);
        this.loading.set(false);
      }
    });
  }

//   filterChanged(): void {
//     // Just triggers computed re-evaluation
//   }

  getCountByStatus(status: string): number {
    return this.filteredApplications().filter(a => a.status === status).length;
  }

  openApplicant(app: Application): void {
    this.appsService.getApplication(app.id).subscribe({
      next: (fullApp) => {
        this.selectedApp.set(fullApp);
        this.newStatus = fullApp.status;
        this.ratingValue = fullApp.rating || 0;
        this.newNote = '';
      }
    });
  }

  closeApplicant(): void {
    this.selectedApp.set(null);
  }

  updateStatus(app: Application): void {
    if (this.newStatus === app.status) return;
    this.updating.set(true);
    const payload = { status: this.newStatus, note: 'Status updated by HR' };
    this.api.post<any>(API.APPLICATIONS.UPDATE_STATUS(app.id), payload).subscribe({
      next: (res) => {
        this.updating.set(false);
        this.selectedApp.set(res.application);
        this.loadApplications();
      },
      error: () => {
        this.updating.set(false);
        alert('Failed to update status.');
      }
    });
  }

  addNote(app: Application): void {
    const note = this.newNote.trim();
    if (!note) return;
    this.api.post<any>(API.APPLICATIONS.ADD_NOTE(app.id), { note }).subscribe({
      next: (res) => {
        const updated = { ...app, hr_notes: res.hr_notes };
        this.selectedApp.set(updated);
        this.newNote = '';
      },
      error: () => alert('Failed to add note.')
    });
  }

  saveRating(app: Application): void {
    this.api.post<any>(API.APPLICATIONS.UPDATE_STATUS(app.id), {
      status: app.status,
      rating: this.ratingValue,
      note: 'Rating updated'
    }).subscribe({
      next: (res) => {
        this.selectedApp.set(res.application);
        this.loadApplications();
      }
    });
  }

  downloadResume(app: Application): void {
    // Open in new tab; interceptor won't attach token to <a> href, so use API service
    const url = API.APPLICATIONS.DOWNLOAD_RESUME(app.id);
    this.api.downloadFile(url).subscribe({
      next: (blob) => {
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.download = `${app.candidate_name || 'candidate'}_resume.pdf`;
        link.click();
      },
      error: () => alert('Failed to download resume.')
    });
  }

  getInitials(name: string): string {
    const parts = name.split(' ').filter(p => p.length > 0);
    if (parts.length === 0) return '?';
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
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