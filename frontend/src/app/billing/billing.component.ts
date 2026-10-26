import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TopNavComponent } from '../shared/top-nav/top-nav.component';
import { PaymentsService } from '../core/services/payments.service';
import { AuthService } from '../core/services/auth.service';
import { SubscriptionPlan, Subscription, CreateOrderResponse, VerifyPaymentPayload } from '../core/models/payment.model';

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
                    <p class="text-xs text-gray-500 uppercase">PLAN</p>
                    <p class="text-lg font-semibold">
                      {{ subscription()?.plan?.name || 'No Active Plan' }}
                    </p>
                    <p class="text-sm text-gray-500">
                      {{ subscription()?.plan?.description || 'Choose a plan below' }}
                    </p>
                  </div>

                  <div class="rounded-2xl bg-slate-50 p-4">
                    <p class="text-xs text-gray-500 uppercase">BILLING</p>
                    <p>
                      {{ subscription()?.plan?.billing_cycle || '-' }}
                    </p>
                    <p>
                      {{
                        subscription()?.plan
                          ? formatCurrency(subscription()!.plan!.price, subscription()!.plan!.currency)
                          : '-'
                      }}
                    </p>
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

            <div class="grid gap-6 md:grid-cols-2 xl:grid-cols-4" *ngIf="plans().length > 0">

              <div
                *ngFor="let plan of plans()"
                class="relative rounded-3xl bg-white p-6 border transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                [ngClass]="{
                  'border-emerald-500 ring-2 ring-emerald-100': plan.trial_period_days > 0,
                  'border-violet-500 ring-2 ring-violet-100': plan.tier_code.includes('PREMIUM'),
                  'border-amber-500 ring-2 ring-amber-100': plan.tier_code.includes('ENTERPRISE'),
                  'border-slate-200': !plan.trial_period_days && !plan.tier_code.includes('PREMIUM') && !plan.tier_code.includes('ENTERPRISE')
                }"
              >

                <!-- Trial Badge -->
                <div
                  *ngIf="plan.trial_period_days > 0"
                  class="absolute -top-3 left-5 rounded-full bg-emerald-600 px-3 py-1 text-[11px] font-bold text-white"
                >
                  7-DAY FREE
                </div>

                <!-- Premium Badge -->
                <div
                  *ngIf="plan.tier_code.includes('PREMIUM')"
                  class="absolute -top-3 left-5 rounded-full bg-violet-600 px-3 py-1 text-[11px] font-bold text-white"
                >
                  MOST POPULAR
                </div>

                <!-- Enterprise Badge -->
                <div
                  *ngIf="plan.tier_code.includes('ENTERPRISE')"
                  class="absolute -top-3 left-5 rounded-full bg-amber-500 px-3 py-1 text-[11px] font-bold text-white"
                >
                  BEST VALUE
                </div>

                <!-- Plan Type -->
                <p class="text-xs uppercase tracking-[0.28em] text-slate-500 font-semibold mb-3">
                  {{ plan.plan_type === 'CANDIDATE' ? 'Candidate Plan' : 'Company Plan' }}
                </p>

                <!-- Name -->
                <h3 class="text-2xl font-bold text-slate-900 leading-tight">
                  {{ getDisplayPlanName(plan) }}
                </h3>

                <!-- Description -->
                <p class="mt-2 text-sm text-slate-500 min-h-[48px]">
                  {{ plan.description }}
                </p>

                <!-- Price -->
                <div class="mt-5 flex items-end gap-1">
                  <span class="text-4xl font-extrabold text-indigo-600">
                    {{ plan.price === 0 ? '₹0' : formatCurrency(plan.price, plan.currency) }}
                  </span>
                  <span class="text-sm text-slate-500 mb-1">/month</span>
                </div>

                <!-- Trial Notice -->
                <div
                  *ngIf="plan.trial_period_days > 0"
                  class="mt-4 rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-700"
                >
                  Card required • No charge today • Cancel anytime
                </div>

                <!-- Features -->
                <div class="mt-5 space-y-3 text-sm">
                  <div
                    *ngFor="let feature of getPlanFeatures(plan)"
                    class="flex items-start gap-2"
                  >
                    <span class="text-emerald-600 mt-0.5">✓</span>
                    <span>{{ feature }}</span>
                  </div>
                </div>

                <!-- CTA -->
                <button
                  (click)="subscribeToPlan(plan)"
                  [disabled]="isCurrentPlan(plan)"
                  class="mt-6 w-full rounded-xl py-3 font-semibold transition-all"
                  [ngClass]="{
                    'bg-emerald-600 hover:bg-emerald-700 text-white': plan.trial_period_days > 0,
                    'bg-violet-600 hover:bg-violet-700 text-white': !plan.trial_period_days,
                    'bg-slate-200 text-slate-500 cursor-not-allowed': isCurrentPlan(plan)
                  }"
                >
                  {{
                    isCurrentPlan(plan)
                      ? 'Current Plan'
                      : (plan.trial_period_days > 0
                          ? 'Start 7-Day Free Trial'
                          : 'Subscribe Now')
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
  selectedPlan: SubscriptionPlan | null = null;
  couponCode = '';
  couponMessage = signal('');
  couponSuccess = signal(false);
  validatingCoupon = signal(false);

  currentUser: any = JSON.parse(localStorage.getItem('user') || '{}');

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading.set(true);
    this.error.set(null);

    this.paymentsService.listPlans().subscribe({
      next: (plans) => {
        const role = this.authService.userRole();

        // Use LET because we'll reorder it later
        let filteredPlans = plans
          .filter(plan => {
            if (role === 'CANDIDATE') {
              return plan.plan_type === 'CANDIDATE';
            }

            if (role === 'HR') {
              return plan.plan_type === 'COMPANY';
            }

            return true;
          })
          .sort((a, b) => {
            const order: Record<string, number> = {
              COMPANY_TRIAL: 1,
              COMPANY_REGULAR: 2,
              COMPANY_PREMIUM: 3,
              COMPANY_ENTERPRISE: 4,

              CANDIDATE_TRIAL: 1,
              CANDIDATE_REGULAR: 2,
              CANDIDATE_PREMIUM: 3,
              CANDIDATE_ENTERPRISE: 4,
            };

            return (order[a.tier_code] || 99) - (order[b.tier_code] || 99);
          });

        // HR → force display order by plan name
        if (role === 'HR') {
          const hrOrder = [
            'HR Trial Plan',
            'Regular',
            'Premium',
            'Enterprise'
          ];

          filteredPlans = [...filteredPlans].sort(
            (a, b) => hrOrder.indexOf(a.name) - hrOrder.indexOf(b.name)
          );
        }

        // Candidate → force display order
        if (role === 'CANDIDATE') {
          const candidateOrder = [
            'Candidate Pro Trial',
            'Candidate Regular',
            'Candidate Premium',
            'Candidate Enterprise'
          ];

          filteredPlans = [...filteredPlans].sort(
            (a, b) =>
              candidateOrder.indexOf(a.name) -
              candidateOrder.indexOf(b.name)
          );
        }

        this.plans.set(filteredPlans);

        if (!this.selectedPlan && filteredPlans.length) {
          this.selectedPlan = filteredPlans[0];
        }
      },

      error: (err) => {
        this.error.set(err?.error?.detail || 'Failed to load plans.');
        this.loading.set(false);
      },

      complete: () => {
        this.fetchCurrentSubscription();
      },
    });
  }

  private fetchCurrentSubscription(): void {
    this.paymentsService.getMySubscription().subscribe({
      next: (sub: any) => {
        if (!sub || sub.status === 'NONE' || !sub.plan) {
          this.subscription.set(null);
        } else {
          this.subscription.set(sub);
        }
      },
      error: () => {
        this.subscription.set(null);
        this.loading.set(false);
      },
      complete: () => this.loading.set(false)
    });
  }

  applyCoupon(event: Event): void {
    event.preventDefault();
    const plan = this.selectedPlan;
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

  subscribeToPlan(plan: SubscriptionPlan): void {
    this.selectedPlan = plan;

    this.paymentsService.createOrder({
      plan_id: plan.id,
      coupon_code: this.couponCode.trim() || undefined
    }).subscribe({
      next: (order: any) => {

        // If backend already activated a free plan (future use)
        if (order.free && order.subscription) {
          this.subscription.set(order.subscription);
          this.onSubscriptionActivated();
          return;
        }

        // Trial and Paid plans BOTH open Razorpay
        this.openRazorpay(order, plan);
      },

      error: (err) => {
        alert(err?.error?.detail || err?.error?.error || 'Unable to create payment order');
      }
    });
  }

  openRazorpay(order: any, plan: SubscriptionPlan): void {

    const Razorpay = (window as any).Razorpay;

    if (!Razorpay) {
      alert('Razorpay SDK is not available.');
      return;
    }

    const options: any = {
      key: order.razorpay_key_id,

      // ✅ Subscription checkout
      order_id: order.razorpay_order_id,

      amount: order.amount,

      currency: order.currency,

      name: 'Enterprise Job Portal',

      description: order.trial
        ? `${order.trial_days}-Day Free Trial`
        : `${plan.name} Subscription`,

      image: 'assets/logo.png',

      prefill: {
        name: this.currentUser?.full_name || '',
        email: this.currentUser?.email || '',
        contact: this.currentUser?.phone || ''
      },

      theme: {
        color: '#6D28D9'
      },

      modal: {
        ondismiss: () => {
          console.log('Subscription checkout cancelled');
        },
        confirm_close: true
      },

      retry: {
        enabled: true,
        max_count: 3
      },

      // Enable all supported payment methods
      method: {
        upi: true,
        card: true,
        netbanking: true,
        wallet: true,
        emi: true,
        paylater: true
      },

      handler: (response: any) => {

        this.paymentsService.verifyPayment({
          razorpay_subscription_id: response.razorpay_subscription_id,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_signature: response.razorpay_signature
        }).subscribe({
          next: () => {
            alert('Subscription activated successfully!');
            this.fetchCurrentSubscription();
          },
          error: () => {
            alert('Payment verification failed.');
          }
        }); 

      }
    };

    const razorpay = new Razorpay(options);
    razorpay.open();

  }

  verifyPayment(payload: VerifyPaymentPayload | any): void {
    this.paymentsService.verifyPayment(payload).subscribe({
      next: () => {
        alert('Subscription activated successfully!');
        this.onSubscriptionActivated();
      },
      error: () => alert('Payment verification failed')
    });
  }

  private onSubscriptionActivated(): void {
    this.fetchCurrentSubscription();
    this.loadData();

    if (typeof (this.authService as any).loadUserProfile === 'function') {
      (this.authService as any).loadUserProfile().subscribe();
    } else if (typeof (this.authService as any).getUserProfile === 'function') {
      (this.authService as any).getUserProfile().subscribe();
    }
  }

  formatCurrency(value: number, currency: string): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(value);
  }

  getDisplayPlanName(plan: SubscriptionPlan): string {
    switch (plan.tier_code) {
      case 'CANDIDATE_TRIAL':
      case 'COMPANY_TRIAL':
        return '7-Day Trial';

      case 'CANDIDATE_REGULAR':
      case 'COMPANY_REGULAR':
        return 'Regular';

      case 'CANDIDATE_PREMIUM':
      case 'COMPANY_PREMIUM':
        return 'Premium';

      case 'CANDIDATE_ENTERPRISE':
      case 'COMPANY_ENTERPRISE':
        return 'Enterprise';

      default:
        return plan.name;
    }
  }

  isCurrentPlan(plan: SubscriptionPlan): boolean {
    const subscription = this.subscription();
    if (!subscription || !subscription.plan) {
      return false;
    }
    return subscription.plan.id === plan.id;
  }

  // ===============================
  // PLAN UI HELPERS
  // ===============================

  getPlanFeatures(plan: SubscriptionPlan): string[] {
    const features: string[] = [];

    // HR Plans
    if (plan.plan_type === 'COMPANY') {
      features.push(
        plan.job_post_quota >= 999
          ? 'Unlimited Job Postings'
          : `${plan.job_post_quota} Job Postings`
      );

      features.push('AI Candidate Matching');
      features.push('Direct Candidate Messaging');

      if (plan.advanced_analytics) {
        features.push('Advanced Recruitment Analytics');
      }

      if (plan.priority_listing) {
        features.push('Priority Job Listing');
      }

      if (plan.resume_boost) {
        features.push('AI Resume Screening');
      }

      return features;
    }

    // Candidate Plans
    features.push('AI Career Recommendations');
    features.push('Direct HR Messaging');

    if (plan.resume_boost) {
      features.push('Priority Resume Visibility');
    }

    if (plan.advanced_analytics) {
      features.push('Application Analytics');
    }

    if (plan.priority_listing) {
      features.push('Featured Candidate Profile');
    }

    if (plan.tier_code.includes('ENTERPRISE')) {
      features.push('Unlimited AI Career Assistant');
    }

    return features;
  }

  getPlanBadge(plan: SubscriptionPlan): string {
    switch (plan.tier_code) {
      case 'COMPANY_TRIAL':
      case 'CANDIDATE_TRIAL':
        return '7-DAY FREE';

      case 'COMPANY_PREMIUM':
      case 'CANDIDATE_PREMIUM':
        return 'MOST POPULAR';

      case 'COMPANY_ENTERPRISE':
      case 'CANDIDATE_ENTERPRISE':
        return 'BEST VALUE';

      default:
        return '';
    }
  }

  isTrialPlan(plan: SubscriptionPlan): boolean {
    return plan.trial_period_days > 0;
  }

  isPremium(plan: SubscriptionPlan): boolean {
    return (
      plan.tier_code === 'COMPANY_PREMIUM' ||
      plan.tier_code === 'CANDIDATE_PREMIUM'
    );
  }

  isEnterprise(plan: SubscriptionPlan): boolean {
    return (
      plan.tier_code === 'COMPANY_ENTERPRISE' ||
      plan.tier_code === 'CANDIDATE_ENTERPRISE'
    );
  }
}

