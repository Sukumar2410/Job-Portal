import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TopNavComponent } from '../shared/top-nav/top-nav.component';
import { PaymentsService } from '../core/services/payments.service';
import { AuthService } from '../core/services/auth.service';
import { SubscriptionPlan, Subscription } from '../core/models/payment.model';

@Component({
  selector: 'app-billing',
  standalone: true,
  imports: [CommonModule, FormsModule, TopNavComponent],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-white">
      <app-top-nav portalName="Billing"></app-top-nav>

      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div class="mb-8">
          <h1 class="text-3xl sm:text-4xl font-bold text-gray-900">Subscription Management</h1>
          <p class="mt-2 text-gray-600 max-w-2xl">
            Manage your current subscription, explore available plans, and apply coupons for discounts.
          </p>
        </div>

        <div *ngIf="loading()" class="flex justify-center py-20">
          <div class="flex flex-col items-center gap-3">
            <svg class="animate-spin w-10 h-10 text-primary-600" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
            </svg>
            <p class="text-sm text-gray-500">Loading subscription details...</p>
          </div>
        </div>

        <div *ngIf="error()" class="bg-red-50 border border-red-200 rounded-2xl p-6 mb-6">
          <p class="text-red-700 font-semibold">Something went wrong.</p>
          <p class="text-sm text-red-600 mt-2">{{ error() }}</p>
          <button (click)="loadData()" class="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all">
            Retry
          </button>
        </div>

        <div *ngIf="!loading() && !error()" class="space-y-8">
          <section class="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <div class="bg-white rounded-3xl shadow-soft p-6">
              <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h2 class="text-xl font-semibold text-gray-900">Current Subscription</h2>
                  <p class="text-sm text-gray-500 mt-1">Your active plan and renewal status.</p>
                </div>
                <div class="text-right">
                  <p class="text-xs uppercase tracking-[0.24em] font-semibold text-primary-700">Status</p>
                  <p class="text-lg font-bold text-gray-900 mt-1">{{ subscription()?.status || 'None' }}</p>
                </div>
              </div>

              <div *ngIf="subscription() as sub; else noSubscription" class="mt-6 space-y-4">
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div class="rounded-2xl bg-slate-50 p-4">
                    <p class="text-xs text-gray-500 uppercase tracking-[0.18em]">Plan</p>
                    <p class="text-lg font-semibold text-gray-900 mt-2">{{ sub.plan.name }}</p>
                    <p class="text-sm text-gray-500">{{ sub.plan.description }}</p>
                  </div>
                  <div class="rounded-2xl bg-slate-50 p-4">
                    <p class="text-xs text-gray-500 uppercase tracking-[0.18em]">Billing</p>
                    <p class="text-lg font-semibold text-gray-900 mt-2">{{ sub.plan.billing_cycle_display || sub.plan.billing_cycle }}</p>
                    <p class="text-sm text-gray-500">{{ formatCurrency(sub.plan.price, sub.plan.currency) }}</p>
                  </div>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div class="rounded-2xl bg-slate-50 p-4">
                    <p class="text-xs text-gray-500 uppercase tracking-[0.18em]">Expires At</p>
                    <p class="text-lg font-semibold text-gray-900 mt-2">
                      {{ sub.expires_at || 'N/A' }}
                    </p>
                  </div>
                  <div class="rounded-2xl bg-slate-50 p-4">
                    <p class="text-xs text-gray-500 uppercase tracking-[0.18em]">Days Remaining</p>
                    <p class="text-lg font-semibold text-gray-900 mt-2">
                      {{ sub.days_remaining ?? 'N/A' }} days
                    </p>
                  </div>
                </div>

                <div class="rounded-3xl bg-gradient-to-r from-indigo-600 to-fuchsia-600 p-6 text-white">
                  <p class="text-sm uppercase tracking-[0.18em] font-semibold">Coupon Applied</p>
                  <p class="text-2xl font-bold mt-3">{{ sub.coupon_code || 'No coupon used' }}</p>
                  <p class="text-sm text-white/80 mt-2">Discount applied: {{ formatCurrency(sub.discount_applied || 0, sub.plan.currency) }}</p>
                </div>
              </div>

              <ng-template #noSubscription>
                <div class="rounded-3xl border border-dashed border-slate-200 p-8 text-center">
                  <p class="text-lg font-semibold text-gray-900">No active subscription yet</p>
                  <p class="text-sm text-gray-500 mt-2">Choose a plan below to get started.</p>
                </div>
              </ng-template>
            </div>

            <div class="bg-white rounded-3xl shadow-soft p-6">
              <h2 class="text-xl font-semibold text-gray-900">Coupon</h2>
              <p class="text-sm text-gray-500 mt-1">Validate a coupon for the currently selected plan.</p>

              <form (submit)="applyCoupon($event)" class="mt-6 space-y-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700">Coupon Code</label>
                  <input
                    type="text"
                    [(ngModel)]="couponCode"
                    name="couponCode"
                    placeholder="Enter coupon code"
                    class="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition-all focus:border-primary-500 focus:bg-white"
                  />
                </div>

                <button
                  type="submit"
                  [disabled]="validatingCoupon()"
                  class="w-full rounded-2xl bg-primary-600 px-4 py-3 text-sm font-semibold text-white hover:bg-primary-700 transition-all disabled:opacity-60"
                >
                  {{ validatingCoupon() ? 'Validating…' : 'Validate Coupon' }}
                </button>
              </form>

              <div *ngIf="couponMessage()" class="mt-4 rounded-2xl border p-4" [ngClass]="couponSuccess() ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-red-200 bg-red-50 text-red-700'">
                {{ couponMessage() }}
              </div>
            </div>
          </section>

          <section>
            <div class="flex items-center justify-between mb-6">
              <div>
                <h2 class="text-xl font-semibold text-gray-900">Available Plans</h2>
                <p class="text-sm text-gray-500 mt-1">Choose a plan and subscribe instantly.</p>
              </div>
            </div>

            <div *ngIf="plans().length === 0" class="rounded-3xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-gray-600">
              No plans are available right now. Please check back later or contact support.
            </div>

            <div class="grid gap-6 lg:grid-cols-3" *ngIf="plans().length > 0">
              <div *ngFor="let plan of plans()" class="group rounded-3xl border border-slate-200 bg-white p-6 shadow-soft transition-all hover:-translate-y-1 hover:shadow-lg">
                <div class="flex items-center justify-between gap-4">
                  <div>
                    <p class="text-sm text-gray-500 uppercase tracking-[0.18em] font-semibold">{{ plan.plan_type_display || plan.plan_type || plan.tier_code || 'Plan' }}</p>
                    <h3 class="mt-3 text-2xl font-bold text-gray-900">{{ plan.name || plan.tier_code || 'Unnamed Plan' }}</h3>
                  </div>
                  <p class="text-right text-3xl font-bold text-primary-600">{{ formatCurrency(plan.price, plan.currency) }}</p>
                </div>

                <p class="mt-4 text-sm text-gray-500">{{ plan.description || 'No description provided.' }}</p>

                <div class="mt-6 space-y-3 text-sm text-gray-600">
                  <p><strong>{{ plan.billing_cycle_display || plan.billing_cycle || 'Billing' }}</strong> billing</p>
                  <p>{{ plan.job_post_quota }} job posts</p>
                  <p>{{ plan.trial_period_days }} day trial</p>
                </div>

                <button
                  type="button"
                  (click)="selectPlan(plan)"
                  [disabled]="isCurrentPlan(plan)"
                  [ngClass]="
                    isCurrentPlan(plan)
                      ? 'bg-green-600 text-white cursor-not-allowed'
                      : selectedPlan()?.id === plan.id
                        ? 'bg-slate-900 text-white'
                        : 'bg-indigo-600 text-white hover:bg-indigo-700'
                  "
                  class="mt-6 w-full rounded-2xl px-4 py-3 text-sm font-semibold transition-all"
                >
                  {{
                    isCurrentPlan(plan)
                      ? '✔ Current Plan'
                      : selectedPlan()?.id === plan.id
                        ? 'Selected'
                        : 'Select Plan'
                  }}
                </button>

                <button
                  *ngIf="selectedPlan()?.id === plan.id && !isCurrentPlan(plan)"
                  type="button"
                  (click)="subscribe(plan)"
                  class="mt-3 w-full rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700 transition-all"
                >
                  {{
                    subscription()
                      ? 'Upgrade Plan'
                      : 'Subscribe Now'
                  }}
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  `,
})
export class BillingComponent implements OnInit {
  private paymentsService = inject(PaymentsService);
  private authService = inject(AuthService);

  loading = signal(true);
  error = signal<string | null>(null);
  plans = signal<SubscriptionPlan[]>([]);
  subscription = signal<Subscription | null>(null);
  selectedPlan = signal<SubscriptionPlan | null>(null);
  couponCode = '';
  couponMessage = signal('');
  couponSuccess = signal(false);
  validatingCoupon = signal(false);

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading.set(true);
    this.error.set(null);

    this.paymentsService.listPlans().subscribe({
      next: (plans) => {

        const role = this.authService.userRole();

        const filteredPlans = plans.filter(plan => {

          if (role === 'CANDIDATE') {
            return plan.plan_type === 'CANDIDATE';
          }

          if (role === 'HR') {
            return plan.plan_type === 'COMPANY';
          }

          return true;

        });

        this.plans.set(filteredPlans);

        if (!this.selectedPlan() && filteredPlans.length) {
          this.selectedPlan.set(filteredPlans[0]);
        }
      },
      error: (err) => {
        this.error.set(err?.error?.detail || 'Failed to load plans.');
        this.loading.set(false);
      },
      complete: () => {
        this.paymentsService.getMySubscription().subscribe({
          next: (sub: any) => {
            if (sub.active === false) {
              this.subscription.set(null);
            } else {
              this.subscription.set(sub);
            }
          },
          error: () => this.loading.set(false),
          complete: () => this.loading.set(false),
        });
      },
    });
  }

  applyCoupon(event: Event): void {
    event.preventDefault();
    const plan = this.selectedPlan();
    const code = this.couponCode.trim();
    if (!plan || !code) {
      this.couponMessage.set('Please select a plan and enter a coupon code.');
      this.couponSuccess.set(false);
      return;
    }

    this.validatingCoupon.set(true);
    this.paymentsService.validateCoupon({ code, plan_id: plan.id }).subscribe({
      next: (result) => {
        this.couponMessage.set(`Coupon valid! Discount: ${result.discount_amount} off. Final price: ${result.final_amount}`);
        this.couponSuccess.set(true);
      },
      error: (err) => {
        this.couponMessage.set(err?.error?.error || err?.error?.detail || 'Coupon is invalid.');
        this.couponSuccess.set(false);
      },
      complete: () => this.validatingCoupon.set(false),
    });
  }

  selectPlan(plan: SubscriptionPlan): void {
    this.selectedPlan.set(plan);
    this.couponMessage.set('');
  }

  subscribe(plan: SubscriptionPlan): void {
    const payload = {
      plan_id: plan.id,
      coupon_code: this.couponCode.trim() || undefined,
      auto_renew: false,
    };

    this.paymentsService.createOrder(payload).subscribe({
      next: (res) => {
        if (res.trial || res.free) {
          this.couponMessage.set(res.message);
          this.couponSuccess.set(true);
          if (res.subscription) {
            this.subscription.set(res.subscription);
          }
          return;
        }

        this.couponMessage.set('Order created. Please complete payment via Razorpay.');
        this.couponSuccess.set(true);
        if (res.razorpay_order_id) {
          this.openRazorpay(res);
        }
      },
      error: (err) => {
        this.couponMessage.set(err?.error?.detail || 'Subscription failed.');
        this.couponSuccess.set(false);
      },
    });
  }

  openRazorpay(res: any): void {
    const options = {
      key: res.razorpay_key_id,
      amount: res.amount,
      currency: res.currency,
      order_id: res.razorpay_order_id,

      name: 'Enterprise Job Portal',
      description: `Subscribe to ${res.plan_name}`,

      handler: (response: any) => {
        this.verifyPayment(response);
      },

      prefill: {
        name: '',
        email: '',
      },

      theme: {
        color: '#4f46e5',
      },

      display: {
        sequence: [
          'upi',
          'card',
          'netbanking',
          'wallet',
          'paylater',
        ],
      },
    };

    this.loadRazorpayScript()
      .then(() => {
        const razorpay = new (window as any).Razorpay(options);

        razorpay.open();
      })
      .catch(() => {
        this.couponMessage.set(
          'Unable to load payment gateway. Please try again later.'
        );

        this.couponSuccess.set(false);
      });
  }

  private loadRazorpayScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      if ((window as any).Razorpay) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject();
      document.body.appendChild(script);
    });
  }

  verifyPayment(payload: any): void {
    this.paymentsService.verifyPayment(payload).subscribe({
      next: (res) => {
        this.couponMessage.set(res.message || 'Payment verified and subscription activated.');
        this.couponSuccess.set(true);
        if (res.subscription) {
          this.subscription.set(res.subscription);
        }
      },
      error: (err) => {
        this.couponMessage.set(err?.error?.detail || 'Payment verification failed.');
        this.couponSuccess.set(false);
      },
    });
  }

  formatCurrency(value: number, currency: string): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(value);
  }

    isCurrentPlan(plan: SubscriptionPlan): boolean {
    const subscription = this.subscription();

    if (!subscription || !subscription.plan) {
      return false;
    }

    return subscription.plan.id === plan.id;
  }
}
