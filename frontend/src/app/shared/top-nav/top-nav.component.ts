import {
  Component,
  Input,
  inject,
  signal,
  HostListener
} from '@angular/core';

import { CommonModule } from '@angular/common';

import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../core/services/auth.service';

import {
  NotificationsService,
  AppNotification
} from '../../core/services/notifications.service';

@Component({
  selector: 'app-top-nav',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <nav class="bg-white/80 backdrop-blur-lg border-b border-gray-200 sticky top-0 z-40 shadow-sm">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <!-- Logo + Nav Links -->
          <div class="flex items-center gap-8">
            <a [routerLink]="dashboardRoute" class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg" [ngClass]="logoGradient">
                <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                </svg>
              </div>
              <div class="hidden sm:block">
                <div class="text-sm font-bold text-gray-900">Enterprise</div>
                <div class="text-xs text-gray-500 -mt-1">{{ portalName }}</div>
              </div>
            </a>

            <!-- Nav Links -->
            <div class="hidden md:flex items-center gap-1">
              <a *ngFor="let link of navLinks"
                [routerLink]="link.route"
                routerLinkActive="bg-gray-100 text-gray-900"
                class="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-all">
                {{ link.label }}
              </a>
            </div>
          </div>

          <!-- Right Side -->
          <div class="flex items-center gap-4">
            <!-- Notification Dropdown -->
            <div class="relative notification-dropdown-container">

              <!-- Notification Bell -->
              <button
                type="button"
                (click)="toggleNotificationDropdown()"
                class="relative p-2.5 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all"
                aria-label="Notifications"
              >

                <svg
                  class="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>

                <!-- Unread Count -->
                <span
                  *ngIf="unreadCount() > 0"
                  class="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white"
                >
                  {{ unreadCount() > 9 ? '9+' : unreadCount() }}
                </span>

              </button>


              <!-- Dropdown -->
              <div
                *ngIf="notificationDropdownOpen()"
                class="absolute right-0 top-14 w-[380px] max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden z-50"
              >

                <!-- Header -->
                <div
                  class="px-5 py-4 border-b border-gray-100 flex items-center justify-between"
                >

                  <div>

                    <h3 class="text-base font-bold text-gray-900">
                      Notifications
                    </h3>

                    <p class="text-xs text-gray-500 mt-0.5">
                      Stay updated with your latest activity
                    </p>

                  </div>

                  <span
                    *ngIf="unreadCount() > 0"
                    class="px-2.5 py-1 text-xs font-bold bg-red-50 text-red-600 rounded-full"
                  >
                    {{ unreadCount() }} unread
                  </span>

                </div>


                <!-- Loading -->
                <div
                  *ngIf="notificationsLoading()"
                  class="px-5 py-10 text-center"
                >

                  <div
                    class="w-7 h-7 mx-auto border-2 border-gray-200 border-t-primary-600 rounded-full animate-spin"
                  ></div>

                  <p class="mt-3 text-sm text-gray-500">
                    Loading notifications...
                  </p>

                </div>


                <!-- Empty State -->
                <div
                  *ngIf="
                    !notificationsLoading() &&
                    recentNotifications().length === 0
                  "
                  class="px-5 py-10 text-center"
                >

                  <div
                    class="w-14 h-14 mx-auto rounded-2xl bg-gray-100 flex items-center justify-center"
                  >
                    <span class="text-2xl">🔔</span>
                  </div>

                  <h4 class="mt-4 text-sm font-semibold text-gray-900">
                    No notifications
                  </h4>

                  <p class="mt-1 text-xs text-gray-500">
                    You're all caught up.
                  </p>

                </div>


                <!-- Notifications List -->
                <div
                  *ngIf="
                    !notificationsLoading() &&
                    recentNotifications().length > 0
                  "
                  class="max-h-[380px] overflow-y-auto"
                >

                  <button
                    *ngFor="let notif of recentNotifications()"
                    type="button"
                    (click)="openNotification(notif)"
                    class="w-full text-left px-5 py-4 flex items-start gap-3 border-b border-gray-100 hover:bg-gray-50 transition-all"
                    [ngClass]="{
                      'bg-primary-50/40': !notif.is_read
                    }"
                  >

                    <!-- Notification Icon -->
                    <div
                      class="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center text-lg"
                      [ngClass]="getNotificationIconClass(notif.notification_type)"
                    >
                      {{ getNotificationIcon(notif.notification_type) }}
                    </div>


                    <!-- Notification Content -->
                    <div class="flex-1 min-w-0">

                      <div class="flex items-start justify-between gap-2">

                        <h4
                          class="text-sm font-semibold truncate"
                          [ngClass]="{
                            'text-gray-900': !notif.is_read,
                            'text-gray-500': notif.is_read
                          }"
                        >
                          {{ notif.title }}
                        </h4>

                        <!-- Unread Dot -->
                        <span
                          *ngIf="!notif.is_read"
                          class="w-2 h-2 mt-1.5 rounded-full bg-primary-500 flex-shrink-0"
                        ></span>

                      </div>


                      <p class="mt-1 text-xs text-gray-600 line-clamp-2">
                        {{ notif.message }}
                      </p>


                      <p class="mt-1.5 text-[11px] text-gray-400">
                        {{ notif.time_since }}
                      </p>

                    </div>

                  </button>

                </div>


                <!-- Footer -->
                <div
                  class="px-4 py-3 border-t border-gray-100 flex items-center justify-between gap-3"
                >

                  <!-- Mark All Read -->
                  <button
                    *ngIf="unreadCount() > 0"
                    type="button"
                    (click)="markAllNotificationsRead()"
                    class="text-xs font-semibold text-gray-600 hover:text-primary-600 transition-colors"
                  >
                    Mark all as read
                  </button>

                  <span
                    *ngIf="unreadCount() === 0"
                    class="text-xs text-gray-400"
                  >
                    All caught up
                  </span>


                  <!-- View All -->
                  <button
                    type="button"
                    (click)="viewAllNotifications()"
                    class="ml-auto text-xs font-bold text-primary-600 hover:text-primary-700 transition-colors"
                  >
                    View all →
                  </button>

                </div>

              </div>

            </div>

            <div class="flex items-center gap-3">
              <div class="w-9 h-9 rounded-full flex items-center justify-center text-white font-semibold shadow-md" [ngClass]="avatarGradient">
                {{ getInitials() }}
              </div>
              <div class="hidden sm:block">
                <div class="text-sm font-semibold text-gray-900">{{ user?.first_name }} {{ user?.last_name }}</div>
                <div class="text-xs text-gray-500">{{ roleLabel }}</div>
              </div>
            </div>

            <button (click)="logout()"
              class="ml-2 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 rounded-lg transition-all border border-transparent hover:border-red-200">
              <svg class="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
              </svg>
              <span class="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>

        <!-- Mobile Nav Links -->
        <div class="md:hidden flex items-center gap-1 pb-3 overflow-x-auto">
          <a *ngFor="let link of navLinks"
            [routerLink]="link.route"
            routerLinkActive="bg-gray-100 text-gray-900"
            class="px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-all whitespace-nowrap">
            {{ link.label }}
          </a>
        </div>
      </div>
    </nav>
  `
})
export class TopNavComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  private notificationsService = inject(NotificationsService);

  unreadCount = this.notificationsService.unreadCount;

  notificationDropdownOpen = signal(false);

  recentNotifications = signal<AppNotification[]>([]);

  notificationsLoading = signal(false);

  @Input() portalName: string = 'Job Portal';

  user = this.auth.currentUser();
  role = this.auth.userRole();

  get roleLabel(): string {
    if (this.role === 'CANDIDATE') return 'Candidate';
    if (this.role === 'HR') return 'HR / Recruiter';
    if (this.role === 'SUPER_ADMIN') return 'Super Admin';
    return '';
  }

  get dashboardRoute(): string {
    return this.auth.getDashboardRoute();
  }

  get logoGradient(): string {
    if (this.role === 'CANDIDATE') return 'bg-gradient-to-br from-primary-600 to-purple-600';
    if (this.role === 'HR') return 'bg-gradient-to-br from-emerald-600 to-teal-600';
    return 'bg-gradient-to-br from-rose-600 to-red-600';
  }

  get avatarGradient(): string {
    if (this.role === 'CANDIDATE') return 'bg-gradient-to-br from-primary-500 to-purple-600';
    if (this.role === 'HR') return 'bg-gradient-to-br from-emerald-500 to-teal-600';
    return 'bg-gradient-to-br from-rose-500 to-red-600';
  }

  get navLinks(): { label: string; route: string }[] {
    if (this.role === 'CANDIDATE') {
      return [
        { label: 'Dashboard', route: '/candidate-dashboard' },
        { label: 'Browse Jobs', route: '/jobs' },
        { label: 'Analytics', route: '/candidate/analytics' },
        { label: 'AI Career Center', route: '/ai-career-center' },
        { label: 'Connect', route: '/social' },
        { label: 'Messaging', route: '/messages' },
        { label: 'Billing', route: '/billing' },
        { label: 'Profile', route: '/profile' },
      ];
    }
      if (this.role === 'HR') {
      return [
        { label: 'Dashboard', route: '/hr-dashboard' },
        { label: 'My Jobs', route: '/hr/jobs' },
        { label: 'Analytics', route: '/hr/analytics' },
        { label: '🤖 AI Assistant', route: '/hr-ai-assistant' },
        { label: 'Applicants', route: '/hr/applicants' },
        { label: 'Connect', route: '/social' },
        { label: 'Messaging', route: '/messages' },
        { label: 'Billing', route: '/billing' },        
      ];
    }
          return [
      { label: 'Dashboard', route: '/admin-dashboard' },
      { label: 'Analytics', route: '/admin/analytics' },
      { label: 'Users', route: '/admin/users' },
      { label: 'Companies', route: '/admin/companies' },
      { label: 'Broadcast', route: '/admin/broadcast' },
      { label: 'Audit Logs', route: '/admin/audit-logs' },
      { label: 'AI Assistant', route: '/admin-ai-assistant' },
    ];
  }

  getInitials(): string {
    if (!this.user) return '?';
    return (this.user.first_name?.[0] || '') + (this.user.last_name?.[0] || '');
  }

  toggleNotificationDropdown(): void {
    const shouldOpen = !this.notificationDropdownOpen();

    this.notificationDropdownOpen.set(shouldOpen);

    if (shouldOpen) {
      this.loadRecentNotifications();
    }
  }

  loadRecentNotifications(): void {
    this.notificationsLoading.set(true);

    this.notificationsService.list().subscribe({
      next: (response: any) => {

        const notifications: AppNotification[] =
          response?.results || response || [];

        this.recentNotifications.set(
          notifications.slice(0, 5)
        );

        this.notificationsLoading.set(false);
      },

      error: (error: unknown) => {

        console.error(
          'Failed to load notifications:',
          error
        );

        this.recentNotifications.set([]);

        this.notificationsLoading.set(false);
      }
    });
  }

  openNotification(notif: AppNotification): void {
    console.log('CLICKED NOTIFICATION:', notif);
    console.log('ACTION URL:', notif.action_url);

    // Mark notification as read
    if (!notif.is_read) {
      this.notificationsService.markAsRead(notif.id).subscribe({
        next: () => {
          notif.is_read = true;
          this.notificationsService.getUnreadCount().subscribe();
        },
        error: (error) => {
          console.error('Failed to mark notification as read:', error);
        }
      });
    }

    // ---------------------------------------------------------
    // APPLICATION NOTIFICATIONS
    // ---------------------------------------------------------

    if (
      notif.related_object_type === 'application' ||
      notif.notification_type === 'APPLICATION_STATUS'
    ) {
      const applicationId = notif.related_object_id;

      if (applicationId) {
        this.router.navigate([
          '/my-applications',
          applicationId
        ]);
      } else {
        this.router.navigate(['/my-applications']);
      }

      return;
    }

    // ---------------------------------------------------------
    // OTHER NOTIFICATIONS
    // ---------------------------------------------------------

    if (notif.action_url) {
      this.router.navigateByUrl(notif.action_url);
      return;
    }

    // Fallback
    this.router.navigate(['/notifications']);
  }

  getNotificationIcon(type: string): string {

    const iconMap: Record<string, string> = {
      APPLICATION_STATUS: '💼',
      INTERVIEW_SCHEDULED: '📅',
      NEW_APPLICATION: '👤',
      JOB_MATCH: '🎯',
      COMPANY_VERIFIED: '✅',
      PAYMENT_SUCCESS: '💳',
      PAYMENT_FAILED: '❌',
      SUBSCRIPTION_EXPIRING: '⚠️',
      ANNOUNCEMENT: '📢',
      OTHER: '🔔'
    };

    return iconMap[type] || '🔔';
  }

  getNotificationIconClass(type: string): string {

    const classMap: Record<string, string> = {
      APPLICATION_STATUS: 'bg-blue-100',
      INTERVIEW_SCHEDULED: 'bg-indigo-100',
      NEW_APPLICATION: 'bg-emerald-100',
      JOB_MATCH: 'bg-purple-100',
      COMPANY_VERIFIED: 'bg-green-100',
      PAYMENT_SUCCESS: 'bg-green-100',
      PAYMENT_FAILED: 'bg-red-100',
      SUBSCRIPTION_EXPIRING: 'bg-amber-100',
      ANNOUNCEMENT: 'bg-pink-100',
      OTHER: 'bg-gray-100'
    };

    return classMap[type] || 'bg-gray-100';
  }

  viewAllNotifications(): void {

    this.notificationDropdownOpen.set(false);

    this.router.navigateByUrl('/notifications');
  }

  markAllNotificationsRead(): void {

    this.notificationsService
      .markAllAsRead()
      .subscribe({

        next: () => {

          const updatedNotifications =
            this.recentNotifications().map(
              notification => ({
                ...notification,
                is_read: true
              })
            );

          this.recentNotifications.set(
            updatedNotifications
          );

        },

        error: (error: unknown) => {

          console.error(
            'Failed to mark all notifications as read:',
            error
          );

        }

      });
  }

  logout(): void {
    this.auth.logout();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {

    if (!this.notificationDropdownOpen()) {
      return;
    }

    const target = event.target as HTMLElement;

    const notificationContainer =
      target.closest(
        '.notification-dropdown-container'
      );

    if (!notificationContainer) {
      this.notificationDropdownOpen.set(false);
    }
  }

  constructor() {
    // Start polling unread count when component initializes
    this.notificationsService.startPolling().subscribe();
  }
}