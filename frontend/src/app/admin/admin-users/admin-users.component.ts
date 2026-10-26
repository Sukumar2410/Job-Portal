import {
  Component,
  OnInit,
  inject,
  signal,
  computed
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import {
  Subject,
  debounceTime,
  distinctUntilChanged
} from 'rxjs';

import { TopNavComponent } from '../../shared/top-nav/top-nav.component';

import {
  AdminUsersService,
  UserFilters
} from '../../core/services/admin-users.service';

import {
  User,
  AdminUserStats,
  AdminUserDetails,
  AdminCandidateProfile,
  AdminHRProfile
} from '../../core/models/user.model';


@Component({
  selector: 'app-admin-users',
  standalone: true,

  imports: [
    CommonModule,
    FormsModule,
    TopNavComponent
  ],

  template: `
    <div
      class="min-h-screen bg-gradient-to-br from-slate-50 via-rose-50 to-red-50"
    >

      <app-top-nav portalName="Admin Console"></app-top-nav>


      <div
        class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
      >

        <!-- =====================================================
             PAGE HEADER
             ===================================================== -->

        <div class="mb-8 animate-fade-in">

          <h1
            class="text-3xl sm:text-4xl font-bold text-gray-900 mb-2"
          >
            User Management 👥
          </h1>

          <p class="text-gray-600">
            View, activate, and manage all platform users.
          </p>

        </div>


        <!-- =====================================================
             STATISTICS
             ===================================================== -->

        <div
          class="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6"
        >

          <!-- Total Users -->

          <div
            class="bg-white rounded-xl p-4 shadow-soft"
          >

            <div
              class="text-2xl font-bold text-gray-900"
            >
              {{ stats().total_users }}
            </div>

            <div class="text-xs text-gray-500">
              Total Users
            </div>

          </div>


          <!-- Candidates -->

          <div
            class="bg-white rounded-xl p-4 shadow-soft"
          >

            <div
              class="text-2xl font-bold text-blue-600"
            >
              {{ stats().candidates }}
            </div>

            <div class="text-xs text-gray-500">
              Candidates
            </div>

          </div>


          <!-- Recruiters -->

          <div
            class="bg-white rounded-xl p-4 shadow-soft"
          >

            <div
              class="text-2xl font-bold text-emerald-600"
            >
              {{ stats().recruiters }}
            </div>

            <div class="text-xs text-gray-500">
              Recruiters
            </div>

          </div>


          <!-- Admins -->

          <div
            class="bg-white rounded-xl p-4 shadow-soft"
          >

            <div
              class="text-2xl font-bold text-rose-600"
            >
              {{ stats().admins }}
            </div>

            <div class="text-xs text-gray-500">
              Admins
            </div>

          </div>


          <!-- Verified -->

          <div
            class="bg-white rounded-xl p-4 shadow-soft"
          >

            <div
              class="text-2xl font-bold text-purple-600"
            >
              {{ stats().verified }}
            </div>

            <div class="text-xs text-gray-500">
              Verified
            </div>

          </div>

        </div>


        <!-- =====================================================
             SEARCH + FILTERS
             ===================================================== -->

        <div
          class="bg-white rounded-2xl shadow-soft p-4 mb-6 animate-slide-up"
        >

          <div
            class="grid grid-cols-1 md:grid-cols-4 gap-3"
          >

            <!-- Search -->

            <div
              class="md:col-span-2 relative"
            >

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
                placeholder="Search by name, email, phone..."
                class="w-full pl-10 pr-4 py-2 bg-gray-50 border-2 border-gray-100 rounded-lg text-sm focus:bg-white focus:border-rose-500 outline-none"
              />

            </div>


            <!-- Role -->

            <select
              [ngModel]="roleFilter()"
              (ngModelChange)="onRoleChange($event)"
              class="px-3 py-2 bg-gray-50 border-2 border-gray-100 rounded-lg text-sm focus:bg-white focus:border-rose-500 outline-none"
            >

              <option value="">
                All Roles
              </option>

              <option value="CANDIDATE">
                Candidates
              </option>

              <option value="HR">
                Recruiters
              </option>

              <option value="SUPER_ADMIN">
                Admins
              </option>

            </select>


            <!-- Status -->

            <select
              [ngModel]="statusFilter()"
              (ngModelChange)="onStatusChange($event)"
              class="px-3 py-2 bg-gray-50 border-2 border-gray-100 rounded-lg text-sm focus:bg-white focus:border-rose-500 outline-none"
            >

              <option value="">
                All Statuses
              </option>

              <option value="active">
                Active
              </option>

              <option value="inactive">
                Deactivated
              </option>

              <option value="verified">
                Verified
              </option>

              <option value="unverified">
                Unverified
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
          *ngIf="!loading() && users().length === 0"
          class="bg-white rounded-2xl shadow-soft p-12 text-center animate-fade-in"
        >

          <div
            class="w-20 h-20 bg-gradient-to-br from-rose-100 to-red-100 rounded-3xl flex items-center justify-center mx-auto mb-4"
          >

            <span class="text-4xl">
              👥
            </span>

          </div>


          <h3
            class="text-lg font-bold text-gray-900 mb-2"
          >
            No users found
          </h3>


          <p
            class="text-gray-500 mb-4"
            *ngIf="hasActiveFilters()"
          >
            No users match your current filters.
            Try clearing them.
          </p>


          <p
            class="text-gray-500 mb-4"
            *ngIf="!hasActiveFilters()"
          >
            There are no users in the system yet.
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
             USERS TABLE
             ===================================================== -->

        <div
          *ngIf="!loading() && users().length > 0"
          class="bg-white rounded-2xl shadow-soft overflow-hidden animate-slide-up"
        >

          <div class="overflow-x-auto">

            <table class="w-full text-sm">

              <thead
                class="bg-gray-50 border-b border-gray-200"
              >

                <tr>

                  <th
                    class="text-left px-4 py-3 font-semibold text-gray-700"
                  >
                    User
                  </th>

                  <th
                    class="text-left px-4 py-3 font-semibold text-gray-700 hidden sm:table-cell"
                  >
                    Role
                  </th>

                  <th
                    class="text-left px-4 py-3 font-semibold text-gray-700 hidden md:table-cell"
                  >
                    Status
                  </th>

                  <th
                    class="text-left px-4 py-3 font-semibold text-gray-700 hidden lg:table-cell"
                  >
                    Joined
                  </th>

                  <th
                    class="text-right px-4 py-3 font-semibold text-gray-700"
                  >
                    Actions
                  </th>

                </tr>

              </thead>


              <tbody>

                <tr
                  *ngFor="let user of users(); let i = index"
                  class="border-b border-gray-100 hover:bg-gray-50 transition-all animate-slide-in-right"
                  [style.animation-delay]="(i * 0.02) + 's'"
                >

                  <!-- User -->

                  <td class="px-4 py-3">

                    <div class="flex items-center gap-3">

                      <div
                        class="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 overflow-hidden"
                        [style.background]="getAvatarGradient(user.role)"
                      >

                        <img
                          *ngIf="user.profile_picture"
                          [src]="user.profile_picture"
                          [alt]="user.full_name || user.email"
                          class="w-full h-full object-cover"
                        />

                        <span *ngIf="!user.profile_picture">
                          {{ getInitials(user) }}
                        </span>

                      </div>


                      <div class="min-w-0">

                        <div
                          class="font-semibold text-gray-900 truncate"
                        >
                          {{ user.first_name }}
                          {{ user.last_name }}
                        </div>

                        <div
                          class="text-xs text-gray-500 truncate"
                        >
                          {{ user.email }}
                        </div>

                      </div>

                    </div>

                  </td>


                  <!-- Role -->

                  <td
                    class="px-4 py-3 hidden sm:table-cell"
                  >

                    <span
                      class="inline-flex items-center px-2 py-1 text-xs font-bold rounded-full"
                      [style.background]="getRoleBg(user.role)"
                      [style.color]="getRoleColor(user.role)"
                    >
                      {{ formatRole(user.role) }}
                    </span>

                  </td>


                  <!-- Status -->

                  <td
                    class="px-4 py-3 hidden md:table-cell"
                  >

                    <div
                      class="flex flex-col gap-1"
                    >

                      <span
                        *ngIf="user.is_active"
                        class="inline-flex items-center gap-1 text-xs text-emerald-700"
                      >

                        <span
                          class="w-2 h-2 bg-emerald-500 rounded-full"
                        ></span>

                        Active

                      </span>


                      <span
                        *ngIf="!user.is_active"
                        class="inline-flex items-center gap-1 text-xs text-red-700"
                      >

                        <span
                          class="w-2 h-2 bg-red-500 rounded-full"
                        ></span>

                        Deactivated

                      </span>


                      <span
                        *ngIf="user.is_verified"
                        class="text-xs text-blue-700"
                      >
                        ✓ Verified
                      </span>


                      <span
                        *ngIf="!user.is_verified"
                        class="text-xs text-amber-700"
                      >
                        ⚠ Unverified
                      </span>

                    </div>

                  </td>


                  <!-- Joined -->

                  <td
                    class="px-4 py-3 hidden lg:table-cell text-xs text-gray-500"
                  >
                    {{ formatDate(user.date_joined) }}
                  </td>


                  <!-- Actions -->

                  <td class="px-4 py-3">

                    <div
                      class="flex justify-end gap-1"
                    >

                      <button
                        type="button"
                        (click)="openUser(user)"
                        class="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                        title="View complete details"
                      >

                        <svg
                          class="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >

                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />

                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />

                        </svg>

                      </button>

                    </div>

                  </td>

                </tr>

              </tbody>

            </table>

          </div>

        </div>


        <!-- =====================================================
             PAGINATION
        ===================================================== -->

        <div
          *ngIf="
            !loading() &&
            users().length > 0 &&
            totalPages() > 1
          "
          class="px-4 py-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4"
        >

          <div class="text-sm text-gray-500">

            Showing

            <span class="font-semibold text-gray-700">
              {{ pageStart() }}
            </span>

            –

            <span class="font-semibold text-gray-700">
              {{ pageEnd() }}
            </span>

            of

            <span class="font-semibold text-gray-700">
              {{ totalCount() }}
            </span>

            users

          </div>


          <div class="flex items-center gap-2">

            <!-- Previous -->

            <button
              type="button"
              (click)="previousPage()"
              [disabled]="!hasPreviousPage()"
              class="px-3 py-2 text-sm font-semibold rounded-lg border border-gray-200 text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              ← Previous
            </button>


            <!-- Page numbers -->

            <div class="flex items-center gap-1">

              <button
                *ngFor="let page of getPageNumbers()"
                type="button"
                (click)="goToPage(page)"
                [class.bg-rose-600]="page === currentPage()"
                [class.text-white]="page === currentPage()"
                [class.bg-gray-100]="page !== currentPage()"
                [class.text-gray-700]="page !== currentPage()"
                class="w-9 h-9 rounded-lg text-sm font-semibold hover:bg-rose-100"
              >
                {{ page }}
              </button>

            </div>


            <!-- Next -->

            <button
              type="button"
              (click)="nextPage()"
              [disabled]="!hasNextPage()"
              class="px-3 py-2 text-sm font-semibold rounded-lg border border-gray-200 text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next →
            </button>

          </div>

        </div>

      </div>


      <!-- =========================================================
           USER DETAIL MODAL
           ========================================================= -->

      <div
        *ngIf="selectedUser() as u"
        class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
        (click)="closeUser()"
      >

        <div
          class="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[92vh] overflow-y-auto animate-scale-in"
          (click)="$event.stopPropagation()"
        >

          <!-- ===================================================
               MODAL HEADER
               =================================================== -->

          <div
            class="p-6 border-b border-gray-100"
          >

            <div
              class="flex items-start justify-between gap-4"
            >

              <div
                class="flex items-center gap-4 min-w-0"
              >

                <!-- Avatar -->

                <div
                  class="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-xl font-bold shadow-md overflow-hidden flex-shrink-0"
                  [style.background]="getAvatarGradient(u.role)"
                >

                  <img
                    *ngIf="u.profile_picture"
                    [src]="u.profile_picture"
                    [alt]="u.full_name || u.email"
                    class="w-full h-full object-cover"
                  />

                  <span *ngIf="!u.profile_picture">
                    {{ getInitials(u) }}
                  </span>

                </div>


                <!-- Name -->

                <div class="min-w-0">

                  <h2
                    class="text-2xl font-bold text-gray-900 truncate"
                  >
                    {{ u.full_name || (u.first_name + ' ' + u.last_name) }}
                  </h2>

                  <p
                    class="text-sm text-gray-500 break-all"
                  >
                    {{ u.email }}
                  </p>

                  <p
                    class="text-xs text-gray-400 mt-1"
                  >
                    User ID: #{{ u.id }}
                  </p>

                </div>

              </div>


              <!-- Close -->

              <button
                type="button"
                (click)="closeUser()"
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


            <!-- Status Badges -->

            <div
              class="flex flex-wrap gap-2 mt-5"
            >

              <span
                class="inline-flex items-center px-3 py-1 text-xs font-bold rounded-full"
                [style.background]="getRoleBg(u.role)"
                [style.color]="getRoleColor(u.role)"
              >
                {{ formatRole(u.role) }}
              </span>


              <span
                *ngIf="u.is_active"
                class="inline-flex items-center gap-1 px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full"
              >

                <span
                  class="w-2 h-2 bg-emerald-500 rounded-full"
                ></span>

                Active

              </span>


              <span
                *ngIf="!u.is_active"
                class="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full"
              >

                <span
                  class="w-2 h-2 bg-red-500 rounded-full"
                ></span>

                Deactivated

              </span>


              <span
                *ngIf="u.is_verified"
                class="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full"
              >
                ✓ Email Verified
              </span>


              <span
                *ngIf="!u.is_verified"
                class="inline-flex items-center gap-1 px-3 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-full"
              >
                ⚠ Email Unverified
              </span>

            </div>

          </div>


          <!-- ===================================================
               DETAIL LOADING
               =================================================== -->

          <div
            *ngIf="detailLoading()"
            class="p-16 flex flex-col items-center justify-center"
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
              Loading complete user details...
            </p>

          </div>


          <!-- ===================================================
               DETAILS CONTENT
               =================================================== -->

          <div
            *ngIf="!detailLoading()"
            class="p-6 space-y-7"
          >

            <!-- =================================================
                 ACCOUNT INFORMATION
                 ================================================= -->

            <section>

              <h3
                class="text-lg font-bold text-gray-900 mb-4"
              >
                👤 Account Information
              </h3>


              <div
                class="grid grid-cols-1 md:grid-cols-2 gap-3"
              >

                <!-- User ID -->

                <div
                  class="p-4 bg-gray-50 rounded-xl"
                >

                  <div class="text-xs text-gray-500">
                    User ID
                  </div>

                  <div
                    class="font-semibold text-gray-900 mt-1"
                  >
                    #{{ u.id }}
                  </div>

                </div>


                <!-- Email -->

                <div
                  class="p-4 bg-gray-50 rounded-xl"
                >

                  <div class="text-xs text-gray-500">
                    Email Address
                  </div>

                  <div
                    class="font-semibold text-gray-900 mt-1 break-all"
                  >
                    {{ u.email }}
                  </div>

                </div>


                <!-- Phone -->

                <div
                  class="p-4 bg-gray-50 rounded-xl"
                >

                  <div class="text-xs text-gray-500">
                    Phone
                  </div>

                  <div
                    class="font-semibold text-gray-900 mt-1"
                  >
                    {{ u.phone || 'Not provided' }}
                  </div>

                </div>


                <!-- Joined -->

                <div
                  class="p-4 bg-gray-50 rounded-xl"
                >

                  <div class="text-xs text-gray-500">
                    Joined
                  </div>

                  <div
                    class="font-semibold text-gray-900 mt-1"
                  >
                    {{ formatDate(u.date_joined) }}
                  </div>

                </div>


                <!-- Last Login -->

                <div
                  class="p-4 bg-gray-50 rounded-xl"
                >

                  <div class="text-xs text-gray-500">
                    Last Login
                  </div>

                  <div
                    class="font-semibold text-gray-900 mt-1"
                  >
                    {{ formatDateTime(u.last_login) }}
                  </div>

                </div>


                <!-- Role -->

                <div
                  class="p-4 bg-gray-50 rounded-xl"
                >

                  <div class="text-xs text-gray-500">
                    Account Role
                  </div>

                  <div
                    class="font-semibold text-gray-900 mt-1"
                  >
                    {{ formatRole(u.role) }}
                  </div>

                </div>

              </div>

            </section>


            <!-- =================================================
                 CANDIDATE PROFILE
                 ================================================= -->

            <section
              *ngIf="candidateProfile() as profile"
            >

              <h3
                class="text-lg font-bold text-gray-900 mb-4"
              >
                💼 Candidate Profile
              </h3>


              <!-- Headline -->

              <div
                *ngIf="profile.headline"
                class="p-4 bg-blue-50 rounded-xl mb-4"
              >

                <div
                  class="text-xs text-blue-600 font-semibold mb-1"
                >
                  Professional Headline
                </div>

                <div
                  class="font-semibold text-gray-900"
                >
                  {{ profile.headline }}
                </div>

              </div>


              <!-- Basic Professional Details -->

              <div
                class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
              >

                <!-- Experience -->

                <div
                  class="p-4 bg-gray-50 rounded-xl"
                >

                  <div class="text-xs text-gray-500">
                    Experience
                  </div>

                  <div
                    class="font-semibold text-gray-900 mt-1"
                  >
                    {{ profile.experience_years }}
                    {{ profile.experience_years === 1 ? 'year' : 'years' }}
                  </div>

                </div>


                <!-- Location -->

                <div
                  class="p-4 bg-gray-50 rounded-xl"
                >

                  <div class="text-xs text-gray-500">
                    Current Location
                  </div>

                  <div
                    class="font-semibold text-gray-900 mt-1"
                  >
                    {{ profile.current_location || 'Not provided' }}
                  </div>

                </div>


                <!-- Expected Salary -->

                <div
                  class="p-4 bg-gray-50 rounded-xl"
                >

                  <div class="text-xs text-gray-500">
                    Expected Salary
                  </div>

                  <div
                    class="font-semibold text-gray-900 mt-1"
                  >
                    {{ formatSalary(profile.expected_salary) }}
                  </div>

                </div>

              </div>


              <!-- Skills -->

              <div
                *ngIf="profile.skills"
                class="mt-4 p-4 bg-gray-50 rounded-xl"
              >

                <div
                  class="text-xs text-gray-500 mb-2"
                >
                  Skills
                </div>

                <div
                  class="flex flex-wrap gap-2"
                >

                  <span
                    *ngFor="let skill of getSkills(profile.skills)"
                    class="px-3 py-1 bg-white border border-gray-200 text-gray-700 text-xs font-semibold rounded-full"
                  >
                    {{ skill }}
                  </span>

                </div>

              </div>


              <!-- Summary -->

              <div
                *ngIf="profile.summary"
                class="mt-4 p-4 bg-gray-50 rounded-xl"
              >

                <div
                  class="text-xs text-gray-500 mb-2"
                >
                  Professional Summary
                </div>

                <p
                  class="text-sm text-gray-700 leading-relaxed whitespace-pre-line"
                >
                  {{ profile.summary }}
                </p>

              </div>


              <!-- Professional Links -->

              <div
                class="mt-4"
              >

                <h4
                  class="text-sm font-bold text-gray-800 mb-3"
                >
                  🔗 Professional Links
                </h4>


                <div
                  class="flex flex-wrap gap-3"
                >

                  <!-- LinkedIn -->

                  <a
                    *ngIf="profile.linkedin_url"
                    [href]="profile.linkedin_url"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-semibold hover:bg-blue-100 transition-all"
                  >
                    LinkedIn ↗
                  </a>


                  <!-- GitHub -->

                  <a
                    *ngIf="profile.github_url"
                    [href]="profile.github_url"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-200 transition-all"
                  >
                    GitHub ↗
                  </a>


                  <!-- Portfolio -->

                  <a
                    *ngIf="profile.portfolio_url"
                    [href]="profile.portfolio_url"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="px-4 py-2 bg-purple-50 text-purple-700 rounded-lg text-sm font-semibold hover:bg-purple-100 transition-all"
                  >
                    Portfolio ↗
                  </a>


                  <!-- No links -->

                  <span
                    *ngIf="
                      !profile.linkedin_url &&
                      !profile.github_url &&
                      !profile.portfolio_url
                    "
                    class="text-sm text-gray-500"
                  >
                    No professional links provided.
                  </span>

                </div>

              </div>
              <!-- =================================================
                   RESUMES
                   ================================================= -->

              <div
                class="mt-6"
              >

                <div
                  class="flex items-center justify-between mb-3"
                >

                  <h4
                    class="text-sm font-bold text-gray-800"
                  >
                    📄 Resumes
                  </h4>

                  <span
                    *ngIf="profile.resumes?.length"
                    class="text-xs text-gray-500"
                  >
                    {{ profile.resumes.length }}
                    {{ profile.resumes.length === 1 ? 'resume' : 'resumes' }}
                  </span>

                </div>


                <!-- Legacy Resume -->

                <div
                  *ngIf="profile.legacy_resume_url"
                  class="p-4 bg-rose-50 rounded-xl mb-3 flex items-center justify-between gap-4"
                >

                  <div
                    class="min-w-0"
                  >

                    <div
                      class="font-semibold text-gray-900"
                    >
                      Legacy Resume
                    </div>

                    <div
                      class="text-xs text-gray-500 mt-1"
                    >
                      Resume stored in the candidate profile
                    </div>

                  </div>


                  <a
                    [href]="profile.legacy_resume_url"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="px-4 py-2 bg-rose-600 text-white rounded-lg text-xs font-semibold hover:bg-rose-700 transition-all flex-shrink-0"
                  >
                    View Resume ↗
                  </a>

                </div>


                <!-- Multiple Resumes -->

                <div
                  *ngIf="
                    profile.resumes &&
                    profile.resumes.length > 0
                  "
                  class="space-y-2"
                >

                  <div
                    *ngFor="let resume of profile.resumes"
                    class="p-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition-all"
                  >

                    <div
                      class="flex items-center justify-between gap-4"
                    >

                      <div
                        class="min-w-0"
                      >

                        <div
                          class="font-semibold text-gray-900 truncate"
                        >
                          {{ resume.title }}
                        </div>


                        <div
                          class="flex flex-wrap gap-2 mt-2"
                        >

                          <span
                            class="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
                          >
                            {{ formatVisibility(resume.visibility) }}
                          </span>


                          <span
                            *ngIf="resume.is_default"
                            class="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full"
                          >
                            Default
                          </span>


                          <span
                            *ngIf="resume.is_boosted"
                            class="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-semibold rounded-full"
                          >
                            Boosted
                          </span>


                          <span
                            *ngIf="resume.ats_score !== null"
                            class="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-full"
                          >
                            ATS {{ resume.ats_score }}
                          </span>

                        </div>


                        <div
                          class="text-xs text-gray-500 mt-2"
                        >
                          Downloads:
                          {{ resume.download_count }}
                        </div>

                      </div>


                      <a
                        *ngIf="resume.file_url"
                        [href]="resume.file_url"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="px-4 py-2 bg-gray-900 text-white rounded-lg text-xs font-semibold hover:bg-gray-800 transition-all flex-shrink-0"
                      >
                        View ↗
                      </a>

                    </div>

                  </div>

                </div>


                <!-- No resume -->

                <div
                  *ngIf="
                    !profile.legacy_resume_url &&
                    (!profile.resumes ||
                    profile.resumes.length === 0)
                  "
                  class="p-5 bg-gray-50 rounded-xl text-center text-sm text-gray-500"
                >
                  No resume uploaded.
                </div>

              </div>


              <!-- Profile timestamps -->

              <div
                class="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-5"
              >

                <div
                  class="p-4 bg-gray-50 rounded-xl"
                >

                  <div class="text-xs text-gray-500">
                    Profile Created
                  </div>

                  <div
                    class="font-semibold text-gray-900 mt-1"
                  >
                    {{ formatDateTime(profile.created_at) }}
                  </div>

                </div>


                <div
                  class="p-4 bg-gray-50 rounded-xl"
                >

                  <div class="text-xs text-gray-500">
                    Profile Last Updated
                  </div>

                  <div
                    class="font-semibold text-gray-900 mt-1"
                  >
                    {{ formatDateTime(profile.updated_at) }}
                  </div>

                </div>

              </div>

            </section>


            <!-- =================================================
                 HR PROFILE
                 ================================================= -->

            <section
              *ngIf="hrProfile() as profile"
            >

              <h3
                class="text-lg font-bold text-gray-900 mb-4"
              >
                💼 HR / Recruiter Profile
              </h3>


              <div
                class="grid grid-cols-1 md:grid-cols-2 gap-3"
              >

                <!-- Designation -->

                <div
                  class="p-4 bg-emerald-50 rounded-xl"
                >

                  <div class="text-xs text-gray-500">
                    Designation
                  </div>

                  <div
                    class="font-semibold text-gray-900 mt-1"
                  >
                    {{ profile.designation || 'Not provided' }}
                  </div>

                </div>


                <!-- Department -->

                <div
                  class="p-4 bg-emerald-50 rounded-xl"
                >

                  <div class="text-xs text-gray-500">
                    Department
                  </div>

                  <div
                    class="font-semibold text-gray-900 mt-1"
                  >
                    {{ profile.department || 'Not provided' }}
                  </div>

                </div>


                <!-- Company -->

                <div
                  class="p-4 bg-gray-50 rounded-xl"
                >

                  <div class="text-xs text-gray-500">
                    Company
                  </div>

                  <div
                    class="font-semibold text-gray-900 mt-1"
                  >
                    {{ profile.company_name || 'Not associated' }}
                  </div>

                </div>


                <!-- Company ID -->

                <div
                  class="p-4 bg-gray-50 rounded-xl"
                >

                  <div class="text-xs text-gray-500">
                    Company ID
                  </div>

                  <div
                    class="font-semibold text-gray-900 mt-1"
                  >
                    {{
                      profile.company_id !== null
                        ? '#' + profile.company_id
                        : 'Not associated'
                    }}
                  </div>

                </div>


                <!-- Profile Created -->

                <div
                  class="p-4 bg-gray-50 rounded-xl"
                >

                  <div class="text-xs text-gray-500">
                    Profile Created
                  </div>

                  <div
                    class="font-semibold text-gray-900 mt-1"
                  >
                    {{ formatDateTime(profile.created_at) }}
                  </div>

                </div>


                <!-- Updated -->

                <div
                  class="p-4 bg-gray-50 rounded-xl"
                >

                  <div class="text-xs text-gray-500">
                    Last Updated
                  </div>

                  <div
                    class="font-semibold text-gray-900 mt-1"
                  >
                    {{ formatDateTime(profile.updated_at) }}
                  </div>

                </div>

              </div>

            </section>


            <!-- =================================================
                 SUPER ADMIN INFORMATION
                 ================================================= -->

            <section
              *ngIf="u.role === 'SUPER_ADMIN'"
            >

              <h3
                class="text-lg font-bold text-gray-900 mb-4"
              >
                🛡️ Administrator Information
              </h3>


              <div
                class="grid grid-cols-1 md:grid-cols-2 gap-3"
              >

                <!-- Staff -->

                <div
                  class="p-4 bg-rose-50 rounded-xl"
                >

                  <div class="text-xs text-gray-500">
                    Staff Account
                  </div>

                  <div
                    class="font-semibold text-gray-900 mt-1"
                  >
                    {{ u.is_staff ? 'Yes' : 'No' }}
                  </div>

                </div>


                <!-- Superuser -->

                <div
                  class="p-4 bg-rose-50 rounded-xl"
                >

                  <div class="text-xs text-gray-500">
                    Superuser
                  </div>

                  <div
                    class="font-semibold text-gray-900 mt-1"
                  >
                    {{ u.is_superuser ? 'Yes' : 'No' }}
                  </div>

                </div>


                <!-- Last Login -->

                <div
                  class="p-4 bg-gray-50 rounded-xl"
                >

                  <div class="text-xs text-gray-500">
                    Last Login
                  </div>

                  <div
                    class="font-semibold text-gray-900 mt-1"
                  >
                    {{ formatDateTime(u.last_login) }}
                  </div>

                </div>


                <!-- Account Created -->

                <div
                  class="p-4 bg-gray-50 rounded-xl"
                >

                  <div class="text-xs text-gray-500">
                    Account Created
                  </div>

                  <div
                    class="font-semibold text-gray-900 mt-1"
                  >
                    {{ formatDateTime(u.date_joined) }}
                  </div>

                </div>

              </div>

            </section>


            <!-- =================================================
                 NO PROFILE INFORMATION
                 ================================================= -->

            <section
              *ngIf="
                u.role !== 'CANDIDATE' &&
                u.role !== 'HR' &&
                u.role !== 'SUPER_ADMIN'
              "
            >

              <div
                class="p-5 bg-gray-50 rounded-xl text-center text-sm text-gray-500"
              >
                No additional profile information available.
              </div>

            </section>

          </div>


          <!-- ===================================================
               ACTIONS
               =================================================== -->

          <div
            class="p-6 border-t border-gray-100"
          >

            <!-- Success -->

            <div
              *ngIf="actionSuccess()"
              class="p-3 bg-green-50 text-green-700 text-sm rounded-lg font-semibold text-center mb-3"
            >
              ✅ {{ actionSuccess() }}
            </div>


            <!-- Error -->

            <div
              *ngIf="actionError()"
              class="p-3 bg-red-50 text-red-700 text-sm rounded-lg font-semibold text-center mb-3"
            >
              ❌ {{ actionError() }}
            </div>


            <div
              class="grid grid-cols-1 sm:grid-cols-2 gap-3"
            >

              <!-- Verify -->

              <button
                *ngIf="!u.is_verified"
                type="button"
                (click)="verifyUser(u)"
                [disabled]="acting()"
                class="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl disabled:opacity-50 transition-all"
              >
                ✓ Verify Email
              </button>


              <!-- Deactivate -->

              <button
                *ngIf="u.is_active"
                type="button"
                (click)="deactivateUser(u)"
                [disabled]="acting()"
                class="px-4 py-3 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-xl disabled:opacity-50 transition-all"
              >
                🚫 Deactivate
              </button>


              <!-- Activate -->

              <button
                *ngIf="!u.is_active"
                type="button"
                (click)="activateUser(u)"
                [disabled]="acting()"
                class="px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl disabled:opacity-50 transition-all"
              >
                ▶️ Activate
              </button>


              <!-- Close -->

              <button
                type="button"
                (click)="closeUser()"
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

export class AdminUsersComponent implements OnInit {

  private usersService =
    inject(AdminUsersService);


  // ==========================================================
  // Users
  // ==========================================================

  users =
    signal<User[]>([]);

  loading =
    signal(true);

  totalCount =
    signal(0);


  // ==========================================================
  // Statistics
  // ==========================================================

  stats =
    signal<AdminUserStats>({
      total_users: 0,
      candidates: 0,
      recruiters: 0,
      admins: 0,
      verified: 0
    });


  // ==========================================================
  // Pagination
  // ==========================================================

  currentPage =
    signal(1);

  pageSize =
    signal(10);


  totalPages =
    computed(() =>
      Math.ceil(
        this.totalCount() /
        this.pageSize()
      )
    );


  pageStart =
    computed(() => {

      if (this.totalCount() === 0) {
        return 0;
      }

      return (
        (this.currentPage() - 1) *
        this.pageSize()
      ) + 1;

    });


  pageEnd =
    computed(() =>
      Math.min(
        this.currentPage() *
        this.pageSize(),
        this.totalCount()
      )
    );


  hasPreviousPage =
    computed(() =>
      this.currentPage() > 1
    );


  hasNextPage =
    computed(() =>
      this.currentPage() <
      this.totalPages()
    );


  // ==========================================================
  // Filters
  // ==========================================================

  searchQuery =
    signal('');

  roleFilter =
    signal('');

  statusFilter =
    signal('');


  // ==========================================================
  // Selected User
  // ==========================================================

  selectedUser =
    signal<AdminUserDetails | null>(null);

  detailLoading =
    signal(false);


  // ==========================================================
  // Role-specific computed profiles
  // ==========================================================

  candidateProfile =
    computed<AdminCandidateProfile | null>(() => {

      const profile =
        this.selectedUser()?.profile;

      if (
        profile &&
        'headline' in profile
      ) {
        return profile as AdminCandidateProfile;
      }

      return null;
    });


  hrProfile =
    computed<AdminHRProfile | null>(() => {

      const profile =
        this.selectedUser()?.profile;

      if (
        profile &&
        'designation' in profile
      ) {
        return profile as AdminHRProfile;
      }

      return null;
    });


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
  // Search Subject
  // ==========================================================

  private searchSubject =
    new Subject<string>();


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

        this.load(1);

      });


    this.load(1);

  }


  // ==========================================================
  // Load Users
  // ==========================================================

  load(
    page: number = this.currentPage()
  ): void {

    this.loading.set(true);

    this.currentPage.set(page);


    const filters: UserFilters = {
      page
    };


    // Search

    if (this.searchQuery()) {

      filters.search =
        this.searchQuery();

    }


    // Role

    if (this.roleFilter()) {

      filters.role =
        this.roleFilter();

    }


    // Status

    const status =
      this.statusFilter();


    if (status === 'active') {

      filters.is_active =
        'true';

    }


    if (status === 'inactive') {

      filters.is_active =
        'false';

    }


    if (status === 'verified') {

      filters.is_verified =
        'true';

    }


    if (status === 'unverified') {

      filters.is_verified =
        'false';

    }


    this.usersService
      .listUsers(filters)
      .subscribe({

        next: (res) => {

          this.users.set(
            res.results || []
          );


          this.totalCount.set(
            res.count || 0
          );


          this.stats.set(
            res.stats || {
              total_users: 0,
              candidates: 0,
              recruiters: 0,
              admins: 0,
              verified: 0
            }
          );


          this.loading.set(false);

        },


        error: (err) => {

          console.error(
            'Failed to load admin users:',
            err
          );


          this.users.set([]);

          this.totalCount.set(0);


          this.stats.set({
            total_users: 0,
            candidates: 0,
            recruiters: 0,
            admins: 0,
            verified: 0
          });


          this.loading.set(false);

        }

      });

  }


  // ==========================================================
  // Pagination
  // ==========================================================

  goToPage(
    page: number
  ): void {

    if (
      page < 1 ||
      page > this.totalPages()
    ) {
      return;
    }

    this.load(page);

  }


  previousPage(): void {

    if (this.hasPreviousPage()) {

      this.load(
        this.currentPage() - 1
      );

    }

  }


  nextPage(): void {

    if (this.hasNextPage()) {

      this.load(
        this.currentPage() + 1
      );

    }

  }


  getPageNumbers(): number[] {

    const total =
      this.totalPages();


    if (total <= 7) {

      return Array.from(
        {
          length: total
        },
        (_, i) => i + 1
      );

    }


    const current =
      this.currentPage();


    if (current <= 4) {

      return [
        1,
        2,
        3,
        4,
        5,
        6,
        7
      ];

    }


    if (
      current >= total - 3
    ) {

      return Array.from(
        {
          length: 7
        },
        (_, i) =>
          total - 6 + i
      );

    }


    return [
      current - 3,
      current - 2,
      current - 1,
      current,
      current + 1,
      current + 2,
      current + 3
    ];

  }

  // ==========================================================
  // Search
  // ==========================================================

  onSearch(
    value: string
  ): void {

    this.searchQuery.set(value);

    this.currentPage.set(1);

    this.searchSubject.next(value);

  }


  // ==========================================================
  // Role Filter
  // ==========================================================

  onRoleChange(
    value: string
  ): void {

    this.roleFilter.set(value);

    this.currentPage.set(1);

    this.load(1);

  }


  // ==========================================================
  // Status Filter
  // ==========================================================

  onStatusChange(
    value: string
  ): void {

    this.statusFilter.set(value);

    this.currentPage.set(1);

    this.load(1);

  }


  // ==========================================================
  // Active Filters
  // ==========================================================

  hasActiveFilters(): boolean {

    return !!(
      this.searchQuery() ||
      this.roleFilter() ||
      this.statusFilter()
    );

  }


  // ==========================================================
  // Clear Filters
  // ==========================================================

  clearFilters(): void {

    this.searchQuery.set('');

    this.roleFilter.set('');

    this.statusFilter.set('');

    this.currentPage.set(1);

    this.load(1);

  }


  // ==========================================================
  // Open User
  // ==========================================================

  openUser(
    user: User
  ): void {

    this.actionSuccess.set(null);

    this.actionError.set(null);

    this.selectedUser.set(null);

    this.acting.set(false);

    this.detailLoading.set(true);


    this.usersService
      .getUserDetails(user.id)
      .subscribe({

        next: (details) => {

          console.log(
            'Admin user details:',
            details
          );


          this.selectedUser.set(
            details
          );


          this.detailLoading.set(false);

        },


        error: (err) => {

          console.error(
            'Failed to load user details:',
            err
          );


          this.detailLoading.set(false);


          this.actionError.set(
            err.error?.detail ||
            'Failed to load complete user details.'
          );


          /*
           * Keep the basic user information visible
           * even if the detail endpoint fails.
           */
          this.selectedUser.set({
            ...user,

            is_staff:
              false,

            is_superuser:
              false,

            last_login:
              null,

            profile:
              null
          });

        }

      });

  }


  // ==========================================================
  // Close User
  // ==========================================================

  closeUser(): void {

    this.selectedUser.set(null);

    this.detailLoading.set(false);

    this.actionSuccess.set(null);

    this.actionError.set(null);

    this.acting.set(false);

  }


  // ==========================================================
  // Update Selected User
  // ==========================================================

  private updateSelectedUser(
    updated: Partial<User>
  ): void {

    const current =
      this.selectedUser();


    if (!current) {
      return;
    }


    this.selectedUser.set({

      ...current,

      ...updated

    });

  }


  // ==========================================================
  // Activate User
  // ==========================================================

  activateUser(
    user: User
  ): void {

    this.acting.set(true);

    this.actionSuccess.set(null);

    this.actionError.set(null);


    this.usersService
      .activate(user.id)
      .subscribe({

        next: (res: any) => {

          this.acting.set(false);


          this.actionSuccess.set(
            res?.message ||
            'User activated successfully.'
          );


          /*
           * Preserve the complete profile information
           * already loaded in the modal.
           */
          this.updateSelectedUser({

            is_active:
              true

          });


          this.updateUserInList({

            ...user,

            is_active:
              true

          });


          this.load(
            this.currentPage()
          );

        },


        error: (err) => {

          this.acting.set(false);


          this.actionError.set(
            err.error?.detail ||
            'Failed to activate user.'
          );

        }

      });

  }


  // ==========================================================
  // Deactivate User
  // ==========================================================

  deactivateUser(
    user: User
  ): void {

    if (
      !confirm(
        `Deactivate ${user.email}? They won't be able to log in.`
      )
    ) {

      return;

    }


    this.acting.set(true);

    this.actionSuccess.set(null);

    this.actionError.set(null);


    this.usersService
      .deactivate(user.id)
      .subscribe({

        next: (res: any) => {

          this.acting.set(false);


          this.actionSuccess.set(
            res?.message ||
            'User deactivated successfully.'
          );


          /*
           * Preserve candidate/HR profile details.
           */
          this.updateSelectedUser({

            is_active:
              false

          });


          this.updateUserInList({

            ...user,

            is_active:
              false

          });


          this.load(
            this.currentPage()
          );

        },


        error: (err) => {

          this.acting.set(false);


          this.actionError.set(
            err.error?.detail ||
            'Failed to deactivate user.'
          );

        }

      });

  }


  // ==========================================================
  // Verify User
  // ==========================================================

  verifyUser(
    user: User
  ): void {

    this.acting.set(true);

    this.actionSuccess.set(null);

    this.actionError.set(null);


    this.usersService
      .verify(user.id)
      .subscribe({

        next: (res: any) => {

          this.acting.set(false);


          this.actionSuccess.set(
            res?.message ||
            'User email verified successfully.'
          );


          /*
           * Preserve complete profile details.
           */
          this.updateSelectedUser({

            is_verified:
              true

          });


          this.updateUserInList({

            ...user,

            is_verified:
              true

          });


          this.load(
            this.currentPage()
          );

        },


        error: (err) => {

          this.acting.set(false);


          this.actionError.set(
            err.error?.detail ||
            'Failed to verify user.'
          );

        }

      });

  }


  // ==========================================================
  // Update User In List
  // ==========================================================

  private updateUserInList(
    updated: User
  ): void {

    const list =
      this.users().map(
        u =>
          u.id === updated.id
            ? {
                ...u,
                ...updated
              }
            : u
      );


    this.users.set(list);

  }


  // ==========================================================
  // Initials
  // ==========================================================

  getInitials(
    u: User
  ): string {

    return (

      (
        u.first_name?.[0] ||
        ''
      ) +

      (
        u.last_name?.[0] ||
        ''
      )

    )
      .toUpperCase() || '?';

  }


  // ==========================================================
  // Avatar Gradient
  // ==========================================================

  getAvatarGradient(
    role: string
  ): string {

    const map:
      Record<string, string> = {

        CANDIDATE:
          'linear-gradient(135deg, #3b82f6, #6366f1)',

        HR:
          'linear-gradient(135deg, #10b981, #14b8a6)',

        SUPER_ADMIN:
          'linear-gradient(135deg, #e11d48, #dc2626)'

      };


    return (
      map[role] ||
      '#6b7280'
    );

  }

  // ==========================================================
  // Role Color
  // ==========================================================

  getRoleColor(
    role: string
  ): string {

    const map:
      Record<string, string> = {

        CANDIDATE:
          '#1d4ed8',

        HR:
          '#065f46',

        SUPER_ADMIN:
          '#b91c1c'

      };


    return (
      map[role] ||
      '#6b7280'
    );

  }


  // ==========================================================
  // Role Background
  // ==========================================================

  getRoleBg(
    role: string
  ): string {

    const map:
      Record<string, string> = {

        CANDIDATE:
          '#dbeafe',

        HR:
          '#d1fae5',

        SUPER_ADMIN:
          '#fee2e2'

      };


    return (
      map[role] ||
      '#f3f4f6'
    );

  }


  // ==========================================================
  // Role Formatting
  // ==========================================================

  formatRole(
    role: string
  ): string {

    const map:
      Record<string, string> = {

        CANDIDATE:
          'Candidate',

        HR:
          'Recruiter',

        SUPER_ADMIN:
          'Super Admin'

      };


    return (
      map[role] ||
      role
    );

  }


  // ==========================================================
  // Date Formatting
  // ==========================================================

  formatDate(
    dateStr: string | undefined | null
  ): string {

    if (!dateStr) {
      return '—';
    }


    const date =
      new Date(dateStr);


    if (
      Number.isNaN(
        date.getTime()
      )
    ) {

      return '—';

    }


    return date.toLocaleDateString(
      'en-US',
      {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      }
    );

  }


  // ==========================================================
  // Date + Time Formatting
  // ==========================================================

  formatDateTime(
    dateStr: string | undefined | null
  ): string {

    if (!dateStr) {
      return 'Never';
    }


    const date =
      new Date(dateStr);


    if (
      Number.isNaN(
        date.getTime()
      )
    ) {

      return '—';

    }


    return date.toLocaleString(
      'en-US',
      {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      }
    );

  }


  // ==========================================================
  // Salary Formatting
  // ==========================================================

  formatSalary(
    salary: string | null | undefined
  ): string {

    if (
      salary === null ||
      salary === undefined ||
      salary === ''
    ) {

      return 'Not provided';

    }


    const numericSalary =
      Number(salary);


    if (
      Number.isNaN(
        numericSalary
      )
    ) {

      return salary;

    }


    return numericSalary.toLocaleString(
      'en-IN',
      {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
      }
    );

  }


  // ==========================================================
  // Skills Formatting
  // ==========================================================

  getSkills(
    skills: string | null | undefined
  ): string[] {

    if (!skills) {
      return [];
    }


    return skills
      .split(',')
      .map(
        skill =>
          skill.trim()
      )
      .filter(
        skill =>
          skill.length > 0
      );

  }


  // ==========================================================
  // Resume Visibility Formatting
  // ==========================================================

  formatVisibility(
    visibility: string
  ): string {

    const map:
      Record<string, string> = {

        PRIVATE:
          'Private',

        RECRUITERS:
          'Recruiters Only',

        PUBLIC:
          'Public'

      };


    return (
      map[visibility] ||
      visibility
    );

  }

}