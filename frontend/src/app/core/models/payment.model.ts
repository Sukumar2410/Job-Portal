export type PlanType = 'COMPANY' | 'CANDIDATE';
export type BillingCycle = 'MONTHLY' | 'YEARLY' | 'ONE_TIME';

export interface SubscriptionPlan {
  id: number;
  name: string;
  plan_type: PlanType;
  plan_type_display?: string;
  tier_code: string;
  description: string;
  price: number;
  currency: string;
  billing_cycle: BillingCycle;
  billing_cycle_display?: string;
  job_post_quota: number;
  featured_job_quota: number;
  resume_boost: boolean;
  priority_listing: boolean;
  advanced_analytics: boolean;
  direct_messaging: boolean;
  ai_recommendations: boolean;
  trial_period_days: number;
  features_list: string[];
  is_active: boolean;
}

export interface Subscription {
  id: number;
  plan: SubscriptionPlan;
  status: string;
  starts_at: string | null;
  expires_at: string | null;
  auto_renew: boolean;
  is_trial: boolean;
  trial_ends_at: string | null;
  coupon_code?: string | null;
  discount_applied?: number;
  is_active_now?: boolean;
  days_remaining?: number;
}

export interface CouponValidationResult {
  valid: boolean;
  coupon: {
    id: number;
    code: string;
    discount_type: string;
    discount_value: string;
  };
  plan_price: string;
  discount_amount: string;
  final_amount: string;
}

export interface CreateOrderPayload {
  plan_id: number;
  coupon_code?: string;
  auto_renew?: boolean;
}

export interface CreateOrderResponse {
  trial?: boolean;
  free?: boolean;
  message: string;
  subscription?: Subscription;
  razorpay_order_id?: string;
  razorpay_key_id?: string;
  amount?: number;
  currency?: string;
  plan_name?: string;
}

export interface VerifyPaymentPayload {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}
