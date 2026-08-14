from rest_framework import serializers
from django.utils import timezone
from .models import (
    SubscriptionPlan, Subscription, Payment,
    Coupon, CouponDiscountType,
)


class SubscriptionPlanSerializer(serializers.ModelSerializer):
    plan_type_display = serializers.CharField(source='get_plan_type_display', read_only=True)
    billing_cycle_display = serializers.CharField(source='get_billing_cycle_display', read_only=True)

    class Meta:
        model = SubscriptionPlan
        fields = '__all__'


class CouponListSerializer(serializers.ModelSerializer):
    """Compact serializer for listing coupons"""
    discount_type_display = serializers.CharField(source='get_discount_type_display', read_only=True)
    is_valid_now = serializers.BooleanField(read_only=True)
    is_expired = serializers.BooleanField(read_only=True)
    is_exhausted = serializers.BooleanField(read_only=True)
    applicable_plans_count = serializers.IntegerField(source='applicable_plans.count', read_only=True)

    class Meta:
        model = Coupon
        fields = (
            'id', 'code', 'description',
            'discount_type', 'discount_type_display', 'discount_value',
            'valid_from', 'valid_until',
            'max_uses', 'current_uses', 'max_uses_per_user',
            'applicable_plans_count',
            'is_active', 'is_valid_now', 'is_expired', 'is_exhausted',
            'created_at',
        )


class CouponDetailSerializer(serializers.ModelSerializer):
    """Full serializer with plan details"""
    applicable_plans_data = SubscriptionPlanSerializer(source='applicable_plans', many=True, read_only=True)
    is_valid_now = serializers.BooleanField(read_only=True)

    class Meta:
        model = Coupon
        fields = '__all__'
        read_only_fields = ('current_uses', 'created_by', 'created_at', 'updated_at')


class CouponValidateSerializer(serializers.Serializer):
    """Input for validating a coupon code"""
    code = serializers.CharField()
    plan_id = serializers.IntegerField()


class SubscriptionSerializer(serializers.ModelSerializer):
    plan = SubscriptionPlanSerializer(read_only=True)
    plan_id = serializers.IntegerField(write_only=True)
    is_active_now = serializers.BooleanField(read_only=True)
    days_remaining = serializers.IntegerField(read_only=True)
    company_name = serializers.CharField(source='company.name', read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)
    coupon_code = serializers.CharField(source='coupon_used.code', read_only=True)

    class Meta:
        model = Subscription
        fields = ('id', 'plan', 'plan_id', 'company', 'user', 'company_name',
                  'user_email', 'status', 'starts_at', 'expires_at',
                  'auto_renew', 'is_trial', 'trial_ends_at',
                  'coupon_used', 'coupon_code', 'discount_applied',
                  'is_active_now', 'days_remaining', 'created_at')
        read_only_fields = ('status', 'starts_at', 'expires_at', 'created_at',
                            'is_trial', 'trial_ends_at')


class PaymentSerializer(serializers.ModelSerializer):
    plan_name = serializers.CharField(source='subscription.plan.name', read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)
    net_amount = serializers.FloatField(read_only=True)
    refunded_by_email = serializers.CharField(source='refunded_by.email', read_only=True)

    class Meta:
        model = Payment
        fields = ('id', 'transaction_id', 'subscription', 'plan_name', 'user_email',
                  'amount', 'currency', 'status', 'payment_method',
                  'razorpay_order_id', 'razorpay_payment_id',
                  'refunded_amount', 'refund_reason', 'refunded_at', 'refunded_by_email',
                  'net_amount', 'gateway_reference', 'created_at', 'completed_at')
        read_only_fields = ('transaction_id', 'status', 'completed_at', 'created_at',
                            'razorpay_order_id', 'razorpay_payment_id')


class CreateOrderSerializer(serializers.Serializer):
    """Input for creating a Razorpay order"""
    plan_id = serializers.IntegerField()
    coupon_code = serializers.CharField(required=False, allow_blank=True)
    auto_renew = serializers.BooleanField(default=False)


class VerifyPaymentSerializer(serializers.Serializer):
    """Input for verifying Razorpay payment"""
    razorpay_order_id = serializers.CharField()
    razorpay_payment_id = serializers.CharField()
    razorpay_signature = serializers.CharField()


class RefundSerializer(serializers.Serializer):
    """Input for refunding a payment"""
    amount = serializers.DecimalField(max_digits=10, decimal_places=2, required=False)
    reason = serializers.CharField(required=False, allow_blank=True)