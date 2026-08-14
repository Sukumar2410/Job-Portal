import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { TopNavComponent } from '../shared/top-nav/top-nav.component';
import { NotificationsService, AppNotification } from '../core/services/notifications.service';
import { AuthService } from '../core/services/auth.service';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule, TopNavComponent],
  template: `
    <div class="min-h-screen" [ngClass]="bgGradient">
      <app-top-nav [portalName]="portalName"></app-top-nav>

      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 animate-fade-in">
          <div>
            <h1 class="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">Notifications 🔔</h1>
            <p class="text-gray-600">Stay updated with your latest activity.</p>
          </div>
          <button *ngIf="hasUnread()" (click)="markAllRead()"
            class="px-4 py-2 bg-white border-2 border-gray-200 text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-50 transition-all">
            ✓ Mark all as read
          </button>
        </div>

        <!-- Loading -->
        <div *ngIf="loading()" class="flex justify-center py-20">
          <svg class="animate-spin w-10 h-10 text-primary-600" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
          </svg>
        </div>

        <!-- Empty -->
        <div *ngIf="!loading() && notifications().length === 0"
          class="bg-white rounded-2xl shadow-soft p-12 text-center animate-fade-in">
          <div class="w-24 h-24 bg-gradient-to-br from-primary-100 to-purple-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <span class="text-5xl">🔔</span>
          </div>
          <h3 class="text-xl font-bold text-gray-900 mb-2">No notifications yet</h3>
          <p class="text-gray-500">
            You're all caught up! Notifications will appear here when there's activity.
          </p>
        </div>

        <!-- Notifications List -->
        <div *ngIf="!loading() && notifications().length > 0" class="space-y-3">
          <div *ngFor="let notif of notifications(); let i = index"
            class="bg-white rounded-2xl shadow-soft hover:shadow-lg transition-all animate-slide-up p-5 cursor-pointer relative"
            [style.animation-delay]="(i * 0.05) + 's'"
            [ngClass]="{'border-l-4 border-l-primary-500': !notif.is_read}"
            (click)="handleClick(notif)">

            <div class="flex items-start gap-4">
              <!-- Icon -->
              <div class="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 text-2xl"
                [style.background]="getIconBg(notif.notification_type)">
                {{ getIcon(notif.notification_type) }}
              </div>

              <!-- Content -->
              <div class="flex-1 min-w-0">
                <div class="flex items-start justify-between gap-2">
                  <div class="min-w-0">
                    <h3 class="font-bold text-gray-900" [ngClass]="{'text-gray-500': notif.is_read}">
                      {{ notif.title }}
                    </h3>
                    <p class="text-sm text-gray-600 mt-1 whitespace-pre-line">{{ notif.message }}</p>
                    <div class="mt-2 flex items-center gap-2 text-xs text-gray-400">
                      <span>{{ notif.time_since }}</span>
                      <span *ngIf="notif.priority === 'HIGH' || notif.priority === 'URGENT'"
                        class="px-2 py-0.5 bg-red-100 text-red-700 rounded font-semibold">
                        {{ notif.priority_display }}
                      </span>
                    </div>
                  </div>

                  <div class="flex items-center gap-2 flex-shrink-0">
                    <span *ngIf="!notif.is_read" class="w-2 h-2 bg-primary-500 rounded-full"></span>
                    <button (click)="deleteNotif(notif, $event)"
                      class="text-gray-400 hover:text-red-500 p-1 rounded-lg hover:bg-red-50 transition-all">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22"/>
                      </svg>
                    </button>
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
export class NotificationsComponent implements OnInit {
  private notificationsService = inject(NotificationsService);
  private auth = inject(AuthService);
  private router = inject(Router);

  notifications = signal<AppNotification[]>([]);
  loading = signal(true);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.notificationsService.list().subscribe({
      next: (res: any) => {
        this.notifications.set(res.results || res || []);
        this.loading.set(false);
        // Refresh unread count
        this.notificationsService.getUnreadCount().subscribe();
      },
      error: () => {
        this.notifications.set([]);
        this.loading.set(false);
      }
    });
  }

  hasUnread(): boolean {
    return this.notifications().some(n => !n.is_read);
  }

    handleClick(notif: AppNotification): void {
    // Mark as read
    if (!notif.is_read) {
      this.notificationsService.markAsRead(notif.id).subscribe({
        next: () => {
          notif.is_read = true;
          this.notifications.set([...this.notifications()]);
          this.notificationsService.getUnreadCount().subscribe();
        }
      });
    }

    // Navigate based on notification type + role
    const targetRoute = this.getRouteForNotification(notif);
    if (targetRoute) {
      this.router.navigateByUrl(targetRoute).catch(() => {
        // Silently ignore if navigation fails
      });
    }
  }

  private getRouteForNotification(notif: AppNotification): string | null {
    const role = this.auth.userRole();

    switch (notif.notification_type) {
      case 'APPLICATION_STATUS':
      case 'INTERVIEW_SCHEDULED':
        // Candidates go to My Applications, HR goes to Applicants
        if (role === 'CANDIDATE') return '/my-applications';
        if (role === 'HR') return '/hr/applicants';
        return null;

      case 'NEW_APPLICATION':
        // HR only — go to applicants page
        return '/hr/applicants';

      case 'JOB_MATCH':
        // Candidates — go to browse jobs
        return '/jobs';

      case 'COMPANY_VERIFIED':
        // HR — go to their company page
        return '/hr/company';

      case 'PAYMENT_SUCCESS':
      case 'PAYMENT_FAILED':
      case 'SUBSCRIPTION_EXPIRING':
        // Would go to /billing — for now, dashboard
        if (role === 'CANDIDATE') return '/candidate-dashboard';
        if (role === 'HR') return '/hr-dashboard';
        return null;

      case 'ANNOUNCEMENT':
      case 'OTHER':
      default:
        // Stay on notifications page
        return null;
    }
  }

  markAllRead(): void {
    this.notificationsService.markAllAsRead().subscribe({
      next: () => {
        this.notifications.set(
          this.notifications().map(n => ({ ...n, is_read: true }))
        );
      }
    });
  }

  deleteNotif(notif: AppNotification, event: Event): void {
    event.stopPropagation();
    this.notificationsService.delete(notif.id).subscribe({
      next: () => {
        this.notifications.set(this.notifications().filter(n => n.id !== notif.id));
        this.notificationsService.getUnreadCount().subscribe();
      }
    });
  }

  getIcon(type: string): string {
    const map: Record<string, string> = {
      APPLICATION_STATUS: '💼',
      INTERVIEW_SCHEDULED: '📅',
      NEW_APPLICATION: '👤',
      JOB_MATCH: '🎯',
      COMPANY_VERIFIED: '✅',
      PAYMENT_SUCCESS: '💳',
      PAYMENT_FAILED: '❌',
      SUBSCRIPTION_EXPIRING: '⚠️',
      ANNOUNCEMENT: '📢',
      OTHER: '🔔',
    };
    return map[type] || '🔔';
  }

  getIconBg(type: string): string {
    const map: Record<string, string> = {
      APPLICATION_STATUS: 'linear-gradient(135deg, #dbeafe, #bfdbfe)',
      INTERVIEW_SCHEDULED: 'linear-gradient(135deg, #e0e7ff, #c7d2fe)',
      NEW_APPLICATION: 'linear-gradient(135deg, #d1fae5, #a7f3d0)',
      JOB_MATCH: 'linear-gradient(135deg, #f3e8ff, #e9d5ff)',
      COMPANY_VERIFIED: 'linear-gradient(135deg, #dcfce7, #bbf7d0)',
      PAYMENT_SUCCESS: 'linear-gradient(135deg, #dcfce7, #bbf7d0)',
      PAYMENT_FAILED: 'linear-gradient(135deg, #fee2e2, #fecaca)',
      SUBSCRIPTION_EXPIRING: 'linear-gradient(135deg, #fef3c7, #fde68a)',
      ANNOUNCEMENT: 'linear-gradient(135deg, #fce7f3, #fbcfe8)',
      OTHER: 'linear-gradient(135deg, #f3f4f6, #e5e7eb)',
    };
    return map[type] || 'linear-gradient(135deg, #f3f4f6, #e5e7eb)';
  }

  get portalName(): string {
    const role = this.auth.userRole();
    if (role === 'CANDIDATE') return 'Job Portal';
    if (role === 'HR') return 'HR Portal';
    return 'Admin Console';
  }

  get bgGradient(): string {
    const role = this.auth.userRole();
    if (role === 'CANDIDATE') return 'bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50';
    if (role === 'HR') return 'bg-gradient-to-br from-slate-50 via-emerald-50 to-teal-50';
    return 'bg-gradient-to-br from-slate-50 via-rose-50 to-red-50';
  }
}