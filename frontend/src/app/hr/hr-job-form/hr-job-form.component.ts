import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { TopNavComponent } from '../../shared/top-nav/top-nav.component';
import { JobsService } from '../../core/services/jobs.service';

@Component({
  selector: 'app-hr-job-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, TopNavComponent],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50 to-teal-50">
      <app-top-nav portalName="HR Portal"></app-top-nav>

      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        <a routerLink="/hr/jobs" class="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-emerald-600 mb-6 font-medium">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
          </svg>
          Back to Jobs
        </a>

        <div class="mb-8 animate-fade-in">
          <h1 class="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
            {{ isEditMode() ? '✏️ Edit Job' : '📝 Post New Job' }}
          </h1>
          <p class="text-gray-600">
            {{ isEditMode() ? 'Update the job details below.' : 'Fill in the details to publish a new job posting.' }}
          </p>
        </div>

        <div *ngIf="loading()" class="flex justify-center py-20">
          <svg class="animate-spin w-10 h-10 text-emerald-600" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
          </svg>
        </div>

        <form *ngIf="!loading()" (submit)="onSubmit($event)" class="space-y-6">

          <!-- Basic Info -->
          <div class="bg-white rounded-2xl shadow-soft p-6 animate-slide-up">
            <h2 class="text-lg font-bold text-gray-900 mb-4">📋 Basic Information</h2>

            <div class="space-y-4">
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2">Job Title *</label>
                <input type="text" [(ngModel)]="form.title" name="title" required
                  placeholder="e.g., Senior Django Developer"
                  class="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 outline-none transition-all" />
              </div>

              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2">Description *</label>
                <textarea [(ngModel)]="form.description" name="description" rows="4" required
                  placeholder="Brief overview of the role..."
                  class="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 outline-none transition-all resize-none"></textarea>
              </div>

              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2">Responsibilities</label>
                <textarea [(ngModel)]="form.responsibilities" name="responsibilities" rows="4"
                  placeholder="• Design REST APIs&#10;• Collaborate with team&#10;• Write clean code"
                  class="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 outline-none transition-all resize-none"></textarea>
              </div>

              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2">Requirements</label>
                <textarea [(ngModel)]="form.requirements" name="requirements" rows="4"
                  placeholder="• 3+ years of Python experience&#10;• Strong Django knowledge&#10;• Bachelor's degree"
                  class="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 outline-none transition-all resize-none"></textarea>
              </div>

              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2">Benefits</label>
                <textarea [(ngModel)]="form.benefits" name="benefits" rows="3"
                  placeholder="• Health insurance&#10;• Flexible hours&#10;• Learning budget"
                  class="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 outline-none transition-all resize-none"></textarea>
              </div>

              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2">Skills Required <span class="text-gray-400 text-xs">(comma-separated)</span></label>
                <input type="text" [(ngModel)]="form.skills_required" name="skills_required"
                  placeholder="Python, Django, DRF, PostgreSQL, Docker"
                  class="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 outline-none transition-all" />
              </div>
            </div>
          </div>

          <!-- Job Type & Mode -->
          <div class="bg-white rounded-2xl shadow-soft p-6 animate-slide-up" style="animation-delay: 0.1s;">
            <h2 class="text-lg font-bold text-gray-900 mb-4">⚙️ Job Type & Mode</h2>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2">Job Type</label>
                <select [(ngModel)]="form.job_type" name="job_type"
                  class="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 outline-none transition-all">
                  <option value="FULL_TIME">Full Time</option>
                  <option value="PART_TIME">Part Time</option>
                  <option value="CONTRACT">Contract</option>
                  <option value="INTERNSHIP">Internship</option>
                  <option value="FREELANCE">Freelance</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2">Work Mode</label>
                <select [(ngModel)]="form.work_mode" name="work_mode"
                  class="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 outline-none transition-all">
                  <option value="ONSITE">On-site</option>
                  <option value="REMOTE">Remote</option>
                  <option value="HYBRID">Hybrid</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2">Experience</label>
                <select [(ngModel)]="form.experience_level" name="experience_level"
                  class="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 outline-none transition-all">
                  <option value="ENTRY">Entry Level (0-2 yr)</option>
                  <option value="MID">Mid Level (2-5 yr)</option>
                  <option value="SENIOR">Senior (5-10 yr)</option>
                  <option value="LEAD">Lead (10+ yr)</option>
                </select>
              </div>
            </div>
          </div>

          <!-- Location & Salary -->
          <div class="bg-white rounded-2xl shadow-soft p-6 animate-slide-up" style="animation-delay: 0.2s;">
            <h2 class="text-lg font-bold text-gray-900 mb-4">📍 Location & Compensation</h2>

            <div class="space-y-4">
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2">Location *</label>
                <input type="text" [(ngModel)]="form.location" name="location" required
                  placeholder="Bangalore, India"
                  class="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 outline-none transition-all" />
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label class="block text-sm font-semibold text-gray-700 mb-2">Min Salary</label>
                  <input type="number" [(ngModel)]="form.min_salary" name="min_salary" placeholder="500000"
                    class="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 outline-none transition-all" />
                </div>
                <div>
                  <label class="block text-sm font-semibold text-gray-700 mb-2">Max Salary</label>
                  <input type="number" [(ngModel)]="form.max_salary" name="max_salary" placeholder="1000000"
                    class="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 outline-none transition-all" />
                </div>
                <div>
                  <label class="block text-sm font-semibold text-gray-700 mb-2">Currency</label>
                  <select [(ngModel)]="form.currency" name="currency"
                    class="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 outline-none transition-all">
                    <option value="INR">INR</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                  </select>
                </div>
              </div>

              <label class="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" [(ngModel)]="form.show_salary" name="show_salary" class="w-5 h-5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500" />
                <span class="text-sm text-gray-700">Show salary range to candidates</span>
              </label>
            </div>
          </div>

          <!-- Deadline -->
          <div class="bg-white rounded-2xl shadow-soft p-6 animate-slide-up" style="animation-delay: 0.3s;">
            <h2 class="text-lg font-bold text-gray-900 mb-4">📅 Application Settings</h2>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2">Application Deadline</label>
                <input type="date" [(ngModel)]="form.application_deadline" name="application_deadline"
                  class="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 outline-none transition-all" />
              </div>
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2">Max Applications</label>
                <input type="number" [(ngModel)]="form.max_applications" name="max_applications"
                  placeholder="Leave blank for unlimited"
                  class="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 outline-none transition-all" />
              </div>
            </div>
          </div>

          <!-- Publish Options -->
          <div class="bg-white rounded-2xl shadow-soft p-6 animate-slide-up" style="animation-delay: 0.4s;">
            <h2 class="text-lg font-bold text-gray-900 mb-4">🚀 Publish Options</h2>

            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-2">Status</label>
              <div class="grid grid-cols-2 gap-3">
                <label class="cursor-pointer">
                  <input type="radio" [(ngModel)]="form.status" name="status" value="DRAFT" class="peer sr-only" />
                  <div class="border-2 border-gray-200 rounded-xl p-4 text-center transition-all peer-checked:border-amber-500 peer-checked:bg-amber-50 hover:border-gray-300">
                    <div class="text-2xl mb-1">📝</div>
                    <div class="font-semibold text-sm text-gray-800">Save as Draft</div>
                    <div class="text-xs text-gray-500">Not visible to candidates</div>
                  </div>
                </label>
                <label class="cursor-pointer">
                  <input type="radio" [(ngModel)]="form.status" name="status" value="ACTIVE" class="peer sr-only" />
                  <div class="border-2 border-gray-200 rounded-xl p-4 text-center transition-all peer-checked:border-emerald-500 peer-checked:bg-emerald-50 hover:border-gray-300">
                    <div class="text-2xl mb-1">🚀</div>
                    <div class="font-semibold text-sm text-gray-800">Publish Now</div>
                    <div class="text-xs text-gray-500">Visible to candidates</div>
                  </div>
                </label>
              </div>
            </div>
          </div>

          <!-- Feedback -->
          <div *ngIf="error()" class="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
            <strong>❌ Error:</strong> {{ error() }}
          </div>

          <div *ngIf="success()" class="p-4 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700 font-semibold">
            ✅ {{ success() }}
          </div>

          <!-- Submit -->
          <div class="flex gap-3">
            <a routerLink="/hr/jobs"
              class="flex-1 py-3 text-center border-2 border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-all">
              Cancel
            </a>
            <button type="submit" [disabled]="saving()"
              class="flex-1 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all disabled:opacity-50">
              {{ saving() ? 'Saving...' : (isEditMode() ? 'Update Job' : 'Post Job') }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `
})
export class HrJobFormComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private jobsService = inject(JobsService);

  loading = signal(false);
  saving = signal(false);
  error = signal<string | null>(null);
  success = signal<string | null>(null);
  editSlug = signal<string | null>(null);
  isEditMode = signal(false);

  form: any = {
    title: '',
    description: '',
    responsibilities: '',
    requirements: '',
    benefits: '',
    skills_required: '',
    job_type: 'FULL_TIME',
    work_mode: 'ONSITE',
    experience_level: 'MID',
    location: '',
    min_salary: null,
    max_salary: null,
    currency: 'INR',
    show_salary: true,
    application_deadline: null,
    max_applications: null,
    status: 'DRAFT',
  };

  ngOnInit(): void {
    const slug = this.route.snapshot.paramMap.get('slug');
    if (slug) {
      this.editSlug.set(slug);
      this.isEditMode.set(true);
      this.loadJob(slug);
    }
  }

  loadJob(slug: string): void {
    this.loading.set(true);
    this.jobsService.getJob(slug).subscribe({
      next: (job) => {
        this.form = {
          title: job.title || '',
          description: job.description || '',
          responsibilities: job.responsibilities || '',
          requirements: job.requirements || '',
          benefits: job.benefits || '',
          skills_required: job.skills_required || '',
          job_type: job.job_type || 'FULL_TIME',
          work_mode: job.work_mode || 'ONSITE',
          experience_level: job.experience_level || 'MID',
          location: job.location || '',
          min_salary: job.min_salary,
          max_salary: job.max_salary,
          currency: job.currency || 'INR',
          show_salary: job.show_salary,
          application_deadline: job.application_deadline,
          max_applications: job.max_applications,
          status: job.status || 'DRAFT',
        };
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Failed to load job.');
        this.loading.set(false);
      }
    });
  }

  onSubmit(event: Event): void {
    event.preventDefault();
    this.saving.set(true);
    this.error.set(null);
    this.success.set(null);

    // Clean up empty values
    const payload: any = { ...this.form };
    Object.keys(payload).forEach(key => {
      if (payload[key] === '' || payload[key] === null || payload[key] === undefined) {
        if (typeof payload[key] === 'boolean') return;  // Keep booleans
        delete payload[key];
      }
    });

    const request = this.isEditMode() && this.editSlug()
      ? this.jobsService.updateJob(this.editSlug()!, payload)
      : this.jobsService.createJob(payload);

    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.success.set(this.isEditMode() ? 'Job updated successfully!' : 'Job posted successfully!');
        setTimeout(() => this.router.navigate(['/hr/jobs']), 1200);
      },
      error: (err) => {
        this.saving.set(false);
        this.error.set(this.parseError(err));
      }
    });
  }

  parseError(err: any): string {
    const e = err?.error;
    if (!e) return 'Something went wrong.';
    if (typeof e === 'string') return e;
    if (e.detail) return e.detail;
    if (e.quota) return e.quota;
    for (const key of Object.keys(e)) {
      const v = e[key];
      if (Array.isArray(v)) return key + ': ' + v[0];
      return key + ': ' + v;
    }
    return 'Failed to save job.';
  }
}