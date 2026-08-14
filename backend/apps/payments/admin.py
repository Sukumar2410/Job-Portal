from django.contrib import admin
from .models import (
    SubscriptionPlan,
    Subscription,
    Payment,
    Coupon,
    SubscriptionUsage
)


@admin.register(SubscriptionPlan)
class SubscriptionPlanAdmin(admin.ModelAdmin):
    list_display = (
    'id',
    'name',
    'plan_type',
    'tier_code',
    'price',
    'billing_cycle',
    'trial_period_days',
    'is_active'
)
    list_filter = ('plan_type', 'billing_cycle', 'is_active')
    search_fields = ('name', 'tier_code')


@admin.register(Coupon)
class CouponAdmin(admin.ModelAdmin):
    list_display = ('code', 'discount_type', 'discount_value', 'current_uses',
                    'max_uses', 'is_active', 'valid_until')
    list_filter = ('discount_type', 'is_active')
    search_fields = ('code', 'description')
    filter_horizontal = ('applicable_plans',)


@admin.register(Subscription)
class SubscriptionAdmin(admin.ModelAdmin):
    list_display = ('id', 'plan', 'company', 'user', 'status', 'is_trial',
                    'starts_at', 'expires_at')
    list_filter = ('status', 'plan__plan_type', 'is_trial')
    search_fields = ('company__name', 'user__email')


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ('transaction_id', 'user', 'amount', 'currency', 'status',
                    'razorpay_payment_id', 'created_at')
    list_filter = ('status', 'payment_method')
    search_fields = ('transaction_id', 'user__email', 'razorpay_payment_id')
    readonly_fields = ('transaction_id', 'created_at', 'completed_at',
                       'razorpay_order_id', 'razorpay_payment_id', 'razorpay_signature')

@admin.register(SubscriptionUsage)
class SubscriptionUsageAdmin(admin.ModelAdmin):
    list_display = (
        'subscription',
        'feature_code',
        'allowed_limit',
        'used',
        'remaining',
        'last_reset_at',
    )

    list_filter = (
        'feature_code',
    )

    search_fields = (
        'subscription__user__email',
        'subscription__company__name',
        'feature_code',
    )

    ordering = (
        'subscription',
        'feature_code',
    )

    readonly_fields = (
        'remaining',
        'created_at',
        'updated_at',
    )