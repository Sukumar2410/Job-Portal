from datetime import timedelta
from decimal import Decimal
from django.utils import timezone
from django.conf import settings
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema, OpenApiTypes 
from django_filters.rest_framework import DjangoFilterBackend
import requests
from requests.auth import HTTPBasicAuth
import hmac
import hashlib

from apps.users.models import UserRole
from apps.users.permissions import IsSuperAdmin
from apps.companies.models import Company
from .models import (
    SubscriptionPlan, Subscription, Payment, Coupon,
    SubscriptionStatus, PaymentStatus, PlanType, BillingCycle,
    CouponDiscountType,
)
from .serializers import (
    SubscriptionPlanSerializer, SubscriptionSerializer,
    PaymentSerializer, CouponListSerializer, CouponDetailSerializer,
    CouponValidateSerializer, CreateOrderSerializer,
    VerifyPaymentSerializer, RefundSerializer,
)

from .subscription_service import create_subscription_usage


RAZORPAY_BASE = 'https://api.razorpay.com/v1'


def razorpay_auth():
    """Returns HTTP Basic Auth tuple for Razorpay API calls"""
    return HTTPBasicAuth(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET)


# ==================== SUBSCRIPTION PLANS ====================
class SubscriptionPlanViewSet(viewsets.ModelViewSet):
    """
    - List/Retrieve: Public (anyone can see plans)
    - Create/Update/Delete: Super Admin only
    """
    queryset = SubscriptionPlan.objects.filter(is_active=True)
    serializer_class = SubscriptionPlanSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return [IsSuperAdmin()]

    def get_queryset(self):
        if self.request.user.is_authenticated and self.request.user.role == UserRole.SUPER_ADMIN:
            return SubscriptionPlan.objects.all()
        return SubscriptionPlan.objects.filter(is_active=True)


# ==================== COUPONS ====================
class CouponViewSet(viewsets.ModelViewSet):
    """
    Super Admin only — manage coupons.
    """
    queryset = Coupon.objects.all().order_by('-created_at')
    permission_classes = [IsSuperAdmin]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['discount_type', 'is_active']
    search_fields = ['code', 'description']

    def get_serializer_class(self):
        if self.action == 'list':
            return CouponListSerializer
        return CouponDetailSerializer

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


from drf_spectacular.utils import extend_schema, OpenApiTypes


@extend_schema(
    summary='Validate Coupon',
    description='Check if a coupon code is valid for a specific plan. Returns discount amount and final price.',
    request=CouponValidateSerializer,
    responses={200: OpenApiTypes.OBJECT, 400: OpenApiTypes.OBJECT, 404: OpenApiTypes.OBJECT},
    tags=['Payments - Coupons'],
)
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def validate_coupon(request):
    """
    POST /api/payments/coupons/validate/
    Check if a coupon code is valid for a specific plan.
    Returns discount amount and final price.
    """
    serializer = CouponValidateSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    code = serializer.validated_data['code'].strip().upper()
    plan_id = serializer.validated_data['plan_id']

    try:
        coupon = Coupon.objects.get(code__iexact=code)
    except Coupon.DoesNotExist:
        return Response({'valid': False, 'error': 'Coupon code not found.'},
                        status=status.HTTP_404_NOT_FOUND)

    if not coupon.is_valid_now:
        reason = 'Coupon is inactive.'
        if coupon.is_expired:
            reason = 'Coupon has expired.'
        elif coupon.is_exhausted:
            reason = 'Coupon usage limit reached.'
        elif not coupon.is_started:
            reason = 'Coupon is not yet active.'
        return Response({'valid': False, 'error': reason},
                        status=status.HTTP_400_BAD_REQUEST)

    try:
        plan = SubscriptionPlan.objects.get(pk=plan_id, is_active=True)
    except SubscriptionPlan.DoesNotExist:
        return Response({'valid': False, 'error': 'Plan not found.'},
                        status=status.HTTP_404_NOT_FOUND)

    # Check plan applicability
    applicable_plans = coupon.applicable_plans.all()
    if applicable_plans.exists() and plan not in applicable_plans:
        return Response({'valid': False, 'error': 'This coupon is not applicable to the selected plan.'},
                        status=status.HTTP_400_BAD_REQUEST)

    # Check per-user usage limit
    user_uses = Subscription.objects.filter(
        user=request.user, coupon_used=coupon
    ).count() if request.user.role == UserRole.CANDIDATE else Subscription.objects.filter(
        company__hr_users__user=request.user, coupon_used=coupon
    ).count()

    if user_uses >= coupon.max_uses_per_user:
        return Response({'valid': False, 'error': 'You have already used this coupon.'},
                        status=status.HTTP_400_BAD_REQUEST)

    # Calculate discount
    discount = coupon.calculate_discount(plan.price)
    final_amount = float(plan.price) - discount

    return Response({
        'valid': True,
        'coupon': {
            'id': coupon.id,
            'code': coupon.code,
            'discount_type': coupon.discount_type,
            'discount_value': str(coupon.discount_value),
        },
        'plan_price': str(plan.price),
        'discount_amount': str(discount),
        'final_amount': str(final_amount),
    })


# ==================== SUBSCRIPTIONS ====================
class SubscriptionViewSet(viewsets.ReadOnlyModelViewSet):
    """View subscriptions - user sees their own, admin sees all"""
    serializer_class = SubscriptionSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['status', 'plan', 'is_trial']
    search_fields = ['user__email', 'company__name']

    def get_queryset(self):
        user = self.request.user
        qs = Subscription.objects.select_related('plan', 'company', 'user', 'coupon_used')

        if user.role == UserRole.SUPER_ADMIN:
            return qs.all()

        if user.role == UserRole.HR:
            hr_profile = getattr(user, 'hr_profile', None)
            if hr_profile and hr_profile.company:
                return qs.filter(company=hr_profile.company)

        return qs.filter(user=user)


# ==================== PAYMENTS ====================
class PaymentViewSet(viewsets.ReadOnlyModelViewSet):
    """View payments - user sees their own, admin sees all"""
    serializer_class = PaymentSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['status', 'payment_method']
    search_fields = ['transaction_id', 'user__email', 'razorpay_order_id']

    def get_queryset(self):
        user = self.request.user
        qs = Payment.objects.select_related('subscription', 'subscription__plan', 'user')

        if user.role == UserRole.SUPER_ADMIN:
            return qs.all()

        return qs.filter(user=user)

    @action(detail=True, methods=['post'], permission_classes=[IsSuperAdmin])
    def refund(self, request, pk=None):
        """
        POST /api/payments/payments/{id}/refund/
        Super Admin refunds a payment (full or partial).
        """
        payment = self.get_object()

        if payment.status not in [PaymentStatus.SUCCESS, PaymentStatus.PARTIALLY_REFUNDED]:
            return Response(
                {'detail': f'Cannot refund payment with status {payment.status}.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = RefundSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        refund_amount = serializer.validated_data.get('amount', payment.amount)
        reason = serializer.validated_data.get('reason', 'Refund by admin')

        max_refundable = float(payment.amount) - float(payment.refunded_amount)
        if float(refund_amount) > max_refundable:
            return Response(
                {'detail': f'Max refundable amount is {max_refundable}.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # ----------------------------------------------------------
        # MOCK REFUND (Development only)
        # ----------------------------------------------------------
        if (
            settings.DEBUG
            and payment.razorpay_payment_id
            and payment.razorpay_payment_id.startswith("mock_")
        ):
            # Skip Razorpay API call in development
            pass

        # ----------------------------------------------------------
        # REAL RAZORPAY REFUND
        # ----------------------------------------------------------
        elif payment.razorpay_payment_id and settings.RAZORPAY_KEY_ID:
            try:
                refund_paise = int(float(refund_amount) * 100)

                response = requests.post(
                    f"{RAZORPAY_BASE}/payments/{payment.razorpay_payment_id}/refund",
                    auth=razorpay_auth(),
                    json={
                        "amount": refund_paise,
                        "notes": {
                            "reason": reason
                        }
                    },
                    timeout=15,
                )

                response.raise_for_status()

            except requests.exceptions.RequestException as e:
                return Response(
                    {
                        "detail": f"Razorpay refund failed: {str(e)}"
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )
        # ----------------------------------------------------------
        # Update payment record
        # ----------------------------------------------------------

        refund_amount = Decimal(str(refund_amount))

        new_refunded_total = payment.refunded_amount + refund_amount

        payment.refunded_amount = new_refunded_total
        payment.refund_reason = reason
        payment.refunded_at = timezone.now()
        payment.refunded_by = request.user

        if new_refunded_total >= payment.amount:
            payment.status = PaymentStatus.REFUNDED

            subscription = payment.subscription
            subscription.status = SubscriptionStatus.CANCELLED
            subscription.save(update_fields=["status"])

        else:
            payment.status = PaymentStatus.PARTIALLY_REFUNDED

        payment.save()

        return Response(
            {
                "message": f"Refund of ₹{refund_amount} processed successfully.",
                "payment": PaymentSerializer(payment).data,
            }
        )


# ==================== RAZORPAY CHECKOUT ====================
@extend_schema(
    summary='Create Razorpay Order',
    description=(
        'Creates a Razorpay order for the selected plan. '
        'Optionally accepts a coupon code for discount. '
        'For plans with trial_period_days > 0, activates a trial instead. '
        'Returns razorpay_order_id and razorpay_key_id for frontend checkout.'
    ),
    request=CreateOrderSerializer,
    responses={201: OpenApiTypes.OBJECT, 400: OpenApiTypes.OBJECT, 403: OpenApiTypes.OBJECT},
    tags=['Payments - Checkout'],
)
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_order(request):
    """
    POST /api/payments/create-order/
    Creates a Razorpay order for the selected plan (with optional coupon).
    Returns order_id + amount for frontend to open Razorpay checkout.
    """
    serializer = CreateOrderSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    plan_id = serializer.validated_data['plan_id']
    coupon_code = serializer.validated_data.get('coupon_code', '').strip().upper()
    auto_renew = serializer.validated_data.get('auto_renew', False)

    try:
        plan = SubscriptionPlan.objects.get(pk=plan_id, is_active=True)
    except SubscriptionPlan.DoesNotExist:
        return Response({'detail': 'Plan not found.'}, status=status.HTTP_404_NOT_FOUND)

    user = request.user
    company = None

    # Assign to company if COMPANY plan
    if plan.plan_type == PlanType.COMPANY:
        if user.role != UserRole.HR:
            return Response({'detail': 'Only HR users can subscribe to company plans.'},
                            status=status.HTTP_403_FORBIDDEN)
        hr_profile = getattr(user, 'hr_profile', None)
        if not hr_profile or not hr_profile.company:
            return Response({'detail': 'You must be linked to a company first.'},
                            status=status.HTTP_400_BAD_REQUEST)
        company = hr_profile.company

    # Apply coupon if provided
    coupon = None
    discount_amount = 0
    final_amount = float(plan.price)

    if coupon_code:
        try:
            coupon = Coupon.objects.get(code__iexact=coupon_code)
            if not coupon.is_valid_now:
                return Response({'detail': 'Coupon is not valid.'},
                                status=status.HTTP_400_BAD_REQUEST)
            applicable = coupon.applicable_plans.all()
            if applicable.exists() and plan not in applicable:
                return Response({'detail': 'Coupon not applicable to this plan.'},
                                status=status.HTTP_400_BAD_REQUEST)
            discount_amount = coupon.calculate_discount(plan.price)
            final_amount = float(plan.price) - discount_amount
        except Coupon.DoesNotExist:
            return Response({'detail': 'Coupon code not found.'},
                            status=status.HTTP_404_NOT_FOUND)

    # Handle free trial (skip payment entirely)
    if plan.trial_period_days > 0:

        starts_at = timezone.now()
        trial_end = starts_at + timedelta(days=plan.trial_period_days)

        subscription = Subscription.objects.create(
            plan=plan,
            company=company,
            user=user if plan.plan_type == PlanType.CANDIDATE else None,
            status=SubscriptionStatus.TRIAL,
            is_trial=True,
            starts_at=starts_at,
            trial_ends_at=trial_end,
            expires_at=trial_end,
            auto_renew=auto_renew,
            coupon_used=coupon,
            discount_applied=Decimal(str(discount_amount)),
        )

        create_subscription_usage(subscription)

        if company and plan.plan_type == PlanType.COMPANY:
            company.subscription_tier = plan.tier_code
            company.job_post_quota = plan.job_post_quota
            company.save()

        return Response({
            'trial': True,
            'message': f'Trial started for {plan.trial_period_days} days.',
            'subscription': SubscriptionSerializer(subscription).data,
        }, status=status.HTTP_201_CREATED)

    # Zero-cost after discount (100% coupon) - grant instantly without Razorpay
    if final_amount <= 0:
        subscription = Subscription.objects.create(
            plan=plan,
            company=company,
            user=user if plan.plan_type == PlanType.CANDIDATE else None,
            status=SubscriptionStatus.ACTIVE,
            starts_at=timezone.now(),
            expires_at=_calculate_expiry(plan),
            auto_renew=auto_renew,
            coupon_used=coupon,
            discount_applied=Decimal(str(discount_amount)),
        )
        Payment.objects.create(
            subscription=subscription,
            user=user,
            amount=Decimal('0'),
            currency=plan.currency,
            status=PaymentStatus.SUCCESS,
            payment_method='FREE_COUPON',
            completed_at=timezone.now(),
        )
        if coupon:
            coupon.current_uses += 1
            coupon.save(update_fields=['current_uses'])
        if company and plan.plan_type == PlanType.COMPANY:
            company.subscription_tier = plan.tier_code
            company.job_post_quota = plan.job_post_quota
            company.save()

        return Response({
            'free': True,
            'message': 'Subscription activated (100% coupon).',
            'subscription': SubscriptionSerializer(subscription).data,
        }, status=status.HTTP_201_CREATED)

    # Create Razorpay order via HTTP API
    try:
        amount_paise = int(final_amount * 100)  # Razorpay uses paise (1 INR = 100 paise)
        response = requests.post(
            f'{RAZORPAY_BASE}/orders',
            auth=razorpay_auth(),
            json={
                'amount': amount_paise,
                'currency': plan.currency,
                'notes': {
                    'plan_id': str(plan.id),
                    'user_id': str(user.id),
                    'coupon_code': coupon.code if coupon else '',
                }
            },
            timeout=15,
        )
        response.raise_for_status()
        razorpay_order = response.json()
    except requests.exceptions.RequestException as e:
        return Response({'detail': f'Razorpay order creation failed: {str(e)}'},
                        status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # Create pending subscription + payment records
    subscription = Subscription.objects.create(
        plan=plan,
        company=company,
        user=user if plan.plan_type == PlanType.CANDIDATE else None,
        status=SubscriptionStatus.PENDING,
        auto_renew=auto_renew,
        coupon_used=coupon,
        discount_applied=Decimal(str(discount_amount)),
    )

    payment = Payment.objects.create(
        subscription=subscription,
        user=user,
        amount=Decimal(str(final_amount)),
        currency=plan.currency,
        status=PaymentStatus.PENDING,
        payment_method='RAZORPAY',
        razorpay_order_id=razorpay_order['id'],
    )

    return Response({
        'trial': False,
        'free': False,
        'razorpay_order_id': razorpay_order['id'],
        'razorpay_key_id': settings.RAZORPAY_KEY_ID,
        'amount': amount_paise,
        'currency': plan.currency,
        'plan_name': plan.name,
        'user_email': user.email,
        'user_name': user.full_name,
        'transaction_id': str(payment.transaction_id),
    }, status=status.HTTP_201_CREATED)


@extend_schema(
    summary='Verify Razorpay Payment',
    description='Called by frontend after Razorpay checkout completes. Verifies HMAC signature and activates subscription.',
    request=VerifyPaymentSerializer,
    responses={200: OpenApiTypes.OBJECT, 400: OpenApiTypes.OBJECT, 404: OpenApiTypes.OBJECT},
    tags=['Payments - Checkout'],
)
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def verify_payment(request):
    """
    POST /api/payments/verify-payment/
    Called by frontend after Razorpay checkout completes.
    Verifies signature + activates subscription.
    """
    serializer = VerifyPaymentSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    order_id = serializer.validated_data['razorpay_order_id']
    payment_id = serializer.validated_data['razorpay_payment_id']
    signature = serializer.validated_data['razorpay_signature']

    # ===========================================
    # Development Mock Verification
    # ===========================================

    if settings.DEBUG and payment_id.startswith("mock_"):
        # Skip signature verification during local development
        pass
    else:
        body = f'{order_id}|{payment_id}'.encode()

        expected_signature = hmac.new(
            settings.RAZORPAY_KEY_SECRET.encode(),
            body,
            hashlib.sha256
        ).hexdigest()

        if expected_signature != signature:
            return Response(
                {'detail': 'Payment signature verification failed.'},
                status=status.HTTP_400_BAD_REQUEST
            )

    # Find the payment record
    try:
        payment = Payment.objects.select_related('subscription', 'subscription__plan').get(
            razorpay_order_id=order_id
        )
    except Payment.DoesNotExist:
        return Response({'detail': 'Payment record not found.'},
                        status=status.HTTP_404_NOT_FOUND)

    if payment.status == PaymentStatus.SUCCESS:
        return Response({'detail': 'Payment already processed.'},
                        status=status.HTTP_400_BAD_REQUEST)

    # Mark payment successful
    payment.status = PaymentStatus.SUCCESS
    payment.razorpay_payment_id = payment_id
    payment.razorpay_signature = signature
    payment.completed_at = timezone.now()
    payment.save()

    # Activate subscription
    subscription = payment.subscription
    plan = subscription.plan
    subscription.status = SubscriptionStatus.ACTIVE
    subscription.starts_at = timezone.now()
    subscription.expires_at = _calculate_expiry(plan)
    subscription.save()

    create_subscription_usage(subscription)

    # Update coupon usage
    if subscription.coupon_used:
        coupon = subscription.coupon_used
        coupon.current_uses += 1
        coupon.save(update_fields=['current_uses'])

    # Update company quota if COMPANY plan
    if subscription.company and plan.plan_type == PlanType.COMPANY:
        company = subscription.company
        company.subscription_tier = plan.tier_code
        company.job_post_quota = plan.job_post_quota
        company.save()

    return Response({
        'message': 'Payment verified and subscription activated.',
        'subscription': SubscriptionSerializer(subscription).data,
        'payment': PaymentSerializer(payment).data,
    })

@extend_schema(
    summary='Get My Current Subscription',
    responses={200: SubscriptionSerializer},
    tags=['Payments - Subscription'],
)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def current_subscription(request):
    """
    GET /api/payments/my-subscription/
    Get the current active subscription for the user or their company.
    """
    user = request.user

    if user.role == UserRole.HR:
        hr_profile = getattr(user, 'hr_profile', None)
        if hr_profile and hr_profile.company:
            sub = Subscription.objects.filter(
                company=hr_profile.company,
                status__in=[SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIAL]
            ).order_by('-created_at').first()
            if sub:
                return Response(SubscriptionSerializer(sub).data)

    if user.role == UserRole.CANDIDATE:
        sub = Subscription.objects.filter(
            user=user,
            status__in=[SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIAL]
        ).order_by('-created_at').first()
        if sub:
            return Response(SubscriptionSerializer(sub).data)

    return Response({'detail': 'No active subscription found.', 'active': False})


# ==================== ADMIN REVENUE ====================
@extend_schema(
    summary='Revenue Dashboard (Admin only)',
    responses={200: OpenApiTypes.OBJECT},
    tags=['Payments - Admin'],
)
@api_view(['GET'])
@permission_classes([IsSuperAdmin])
def revenue_dashboard(request):
    """
    GET /api/payments/revenue/
    Returns revenue statistics for Super Admin.
    """
    from django.db.models import Sum, Count, Q
    from django.db.models.functions import TruncDate

    now = timezone.now()
    thirty_days_ago = now - timedelta(days=30)

    successful_payments = Payment.objects.filter(
        status__in=[PaymentStatus.SUCCESS, PaymentStatus.PARTIALLY_REFUNDED]
    )

    total_revenue = successful_payments.aggregate(
        total=Sum('amount'), refunded=Sum('refunded_amount')
    )
    gross_revenue = float(total_revenue['total'] or 0)
    total_refunded = float(total_revenue['refunded'] or 0)
    net_revenue = gross_revenue - total_refunded

    # MRR - Monthly Recurring Revenue (active subs only)
    active_subs_revenue = Subscription.objects.filter(
        status=SubscriptionStatus.ACTIVE,
        plan__billing_cycle=BillingCycle.MONTHLY,
    ).aggregate(total=Sum('plan__price'))
    mrr = float(active_subs_revenue['total'] or 0)

    # Revenue over last 30 days
    revenue_over_time = (
        successful_payments.filter(completed_at__gte=thirty_days_ago)
        .annotate(day=TruncDate('completed_at'))
        .values('day')
        .annotate(revenue=Sum('amount'))
        .order_by('day')
    )
    revenue_list = [
        {'date': str(item['day']), 'revenue': float(item['revenue'] or 0)}
        for item in revenue_over_time
    ]

    # Top plans by revenue
    top_plans = (
        SubscriptionPlan.objects.annotate(
            revenue=Sum('subscriptions__payments__amount',
                        filter=Q(subscriptions__payments__status=PaymentStatus.SUCCESS)),
            subscribers=Count('subscriptions', distinct=True)
        )
        .filter(revenue__gt=0)
        .order_by('-revenue')[:5]
    )
    top_plans_list = [
        {
            'id': p.id,
            'name': p.name,
            'revenue': float(p.revenue or 0),
            'subscribers': p.subscribers,
        }
        for p in top_plans
    ]

    return Response({
        'gross_revenue': gross_revenue,
        'total_refunded': total_refunded,
        'net_revenue': net_revenue,
        'mrr': mrr,
        'total_subscriptions': Subscription.objects.count(),
        'active_subscriptions': Subscription.objects.filter(status=SubscriptionStatus.ACTIVE).count(),
        'trial_subscriptions': Subscription.objects.filter(status=SubscriptionStatus.TRIAL).count(),
        'total_payments': successful_payments.count(),
        'refunded_payments': Payment.objects.filter(status=PaymentStatus.REFUNDED).count(),
        'revenue_over_time': revenue_list,
        'top_plans': top_plans_list,
    })


# ==================== HELPERS ====================
def _calculate_expiry(plan):
    """Calculate expiry date based on billing cycle"""
    if plan.billing_cycle == BillingCycle.MONTHLY:
        return timezone.now() + timedelta(days=30)
    elif plan.billing_cycle == BillingCycle.YEARLY:
        return timezone.now() + timedelta(days=365)
    return None