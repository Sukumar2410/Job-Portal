from rest_framework import serializers
from .models import SubscriptionPlan, Subscription, Payment, Coupon


class SubscriptionPlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = SubscriptionPlan
        fields = '__all__'


class CouponSerializer(serializers.ModelSerializer):
    class Meta:
        model = Coupon
        fields = '__all__'

    def validate_code(self, value):
        return value.upper().strip()


class ValidateCouponSerializer(serializers.Serializer):
    code = serializers.CharField(max_length=50)
    plan_id = serializers.IntegerField(required=False, allow_null=True)


class PaymentSerializer(serializers.ModelSerializer):
    user_email = serializers.EmailField(
        source='user.email',
        read_only=True
    )

    company_name = serializers.SerializerMethodField()

    plan_name = serializers.SerializerMethodField()

    class Meta:
        model = Payment
        fields = [
            'id',
            'transaction_id',
            'user',
            'user_email',
            'company_name',
            'subscription',
            'plan_name',
            'amount',
            'currency',
            'status',
            'created_at',
            'razorpay_order_id',
            'razorpay_payment_id',
        ]

    def get_company_name(self, obj):
        if obj.subscription and obj.subscription.company:
            return obj.subscription.company.name
        return "-"

    def get_plan_name(self, obj):
        if obj.subscription and obj.subscription.plan:
            return obj.subscription.plan.name
        return "-"

class SubscriptionSerializer(serializers.ModelSerializer):
    user_email = serializers.EmailField(source='user.email', read_only=True)
    plan_detail = SubscriptionPlanSerializer(source='plan', read_only=True)

    class Meta:
        model = Subscription
        fields = [
            'id', 'user', 'user_email', 'plan', 'plan_detail',
            'status', 'starts_at', 'expires_at', 'auto_renew',
            'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class AdminManualPaymentSerializer(serializers.Serializer):
    user_id = serializers.IntegerField()
    subscription_id = serializers.IntegerField()
    amount = serializers.DecimalField(max_digits=10, decimal_places=2)
    notes = serializers.CharField(required=False, allow_blank=True)