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

@Injectable({ providedIn: 'root' })
export class PaymentsService {
  private api = inject(ApiService);

  listPlans(): Observable<SubscriptionPlan[]> {
    return this.api.get<PaginatedResponse<SubscriptionPlan>>(API.PAYMENTS.PLANS).pipe(
      map((response) => response.results)
    );
  }

  getMySubscription(): Observable<Subscription> {
    return this.api.get<Subscription>(API.PAYMENTS.MY_SUBSCRIPTION);
  }

  listPayments(): Observable<any[]> {
    return this.api.get<any[]>(API.PAYMENTS.PAYMENTS);
  }

  getRevenue(): Observable<any> {
    return this.api.get<any>(API.PAYMENTS.REVENUE);
  }

  validateCoupon(payload: { code: string; plan_id: number }): Observable<CouponValidationResult> {
    return this.api.post<CouponValidationResult>(API.PAYMENTS.COUPON_VALIDATE, payload);
  }

  createOrder(payload: CreateOrderPayload): Observable<CreateOrderResponse> {
    return this.api.post<CreateOrderResponse>(API.PAYMENTS.CREATE_ORDER, payload);
  }

  verifyPayment(payload: VerifyPaymentPayload): Observable<CreateOrderResponse> {
    return this.api.post<CreateOrderResponse>(API.PAYMENTS.VERIFY_PAYMENT, payload);
  }
}
