import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from './api.service';
import { API } from '../constants/api.constants';
import { PaginatedResponse } from '../models/common.model';
import {
  SubscriptionPlan,
  Subscription,
  CouponValidationResult,
  CreateOrderPayload,
  CreateOrderResponse,
  VerifyPaymentPayload,
} from '../models/payment.model';

/* ---------- Revenue Interfaces ---------- */

export interface RevenueTransaction {
  id: number;
  transaction_id: string;
  user: number;
  user_email: string;
  company_name: string;
  subscription: number;
  plan_name: string;
  amount: number;
  currency: string;
  status: string;
  created_at: string;
  razorpay_order_id: string;
  razorpay_payment_id: string;
}

export interface RevenueDashboard {
  total_revenue: number;
  successful_transactions: number;
  active_subscriptions: number;
  expiring_soon: number;
  trial_users: number;

  monthly_revenue: {
    month: string;
    revenue: number;
  }[];

  plan_breakdown: {
    plan: string;
    count: number;
  }[];

  recent_transactions: RevenueTransaction[];
}

@Injectable({
  providedIn: 'root'
})
export class PaymentsService {

  private api = inject(ApiService);

  /* ---------- Subscription Plans ---------- */

  listPlans(): Observable<SubscriptionPlan[]> {
    return this.api
      .get<PaginatedResponse<SubscriptionPlan>>(API.PAYMENTS.PLANS)
      .pipe(map(res => res.results));
  }

  /* ---------- My Subscription ---------- */

  getMySubscription(): Observable<Subscription> {
    return this.api.get<Subscription>(API.PAYMENTS.MY_SUBSCRIPTION);
  }

  /* ---------- Payments ---------- */

  listPayments(): Observable<any[]> {
    return this.api.get<any[]>(API.PAYMENTS.PAYMENTS);
  }

  /* ---------- Revenue Dashboard ---------- */

  getRevenue(period: string = 'all'): Observable<RevenueDashboard> {
    return this.api.get<RevenueDashboard>(
      `${API.PAYMENTS.REVENUE}?period=${period}`
    );
  }

  /* ---------- Coupons ---------- */

  validateCoupon(payload: {
    code: string;
    plan_id: number;
  }): Observable<CouponValidationResult> {
    return this.api.post<CouponValidationResult>(
      API.PAYMENTS.COUPON_VALIDATE,
      payload
    );
  }

  /* ---------- Razorpay ---------- */

  createOrder(
    payload: CreateOrderPayload
  ): Observable<CreateOrderResponse> {
    return this.api.post<CreateOrderResponse>(
      API.PAYMENTS.CREATE_ORDER,
      payload
    );
  }

  verifyPayment(
    payload: VerifyPaymentPayload
  ): Observable<CreateOrderResponse> {
    return this.api.post<CreateOrderResponse>(
      API.PAYMENTS.VERIFY_PAYMENT,
      payload
    );
  }

}