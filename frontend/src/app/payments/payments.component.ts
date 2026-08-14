import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TopNavComponent } from '../shared/top-nav/top-nav.component';
import { PaymentsService } from '../core/services/payments.service';

@Component({
  selector: 'app-payments',
  standalone: true,
  imports: [CommonModule, TopNavComponent],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-white">
      <app-top-nav portalName="Payments"></app-top-nav>

      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div class="mb-8">
          <h1 class="text-3xl font-bold text-gray-900">Payments</h1>
          <p class="mt-2 text-gray-600">Recent subscription payments and transaction history.</p>
        </div>

        <div *ngIf="loading()" class="rounded-3xl bg-white p-8 text-center text-sm text-gray-600">
          Loading payments...
        </div>

        <div *ngIf="error()" class="rounded-3xl border border-red-200 bg-red-50 p-6 text-red-700">
          {{ error() }}
        </div>

        <div *ngIf="!loading() && !error()" class="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-soft">
          <table class="min-w-full divide-y divide-slate-200">
            <thead class="bg-slate-50">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Transaction</th>
                <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Amount</th>
                <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Status</th>
                <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Method</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr *ngFor="let payment of payments()">
                <td class="px-4 py-4 text-sm text-gray-700">{{ payment.transaction_id || payment.razorpay_order_id || 'N/A' }}</td>
                <td class="px-4 py-4 text-sm font-semibold text-gray-900">{{ payment.amount || 0 }}</td>
                <td class="px-4 py-4 text-sm">
                  <span class="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">{{ payment.status }}</span>
                </td>
                <td class="px-4 py-4 text-sm text-gray-600">{{ payment.payment_method || 'N/A' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `
})
export class PaymentsComponent implements OnInit {
  private paymentsService = inject(PaymentsService);

  payments = signal<any[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);

  ngOnInit(): void {
    this.loadPayments();
  }

  loadPayments(): void {
    this.loading.set(true);
    this.error.set(null);
    this.paymentsService.listPayments().subscribe({
      next: (payments) => this.payments.set(payments),
      error: () => this.error.set('Unable to load payments right now.'),
      complete: () => this.loading.set(false),
    });
  }
}
