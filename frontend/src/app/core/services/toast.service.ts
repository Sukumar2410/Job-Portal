import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {

  toasts = signal<Toast[]>([]);

  show(message: string, type: ToastType = 'info') {

    const toast: Toast = {
      id: Date.now(),
      message,
      type
    };

    this.toasts.update(t => [...t, toast]);

    setTimeout(() => {
      this.remove(toast.id);
    }, 3000);

  }

  success(msg: string) {
    this.show(msg, 'success');
  }

  error(msg: string) {
    this.show(msg, 'error');
  }

  warning(msg: string) {
    this.show(msg, 'warning');
  }

  info(msg: string) {
    this.show(msg, 'info');
  }

  remove(id: number) {
    this.toasts.update(t => t.filter(x => x.id !== id));
  }
}