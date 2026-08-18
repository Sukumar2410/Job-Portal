import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';

import { TopNavComponent } from '../../shared/top-nav/top-nav.component';
import { CompaniesService, CompanyFilters } from '../../core/services/companies.service';
import { Company, CompanyAdminDetails } from '../../core/models/company.model';

@Component({
  selector: 'app-admin-companies',
  standalone: true,
  imports: [CommonModule, FormsModule, TopNavComponent],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-slate-50 via-rose-50 to-red-50">
      <app-top-nav portalName="Admin Console"></app-top-nav>

      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        <div class="mb-8 animate-fade-in">
          <h1 class="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">Company Management 🏢</h1>
          <p class="text-gray-600">View, verify, and manage all companies on the platform.</p>
        </div>

        <!-- Stats -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <div class="bg-white rounded-xl p-4 shadow-soft">
            <div class="text-2xl font-bold text-gray-900">{{ totalCount() }}</div>
            <div class="text-xs text-gray-500">Total Companies</div>
          </div>
          <div class="bg-white rounded-xl p-4 shadow-soft">
            <div class="text-2xl font-bold text-blue-600">{{ verifiedCount() }}</div>
            <div class="text-xs text-gray-500">Verified</div>
          </div>
          <div class="bg-white rounded-xl p-4 shadow-soft">
            <div class="text-2xl font-bold text-amber-600">{{ unverifiedCount() }}</div>
            <div class="text-xs text-gray-500">Pending Verification</div>
          </div>
          <div class="bg-white rounded-xl p-4 shadow-soft">
            <div class="text-2xl font-bold text-emerald-600">{{ activeJobsCount() }}</div>
            <div class="text-xs text-gray-500">Total Active Jobs</div>
          </div>
        </div>

        <!-- Search + Filters -->
        <div class="bg-white rounded-2xl shadow-soft p-4 mb-6 animate-slide-up">
          <div class="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div class="md:col-span-2 relative">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                </svg>
              </div>
              <input type="text" [ngModel]="searchQuery()" (ngModelChange)="onSearch($event)"
                placeholder="Search by name, industry, headquarters..."
                class="w-full pl-10 pr-4 py-2 bg-gray-50 border-2 border-gray-100 rounded-lg text-sm focus:bg-white focus:border-rose-500 outline-none" />
            </div>
            <select [ngModel]="sizeFilter()" (ngModelChange)="onSizeChange($event)"
              class="px-3 py-2 bg-gray-50 border-2 border-gray-100 rounded-lg text-sm focus:bg-white focus:border-rose-500 outline-none">
              <option value="">All Sizes</option>
              <option value="STARTUP">1-10 employees</option>
              <option value="SMALL">11-50 employees</option>
              <option value="MEDIUM">51-200 employees</option>
              <option value="LARGE">201-1000 employees</option>
              <option value="ENTERPRISE">1000+ employees</option>
            </select>
            <select [ngModel]="verifiedFilter()" (ngModelChange)="onVerifiedChange($event)"
              class="px-3 py-2 bg-gray-50 border-2 border-gray-100 rounded-lg text-sm focus:bg-white focus:border-rose-500 outline-none">
              <option value="">All Companies</option>
              <option value="true">Verified Only</option>
              <option value="false">Unverified Only</option>
            </select>
          </div>
        </div>

        <!-- Loading -->
        <div *ngIf="loading()" class="flex justify-center py-20">
          <svg class="animate-spin w-10 h-10 text-rose-600" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
          </svg>
        </div>

        <!-- Empty -->
        <div *ngIf="!loading() && companies().length === 0"
          class="bg-white rounded-2xl shadow-soft p-12 text-center animate-fade-in">
          <div class="w-20 h-20 bg-gradient-to-br from-rose-100 to-red-100 rounded-3xl flex items-center justify-center mx-auto mb-4">
            <span class="text-4xl">🏢</span>
          </div>
          <h3 class="text-lg font-bold text-gray-900 mb-2">No companies found</h3>
          <p class="text-gray-500 mb-4">Try clearing your filters.</p>
          <button *ngIf="hasActiveFilters()" (click)="clearFilters()"
            class="px-6 py-2.5 bg-gradient-to-r from-rose-600 to-red-600 text-white text-sm font-semibold rounded-xl shadow-md hover:shadow-lg transition-all">
            Clear all filters
          </button>
        </div>

        <!-- Companies Grid -->
        <div *ngIf="!loading() && companies().length > 0"
          class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div *ngFor="let comp of companies(); let i = index"
            class="bg-white rounded-2xl shadow-soft hover:shadow-lg transition-all animate-slide-up cursor-pointer p-5"
            [style.animation-delay]="(i * 0.03) + 's'"
            (click)="openCompany(comp)">

            <div class="flex items-start justify-between mb-3">
              <div class="flex items-center gap-3 min-w-0 flex-1">
                <div class="w-12 h-12 bg-gradient-to-br from-rose-500 to-red-600 rounded-xl flex items-center justify-center text-white font-bold flex-shrink-0">
                  {{ getFirstChar(comp.name) }}
                </div>
                <div class="min-w-0">
                  <div class="font-bold text-gray-900 truncate">{{ comp.name }}</div>
                  <div class="text-xs text-gray-500 truncate">{{ comp.industry || 'No industry' }}</div>
                </div>
              </div>
              <span *ngIf="comp.is_verified" class="inline-flex items-center gap-0.5 px-2 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full flex-shrink-0">
                ✓ Verified
              </span>
              <span *ngIf="!comp.is_verified" class="inline-flex items-center gap-0.5 px-2 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-full flex-shrink-0">
                ⚠ Pending
              </span>
            </div>

            <div class="text-xs text-gray-600 space-y-1 mb-3">
              <div *ngIf="comp.headquarters">📍 {{ comp.headquarters }}</div>
              <div *ngIf="comp.company_size">🏢 {{ formatSize(comp.company_size) }}</div>
              <div *ngIf="comp.founded_year">📅 Founded {{ comp.founded_year }}</div>
            </div>

            <div class="pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
              <span class="text-gray-500">
                <strong class="text-rose-600">{{ comp.active_job_count || 0 }}</strong> active jobs
              </span>
              <span class="text-gray-400">{{ formatDate(comp.created_at) }}</span>
            </div>
          </div>
        </div>

      </div>

      <!-- Company Detail Modal -->
      <div *ngIf="selectedCompany() as c"
        class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
        (click)="closeCompany()">
        <div class="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-scale-in" (click)="$event.stopPropagation()">

          <!-- Header -->
          <div class="p-6 border-b border-gray-100">
            <div class="flex items-start justify-between mb-4">
              <div class="flex items-center gap-4">
                <div class="w-16 h-16 bg-gradient-to-br from-rose-500 to-red-600 rounded-2xl flex items-center justify-center text-white text-xl font-bold shadow-md">
                  {{ getFirstChar(c.name) }}
                </div>
                <div>
                  <h2 class="text-2xl font-bold text-gray-900">{{ c.name }}</h2>
                  <p class="text-sm text-gray-500">{{ c.industry || 'No industry' }}</p>
                </div>
              </div>
              <button (click)="closeCompany()" class="text-gray-400 hover:text-gray-600">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>

            <div class="flex flex-wrap gap-2">
              <span *ngIf="c.is_verified" class="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full">
                ✓ Verified
              </span>
              <span *ngIf="!c.is_verified" class="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-full">
                ⚠ Pending Verification
              </span>
              <span *ngIf="c.is_active" class="inline-flex items-center gap-1 px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full">
                <span class="w-2 h-2 bg-emerald-500 rounded-full"></span> Active
              </span>
              <span class="inline-flex items-center px-2 py-1 bg-purple-100 text-purple-700 text-xs font-bold rounded-full">
                {{ c.subscription_tier || 'FREE' }}
              </span>
            </div>
          </div>

          <!-- Details -->
          <div class="p-6 space-y-4">
            <div *ngIf="c.description">
              <div class="text-xs font-semibold text-gray-500 mb-1">Description</div>
              <p class="text-sm text-gray-700">{{ c.description }}</p>
            </div>

            <div class="grid grid-cols-2 gap-3 text-sm">
              <div class="p-3 bg-gray-50 rounded-lg">
                <div class="text-xs text-gray-500">Size</div>
                <div class="font-semibold text-gray-900">{{ formatSize(c.company_size) || 'N/A' }}</div>
              </div>
              <div class="p-3 bg-gray-50 rounded-lg">
                <div class="text-xs text-gray-500">Headquarters</div>
                <div class="font-semibold text-gray-900">{{ c.headquarters || 'N/A' }}</div>
              </div>
              <div class="p-3 bg-gray-50 rounded-lg">
                <div class="text-xs text-gray-500">Founded</div>
                <div class="font-semibold text-gray-900">{{ c.founded_year || 'N/A' }}</div>
              </div>
              <div class="p-3 bg-gray-50 rounded-lg">
                <div class="text-xs text-gray-500">Active Jobs</div>
                <div class="font-semibold text-rose-600">{{ c.active_job_count || 0 }}</div>
              </div>
              <div class="p-3 bg-gray-50 rounded-lg">
                <div class="text-xs text-gray-500">Job Quota</div>
                <div class="font-semibold text-gray-900">{{ c.job_post_quota }}</div>
              </div>
              <div class="p-3 bg-gray-50 rounded-lg">
                <div class="text-xs text-gray-500">Joined</div>
                <div class="font-semibold text-gray-900">{{ formatDate(c.created_at) }}</div>
              </div>
            </div>

            <div *ngIf="c.website || c.contact_email || c.contact_phone">
              <div class="text-xs font-semibold text-gray-500 mb-2">Contact</div>
              <div class="space-y-1 text-sm">
                <div *ngIf="c.website">
                  🌐 <a [href]="c.website" target="_blank" class="text-blue-600 hover:underline">{{ c.website }}</a>
                </div>
                <div *ngIf="c.contact_email">📧 {{ c.contact_email }}</div>
                <div *ngIf="c.contact_phone">📞 {{ c.contact_phone }}</div>
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div class="p-6 border-t border-gray-100 space-y-2">
            <div *ngIf="actionSuccess()" class="p-2 bg-green-50 text-green-700 text-sm rounded-lg font-semibold text-center">
              ✅ {{ actionSuccess() }}
            </div>
            <div *ngIf="actionError()" class="p-2 bg-red-50 text-red-700 text-sm rounded-lg font-semibold text-center">
              ❌ {{ actionError() }}
            </div>

            <div class="grid grid-cols-2 gap-2">
              <button *ngIf="!c.is_verified" (click)="verifyCompany(c)" [disabled]="acting()"
                class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg disabled:opacity-50 transition-all">
                ✓ Verify Company
              </button>
              <button *ngIf="c.is_verified" (click)="unverifyCompany(c)" [disabled]="acting()"
                class="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold rounded-lg disabled:opacity-50 transition-all">
                ⚠ Revoke Verification
              </button>
              <button (click)="closeCompany()"
                class="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold rounded-lg transition-all">
                Close
              </button>
            </div>
          </div>
        </div>
      </div>

    </div>
  `
})
export class AdminCompaniesComponent implements OnInit {
  private companiesService = inject(CompaniesService);

  companies = signal<Company[]>([]);
  loading = signal(true);
  totalCount = signal(0);

  searchQuery = signal('');
  sizeFilter = signal('');
  verifiedFilter = signal('');

  selectedCompany = signal<Company | null>(null);
  selectedCompanyDetails = signal<CompanyAdminDetails | null>(null);
  acting = signal(false);
  actionSuccess = signal<string | null>(null);
  actionError = signal<string | null>(null);

  private searchSubject = new Subject<string>();

  verifiedCount = () => this.companies().filter(c => c.is_verified).length;
  unverifiedCount = () => this.companies().filter(c => !c.is_verified).length;
  activeJobsCount = () => this.companies().reduce((sum, c) => sum + (c.active_job_count || 0), 0);

  ngOnInit(): void {
    this.searchSubject.pipe(debounceTime(400), distinctUntilChanged()).subscribe(() => this.load());
    this.load();
  }

  load(): void {
    this.loading.set(true);
    const filters: CompanyFilters = { page: 1 };
    if (this.searchQuery()) filters.search = this.searchQuery();
    if (this.sizeFilter()) filters.company_size = this.sizeFilter();
    if (this.verifiedFilter()) filters.is_verified = this.verifiedFilter();

    this.companiesService.listCompanies(filters).subscribe({
      next: (res) => {
        this.companies.set(res.results || []);
        this.totalCount.set(res.count || 0);
        this.loading.set(false);
      },
      error: () => {
        this.companies.set([]);
        this.loading.set(false);
      }
    });
  }

  onSearch(value: string): void {
    this.searchQuery.set(value);
    this.searchSubject.next(value);
  }

  onSizeChange(value: string): void {
    this.sizeFilter.set(value);
    this.load();
  }

  onVerifiedChange(value: string): void {
    this.verifiedFilter.set(value);
    this.load();
  }

  hasActiveFilters(): boolean {
    return !!(this.searchQuery() || this.sizeFilter() || this.verifiedFilter());
  }

  clearFilters(): void {
    this.searchQuery.set('');
    this.sizeFilter.set('');
    this.verifiedFilter.set('');
    this.load();
  }

  openCompany(comp: Company): void {

    this.actionSuccess.set(null);
    this.actionError.set(null);

    // Show basic information immediately
    this.selectedCompany.set(comp);

    // Clear previous detailed information
    this.selectedCompanyDetails.set(null);

    // Load complete admin information
    this.companiesService
      .getCompanyAdminDetails(comp.slug)
      .subscribe({

        next: (details) => {

          this.selectedCompanyDetails.set(
            details
          );

        },

        error: (error) => {

          console.error(
            'Failed to load company details:',
            error
          );

          this.actionError.set(
            'Unable to load complete company details.'
          );

        }

      });
  }

  closeCompany(): void {

    this.selectedCompany.set(null);

    this.selectedCompanyDetails.set(null);

    this.actionSuccess.set(null);
    this.actionError.set(null);
  }
  verifyCompany(comp: Company): void {
    this.acting.set(true);
    this.companiesService.verifyCompany(comp.slug).subscribe({
      next: (res: any) => {
        this.acting.set(false);
        this.actionSuccess.set(res.message || 'Company verified.');
        this.selectedCompany.set({ ...comp, is_verified: true });
        this.load();
      },
      error: (err) => {
        this.acting.set(false);
        this.actionError.set(err.error?.detail || 'Verification failed.');
      }
    });
  }

  unverifyCompany(comp: Company): void {
    if (!confirm(`Revoke verification for "${comp.name}"?`)) return;
    this.acting.set(true);
    this.companiesService.unverifyCompany(comp.slug).subscribe({
      next: (res: any) => {
        this.acting.set(false);
        this.actionSuccess.set(res.message || 'Verification revoked.');
        this.selectedCompany.set({ ...comp, is_verified: false });
        this.load();
      },
      error: (err) => {
        this.acting.set(false);
        this.actionError.set(err.error?.detail || 'Failed to revoke.');
      }
    });
  }

  getFirstChar(name: string | undefined): string {
    return name && name.length > 0 ? name[0].toUpperCase() : '?';
  }

  formatSize(size: string | undefined): string {
    const map: Record<string, string> = {
      STARTUP: '1-10 employees',
      SMALL: '11-50 employees',
      MEDIUM: '51-200 employees',
      LARGE: '201-1000 employees',
      ENTERPRISE: '1000+ employees',
    };
    return map[size || ''] || '';
  }

  formatDate(dateStr: string | undefined): string {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }
}