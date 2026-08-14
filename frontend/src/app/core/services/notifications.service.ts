import { Injectable, inject, signal } from '@angular/core';
import { Observable, tap, interval, switchMap, startWith } from 'rxjs';
import { ApiService } from './api.service';
import { API } from '../constants/api.constants';

export interface AppNotification {
  id: number;
  notification_type: string;
  notification_type_display: string;
  priority: string;
  priority_display: string;
  title: string;
  message: string;
  action_url: string;
  related_object_type: string;
  related_object_id: number | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
  time_since: string;
}

@Injectable({ providedIn: 'root' })
export class NotificationsService {
  private api = inject(ApiService);

  // Reactive unread count signal
  unreadCount = signal<number>(0);

  list(): Observable<any> {
    return this.api.get(API.NOTIFICATIONS.LIST);
  }

  getUnreadCount(): Observable<{ unread_count: number }> {
    return this.api.get<{ unread_count: number }>(API.NOTIFICATIONS.UNREAD_COUNT).pipe(
      tap(res => this.unreadCount.set(res.unread_count))
    );
  }

  markAsRead(id: number): Observable<any> {
    return this.api.post(API.NOTIFICATIONS.MARK_READ(id), {});
  }

  markAllAsRead(): Observable<any> {
    return this.api.post(API.NOTIFICATIONS.MARK_ALL_READ, {}).pipe(
      tap(() => this.unreadCount.set(0))
    );
  }

  delete(id: number): Observable<any> {
    return this.api.delete(API.NOTIFICATIONS.DELETE(id));
  }

  // Poll every 30 seconds for new notifications
  startPolling(): Observable<{ unread_count: number }> {
    return interval(30000).pipe(
      startWith(0),
      switchMap(() => this.getUnreadCount())
    );
  }

    broadcast(payload: {
    title: string;
    message: string;
    target_role: string;
    priority: string;
    action_url?: string;
  }): Observable<any> {
    return this.api.post(API.NOTIFICATIONS.BROADCAST, payload);
  }
}