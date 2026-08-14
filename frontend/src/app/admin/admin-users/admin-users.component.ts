import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';

import { TopNavComponent } from '../../shared/top-nav/top-nav.component';
import { AdminUsersService, UserFilters } from '../../core/services/admin-users.service';
import { User } from '../../core/models/user.model';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, FormsModule, TopNavComponent],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-slate-50 via-rose-50 to-red-50">
      <app-top-nav portalName="Admin Console"></app-top-nav>

      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        <div class="mb-8 animate-fade-in">
          <h1 class="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">User Management 👥</h1>
          <p class="text-gray-600">View, activate, and manage all platform users.</p>
        </div>

        <!-- Stats -->
        <div class="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
          <div class="bg-white rounded-xl p-4 shadow-soft">
            <div class="text-2xl font-bold text-gray-900">{{ totalCount() }}</div>
            <div class="text-xs text-gray-500">Total Users</div>
          </div>
          <div class="bg-white rounded-xl p-4 shadow-soft">
            <div class="text-2xl font-bold text-blue-600">{{ countByRole('CANDIDATE') }}</div>
            <div class="text-xs text-gray-500">Candidates</div>
          </div>
          <div class="bg-white rounded-xl p-4 shadow-soft">
            <div class="text-2xl font-bold text-emerald-600">{{ countByRole('HR') }}</div>
            <div class="text-xs text-gray-500">Recruiters</div>
          </div>
          <div class="bg-white rounded-xl p-4 shadow-soft">
            <div class="text-2xl font-bold text-rose-600">{{ countByRole('SUPER_ADMIN') }}</div>
            <div class="text-xs text-gray-500">Admins</div>
          </div>
          <div class="bg-white rounded-xl p-4 shadow-soft">
            <div class="text-2xl font-bold text-purple-600">{{ verifiedCount() }}</div>
            <div class="text-xs text-gray-500">Verified</div>
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
                placeholder="Search by name, email, phone..."
                class="w-full pl-10 pr-4 py-2 bg-gray-50 border-2 border-gray-100 rounded-lg text-sm focus:bg-white focus:border-rose-500 outline-none" />
            </div>
            <select [ngModel]="roleFilter()" (ngModelChange)="onRoleChange($event)"
              class="px-3 py-2 bg-gray-50 border-2 border-gray-100 rounded-lg text-sm focus:bg-white focus:border-rose-500 outline-none">
              <option value="">All Roles</option>
              <option value="CANDIDATE">Candidates</option>
              <option value="HR">Recruiters</option>
              <option value="SUPER_ADMIN">Admins</option>
            </select>
            <select [ngModel]="statusFilter()" (ngModelChange)="onStatusChange($event)"
              class="px-3 py-2 bg-gray-50 border-2 border-gray-100 rounded-lg text-sm focus:bg-white focus:border-rose-500 outline-none">
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Deactivated</option>
              <option value="verified">Verified</option>
              <option value="unverified">Unverified</option>
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
        <div *ngIf="!loading() && users().length === 0"
            class="bg-white rounded-2xl shadow-soft p-12 text-center animate-fade-in">
            <div class="w-20 h-20 bg-gradient-to-br from-rose-100 to-red-100 rounded-3xl flex items-center justify-center mx-auto mb-4">
                <span class="text-4xl">👥</span>
            </div>
            <h3 class="text-lg font-bold text-gray-900 mb-2">No users found</h3>
            <p class="text-gray-500 mb-4" *ngIf="hasActiveFilters()">
                No users match your current filters. Try clearing them.
            </p>
            <p class="text-gray-500 mb-4" *ngIf="!hasActiveFilters()">
                There are no users in the system yet.
            </p>
            <button *ngIf="hasActiveFilters()" (click)="clearFilters()"
                class="px-6 py-2.5 bg-gradient-to-r from-rose-600 to-red-600 text-white text-sm font-semibold rounded-xl shadow-md hover:shadow-lg transition-all">
                Clear all filters
            </button>
        </div>

        <!-- Users List -->
        <div *ngIf="!loading() && users().length > 0" class="bg-white rounded-2xl shadow-soft overflow-hidden animate-slide-up">
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead class="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th class="text-left px-4 py-3 font-semibold text-gray-700">User</th>
                  <th class="text-left px-4 py-3 font-semibold text-gray-700 hidden sm:table-cell">Role</th>
                  <th class="text-left px-4 py-3 font-semibold text-gray-700 hidden md:table-cell">Status</th>
                  <th class="text-left px-4 py-3 font-semibold text-gray-700 hidden lg:table-cell">Joined</th>
                  <th class="text-right px-4 py-3 font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let user of users(); let i = index"
                  class="border-b border-gray-100 hover:bg-gray-50 transition-all animate-slide-in-right"
                  [style.animation-delay]="(i * 0.02) + 's'">
                  <td class="px-4 py-3">
                    <div class="flex items-center gap-3">
                      <div class="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0"
                        [style.background]="getAvatarGradient(user.role)">
                        {{ getInitials(user) }}
                      </div>
                      <div class="min-w-0">
                        <div class="font-semibold text-gray-900 truncate">{{ user.first_name }} {{ user.last_name }}</div>
                        <div class="text-xs text-gray-500 truncate">{{ user.email }}</div>
                      </div>
                    </div>
                  </td>
                  <td class="px-4 py-3 hidden sm:table-cell">
                    <span class="inline-flex items-center px-2 py-1 text-xs font-bold rounded-full"
                      [style.background]="getRoleBg(user.role)"
                      [style.color]="getRoleColor(user.role)">
                      {{ formatRole(user.role) }}
                    </span>
                  </td>
                  <td class="px-4 py-3 hidden md:table-cell">
                    <div class="flex flex-col gap-1">
                      <span *ngIf="user.is_active" class="inline-flex items-center gap-1 text-xs text-emerald-700">
                        <span class="w-2 h-2 bg-emerald-500 rounded-full"></span> Active
                      </span>
                      <span *ngIf="!user.is_active" class="inline-flex items-center gap-1 text-xs text-red-700">
                        <span class="w-2 h-2 bg-red-500 rounded-full"></span> Deactivated
                      </span>
                      <span *ngIf="user.is_verified" class="text-xs text-blue-700">✓ Verified</span>
                      <span *ngIf="!user.is_verified" class="text-xs text-amber-700">⚠ Unverified</span>
                    </div>
                  </td>
                  <td class="px-4 py-3 hidden lg:table-cell text-xs text-gray-500">
                    {{ formatDate(user.date_joined) }}
                  </td>
                  <td class="px-4 py-3">
                    <div class="flex justify-end gap-1">
                      <button (click)="openUser(user)"
                        class="p-2 text-blue-600 hover:bg-blue-50 rounded-lg" title="View details">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </div>

      <!-- User Detail Modal -->
      <div *ngIf="selectedUser() as u"
        class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
        (click)="closeUser()">
        <div class="bg-white rounded-2xl shadow-2xl max-w-lg w-full animate-scale-in" (click)="$event.stopPropagation()">

          <!-- Header -->
          <div class="p-6 border-b border-gray-100">
            <div class="flex items-start justify-between mb-4">
              <div class="flex items-center gap-4">
                <div class="w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-bold shadow-md"
                  [style.background]="getAvatarGradient(u.role)">
                  {{ getInitials(u) }}
                </div>
                <div>
                  <h2 class="text-xl font-bold text-gray-900">{{ u.first_name }} {{ u.last_name }}</h2>
                  <p class="text-sm text-gray-500">{{ u.email }}</p>
                </div>
              </div>
              <button (click)="closeUser()" class="text-gray-400 hover:text-gray-600">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>

            <div class="flex flex-wrap gap-2">
              <span class="inline-flex items-center px-2 py-1 text-xs font-bold rounded-full"
                [style.background]="getRoleBg(u.role)"
                [style.color]="getRoleColor(u.role)">
                {{ formatRole(u.role) }}
              </span>
              <span *ngIf="u.is_active" class="inline-flex items-center gap-1 px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full">
                <span class="w-2 h-2 bg-emerald-500 rounded-full"></span> Active
              </span>
              <span *ngIf="!u.is_active" class="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full">
                <span class="w-2 h-2 bg-red-500 rounded-full"></span> Deactivated
              </span>
              <span *ngIf="u.is_verified" class="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full">
                ✓ Email Verified
              </span>
              <span *ngIf="!u.is_verified" class="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-full">
                ⚠ Unverified
              </span>
            </div>
          </div>

          <!-- Details -->
          <div class="p-6 space-y-3 text-sm">
            <div class="flex justify-between">
              <span class="text-gray-500">User ID</span>
              <span class="font-semibold text-gray-900">#{{ u.id }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-500">Phone</span>
              <span class="font-semibold text-gray-900">{{ u.phone || 'Not provided' }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-500">Joined</span>
              <span class="font-semibold text-gray-900">{{ formatDate(u.date_joined) }}</span>
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
              <button *ngIf="!u.is_verified" (click)="verifyUser(u)" [disabled]="acting()"
                class="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg disabled:opacity-50 transition-all">
                ✓ Verify Email
              </button>
              <button *ngIf="u.is_active" (click)="deactivateUser(u)" [disabled]="acting()"
                class="px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg disabled:opacity-50 transition-all">
                🚫 Deactivate
              </button>
              <button *ngIf="!u.is_active" (click)="activateUser(u)" [disabled]="acting()"
                class="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg disabled:opacity-50 transition-all">
                ▶️ Activate
              </button>
              <button (click)="closeUser()"
                class="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold rounded-lg transition-all col-span-2 sm:col-span-1">
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
  private usersService = inject(AdminUsersService);

  users = signal<User[]>([]);
  loading = signal(true);
  totalCount = signal(0);

  searchQuery = signal('');
  roleFilter = signal('');
  statusFilter = signal('');

  selectedUser = signal<User | null>(null);
  acting = signal(false);
  actionSuccess = signal<string | null>(null);
  actionError = signal<string | null>(null);

  private searchSubject = new Subject<string>();

  countByRole = (role: string) => this.users().filter(u => u.role === role).length;
  verifiedCount = () => this.users().filter(u => u.is_verified).length;

  ngOnInit(): void {
    this.searchSubject.pipe(debounceTime(400), distinctUntilChanged()).subscribe(() => this.load());
    this.load();
  }

  load(): void {
    this.loading.set(true);
    const filters: UserFilters = { page: 1 };
    if (this.searchQuery()) filters.search = this.searchQuery();
    if (this.roleFilter()) filters.role = this.roleFilter();

    const s = this.statusFilter();
    if (s === 'active') filters.is_active = 'true';
    if (s === 'inactive') filters.is_active = 'false';
    if (s === 'verified') filters.is_verified = 'true';
    if (s === 'unverified') filters.is_verified = 'false';

    this.usersService.listUsers(filters).subscribe({
      next: (res) => {
        this.users.set(res.results || []);
        this.totalCount.set(res.count || 0);
        this.loading.set(false);
      },
      error: () => {
        this.users.set([]);
        this.loading.set(false);
      }
    });
  }

    hasActiveFilters(): boolean {
    return !!(this.searchQuery() || this.roleFilter() || this.statusFilter());
  }

  clearFilters(): void {
    this.searchQuery.set('');
    this.roleFilter.set('');
    this.statusFilter.set('');
    this.load();
  }

  onSearch(value: string): void {
    this.searchQuery.set(value);
    this.searchSubject.next(value);
  }

  onRoleChange(value: string): void {
    this.roleFilter.set(value);
    this.load();
  }

  onStatusChange(value: string): void {
    this.statusFilter.set(value);
    this.load();
  }

  openUser(user: User): void {
    this.actionSuccess.set(null);
    this.actionError.set(null);
    this.selectedUser.set(user);
  }

  closeUser(): void {
    this.selectedUser.set(null);
  }

    activateUser(user: User): void {
    this.acting.set(true);
    this.usersService.activate(user.id).subscribe({
      next: (res: any) => {
        this.acting.set(false);
        this.actionSuccess.set(res.message);
        this.selectedUser.set(res.user);
        this.load();  // ✅ Reload
      },
      error: (err) => {
        this.acting.set(false);
        this.actionError.set(err.error?.detail || 'Action failed.');
      }
    });
  }

  verifyUser(user: User): void {
    this.acting.set(true);
    this.usersService.verify(user.id).subscribe({
      next: (res: any) => {
        this.acting.set(false);
        this.actionSuccess.set(res.message);
        this.selectedUser.set(res.user);
        this.load();  // ✅ Reload
      },
      error: (err) => {
        this.acting.set(false);
        this.actionError.set(err.error?.detail || 'Action failed.');
      }
    });
  }

    deactivateUser(user: User): void {
    if (!confirm(`Deactivate ${user.email}? They won't be able to log in.`)) return;
    this.acting.set(true);
    this.usersService.deactivate(user.id).subscribe({
      next: (res: any) => {
        this.acting.set(false);
        this.actionSuccess.set(res.message);
        this.selectedUser.set(res.user);
        this.load();  // ✅ Reload the full list so filters apply correctly
      },
      error: (err) => {
        this.acting.set(false);
        this.actionError.set(err.error?.detail || 'Action failed.');
      }
    });
  }

  private updateUserInList(updated: User): void {
    const list = this.users().map(u => u.id === updated.id ? updated : u);
    this.users.set(list);
  }

  getInitials(u: User): string {
    return ((u.first_name?.[0] || '') + (u.last_name?.[0] || '')).toUpperCase() || '?';
  }

  getAvatarGradient(role: string): string {
    const map: Record<string, string> = {
      CANDIDATE: 'linear-gradient(135deg, #3b82f6, #6366f1)',
      HR: 'linear-gradient(135deg, #10b981, #14b8a6)',
      SUPER_ADMIN: 'linear-gradient(135deg, #e11d48, #dc2626)',
    };
    return map[role] || '#6b7280';
  }

  getRoleColor(role: string): string {
    const map: Record<string, string> = {
      CANDIDATE: '#1d4ed8',
      HR: '#065f46',
      SUPER_ADMIN: '#b91c1c',
    };
    return map[role] || '#6b7280';
  }

  getRoleBg(role: string): string {
    const map: Record<string, string> = {
      CANDIDATE: '#dbeafe',
      HR: '#d1fae5',
      SUPER_ADMIN: '#fee2e2',
    };
    return map[role] || '#f3f4f6';
  }

  formatRole(role: string): string {
    const map: Record<string, string> = {
      CANDIDATE: 'Candidate',
      HR: 'Recruiter',
      SUPER_ADMIN: 'Super Admin',
    };
    return map[role] || role;
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