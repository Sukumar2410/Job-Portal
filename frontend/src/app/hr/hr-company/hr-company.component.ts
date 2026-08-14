import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { TopNavComponent } from '../../shared/top-nav/top-nav.component';
import { CompaniesService } from '../../core/services/companies.service';
import { Company } from '../../core/models/company.model';

@Component({
  selector: 'app-hr-company',
  standalone: true,
  imports: [CommonModule, FormsModule, TopNavComponent],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50 to-teal-50">
      <app-top-nav portalName="HR Portal"></app-top-nav>

      <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        <div class="mb-8 animate-fade-in">
          <h1 class="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">Company Profile 🏢</h1>
          <p class="text-gray-600">Manage your company details visible to candidates.</p>
        </div>

        <!-- Loading -->
        <div *ngIf="loading()" class="flex justify-center py-20">
          <svg class="animate-spin w-10 h-10 text-emerald-600" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
          </svg>
        </div>

        <!-- No Company Yet - Create Form -->
        <div *ngIf="!loading() && !company()" class="bg-white rounded-2xl shadow-soft p-8 animate-fade-in">
          <div class="text-center mb-6">
            <div class="w-20 h-20 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span class="text-4xl">🏢</span>
            </div>
            <h2 class="text-2xl font-bold text-gray-900 mb-2">Create Your Company Profile</h2>
            <p class="text-gray-500">Set up your company to start posting jobs.</p>
          </div>

          <form (submit)="createCompany($event)" class="space-y-4">
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-2">Company Name *</label>
              <input type="text" [(ngModel)]="form.name" name="name" required
                placeholder="e.g., TechCorp Solutions"
                class="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 outline-none transition-all" />
            </div>

            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-2">Description</label>
              <textarea [(ngModel)]="form.description" name="description" rows="3"
                placeholder="Tell candidates about your company..."
                class="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 outline-none transition-all resize-none"></textarea>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2">Industry</label>
                <input type="text" [(ngModel)]="form.industry" name="industry" placeholder="Technology"
                  class="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 outline-none transition-all" />
              </div>
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2">Company Size</label>
                <select [(ngModel)]="form.company_size" name="company_size"
                  class="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 outline-none transition-all">
                  <option value="">Select size</option>
                  <option value="STARTUP">1-10 employees</option>
                  <option value="SMALL">11-50 employees</option>
                  <option value="MEDIUM">51-200 employees</option>
                  <option value="LARGE">201-1000 employees</option>
                  <option value="ENTERPRISE">1000+ employees</option>
                </select>
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2">Headquarters</label>
                <input type="text" [(ngModel)]="form.headquarters" name="headquarters" placeholder="Bangalore, India"
                  class="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 outline-none transition-all" />
              </div>
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2">Founded Year</label>
                <input type="number" [(ngModel)]="form.founded_year" name="founded_year" placeholder="2015"
                  class="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 outline-none transition-all" />
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2">Website</label>
                <input type="url" [(ngModel)]="form.website" name="website" placeholder="https://example.com"
                  class="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 outline-none transition-all" />
              </div>
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2">Contact Email</label>
                <input type="email" [(ngModel)]="form.contact_email" name="contact_email" placeholder="hr@example.com"
                  class="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 outline-none transition-all" />
              </div>
            </div>

            <div *ngIf="error()" class="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {{ error() }}
            </div>

            <button type="submit" [disabled]="saving() || !form.name"
              class="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all disabled:opacity-50">
              {{ saving() ? 'Creating...' : 'Create Company Profile' }}
            </button>
          </form>
        </div>

        <!-- Existing Company - Edit Form -->
        <ng-container *ngIf="!loading() && company() as c">
          <!-- Header Card -->
          <div class="bg-white rounded-2xl shadow-soft overflow-hidden mb-6 animate-fade-in">
            <div class="h-32 bg-gradient-to-br from-emerald-600 via-teal-700 to-cyan-700 relative">
              <div class="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
            </div>
            <div class="px-6 pb-6">
              <div class="flex items-start gap-4 -mt-12">
                <div class="w-24 h-24 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl shadow-lg flex items-center justify-center text-3xl font-bold text-white flex-shrink-0 border-4 border-white">
                  {{ getFirstChar(c.name) }}
                </div>
                <div class="flex-1 min-w-0 pt-12">
                  <div class="flex items-center gap-2 flex-wrap">
                    <h2 class="text-2xl font-bold text-gray-900">{{ c.name }}</h2>
                    <span *ngIf="c.is_verified" class="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full">
                      ✓ Verified
                    </span>
                    <span *ngIf="!c.is_verified" class="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-full">
                      ⚠️ Pending Verification
                    </span>
                  </div>
                  <p class="text-sm text-gray-500 mt-1">{{ c.industry || 'Industry not set' }} · {{ c.headquarters || 'Location not set' }}</p>
                </div>
              </div>

              <!-- Quick Stats -->
              <div class="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-100">
                <div>
                  <div class="text-2xl font-bold text-emerald-600">{{ c.active_job_count || 0 }}</div>
                  <div class="text-xs text-gray-500">Active Jobs</div>
                </div>
                <div>
                  <div class="text-2xl font-bold text-blue-600">{{ c.job_post_quota }}</div>
                  <div class="text-xs text-gray-500">Job Quota</div>
                </div>
                <div>
                  <div class="text-2xl font-bold text-purple-600">{{ c.subscription_tier }}</div>
                  <div class="text-xs text-gray-500">Plan</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Edit Form -->
          <div class="bg-white rounded-2xl shadow-soft p-6 animate-slide-up">
            <h3 class="text-xl font-bold text-gray-900 mb-4">✏️ Edit Company Details</h3>

            <form (submit)="updateCompany($event)" class="space-y-4">
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2">Company Name</label>
                <input type="text" [(ngModel)]="form.name" name="name" required
                  class="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 outline-none transition-all" />
              </div>

              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                <textarea [(ngModel)]="form.description" name="description" rows="4"
                  class="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 outline-none transition-all resize-none"></textarea>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-semibold text-gray-700 mb-2">Industry</label>
                  <input type="text" [(ngModel)]="form.industry" name="industry"
                    class="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 outline-none transition-all" />
                </div>
                <div>
                  <label class="block text-sm font-semibold text-gray-700 mb-2">Company Size</label>
                  <select [(ngModel)]="form.company_size" name="company_size"
                    class="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 outline-none transition-all">
                    <option value="STARTUP">1-10 employees</option>
                    <option value="SMALL">11-50 employees</option>
                    <option value="MEDIUM">51-200 employees</option>
                    <option value="LARGE">201-1000 employees</option>
                    <option value="ENTERPRISE">1000+ employees</option>
                  </select>
                </div>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-semibold text-gray-700 mb-2">Headquarters</label>
                  <input type="text" [(ngModel)]="form.headquarters" name="headquarters"
                    class="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 outline-none transition-all" />
                </div>
                <div>
                  <label class="block text-sm font-semibold text-gray-700 mb-2">Founded Year</label>
                  <input type="number" [(ngModel)]="form.founded_year" name="founded_year"
                    class="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 outline-none transition-all" />
                </div>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-semibold text-gray-700 mb-2">Website</label>
                  <input type="url" [(ngModel)]="form.website" name="website"
                    class="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 outline-none transition-all" />
                </div>
                <div>
                  <label class="block text-sm font-semibold text-gray-700 mb-2">Contact Email</label>
                  <input type="email" [(ngModel)]="form.contact_email" name="contact_email"
                    class="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 outline-none transition-all" />
                </div>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-semibold text-gray-700 mb-2">Contact Phone</label>
                  <input type="tel" [(ngModel)]="form.contact_phone" name="contact_phone"
                    class="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 outline-none transition-all" />
                </div>
                <div>
                  <label class="block text-sm font-semibold text-gray-700 mb-2">LinkedIn URL</label>
                  <input type="url" [(ngModel)]="form.linkedin_url" name="linkedin_url"
                    class="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 outline-none transition-all" />
                </div>
              </div>

              <div *ngIf="saveSuccess()" class="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700 font-semibold">
                ✅ Company profile updated successfully!
              </div>

              <div *ngIf="error()" class="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {{ error() }}
              </div>

              <button type="submit" [disabled]="saving()"
                class="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all disabled:opacity-50">
                {{ saving() ? 'Saving...' : 'Save Changes' }}
              </button>
            </form>
          </div>
        </ng-container>

      </div>
    </div>
  `
})
export class HrCompanyComponent implements OnInit {
  private companiesService = inject(CompaniesService);

  company = signal<Company | null>(null);
  loading = signal(true);
  saving = signal(false);
  saveSuccess = signal(false);
  error = signal<string | null>(null);

  form: any = {
    name: '',
    description: '',
    industry: '',
    company_size: '',
    headquarters: '',
    founded_year: null,
    website: '',
    contact_email: '',
    contact_phone: '',
    linkedin_url: '',
  };

  ngOnInit(): void {
    this.loadCompany();
  }

  loadCompany(): void {
    this.loading.set(true);
    this.companiesService.getMyCompany().subscribe({
      next: (c) => {
        this.company.set(c);
        this.populateForm(c);
        this.loading.set(false);
      },
      error: (err) => {
        // 404 = no company yet, which is fine
        this.company.set(null);
        this.loading.set(false);
      }
    });
  }

  populateForm(c: Company): void {
    this.form = {
      name: c.name || '',
      description: c.description || '',
      industry: c.industry || '',
      company_size: c.company_size || '',
      headquarters: c.headquarters || '',
      founded_year: c.founded_year || null,
      website: c.website || '',
      contact_email: c.contact_email || '',
      contact_phone: c.contact_phone || '',
      linkedin_url: c.linkedin_url || '',
    };
  }

  createCompany(event: Event): void {
    event.preventDefault();
    this.saving.set(true);
    this.error.set(null);

    // Clean up empty strings to null for optional fields
    const payload: any = { ...this.form };
    Object.keys(payload).forEach(key => {
      if (payload[key] === '' || payload[key] === null) delete payload[key];
    });

    this.companiesService.createCompany(payload).subscribe({
      next: (c) => {
        this.saving.set(false);
        this.company.set(c);
        this.saveSuccess.set(true);
        setTimeout(() => this.saveSuccess.set(false), 3000);
      },
      error: (err) => {
        this.saving.set(false);
        this.error.set(this.parseError(err));
      }
    });
  }

  updateCompany(event: Event): void {
    event.preventDefault();
    const c = this.company();
    if (!c) return;

    this.saving.set(true);
    this.error.set(null);
    this.saveSuccess.set(false);

    this.companiesService.updateCompany(c.slug, this.form).subscribe({
      next: (updated) => {
        this.saving.set(false);
        this.company.set(updated);
        this.saveSuccess.set(true);
        setTimeout(() => this.saveSuccess.set(false), 3000);
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
    for (const key of Object.keys(e)) {
      const v = e[key];
      if (Array.isArray(v)) return key + ': ' + v[0];
      return key + ': ' + v;
    }
    return 'Failed.';
  }

  getFirstChar(name: string | undefined): string {
    return name && name.length > 0 ? name[0].toUpperCase() : '?';
  }
}