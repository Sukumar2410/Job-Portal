import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';

import { TopNavComponent } from '../../shared/top-nav/top-nav.component';
import { AuditLogsService, AuditLog, AuditLogStats, AuditLogFilters, AuditActionOption } from '../../core/services/audit-logs.service';

@Component({
  selector: 'app-admin-audit-logs',
  standalone: true,
  imports: [CommonModule, FormsModule, TopNavComponent],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-slate-50 via-rose-50 to-red-50">
      <app-top-nav portalName="Admin Console"></app-top-nav>

      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 animate-fade-in">
          <div>
            <h1 class="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">Audit Logs 🔍</h1>
            <p class="text-gray-600">Compliance-grade tracking of every important action.</p>
          </div>
          <button (click)="refresh()" [disabled]="loading()"
            class="inline-flex items-center gap-2 px-4 py-2 bg-white border-2 border-gray-200 text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-50 transition-all disabled:opacity-50">
            <svg class="w-4 h-4" [class.animate-spin]="loading()" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
            </svg>
            Refresh
          </button>
        </div>

        <!-- Stats Bar -->
        <div *ngIf="stats() as s" class="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6 animate-slide-up">
          <div class="bg-white rounded-xl p-4 shadow-soft">
            <div class="text-2xl font-bold text-gray-900">{{ s.total_logs }}</div>
            <div class="text-xs text-gray-500">Total Logs</div>
          </div>
          <div class="bg-white rounded-xl p-4 shadow-soft">
            <div class="text-2xl font-bold text-blue-600">{{ s.logs_today }}</div>
            <div class="text-xs text-gray-500">Today</div>
          </div>
          <div class="bg-white rounded-xl p-4 shadow-soft">
            <div class="text-2xl font-bold text-purple-600">{{ s.logs_this_week }}</div>
            <div class="text-xs text-gray-500">This Week</div>
          </div>
          <div class="bg-white rounded-xl p-4 shadow-soft">
            <div class="text-2xl font-bold text-amber-600">{{ s.warning_count }}</div>
            <div class="text-xs text-gray-500">Warnings</div>
          </div>
          <div class="bg-white rounded-xl p-4 shadow-soft">
            <div class="text-2xl font-bold text-red-600">{{ s.critical_count }}</div>
            <div class="text-xs text-gray-500">Critical</div>
          </div>
        </div>

        <!-- Filters -->
        <div class="bg-white rounded-2xl shadow-soft p-4 mb-6 animate-slide-up">
          <div class="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div class="md:col-span-2 relative">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                </svg>
              </div>
              <input type="text" [ngModel]="searchQuery()" (ngModelChange)="onSearch($event)"
                placeholder="Search description, email, or target..."
                class="w-full pl-10 pr-4 py-2 bg-gray-50 border-2 border-gray-100 rounded-lg text-sm focus:bg-white focus:border-rose-500 outline-none" />
            </div>
            <select [ngModel]="actionFilter()" (ngModelChange)="onActionChange($event)"
              class="px-3 py-2 bg-gray-50 border-2 border-gray-100 rounded-lg text-sm focus:bg-white focus:border-rose-500 outline-none">
              <option value="">All Actions</option>
              <option *ngFor="let opt of actionOptions()" [value]="opt.value">{{ opt.label }}</option>
            </select>
            <select [ngModel]="severityFilter()" (ngModelChange)="onSeverityChange($event)"
              class="px-3 py-2 bg-gray-50 border-2 border-gray-100 rounded-lg text-sm focus:bg-white focus:border-rose-500 outline-none">
              <option value="">All Severities</option>
              <option value="INFO">Info</option>
              <option value="WARNING">Warning</option>
              <option value="CRITICAL">Critical</option>
            </select>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-4 gap-3 mt-3">
            <select [ngModel]="roleFilter()" (ngModelChange)="onRoleChange($event)"
              class="px-3 py-2 bg-gray-50 border-2 border-gray-100 rounded-lg text-sm focus:bg-white focus:border-rose-500 outline-none">
              <option value="">All Actor Roles</option>
              <option value="CANDIDATE">Candidates</option>
              <option value="HR">Recruiters</option>
              <option value="SUPER_ADMIN">Super Admins</option>
            </select>
            <select [ngModel]="orderingFilter()" (ngModelChange)="onOrderingChange($event)"
              class="px-3 py-2 bg-gray-50 border-2 border-gray-100 rounded-lg text-sm focus:bg-white focus:border-rose-500 outline-none">
              <option value="-created_at">Newest First</option>
              <option value="created_at">Oldest First</option>
            </select>
            <button *ngIf="hasActiveFilters()" (click)="clearFilters()"
              class="px-3 py-2 bg-red-50 text-red-600 border-2 border-red-200 rounded-lg text-sm font-medium hover:bg-red-100 transition-all">
              ✕ Clear filters
            </button>
            <div class="flex items-center justify-end text-sm text-gray-500">
              <strong class="text-gray-900 mr-1">{{ totalCount() }}</strong> logs found
            </div>
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
        <div *ngIf="!loading() && logs().length === 0"
          class="bg-white rounded-2xl shadow-soft p-12 text-center animate-fade-in">
          <div class="w-20 h-20 bg-gradient-to-br from-rose-100 to-red-100 rounded-3xl flex items-center justify-center mx-auto mb-4">
            <span class="text-4xl">🔍</span>
          </div>
          <h3 class="text-lg font-bold text-gray-900 mb-2">No audit logs found</h3>
          <p class="text-gray-500">Try clearing your filters or perform some actions.</p>
        </div>

        <!-- Logs List -->
        <div *ngIf="!loading() && logs().length > 0" class="space-y-2">
          <div *ngFor="let log of logs(); let i = index"
            class="bg-white rounded-xl shadow-soft hover:shadow-md transition-all animate-slide-up p-4 cursor-pointer"
            [style.animation-delay]="(i * 0.02) + 's'"
            [style.border-left]="'4px solid ' + getSeverityColor(log.severity)"
            (click)="openLog(log)">

            <div class="flex items-start justify-between gap-3">
              <div class="flex items-start gap-3 min-w-0 flex-1">
                <!-- Severity Icon -->
                <div class="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 text-lg"
                  [style.background]="getSeverityBg(log.severity)">
                  {{ getSeverityIcon(log.severity) }}
                </div>

                <div class="min-w-0 flex-1">
                  <div class="flex flex-wrap items-center gap-2 mb-1">
                    <span class="font-semibold text-gray-900 text-sm">{{ log.action_display }}</span>
                    <span class="text-xs px-2 py-0.5 rounded-full font-medium"
                      [style.background]="getSeverityBg(log.severity)"
                      [style.color]="getSeverityColor(log.severity)">
                      {{ log.severity }}
                    </span>
                  </div>
                  <p class="text-sm text-gray-700 truncate">{{ log.description }}</p>
                  <div class="flex flex-wrap items-center gap-2 mt-1 text-xs text-gray-500">
                    <span class="font-medium">{{ log.actor_name || 'System' }}</span>
                    <span *ngIf="log.actor_role">·</span>
                    <span *ngIf="log.actor_role" class="px-1.5 py-0.5 rounded"
                      [style.background]="getRoleBg(log.actor_role)"
                      [style.color]="getRoleColor(log.actor_role)">
                      {{ formatRole(log.actor_role) }}
                    </span>
                    <span>·</span>
                    <span>{{ log.time_since }}</span>
                    <span *ngIf="log.ip_address">·</span>
                    <span *ngIf="log.ip_address" class="font-mono text-[10px]">{{ log.ip_address }}</span>
                  </div>
                </div>
              </div>

              <svg class="w-4 h-4 text-gray-400 flex-shrink-0 mt-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
              </svg>
            </div>
          </div>
        </div>

        <!-- Pagination -->
        <div *ngIf="!loading() && logs().length > 0 && totalPages() > 1" class="mt-6 flex justify-center gap-2">
          <button (click)="goToPage(currentPage() - 1)" [disabled]="currentPage() === 1"
            class="px-4 py-2 bg-white border-2 border-gray-200 rounded-lg text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:border-rose-500 hover:text-rose-600 transition-all">
            ← Previous
          </button>
          <span class="px-4 py-2 text-sm text-gray-600">
            Page <strong>{{ currentPage() }}</strong> of <strong>{{ totalPages() }}</strong>
          </span>
          <button (click)="goToPage(currentPage() + 1)" [disabled]="currentPage() === totalPages()"
            class="px-4 py-2 bg-white border-2 border-gray-200 rounded-lg text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:border-rose-500 hover:text-rose-600 transition-all">
            Next →
          </button>
        </div>

      </div>

      <!-- Detail Modal -->
      <div *ngIf="selectedLog() as log"
        class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
        (click)="closeLog()">
        <div class="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-scale-in" (click)="$event.stopPropagation()">

          <!-- Header -->
          <div class="p-6 border-b border-gray-100">
            <div class="flex items-start justify-between mb-4">
              <div class="flex items-center gap-4">
                <div class="w-12 h-12 rounded-xl flex items-center justify-center text-xl"
                  [style.background]="getSeverityBg(log.severity)">
                  {{ getSeverityIcon(log.severity) }}
                </div>
                <div>
                  <h2 class="text-xl font-bold text-gray-900">{{ log.action_display }}</h2>
                  <p class="text-sm text-gray-500 font-mono">Log #{{ log.id }}</p>
                </div>
              </div>
              <button (click)="closeLog()" class="text-gray-400 hover:text-gray-600">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>

            <div class="flex flex-wrap gap-2">
              <span class="inline-flex items-center px-2 py-1 text-xs font-bold rounded-full"
                [style.background]="getSeverityBg(log.severity)"
                [style.color]="getSeverityColor(log.severity)">
                {{ log.severity_display }}
              </span>
              <span *ngIf="log.actor_role" class="inline-flex items-center px-2 py-1 text-xs font-bold rounded-full"
                [style.background]="getRoleBg(log.actor_role)"
                [style.color]="getRoleColor(log.actor_role)">
                {{ formatRole(log.actor_role) }}
              </span>
              <span class="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-700 text-xs font-bold rounded-full">
                {{ log.time_since }}
              </span>
            </div>
          </div>

          <!-- Details -->
          <div class="p-6 space-y-4">

            <!-- Description -->
            <div>
              <div class="text-xs font-semibold text-gray-500 mb-1">DESCRIPTION</div>
              <p class="text-sm text-gray-900">{{ log.description || 'No description' }}</p>
            </div>

            <!-- Actor -->
            <div class="grid grid-cols-2 gap-3">
              <div class="p-3 bg-gray-50 rounded-lg">
                <div class="text-xs text-gray-500 mb-1">Actor</div>
                <div class="font-semibold text-gray-900 text-sm">{{ log.actor_name || 'System' }}</div>
                <div class="text-xs text-gray-500">{{ log.actor_email || '—' }}</div>
              </div>
              <div class="p-3 bg-gray-50 rounded-lg">
                <div class="text-xs text-gray-500 mb-1">Target</div>
                <div class="font-semibold text-gray-900 text-sm">{{ log.target_type || '—' }}</div>
                <div class="text-xs text-gray-500">{{ log.target_repr || 'No target' }}</div>
              </div>
              <div class="p-3 bg-gray-50 rounded-lg">
                <div class="text-xs text-gray-500 mb-1">IP Address</div>
                <div class="font-mono text-sm text-gray-900">{{ log.ip_address || 'N/A' }}</div>
              </div>
              <div class="p-3 bg-gray-50 rounded-lg">
                <div class="text-xs text-gray-500 mb-1">Timestamp</div>
                <div class="text-sm text-gray-900">{{ formatFullDate(log.created_at) }}</div>
              </div>
            </div>

            <!-- Changes -->
            <div *ngIf="log.changes && hasKeys(log.changes)">
              <div class="text-xs font-semibold text-gray-500 mb-1">CHANGES</div>
              <pre class="p-3 bg-gray-900 text-green-400 text-xs rounded-lg overflow-x-auto font-mono">{{ formatJson(log.changes) }}</pre>
            </div>

            <!-- Metadata -->
            <div *ngIf="log.metadata && hasKeys(log.metadata)">
              <div class="text-xs font-semibold text-gray-500 mb-1">METADATA</div>
              <pre class="p-3 bg-gray-900 text-blue-300 text-xs rounded-lg overflow-x-auto font-mono">{{ formatJson(log.metadata) }}</pre>
            </div>

            <!-- User Agent -->
            <div *ngIf="log.user_agent">
              <div class="text-xs font-semibold text-gray-500 mb-1">USER AGENT</div>
              <p class="text-xs text-gray-600 font-mono break-all bg-gray-50 p-2 rounded">{{ log.user_agent }}</p>
            </div>
          </div>

          <!-- Footer -->
          <div class="p-6 border-t border-gray-100">
            <button (click)="closeLog()"
              class="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg transition-all">
              Close
            </button>
          </div>
        </div>
      </div>

    </div>
  `
})
export class AdminAuditLogsComponent implements OnInit {
  private auditService = inject(AuditLogsService);

  logs = signal<AuditLog[]>([]);
  stats = signal<AuditLogStats | null>(null);
  actionOptions = signal<AuditActionOption[]>([]);
  loading = signal(true);
  totalCount = signal(0);
  currentPage = signal(1);
  pageSize = 20;

  searchQuery = signal('');
  actionFilter = signal('');
  severityFilter = signal('');
  roleFilter = signal('');
  orderingFilter = signal('-created_at');

  selectedLog = signal<AuditLog | null>(null);

  private searchSubject = new Subject<string>();

  totalPages = () => Math.ceil(this.totalCount() / this.pageSize);

  ngOnInit(): void {
    this.searchSubject.pipe(debounceTime(400), distinctUntilChanged()).subscribe(() => {
      this.currentPage.set(1);
      this.loadLogs();
    });
    this.loadStats();
    this.loadActions();
    this.loadLogs();
  }

  loadStats(): void {
    this.auditService.getStats().subscribe({
      next: (s) => this.stats.set(s),
      error: () => this.stats.set(null)
    });
  }

  loadActions(): void {
    this.auditService.getActions().subscribe({
      next: (a) => this.actionOptions.set(a || []),
      error: () => this.actionOptions.set([])
    });
  }

  loadLogs(): void {
    this.loading.set(true);
    const filters: AuditLogFilters = {
      page: this.currentPage(),
      ordering: this.orderingFilter(),
    };
    if (this.searchQuery()) filters.search = this.searchQuery();
    if (this.actionFilter()) filters.action = this.actionFilter();
    if (this.severityFilter()) filters.severity = this.severityFilter();
    if (this.roleFilter()) filters.actor_role = this.roleFilter();

    this.auditService.listLogs(filters).subscribe({
      next: (res) => {
        this.logs.set(res.results || []);
        this.totalCount.set(res.count || 0);
        this.loading.set(false);
      },
      error: () => {
        this.logs.set([]);
        this.loading.set(false);
      }
    });
  }

  refresh(): void {
    this.loadStats();
    this.loadLogs();
  }

  onSearch(v: string): void {
    this.searchQuery.set(v);
    this.searchSubject.next(v);
  }

  onActionChange(v: string): void {
    this.actionFilter.set(v);
    this.currentPage.set(1);
    this.loadLogs();
  }

  onSeverityChange(v: string): void {
    this.severityFilter.set(v);
    this.currentPage.set(1);
    this.loadLogs();
  }

  onRoleChange(v: string): void {
    this.roleFilter.set(v);
    this.currentPage.set(1);
    this.loadLogs();
  }

  onOrderingChange(v: string): void {
    this.orderingFilter.set(v);
    this.loadLogs();
  }

  hasActiveFilters(): boolean {
    return !!(this.searchQuery() || this.actionFilter() || this.severityFilter() || this.roleFilter());
  }

  clearFilters(): void {
    this.searchQuery.set('');
    this.actionFilter.set('');
    this.severityFilter.set('');
    this.roleFilter.set('');
    this.orderingFilter.set('-created_at');
    this.currentPage.set(1);
    this.loadLogs();
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages()) return;
    this.currentPage.set(page);
    this.loadLogs();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  openLog(log: AuditLog): void {
    this.selectedLog.set(log);
  }

  closeLog(): void {
    this.selectedLog.set(null);
  }

  getSeverityIcon(sev: string): string {
    const map: Record<string, string> = { INFO: 'ℹ️', WARNING: '⚠️', CRITICAL: '🚨' };
    return map[sev] || '📝';
  }

  getSeverityColor(sev: string): string {
    const map: Record<string, string> = { INFO: '#3b82f6', WARNING: '#f59e0b', CRITICAL: '#ef4444' };
    return map[sev] || '#6b7280';
  }

  getSeverityBg(sev: string): string {
    const map: Record<string, string> = { INFO: '#dbeafe', WARNING: '#fef3c7', CRITICAL: '#fee2e2' };
    return map[sev] || '#f3f4f6';
  }

  getRoleColor(role: string): string {
    const map: Record<string, string> = { CANDIDATE: '#1d4ed8', HR: '#065f46', SUPER_ADMIN: '#b91c1c' };
    return map[role] || '#6b7280';
  }

  getRoleBg(role: string): string {
    const map: Record<string, string> = { CANDIDATE: '#dbeafe', HR: '#d1fae5', SUPER_ADMIN: '#fee2e2' };
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

  formatFullDate(dateStr: string): string {
    return new Date(dateStr).toLocaleString('en-US', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
  }

  hasKeys(obj: any): boolean {
    return obj && typeof obj === 'object' && Object.keys(obj).length > 0;
  }

  formatJson(obj: any): string {
    try {
      return JSON.stringify(obj, null, 2);
    } catch {
      return String(obj);
    }
  }
}