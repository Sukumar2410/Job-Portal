import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TopNavComponent } from '../shared/top-nav/top-nav.component';
import { PaymentsService } from '../core/services/payments.service';

@Component({
  selector: 'app-revenue',
  standalone: true,
  imports: [CommonModule, TopNavComponent],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50 to-white">
      <app-top-nav portalName="Revenue"></app-top-nav>

      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div class="mb-8">
          <h1 class="text-3xl font-bold text-gray-900">Revenue Dashboard</h1>
          <p class="mt-2 text-gray-600">Monitor subscription growth and revenue health.</p>
        </div>

        <div *ngIf="loading()" class="rounded-3xl bg-white p-8 text-center text-sm text-gray-600">
          Loading revenue data...
        </div>

        <div *ngIf="error()" class="rounded-3xl border border-red-200 bg-red-50 p-6 text-red-700">
          {{ error() }}
        </div>

        <div *ngIf="!loading() && !error()" class="grid gap-6 lg:grid-cols-3">
          <div class="rounded-3xl bg-white p-6 shadow-soft">
            <p class="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Gross Revenue</p>
            <p class="mt-3 text-3xl font-bold text-gray-900">{{ revenue()?.gross_revenue || 0 }}</p>
          </div>
          <div class="rounded-3xl bg-white p-6 shadow-soft">
            <p class="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Net Revenue</p>
            <p class="mt-3 text-3xl font-bold text-gray-900">{{ revenue()?.net_revenue || 0 }}</p>
          </div>
          <div class="rounded-3xl bg-white p-6 shadow-soft">
            <p class="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Active Subscriptions</p>
            <p class="mt-3 text-3xl font-bold text-gray-900">{{ revenue()?.active_subscriptions || 0 }}</p>
          </div>
        </div>
      </div>
    </div>
  `
})
export class RevenueComponent implements OnInit {
  private paymentsService = inject(PaymentsService);

  revenue = signal<any>(null);
  loading = signal(true);
  error = signal<string | null>(null);

  ngOnInit(): void {
    this.loadRevenue();
  }

  loadRevenue(): void {
    this.loading.set(true);
    this.error.set(null);
    this.paymentsService.getRevenue().subscribe({
      next: (data) => this.revenue.set(data),
      error: () => this.error.set('Unable to load revenue data right now.'),
      complete: () => this.loading.set(false),
    });
  }
}
