import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { TopNavComponent } from '../shared/top-nav/top-nav.component';
import { ProfileService } from '../core/services/profile.service';
import { AuthService } from '../core/services/auth.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, TopNavComponent],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <app-top-nav portalName="Job Portal"></app-top-nav>

      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        <div class="mb-8 animate-fade-in">
          <h1 class="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">My Profile 👤</h1>
          <p class="text-gray-600">Keep your profile up to date for better job matches.</p>
        </div>

        <div *ngIf="loading()" class="flex justify-center py-20">
          <svg class="animate-spin w-10 h-10 text-primary-600" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
          </svg>
        </div>

        <div *ngIf="!loading() && profile()" class="space-y-6">

          <!-- Resume Upload Card -->
          <div class="bg-white rounded-2xl shadow-soft p-6 animate-slide-up">
            <h2 class="text-xl font-bold text-gray-900 mb-4">📄 Resume</h2>

            <div *ngIf="profile()?.resume" class="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-xl mb-4">
              <div class="flex items-center gap-3">
                <div class="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center text-white text-2xl">📄</div>
                <div>
                  <div class="font-semibold text-gray-900">Resume uploaded</div>
                  <a [href]="profile().resume" target="_blank" class="text-sm text-green-700 hover:underline">View resume →</a>
                </div>
              </div>
              <button (click)="deleteResume()" class="px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg font-semibold">
                Remove
              </button>
            </div>

            <div *ngIf="!profile()?.resume" class="p-4 bg-amber-50 border border-amber-200 rounded-xl mb-4">
              <p class="text-sm text-amber-800">⚠️ No resume uploaded yet. Upload one to apply to jobs.</p>
            </div>

            <label class="block cursor-pointer">
              <input type="file" (change)="onFileSelected($event)" accept=".pdf,.doc,.docx" class="hidden" />
              <div class="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-primary-500 hover:bg-primary-50/30 transition-all">
                <div class="text-3xl mb-2">📤</div>
                <div class="font-semibold text-gray-700">
                  {{ uploading() ? 'Uploading...' : (profile()?.resume ? 'Replace resume' : 'Upload resume') }}
                </div>
                <div class="text-xs text-gray-500 mt-1">PDF, DOC, DOCX · Max 5MB</div>
              </div>
            </label>

            <div *ngIf="uploadError()" class="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {{ uploadError() }}
            </div>
          </div>

          <!-- Profile Info Form -->
          <div class="bg-white rounded-2xl shadow-soft p-6 animate-slide-up" style="animation-delay: 0.1s;">
            <h2 class="text-xl font-bold text-gray-900 mb-4">✏️ Professional Info</h2>

            <form (submit)="saveProfile($event)" class="space-y-4">
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2">Headline</label>
                <input type="text" [(ngModel)]="form.headline" name="headline"
                  placeholder="e.g., Senior Full-Stack Developer"
                  class="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:bg-white focus:border-primary-500 focus:ring-4 focus:ring-primary-100 outline-none transition-all" />
              </div>

              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2">Summary</label>
                <textarea [(ngModel)]="form.summary" name="summary" rows="4"
                  placeholder="Tell recruiters about your experience..."
                  class="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:bg-white focus:border-primary-500 focus:ring-4 focus:ring-primary-100 outline-none transition-all resize-none"></textarea>
              </div>

              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2">Skills <span class="text-gray-400 text-xs">(comma-separated)</span></label>
                <input type="text" [(ngModel)]="form.skills" name="skills"
                  placeholder="Python, Django, Angular, TypeScript"
                  class="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:bg-white focus:border-primary-500 focus:ring-4 focus:ring-primary-100 outline-none transition-all" />
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-semibold text-gray-700 mb-2">Experience (years)</label>
                  <input type="number" [(ngModel)]="form.experience_years" name="experience_years" min="0"
                    class="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:bg-white focus:border-primary-500 focus:ring-4 focus:ring-primary-100 outline-none transition-all" />
                </div>
                <div>
                  <label class="block text-sm font-semibold text-gray-700 mb-2">Current Location</label>
                  <input type="text" [(ngModel)]="form.current_location" name="current_location"
                    placeholder="Bangalore, India"
                    class="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:bg-white focus:border-primary-500 focus:ring-4 focus:ring-primary-100 outline-none transition-all" />
                </div>
              </div>

              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2">Expected Salary (annual)</label>
                <input type="number" [(ngModel)]="form.expected_salary" name="expected_salary"
                  placeholder="800000"
                  class="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:bg-white focus:border-primary-500 focus:ring-4 focus:ring-primary-100 outline-none transition-all" />
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-semibold text-gray-700 mb-2">LinkedIn URL</label>
                  <input type="url" [(ngModel)]="form.linkedin_url" name="linkedin_url"
                    placeholder="https://linkedin.com/in/username"
                    class="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:bg-white focus:border-primary-500 focus:ring-4 focus:ring-primary-100 outline-none transition-all" />
                </div>
                <div>
                  <label class="block text-sm font-semibold text-gray-700 mb-2">GitHub URL</label>
                  <input type="url" [(ngModel)]="form.github_url" name="github_url"
                    placeholder="https://github.com/username"
                    class="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:bg-white focus:border-primary-500 focus:ring-4 focus:ring-primary-100 outline-none transition-all" />
                </div>
              </div>

              <div *ngIf="saveSuccess()" class="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700 font-semibold">
                ✅ Profile saved successfully!
              </div>

              <div *ngIf="saveError()" class="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {{ saveError() }}
              </div>

              <button type="submit" [disabled]="saving()"
                class="w-full py-3 bg-gradient-to-r from-primary-600 to-purple-600 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all disabled:opacity-50">
                {{ saving() ? 'Saving...' : 'Save Profile' }}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  `
})
export class ProfileComponent implements OnInit {
  private profileService = inject(ProfileService);
  private auth = inject(AuthService);

  profile = signal<any>(null);
  loading = signal(true);
  saving = signal(false);
  uploading = signal(false);
  saveSuccess = signal(false);
  saveError = signal<string | null>(null);
  uploadError = signal<string | null>(null);

  form = {
    headline: '',
    summary: '',
    skills: '',
    experience_years: 0,
    current_location: '',
    expected_salary: null as number | null,
    linkedin_url: '',
    github_url: '',
  };

  ngOnInit(): void {
    this.loadProfile();
  }

  loadProfile(): void {
    this.loading.set(true);
    this.profileService.getCandidateProfile().subscribe({
      next: (p) => {
        this.profile.set(p);
        this.form = {
          headline: p.headline || '',
          summary: p.summary || '',
          skills: p.skills || '',
          experience_years: p.experience_years || 0,
          current_location: p.current_location || '',
          expected_salary: p.expected_salary || null,
          linkedin_url: p.linkedin_url || '',
          github_url: p.github_url || '',
        };
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];

    if (file.size > 5 * 1024 * 1024) {
      this.uploadError.set('File is too large. Max 5MB.');
      return;
    }

    this.uploading.set(true);
    this.uploadError.set(null);

    this.profileService.uploadResume(file).subscribe({
      next: () => {
        this.uploading.set(false);
        this.loadProfile();
      },
      error: (err) => {
        this.uploading.set(false);
        this.uploadError.set(err.error?.resume?.[0] || err.error?.detail || 'Upload failed.');
      }
    });
  }

  deleteResume(): void {
    if (!confirm('Delete your resume?')) return;
    this.profileService.deleteResume().subscribe({
      next: () => this.loadProfile()
    });
  }

  saveProfile(event: Event): void {
    event.preventDefault();
    this.saving.set(true);
    this.saveError.set(null);
    this.saveSuccess.set(false);

    this.profileService.updateCandidateProfile(this.form).subscribe({
      next: () => {
        this.saving.set(false);
        this.saveSuccess.set(true);
        setTimeout(() => this.saveSuccess.set(false), 3000);
      },
      error: (err) => {
        this.saving.set(false);
        this.saveError.set(err.error?.detail || 'Failed to save.');
      }
    });
  }
}