import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { TopNavComponent } from '../../shared/top-nav/top-nav.component';
import { NotificationsService } from '../../core/services/notifications.service';

@Component({
  selector: 'app-admin-broadcast',
  standalone: true,
  imports: [CommonModule, FormsModule, TopNavComponent],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-slate-50 via-rose-50 to-red-50">
      <app-top-nav portalName="Admin Console"></app-top-nav>

      <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        <div class="mb-8 animate-fade-in">
          <h1 class="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">Broadcast Notification 📢</h1>
          <p class="text-gray-600">Send an announcement to all users or specific roles.</p>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">

          <!-- ============ LEFT: Compose Form ============ -->
          <div class="bg-white rounded-2xl shadow-soft p-6 animate-slide-up">
            <h2 class="text-lg font-bold text-gray-900 mb-4">✍️ Compose Message</h2>

            <form (submit)="send($event)" class="space-y-4">

              <!-- Target Audience -->
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2">Send To *</label>
                <div class="grid grid-cols-2 gap-2">
                  <label *ngFor="let target of targets" class="cursor-pointer">
                    <input type="radio" [(ngModel)]="form.target_role" [name]="'target'" [value]="target.value" class="peer sr-only" />
                    <div class="border-2 border-gray-200 rounded-lg p-3 transition-all peer-checked:border-rose-500 peer-checked:bg-rose-50 hover:border-gray-300">
                      <div class="text-xl mb-1">{{ target.icon }}</div>
                      <div class="font-semibold text-sm text-gray-800">{{ target.label }}</div>
                      <div class="text-xs text-gray-500 mt-0.5">{{ target.description }}</div>
                    </div>
                  </label>
                </div>
              </div>

              <!-- Priority -->
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2">Priority *</label>
                <div class="grid grid-cols-4 gap-2">
                  <label *ngFor="let p of priorities" class="cursor-pointer">
                    <input type="radio" [(ngModel)]="form.priority" [name]="'priority'" [value]="p.value" class="peer sr-only" />
                    <div class="border-2 border-gray-200 rounded-lg py-2 px-1 text-center transition-all peer-checked:border-rose-500 peer-checked:bg-rose-50 hover:border-gray-300">
                      <div class="text-sm font-semibold" [style.color]="p.color">{{ p.label }}</div>
                    </div>
                  </label>
                </div>
              </div>

              <!-- Title -->
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2">Title *</label>
                <input type="text" [(ngModel)]="form.title" name="title" required
                  placeholder="e.g., 🚀 Platform Maintenance Scheduled"
                  maxlength="200"
                  class="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:bg-white focus:border-rose-500 focus:ring-4 focus:ring-rose-100 outline-none transition-all" />
                <div class="text-xs text-gray-400 mt-1 text-right">{{ (form.title || '').length }}/200</div>
              </div>

              <!-- Message -->
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2">Message *</label>
                <textarea [(ngModel)]="form.message" name="message" rows="6" required
                  placeholder="Write your announcement here..."
                  class="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:bg-white focus:border-rose-500 focus:ring-4 focus:ring-rose-100 outline-none transition-all resize-none"></textarea>
              </div>

              <!-- Optional Action URL -->
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2">
                  Action URL <span class="text-gray-400 text-xs font-normal">(optional)</span>
                </label>
                <input type="text" [(ngModel)]="form.action_url" name="action_url"
                  placeholder="e.g., /jobs or leave blank"
                  class="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:bg-white focus:border-rose-500 focus:ring-4 focus:ring-rose-100 outline-none transition-all" />
                <div class="text-xs text-gray-500 mt-1">Where clicking the notification takes users.</div>
              </div>

              <!-- Feedback -->
              <div *ngIf="success()" class="p-4 bg-green-50 border border-green-200 rounded-xl">
                <div class="font-semibold text-green-800">✅ Broadcast sent successfully!</div>
                <div class="text-sm text-green-700 mt-1">{{ success() }}</div>
              </div>

              <div *ngIf="error()" class="p-4 bg-red-50 border border-red-200 rounded-xl">
                <div class="font-semibold text-red-800">❌ Broadcast failed</div>
                <div class="text-sm text-red-700 mt-1">{{ error() }}</div>
              </div>

              <!-- Submit -->
              <button type="submit" [disabled]="sending() || !isValid()"
                class="w-full py-3.5 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                <svg *ngIf="sending()" class="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                </svg>
                {{ sending() ? 'Sending...' : '📤 Send Broadcast' }}
              </button>
            </form>
          </div>

          <!-- ============ RIGHT: Live Preview ============ -->
          <div class="animate-slide-up" style="animation-delay: 0.1s;">
            <div class="sticky top-24">
              <h2 class="text-lg font-bold text-gray-900 mb-4">👀 Live Preview</h2>

              <!-- Preview Card -->
              <div class="bg-white rounded-2xl shadow-lg p-5 relative"
                [class.border-l-4]="form.priority !== 'LOW'"
                [style.border-left-color]="getPriorityColor(form.priority)">

                <div class="flex items-start gap-4">
                  <div class="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 text-2xl"
                    [style.background]="getPriorityBg(form.priority)">
                    📢
                  </div>

                  <div class="flex-1 min-w-0">
                    <div class="flex items-start justify-between gap-2">
                      <div class="min-w-0">
                        <h3 class="font-bold text-gray-900">
                          {{ form.title || 'Your title will appear here' }}
                        </h3>
                        <p class="text-sm text-gray-600 mt-1 whitespace-pre-line">
                          {{ form.message || 'Your message will appear here...' }}
                        </p>
                        <div class="mt-2 flex items-center gap-2 text-xs text-gray-400">
                          <span>just now</span>
                          <span *ngIf="form.priority === 'HIGH' || form.priority === 'URGENT'"
                            class="px-2 py-0.5 bg-red-100 text-red-700 rounded font-semibold">
                            {{ formatPriority(form.priority) }}
                          </span>
                        </div>
                      </div>
                      <span class="w-2 h-2 bg-primary-500 rounded-full flex-shrink-0 mt-2"></span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Info Box -->
              <div class="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-800">
                <div class="font-semibold mb-2">📋 Broadcast Info</div>
                <ul class="space-y-1 text-xs">
                  <li>• Target: <strong>{{ getTargetLabel() }}</strong></li>
                  <li>• Priority: <strong [style.color]="getPriorityColor(form.priority)">{{ formatPriority(form.priority) }}</strong></li>
                  <li *ngIf="form.action_url">• Redirects to: <code class="bg-white px-1 rounded">{{ form.action_url }}</code></li>
                  <li>• All users will receive this instantly</li>
                  <li>• Action is logged in audit trail</li>
                </ul>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  `
})
export class AdminBroadcastComponent {
  private notificationsService = inject(NotificationsService);

  sending = signal(false);
  success = signal<string | null>(null);
  error = signal<string | null>(null);

  form = {
    title: '',
    message: '',
    target_role: 'ALL',
    priority: 'NORMAL',
    action_url: '',
  };

  targets = [
    { value: 'ALL', label: 'All Users', icon: '🌐', description: 'Everyone on the platform' },
    { value: 'CANDIDATE', label: 'Candidates', icon: '👤', description: 'Job seekers only' },
    { value: 'HR', label: 'Recruiters', icon: '💼', description: 'HR/Company users only' },
    { value: 'SUPER_ADMIN', label: 'Admins', icon: '🛡️', description: 'Super admins only' },
  ];

  priorities = [
    { value: 'LOW', label: 'Low', color: '#6b7280' },
    { value: 'NORMAL', label: 'Normal', color: '#3b82f6' },
    { value: 'HIGH', label: 'High', color: '#f59e0b' },
    { value: 'URGENT', label: 'Urgent', color: '#ef4444' },
  ];

  isValid(): boolean {
    return !!(this.form.title.trim() && this.form.message.trim());
  }

  send(event: Event): void {
    event.preventDefault();
    if (!this.isValid()) return;

    if (!confirm(`Send this broadcast to ${this.getTargetLabel()}?`)) return;

    this.sending.set(true);
    this.success.set(null);
    this.error.set(null);

    this.notificationsService.broadcast(this.form).subscribe({
      next: (res: any) => {
        this.sending.set(false);
        this.success.set(res.message || `Broadcast sent to ${res.recipient_count} users.`);
        // Reset form
        this.form.title = '';
        this.form.message = '';
        this.form.action_url = '';
        // Auto-hide success after 5s
        setTimeout(() => this.success.set(null), 5000);
      },
      error: (err) => {
        this.sending.set(false);
        this.error.set(err.error?.detail || err.error?.message || 'Failed to send broadcast.');
      }
    });
  }

  getTargetLabel(): string {
    const t = this.targets.find(x => x.value === this.form.target_role);
    return t?.label || 'All Users';
  }

  formatPriority(priority: string): string {
    return priority.charAt(0) + priority.slice(1).toLowerCase();
  }

  getPriorityColor(priority: string): string {
    const map: Record<string, string> = {
      LOW: '#6b7280',
      NORMAL: '#3b82f6',
      HIGH: '#f59e0b',
      URGENT: '#ef4444',
    };
    return map[priority] || '#6b7280';
  }

  getPriorityBg(priority: string): string {
    const map: Record<string, string> = {
      LOW: 'linear-gradient(135deg, #f3f4f6, #e5e7eb)',
      NORMAL: 'linear-gradient(135deg, #dbeafe, #bfdbfe)',
      HIGH: 'linear-gradient(135deg, #fef3c7, #fde68a)',
      URGENT: 'linear-gradient(135deg, #fee2e2, #fecaca)',
    };
    return map[priority] || 'linear-gradient(135deg, #f3f4f6, #e5e7eb)';
  }
}