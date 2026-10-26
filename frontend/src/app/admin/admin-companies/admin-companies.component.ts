import {
  Component,
  OnInit,
  inject,
  signal
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import {
  Subject,
  debounceTime,
  distinctUntilChanged
} from 'rxjs';

import { HttpErrorResponse } from '@angular/common/http';

import { TopNavComponent } from '../../shared/top-nav/top-nav.component';

import {
  CompaniesService,
  CompanyFilters
} from '../../core/services/companies.service';

import {
  Company,
  CompanyAdminDetails
} from '../../core/models/company.model';


@Component({
  selector: 'app-admin-companies',

  standalone: true,

  imports: [
    CommonModule,
    FormsModule,
    TopNavComponent
  ],

  template: `
    <div class="min-h-screen bg-gradient-to-br from-slate-50 via-rose-50 to-red-50">

      <app-top-nav portalName="Admin Console"></app-top-nav>

      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        <!-- =====================================================
             PAGE HEADER
             ===================================================== -->

        <div class="mb-8 animate-fade-in">

          <h1 class="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
            Company Management 🏢
          </h1>

          <p class="text-gray-600">
            View, verify, and manage all companies on the platform.
          </p>

        </div>


        <!-- =====================================================
             STATS
             ===================================================== -->

        <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">

          <div class="bg-white rounded-xl p-4 shadow-soft">

            <div class="text-2xl font-bold text-gray-900">
              {{ totalCount() }}
            </div>

            <div class="text-xs text-gray-500">
              Total Companies
            </div>

          </div>


          <div class="bg-white rounded-xl p-4 shadow-soft">

            <div class="text-2xl font-bold text-blue-600">
              {{ verifiedCount() }}
            </div>

            <div class="text-xs text-gray-500">
              Verified
            </div>

          </div>


          <div class="bg-white rounded-xl p-4 shadow-soft">

            <div class="text-2xl font-bold text-amber-600">
              {{ unverifiedCount() }}
            </div>

            <div class="text-xs text-gray-500">
              Pending Verification
            </div>

          </div>


          <div class="bg-white rounded-xl p-4 shadow-soft">

            <div class="text-2xl font-bold text-emerald-600">
              {{ activeJobsCount() }}
            </div>

            <div class="text-xs text-gray-500">
              Total Active Jobs
            </div>

          </div>

        </div>


        <!-- =====================================================
             SEARCH + FILTERS
             ===================================================== -->

        <div class="bg-white rounded-2xl shadow-soft p-4 mb-6 animate-slide-up">

          <div class="grid grid-cols-1 md:grid-cols-4 gap-3">

            <!-- Search -->

            <div class="md:col-span-2 relative">

              <div
                class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"
              >

                <svg
                  class="w-4 h-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >

                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />

                </svg>

              </div>

              <input
                type="text"
                [ngModel]="searchQuery()"
                (ngModelChange)="onSearch($event)"
                placeholder="Search by name, industry, headquarters..."
                class="w-full pl-10 pr-4 py-2 bg-gray-50 border-2 border-gray-100 rounded-lg text-sm focus:bg-white focus:border-rose-500 outline-none"
              />

            </div>


            <!-- Company Size -->

            <select
              [ngModel]="sizeFilter()"
              (ngModelChange)="onSizeChange($event)"
              class="px-3 py-2 bg-gray-50 border-2 border-gray-100 rounded-lg text-sm focus:bg-white focus:border-rose-500 outline-none"
            >

              <option value="">
                All Sizes
              </option>

              <option value="STARTUP">
                1-10 employees
              </option>

              <option value="SMALL">
                11-50 employees
              </option>

              <option value="MEDIUM">
                51-200 employees
              </option>

              <option value="LARGE">
                201-1000 employees
              </option>

              <option value="ENTERPRISE">
                1000+ employees
              </option>

            </select>


            <!-- Verification -->

            <select
              [ngModel]="verifiedFilter()"
              (ngModelChange)="onVerifiedChange($event)"
              class="px-3 py-2 bg-gray-50 border-2 border-gray-100 rounded-lg text-sm focus:bg-white focus:border-rose-500 outline-none"
            >

              <option value="">
                All Companies
              </option>

              <option value="true">
                Verified Only
              </option>

              <option value="false">
                Unverified Only
              </option>

            </select>

          </div>

        </div>


        <!-- =====================================================
             LOADING
             ===================================================== -->

        <div
          *ngIf="loading()"
          class="flex justify-center py-20"
        >

          <svg
            class="animate-spin w-10 h-10 text-rose-600"
            fill="none"
            viewBox="0 0 24 24"
          >

            <circle
              class="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              stroke-width="4"
            ></circle>

            <path
              class="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
            ></path>

          </svg>

        </div>


        <!-- =====================================================
             EMPTY STATE
             ===================================================== -->

        <div
          *ngIf="!loading() && companies().length === 0"
          class="bg-white rounded-2xl shadow-soft p-12 text-center animate-fade-in"
        >

          <div
            class="w-20 h-20 bg-gradient-to-br from-rose-100 to-red-100 rounded-3xl flex items-center justify-center mx-auto mb-4"
          >

            <span class="text-4xl">
              🏢
            </span>

          </div>

          <h3 class="text-lg font-bold text-gray-900 mb-2">
            No companies found
          </h3>

          <p class="text-gray-500 mb-4">
            Try clearing your filters.
          </p>

          <button
            *ngIf="hasActiveFilters()"
            (click)="clearFilters()"
            class="px-6 py-2.5 bg-gradient-to-r from-rose-600 to-red-600 text-white text-sm font-semibold rounded-xl shadow-md hover:shadow-lg transition-all"
          >
            Clear all filters
          </button>

        </div>


        <!-- =====================================================
             COMPANIES GRID
             ===================================================== -->

        <div
          *ngIf="!loading() && companies().length > 0"
          class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        >

          <div
            *ngFor="let comp of companies(); let i = index"
            class="bg-white rounded-2xl shadow-soft hover:shadow-lg transition-all animate-slide-up cursor-pointer p-5"
            [style.animation-delay]="(i * 0.03) + 's'"
            (click)="openCompany(comp)"
          >

            <div class="flex items-start justify-between mb-3">

              <div class="flex items-center gap-3 min-w-0 flex-1">

                <div
                  class="w-12 h-12 bg-gradient-to-br from-rose-500 to-red-600 rounded-xl flex items-center justify-center text-white font-bold flex-shrink-0"
                >
                  {{ getFirstChar(comp.name) }}
                </div>

                <div class="min-w-0">

                  <div class="font-bold text-gray-900 truncate">
                    {{ comp.name }}
                  </div>

                  <div class="text-xs text-gray-500 truncate">
                    {{ comp.industry || 'No industry' }}
                  </div>

                </div>

              </div>


              <span
                *ngIf="comp.is_verified"
                class="inline-flex items-center gap-0.5 px-2 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full flex-shrink-0"
              >
                ✓ Verified
              </span>

              <span
                *ngIf="!comp.is_verified"
                class="inline-flex items-center gap-0.5 px-2 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-full flex-shrink-0"
              >
                ⚠ Pending
              </span>

            </div>


            <div class="text-xs text-gray-600 space-y-1 mb-3">

              <div *ngIf="comp.headquarters">
                📍 {{ comp.headquarters }}
              </div>

              <div *ngIf="comp.company_size">
                🏢 {{ formatSize(comp.company_size) }}
              </div>

              <div *ngIf="comp.founded_year">
                📅 Founded {{ comp.founded_year }}
              </div>

            </div>


            <div
              class="pt-3 border-t border-gray-100 flex items-center justify-between text-xs"
            >

              <span class="text-gray-500">

                <strong class="text-rose-600">
                  {{ comp.active_job_count || 0 }}
                </strong>

                active jobs

              </span>

              <span class="text-gray-400">
                {{ formatDate(comp.created_at) }}
              </span>

            </div>

          </div>

        </div>

      </div>


      <!-- =====================================================
           COMPANY DETAIL MODAL
           ===================================================== -->

      <div
        *ngIf="selectedCompany() as selected"
        class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
        (click)="closeCompany()"
      >

        <div
          class="bg-white rounded-3xl shadow-2xl max-w-5xl w-full max-h-[92vh] overflow-y-auto animate-scale-in"
          (click)="$event.stopPropagation()"
        >

          <!-- HEADER -->

          <div class="p-6 border-b border-gray-100">

            <div class="flex items-start justify-between">

              <div class="flex items-center gap-4 min-w-0">

                <div
                  class="w-16 h-16 bg-gradient-to-br from-rose-500 to-red-600 rounded-2xl flex items-center justify-center text-white text-xl font-bold shadow-md overflow-hidden flex-shrink-0"
                >

                  <img
                    *ngIf="selected.logo"
                    [src]="selected.logo"
                    [alt]="selected.name"
                    class="w-full h-full object-cover"
                  />

                  <span *ngIf="!selected.logo">
                    {{ getFirstChar(selected.name) }}
                  </span>

                </div>


                <div class="min-w-0">

                  <h2 class="text-2xl font-bold text-gray-900 truncate">
                    {{ selected.name }}
                  </h2>

                  <p class="text-sm text-gray-500">
                    {{ selected.industry || 'No industry' }}
                  </p>

                  <p class="text-xs text-gray-400 mt-1">
                    Company ID: #{{ selected.id }}
                  </p>

                </div>

              </div>


              <button
                (click)="closeCompany()"
                class="text-gray-400 hover:text-gray-700 transition-colors flex-shrink-0"
              >

                <svg
                  class="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >

                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M6 18L18 6M6 6l12 12"
                  />

                </svg>

              </button>

            </div>


            <div class="flex flex-wrap gap-2 mt-5">

              <span
                *ngIf="selected.is_verified"
                class="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full"
              >
                ✓ Verified
              </span>

              <span
                *ngIf="!selected.is_verified"
                class="px-3 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-full"
              >
                ⚠ Pending Verification
              </span>

              <span
                *ngIf="selected.is_active"
                class="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full"
              >
                ● Active
              </span>

              <span
                *ngIf="!selected.is_active"
                class="px-3 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full"
              >
                ● Inactive
              </span>

              <span
                class="px-3 py-1 bg-purple-100 text-purple-700 text-xs font-bold rounded-full"
              >
                {{ selected.subscription_tier || 'FREE' }}
              </span>

            </div>

          </div>


          <!-- DETAIL LOADING -->

          <div
            *ngIf="detailLoading()"
            class="p-12 flex flex-col items-center justify-center"
          >

            <svg
              class="animate-spin w-10 h-10 text-rose-600 mb-4"
              fill="none"
              viewBox="0 0 24 24"
            >

              <circle
                class="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="4"
              ></circle>

              <path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
              ></path>

            </svg>

            <p class="text-sm text-gray-500">
              Loading complete company details...
            </p>

          </div>


          <!-- COMPLETE DETAILS -->

          <div
            *ngIf="!detailLoading() && selectedCompanyDetails() as c"
            class="p-6 space-y-7"
          >

            <!-- COMPANY OVERVIEW -->

            <section>

              <h3 class="text-lg font-bold text-gray-900 mb-4">
                🏢 Company Overview
              </h3>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">

                <div class="p-4 bg-gray-50 rounded-xl">

                  <div class="text-xs text-gray-500 mb-1">
                    Industry
                  </div>

                  <div class="font-semibold text-gray-900">
                    {{ c.industry || 'N/A' }}
                  </div>

                </div>


                <div class="p-4 bg-gray-50 rounded-xl">

                  <div class="text-xs text-gray-500 mb-1">
                    Company Size
                  </div>

                  <div class="font-semibold text-gray-900">
                    {{ formatSize(c.company_size) || 'N/A' }}
                  </div>

                </div>


                <div class="p-4 bg-gray-50 rounded-xl">

                  <div class="text-xs text-gray-500 mb-1">
                    Headquarters
                  </div>

                  <div class="font-semibold text-gray-900">
                    {{ c.headquarters || 'N/A' }}
                  </div>

                </div>


                <div class="p-4 bg-gray-50 rounded-xl">

                  <div class="text-xs text-gray-500 mb-1">
                    Founded
                  </div>

                  <div class="font-semibold text-gray-900">
                    {{ c.founded_year || 'N/A' }}
                  </div>

                </div>

              </div>


              <div
                *ngIf="c.description"
                class="mt-4 p-4 bg-gray-50 rounded-xl"
              >

                <div class="text-xs text-gray-500 mb-2">
                  Company Description
                </div>

                <p class="text-sm text-gray-700 leading-relaxed">
                  {{ c.description }}
                </p>

              </div>

            </section>


            <!-- PLATFORM STATISTICS -->

            <section>

              <h3 class="text-lg font-bold text-gray-900 mb-4">
                📊 Platform Statistics
              </h3>

              <div class="grid grid-cols-2 md:grid-cols-4 gap-3">

                <div class="p-4 bg-blue-50 rounded-xl">

                  <div class="text-2xl font-bold text-blue-600">
                    {{ c.total_job_count || 0 }}
                  </div>

                  <div class="text-xs text-gray-600">
                    Total Jobs
                  </div>

                </div>


                <div class="p-4 bg-emerald-50 rounded-xl">

                  <div class="text-2xl font-bold text-emerald-600">
                    {{ c.active_job_count || 0 }}
                  </div>

                  <div class="text-xs text-gray-600">
                    Active Jobs
                  </div>

                </div>


                <div class="p-4 bg-gray-100 rounded-xl">

                  <div class="text-2xl font-bold text-gray-700">
                    {{ c.closed_job_count || 0 }}
                  </div>

                  <div class="text-xs text-gray-600">
                    Closed Jobs
                  </div>

                </div>


                <div class="p-4 bg-purple-50 rounded-xl">

                  <div class="text-2xl font-bold text-purple-600">
                    {{ c.unique_candidate_count || 0 }}
                  </div>

                  <div class="text-xs text-gray-600">
                    Unique Candidates
                  </div>

                </div>

              </div>

            </section>


            <!-- APPLICATION STATISTICS -->

            <section>

              <h3 class="text-lg font-bold text-gray-900 mb-4">
                👥 Candidate & Application Statistics
              </h3>

              <div class="grid grid-cols-2 md:grid-cols-4 gap-3">

                <div class="p-4 bg-rose-50 rounded-xl">

                  <div class="text-2xl font-bold text-rose-600">
                    {{ c.total_application_count || 0 }}
                  </div>

                  <div class="text-xs text-gray-600">
                    Total Applications
                  </div>

                </div>


                <div class="p-4 bg-sky-50 rounded-xl">

                  <div class="text-2xl font-bold text-sky-600">
                    {{ c.applied_count || 0 }}
                  </div>

                  <div class="text-xs text-gray-600">
                    Applied
                  </div>

                </div>


                <div class="p-4 bg-amber-50 rounded-xl">

                  <div class="text-2xl font-bold text-amber-600">
                    {{ c.under_review_count || 0 }}
                  </div>

                  <div class="text-xs text-gray-600">
                    Under Review
                  </div>

                </div>


                <div class="p-4 bg-indigo-50 rounded-xl">

                  <div class="text-2xl font-bold text-indigo-600">
                    {{ c.shortlisted_count || 0 }}
                  </div>

                  <div class="text-xs text-gray-600">
                    Shortlisted
                  </div>

                </div>


                <div class="p-4 bg-violet-50 rounded-xl">

                  <div class="text-2xl font-bold text-violet-600">
                    {{ c.interview_count || 0 }}
                  </div>

                  <div class="text-xs text-gray-600">
                    Interviews
                  </div>

                </div>


                <div class="p-4 bg-orange-50 rounded-xl">

                  <div class="text-2xl font-bold text-orange-600">
                    {{ c.offered_count || 0 }}
                  </div>

                  <div class="text-xs text-gray-600">
                    Offers
                  </div>

                </div>


                <div class="p-4 bg-green-50 rounded-xl">

                  <div class="text-2xl font-bold text-green-600">
                    {{ c.hired_count || 0 }}
                  </div>

                  <div class="text-xs text-gray-600">
                    Hired
                  </div>

                </div>


                <div class="p-4 bg-red-50 rounded-xl">

                  <div class="text-2xl font-bold text-red-600">
                    {{ c.rejected_count || 0 }}
                  </div>

                  <div class="text-xs text-gray-600">
                    Rejected
                  </div>

                </div>

              </div>

            </section>


            <!-- JOB QUOTA -->

            <section>

              <h3 class="text-lg font-bold text-gray-900 mb-4">
                💼 Job Posting Quota
              </h3>

              <div class="grid grid-cols-1 md:grid-cols-3 gap-4">

                <div class="p-4 bg-gray-50 rounded-xl">

                  <div class="text-xs text-gray-500">
                    Job Quota
                  </div>

                  <div class="text-xl font-bold text-gray-900 mt-1">
                    {{ c.job_post_quota }}
                  </div>

                </div>


                <div class="p-4 bg-rose-50 rounded-xl">

                  <div class="text-xs text-gray-500">
                    Jobs Used
                  </div>

                  <div class="text-xl font-bold text-rose-600 mt-1">
                    {{ c.jobs_used }}
                  </div>

                </div>


                <div class="p-4 bg-emerald-50 rounded-xl">

                  <div class="text-xs text-gray-500">
                    Jobs Remaining
                  </div>

                  <div class="text-xl font-bold text-emerald-600 mt-1">
                    {{ c.jobs_remaining }}
                  </div>

                </div>

              </div>

            </section>


            <!-- RECENT JOBS -->

            <section>

              <div class="flex items-center justify-between mb-4">

                <h3 class="text-lg font-bold text-gray-900">
                  📋 Recent Job Postings
                </h3>

                <span class="text-xs text-gray-500">
                  Showing {{ c.recent_jobs?.length || 0 }} recent jobs
                </span>

              </div>


              <div
                *ngIf="c.recent_jobs && c.recent_jobs.length > 0"
                class="space-y-3"
              >

                <div
                  *ngFor="let job of c.recent_jobs"
                  class="p-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition-all"
                >

                  <div class="flex items-start justify-between gap-4">

                    <div class="min-w-0">

                      <h4 class="font-bold text-gray-900">
                        {{ job.title }}
                      </h4>

                      <div class="flex flex-wrap gap-2 mt-2">

                        <span class="text-xs text-gray-600">
                          📍 {{ job.location }}
                        </span>

                        <span class="text-xs text-gray-600">
                          💼 {{ job.job_type }}
                        </span>

                        <span class="text-xs text-gray-600">
                          🏠 {{ job.work_mode }}
                        </span>

                      </div>

                      <div class="text-xs text-gray-500 mt-2">
                        {{ job.experience_level }}
                      </div>

                    </div>


                    <div class="text-right flex-shrink-0">

                      <span
                        class="inline-flex px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full"
                      >
                        {{ job.status_display }}
                      </span>

                      <div class="text-xs text-gray-500 mt-2">
                        👁 {{ job.views_count }} views
                      </div>

                      <div class="text-xs text-gray-500">
                        👥 {{ job.applications_count }} applications
                      </div>

                    </div>

                  </div>

                </div>

              </div>


              <div
                *ngIf="!c.recent_jobs || c.recent_jobs.length === 0"
                class="p-6 bg-gray-50 rounded-xl text-center text-sm text-gray-500"
              >
                No recent job postings found.
              </div>

            </section>


            <!-- CONTACT INFORMATION -->

            <section>

              <h3 class="text-lg font-bold text-gray-900 mb-4">
                📞 Contact Information
              </h3>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-3">

                <div class="p-4 bg-gray-50 rounded-xl">

                  <div class="text-xs text-gray-500">
                    Email
                  </div>

                  <div class="font-semibold text-gray-900 mt-1 break-all">
                    {{ c.contact_email || 'N/A' }}
                  </div>

                </div>


                <div class="p-4 bg-gray-50 rounded-xl">

                  <div class="text-xs text-gray-500">
                    Phone
                  </div>

                  <div class="font-semibold text-gray-900 mt-1">
                    {{ c.contact_phone || 'N/A' }}
                  </div>

                </div>

              </div>


              <div class="flex flex-wrap gap-3 mt-3">

                <a
                  *ngIf="c.website"
                  [href]="c.website"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-semibold hover:bg-blue-100"
                >
                  🌐 Website
                </a>


                <a
                  *ngIf="c.linkedin_url"
                  [href]="c.linkedin_url"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-semibold hover:bg-blue-100"
                >
                  LinkedIn
                </a>


                <a
                  *ngIf="c.twitter_url"
                  [href]="c.twitter_url"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-200"
                >
                  Twitter
                </a>

              </div>

            </section>


            <!-- PLATFORM INFORMATION -->

            <section>

              <h3 class="text-lg font-bold text-gray-900 mb-4">
                ⚙️ Platform Information
              </h3>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-3">

                <div class="p-4 bg-gray-50 rounded-xl">

                  <div class="text-xs text-gray-500">
                    Subscription
                  </div>

                  <div class="font-semibold text-gray-900 mt-1">
                    {{ c.subscription_tier || 'FREE' }}
                  </div>

                </div>


                <div class="p-4 bg-gray-50 rounded-xl">

                  <div class="text-xs text-gray-500">
                    Company Slug
                  </div>

                  <div class="font-semibold text-gray-900 mt-1 break-all">
                    {{ c.slug }}
                  </div>

                </div>


                <div class="p-4 bg-gray-50 rounded-xl">

                  <div class="text-xs text-gray-500">
                    Registered
                  </div>

                  <div class="font-semibold text-gray-900 mt-1">
                    {{ formatDate(c.created_at) }}
                  </div>

                </div>


                <div class="p-4 bg-gray-50 rounded-xl">

                  <div class="text-xs text-gray-500">
                    Last Updated
                  </div>

                  <div class="font-semibold text-gray-900 mt-1">
                    {{ formatDate(c.updated_at) }}
                  </div>

                </div>

              </div>

            </section>

          </div>


          <!-- ACTIONS -->

          <div class="p-6 border-t border-gray-100">

            <div
              *ngIf="actionSuccess()"
              class="p-3 bg-green-50 text-green-700 text-sm rounded-lg font-semibold text-center mb-3"
            >
              ✅ {{ actionSuccess() }}
            </div>


            <div
              *ngIf="actionError()"
              class="p-3 bg-red-50 text-red-700 text-sm rounded-lg font-semibold text-center mb-3"
            >
              ❌ {{ actionError() }}
            </div>


            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">

              <button
                *ngIf="!selected.is_verified"
                (click)="verifyCompany(selected)"
                [disabled]="acting()"
                class="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl disabled:opacity-50 transition-all"
              >
                ✓ Verify Company
              </button>


              <button
                *ngIf="selected.is_verified"
                (click)="unverifyCompany(selected)"
                [disabled]="acting()"
                class="px-4 py-3 bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold rounded-xl disabled:opacity-50 transition-all"
              >
                ⚠ Revoke Verification
              </button>


              <button
                (click)="closeCompany()"
                class="px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold rounded-xl transition-all"
              >
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

  // ==========================================================
  // Company List
  // ==========================================================

  companies = signal<Company[]>([]);

  loading = signal(true);

  totalCount = signal(0);


  // ==========================================================
  // Filters
  // ==========================================================

  searchQuery = signal('');

  sizeFilter = signal('');

  verifiedFilter = signal('');


  // ==========================================================
  // Company Details
  // ==========================================================

  selectedCompany =
    signal<Company | null>(null);

  selectedCompanyDetails =
    signal<CompanyAdminDetails | null>(null);

  detailLoading =
    signal(false);


  // ==========================================================
  // Actions
  // ==========================================================

  acting =
    signal(false);

  actionSuccess =
    signal<string | null>(null);

  actionError =
    signal<string | null>(null);


  // ==========================================================
  // Search
  // ==========================================================

  private searchSubject =
    new Subject<string>();


  // ==========================================================
  // Statistics
  // ==========================================================

  verifiedCount = (): number =>
    this.companies()
      .filter(
        (company: Company) =>
          company.is_verified
      )
      .length;


  unverifiedCount = (): number =>
    this.companies()
      .filter(
        (company: Company) =>
          !company.is_verified
      )
      .length;


  activeJobsCount = (): number =>
    this.companies()
      .reduce(
        (
          sum: number,
          company: Company
        ) =>
          sum +
          (company.active_job_count || 0),
        0
      );


  // ==========================================================
  // Initialization
  // ==========================================================

  ngOnInit(): void {

    this.searchSubject
      .pipe(
        debounceTime(400),
        distinctUntilChanged()
      )
      .subscribe(() => {
        this.load();
      });

    this.load();
  }


  // ==========================================================
  // Load Companies
  // ==========================================================

  load(): void {

    this.loading.set(true);

    const filters: CompanyFilters = {
      page: 1
    };


    if (this.searchQuery()) {

      filters.search =
        this.searchQuery();

    }


    if (this.sizeFilter()) {

      filters.company_size =
        this.sizeFilter();

    }


    if (this.verifiedFilter()) {

      filters.is_verified =
        this.verifiedFilter();

    }


    this.companiesService
      .listCompanies(filters)
      .subscribe({

        next: (res) => {

          this.companies.set(
            res.results || []
          );

          this.totalCount.set(
            res.count || 0
          );

          this.loading.set(false);

        },

        error: (error: HttpErrorResponse) => {

          console.error(
            'Failed to load companies:',
            error
          );

          this.companies.set([]);

          this.totalCount.set(0);

          this.loading.set(false);

        }

      });

  }


  // ==========================================================
  // Search
  // ==========================================================

  onSearch(value: string): void {

    this.searchQuery.set(value);

    this.searchSubject.next(value);

  }


  // ==========================================================
  // Size Filter
  // ==========================================================

  onSizeChange(value: string): void {

    this.sizeFilter.set(value);

    this.load();

  }


  // ==========================================================
  // Verification Filter
  // ==========================================================

  onVerifiedChange(value: string): void {

    this.verifiedFilter.set(value);

    this.load();

  }


  // ==========================================================
  // Active Filters
  // ==========================================================

  hasActiveFilters(): boolean {

    return !!(
      this.searchQuery() ||
      this.sizeFilter() ||
      this.verifiedFilter()
    );

  }


  // ==========================================================
  // Clear Filters
  // ==========================================================

  clearFilters(): void {

    this.searchQuery.set('');

    this.sizeFilter.set('');

    this.verifiedFilter.set('');

    this.load();

  }


  // ==========================================================
  // Open Company
  // ==========================================================

  openCompany(
    comp: Company
  ): void {

    this.actionSuccess.set(null);

    this.actionError.set(null);

    this.selectedCompany.set(comp);

    this.selectedCompanyDetails.set(null);

    this.detailLoading.set(true);


    this.companiesService
      .getAdminCompanyDetails(comp.slug)
      .subscribe({

        next: (
          details: CompanyAdminDetails
        ) => {

          console.log(
            'Company admin details:',
            details
          );

          this.selectedCompanyDetails.set(
            details
          );

          this.detailLoading.set(false);

        },

        error: (
          error: HttpErrorResponse
        ) => {

          console.error(
            'Failed to load company admin details:',
            error
          );

          this.detailLoading.set(false);

          this.actionError.set(
            error.error?.detail ||
            error.message ||
            'Unable to load complete company details.'
          );

        }

      });

  }


  // ==========================================================
  // Close Company
  // ==========================================================

  closeCompany(): void {

    this.selectedCompany.set(null);

    this.selectedCompanyDetails.set(null);

    this.detailLoading.set(false);

    this.actionSuccess.set(null);

    this.actionError.set(null);

  }


  // ==========================================================
  // Verify Company
  // ==========================================================

  verifyCompany(
    comp: Company
  ): void {

    this.acting.set(true);


    this.companiesService
      .verifyCompany(comp.slug)
      .subscribe({

        next: (res: {
          message?: string;
        }) => {

          this.acting.set(false);

          this.actionSuccess.set(
            res.message ||
            'Company verified.'
          );


          this.selectedCompany.set({

            ...comp,

            is_verified: true

          });


          const details =
            this.selectedCompanyDetails();


          if (details) {

            this.selectedCompanyDetails.set({

              ...details,

              is_verified: true

            });

          }


          this.load();

        },

        error: (
          error: HttpErrorResponse
        ) => {

          this.acting.set(false);

          this.actionError.set(
            error.error?.detail ||
            error.message ||
            'Verification failed.'
          );

        }

      });

  }


  // ==========================================================
  // Unverify Company
  // ==========================================================

  unverifyCompany(
    comp: Company
  ): void {

    if (
      !confirm(
        `Revoke verification for "${comp.name}"?`
      )
    ) {

      return;

    }


    this.acting.set(true);


    this.companiesService
      .unverifyCompany(comp.slug)
      .subscribe({

        next: (res: {
          message?: string;
        }) => {

          this.acting.set(false);

          this.actionSuccess.set(
            res.message ||
            'Verification revoked.'
          );


          this.selectedCompany.set({

            ...comp,

            is_verified: false

          });


          const details =
            this.selectedCompanyDetails();


          if (details) {

            this.selectedCompanyDetails.set({

              ...details,

              is_verified: false

            });

          }


          this.load();

        },

        error: (
          error: HttpErrorResponse
        ) => {

          this.acting.set(false);

          this.actionError.set(
            error.error?.detail ||
            error.message ||
            'Failed to revoke verification.'
          );

        }

      });

  }


  // ==========================================================
  // First Character
  // ==========================================================

  getFirstChar(
    name: string | undefined
  ): string {

    return name &&
      name.length > 0

      ? name[0].toUpperCase()

      : '?';

  }


  // ==========================================================
  // Company Size Formatting
  // ==========================================================

  formatSize(
    size: string | undefined
  ): string {

    const map: Record<string, string> = {

      STARTUP:
        '1-10 employees',

      SMALL:
        '11-50 employees',

      MEDIUM:
        '51-200 employees',

      LARGE:
        '201-1000 employees',

      ENTERPRISE:
        '1000+ employees'

    };


    return map[size || ''] || '';

  }


  // ==========================================================
  // Date Formatting
  // ==========================================================

  formatDate(
    dateStr: string | undefined
  ): string {

    if (!dateStr) {

      return '—';

    }


    return new Date(dateStr)
      .toLocaleDateString(
        'en-US',
        {
          day: 'numeric',
          month: 'short',
          year: 'numeric'
        }
      );

  }

}