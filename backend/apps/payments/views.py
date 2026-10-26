from datetime import timedelta
from decimal import Decimal
from xmlrpc import client
import razorpay
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.db.models import Sum, Count
from django.db.models.functions import TruncMonth
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.core.mail import EmailMultiAlternatives
from django.utils.html import strip_tags
from apps.users.models import UserRole
from django.conf import settings
from django.views.decorators.csrf import csrf_exempt
import json

from .models import SubscriptionPlan, Subscription, Payment, Coupon, SubscriptionStatus
from .serializers import (
    SubscriptionPlanSerializer,
    SubscriptionSerializer,
    PaymentSerializer,
    CouponSerializer,
    ValidateCouponSerializer,
    AdminManualPaymentSerializer,
)


class IsSuperAdminUser(permissions.BasePermission):
    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and (
                request.user.is_superuser or
                getattr(request.user, "role", None) == "SUPER_ADMIN"
            )
        )


# --- VIEWSETS ---

class SubscriptionPlanViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = SubscriptionPlanSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = SubscriptionPlan.objects.filter(
            is_active=True
        ).order_by("sort_order", "price")

        user = self.request.user

        # Candidate Login
        if getattr(user, "role", None) == "CANDIDATE":
            return queryset.filter(plan_type="CANDIDATE")

        # HR / Company Login
        if getattr(user, "role", None) == "HR":
            return queryset.filter(plan_type="COMPANY")

        # Super Admin → Can see everything
        if user.is_superuser or getattr(user, "role", None) == "SUPER_ADMIN":
            return queryset

        return queryset.none()


class CouponViewSet(viewsets.ModelViewSet):
    queryset = Coupon.objects.all().order_by('-created_at')
    serializer_class = CouponSerializer
    permission_classes = [IsSuperAdminUser]


class SubscriptionViewSet(viewsets.ModelViewSet):
    queryset = Subscription.objects.select_related('user', 'plan').all().order_by('-created_at')
    serializer_class = SubscriptionSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve', 'update', 'partial_update', 'destroy']:
            permission_classes = [IsSuperAdminUser]
        else:
            permission_classes = [permissions.IsAuthenticated]
        return [permission() for permission in permission_classes]


class PaymentViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Payment.objects.select_related('user', 'subscription').all().order_by('-created_at')
    serializer_class = PaymentSerializer
    permission_classes = [IsSuperAdminUser]


# --- PUBLIC & USER ENDPOINTS ---

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def validate_coupon(request):
    serializer = ValidateCouponSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    code = serializer.validated_data['code'].upper()
    try:
        coupon = Coupon.objects.get(code=code, is_active=True)
    except Coupon.DoesNotExist:
        return Response({'valid': False, 'message': 'Invalid or inactive coupon code.'}, status=status.HTTP_404_NOT_FOUND)

    if coupon.valid_until and coupon.valid_until < timezone.now():
        return Response({'valid': False, 'message': 'Coupon has expired.'}, status=status.HTTP_400_BAD_REQUEST)

    if coupon.max_uses and coupon.current_uses >= coupon.max_uses:
        return Response({'valid': False, 'message': 'Coupon limit reached.'}, status=status.HTTP_400_BAD_REQUEST)

    return Response({
        'valid': True,
        'code': coupon.code,
        'discount_type': coupon.discount_type,
        'discount_value': coupon.discount_value,
    }, status=status.HTTP_200_OK)


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def create_order(request):
    plan_id = request.data.get("plan_id")
    auto_renew = request.data.get("auto_renew", True)

    if not plan_id:
        return Response(
            {"error": "plan_id is required"},
            status=status.HTTP_400_BAD_REQUEST
        )

    plan = get_object_or_404(
        SubscriptionPlan,
        id=plan_id,
        is_active=True
    )

    # Get HR company if applicable
    company = None
    if request.user.role == UserRole.HR:
        hr_profile = getattr(request.user, "hr_profile", None)
        if hr_profile:
            company = hr_profile.company

    # Create or reuse Razorpay Customer
    client = razorpay.Client(
        auth=(
            settings.RAZORPAY_KEY_ID,
            settings.RAZORPAY_KEY_SECRET
        )
    )

    customers = client.customer.all({
        "email": request.user.email
    }).get("items", [])

    if customers:
        customer_id = customers[0]["id"]
    else:
        customer = client.customer.create({
            "name": request.user.full_name,
            "email": request.user.email,
            "contact": request.user.phone or ""
        })
        customer_id = customer["id"]

    # Create pending subscription
    subscription = Subscription.objects.create(
        user=request.user,
        company=company,
        plan=plan,
        status=SubscriptionStatus.PENDING,
        auto_renew=auto_renew,
        razorpay_customer_id=customer_id,
    )

    # Create Razorpay Subscription (Auto Debit)
    # ---------------------------------------------------
    # Development Mode: Create Razorpay Order
    # ---------------------------------------------------

    # Razorpay Orders require at least ₹1
    if plan.trial_period_days > 0:
        amount = 100      # ₹1 authorization in development
    else:
        amount = int(Decimal(plan.price) * 100)

    razorpay_order = client.order.create({
        "amount": amount,
        "currency": "INR",
        "payment_capture": 1,
        "notes": {
            "plan_id": str(plan.id),
            "user_id": str(request.user.id),
            "trial": str(plan.trial_period_days > 0),
        }
    })

    Payment.objects.create(
        user=request.user,
        subscription=subscription,
        amount=plan.price,
        currency="INR",
        status="PENDING",
        razorpay_order_id=razorpay_order["id"],
    )

    return Response({
        "razorpay_order_id": razorpay_order["id"],
        "razorpay_key_id": settings.RAZORPAY_KEY_ID,
        "amount": amount,
        "currency": "INR",
        "plan_name": plan.name,
        "trial": plan.trial_period_days > 0,
        "trial_days": plan.trial_period_days,
        "message": "Order created successfully."
    })

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def verify_payment(request):
    """
    Verify Razorpay Subscription payment and activate the subscription.
    """

    razorpay_subscription_id = request.data.get("razorpay_subscription_id")
    razorpay_payment_id = request.data.get("razorpay_payment_id")
    razorpay_signature = request.data.get("razorpay_signature")

    if not all([
        razorpay_subscription_id,
        razorpay_payment_id,
        razorpay_signature
    ]):
        return Response(
            {"error": "Missing payment verification fields."},
            status=status.HTTP_400_BAD_REQUEST
        )

    client = razorpay.Client(
        auth=(
            settings.RAZORPAY_KEY_ID,
            settings.RAZORPAY_KEY_SECRET
        )
    )

    # -----------------------------
    # Verify Razorpay Signature
    # -----------------------------
    try:
        client.utility.verify_subscription_payment_signature({
            "razorpay_subscription_id": razorpay_subscription_id,
            "razorpay_payment_id": razorpay_payment_id,
            "razorpay_signature": razorpay_signature,
        })
    except Exception:
        return Response(
            {"error": "Invalid payment signature."},
            status=status.HTTP_400_BAD_REQUEST
        )

    # -----------------------------
    # Fetch Pending Subscription
    # -----------------------------
    try:
        subscription = Subscription.objects.get(
            razorpay_subscription_id=razorpay_subscription_id,
            user=request.user
        )
    except Subscription.DoesNotExist:
        return Response(
            {"error": "Subscription not found."},
            status=status.HTTP_404_NOT_FOUND
        )

    # -----------------------------
    # Activate Trial / Paid Plan
    # -----------------------------
    now = timezone.now()

    if subscription.plan.trial_period_days > 0:
        subscription.status = SubscriptionStatus.TRIAL
        subscription.is_trial = True
        subscription.starts_at = now
        subscription.trial_ends_at = now + timedelta(
            days=subscription.plan.trial_period_days
        )
        subscription.expires_at = subscription.trial_ends_at
    else:
        subscription.status = SubscriptionStatus.ACTIVE
        subscription.is_trial = False
        subscription.starts_at = now
        subscription.expires_at = now + timedelta(days=30)

    subscription.razorpay_payment_id = razorpay_payment_id
    subscription.save()

    # -----------------------------
    # Create Payment Record
    # -----------------------------
    payment = Payment.objects.create(
        user=request.user,
        subscription=subscription,
        amount=subscription.plan.price,
        currency="INR",
        status="SUCCESS",
        transaction_id=razorpay_payment_id,
        razorpay_order_id="",
        razorpay_payment_id=razorpay_payment_id,
    )

    # -----------------------------
    # Send Confirmation Email
    # -----------------------------
    html = f"""
    <html>
      <body style="font-family:Arial;padding:30px;background:#F3F4F6;">
        <div style="max-width:620px;margin:auto;background:#fff;border-radius:12px;padding:30px;">
          <h2 style="color:#059669;">🎉 Subscription Activated</h2>

          <p>Hi {request.user.full_name},</p>

          <p>Your <strong>{subscription.plan.name}</strong> subscription has been activated successfully.</p>

          <table style="width:100%;margin-top:20px;">
            <tr><td><b>Plan</b></td><td>{subscription.plan.name}</td></tr>
            <tr><td><b>Amount</b></td><td>₹ {payment.amount}</td></tr>
            <tr><td><b>Transaction</b></td><td>{payment.transaction_id}</td></tr>
            <tr><td><b>Start</b></td><td>{subscription.starts_at.strftime('%d %b %Y')}</td></tr>
            <tr><td><b>Expiry</b></td><td>{subscription.expires_at.strftime('%d %b %Y')}</td></tr>
          </table>

          <p style="margin-top:25px;">
            Thank you for choosing Enterprise Job Portal.
          </p>
        </div>
      </body>
    </html>
    """

    email = EmailMultiAlternatives(
        subject="🎉 Subscription Activated | Enterprise Job Portal",
        body=strip_tags(html),
        from_email=settings.DEFAULT_FROM_EMAIL,
        to=[request.user.email],
    )

    email.attach_alternative(html, "text/html")
    email.send()

    return Response(
        {
            "message": "Payment verified successfully.",
            "subscription_status": subscription.status,
            "trial": subscription.is_trial,
            "trial_ends_at": subscription.trial_ends_at,
        },
        status=status.HTTP_200_OK,
    )

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def current_subscription(request):
    sub = Subscription.objects.filter(user=request.user, status='ACTIVE').order_by('-created_at').first()
    if not sub:
        return Response({'subscription': None}, status=status.HTTP_200_OK)
    serializer = SubscriptionSerializer(sub)
    return Response({'subscription': serializer.data}, status=status.HTTP_200_OK)


# --- SUPER ADMIN ANALYTICS & OVERRIDES ---

@api_view(["GET"])
@permission_classes([IsSuperAdminUser])
def revenue_dashboard(request):
    period = request.GET.get("period", "all").lower()
    today = timezone.localdate()

    # Base queryset for completed payments
    successful = Payment.objects.filter(status="SUCCESS")

    # Filter payment calculations according to period parameter
    if period == "today":
        successful = successful.filter(created_at__date=today)
    elif period in ["month", "this_month"]:
        successful = successful.filter(
            created_at__year=today.year,
            created_at__month=today.month
        )
    elif period in ["year", "this_year"]:
        successful = successful.filter(
            created_at__year=today.year
        )

    elif period in ["trial", "trial_users"]:
            successful = successful.filter(
                subscription__is_trial=True
            )

    # Total revenue for selected period
    total_revenue = successful.aggregate(
        total=Sum("amount")
    )["total"] or Decimal("0.00")

    successful_transactions = successful.count()

    # Active subscription metrics
    active_subscriptions = Subscription.objects.filter(
        status="ACTIVE",
        expires_at__date__gte=today
    ).count()

    expiring_soon = Subscription.objects.filter(
        status="ACTIVE",
        expires_at__date__range=[
            today,
            today + timedelta(days=7)
        ]
    ).count()

    trial_subscriptions = Subscription.objects.filter(
        is_trial=True,
        status__in=["TRIAL", "ACTIVE"]
    )

    trial_users = trial_subscriptions.count()

    # Monthly revenue aggregate
    monthly = (
        successful
        .annotate(month=TruncMonth("created_at"))
        .values("month")
        .annotate(revenue=Sum("amount"))
        .order_by("month")
    )

    monthly_data = [
        {
            "month": m["month"].strftime("%b %Y"),
            "revenue": float(m["revenue"])
        }
        for m in monthly if m["month"]
    ]

    # Active plan breakdown
    plans = (
        Subscription.objects
        .filter(status="ACTIVE")
        .values("plan__name")
        .annotate(count=Count("id"))
        .order_by("-count")
    )

    plan_data = [
        {
            "plan": p["plan__name"] or "Unknown",
            "count": p["count"]
        }
        for p in plans
    ]

    # Recent payments (limited to filtered period set)
    recent = (
        successful
        .select_related(
            "subscription",
            "subscription__plan",
            "subscription__company",
            "user",
        )
        .order_by("-created_at")[:20]
    )

    recent_data = []
    for payment in recent:
        company_name = "-"
        if payment.subscription and payment.subscription.company:
            company_name = payment.subscription.company.name

        plan_name = "-"
        if payment.subscription and payment.subscription.plan:
            plan_name = payment.subscription.plan.name

        user_email = payment.user.email if payment.user else "-"
        tx_id = str(payment.transaction_id)

        recent_data.append({
            # Standard keys
            "id": tx_id,
            "company": company_name,
            "plan": plan_name,
            "user": user_email,
            "amount": float(payment.amount),
            "status": payment.status,
            "created_at": payment.created_at,

            # Alternate/Explicit frontend keys (prevents empty table cells)
            "transaction_id": tx_id,
            "transaction": tx_id,
            "company_name": company_name,
            "plan_name": plan_name,
            "user_email": user_email,
            "email": user_email,
        })
    return Response({
        "total_revenue": float(total_revenue),
        "successful_transactions": successful_transactions,
        "active_subscriptions": active_subscriptions,
        "expiring_soon": expiring_soon,
        "trial_users": trial_users,
        "monthly_revenue": monthly_data,
        "plan_breakdown": plan_data,
        "recent_transactions": recent_data,
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsSuperAdminUser])
def admin_manual_payment_override(request):
    serializer = AdminManualPaymentSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    payment = Payment.objects.create(
        user_id=serializer.validated_data['user_id'],
        subscription_id=serializer.validated_data['subscription_id'],
        amount=serializer.validated_data['amount'],
        status='SUCCESS',
        razorpay_order_id='MANUAL_OVERRIDE',
        razorpay_payment_id='MANUAL_OVERRIDE',
    )
    return Response({
        'message': 'Manual payment successfully logged.',
        'payment': PaymentSerializer(payment).data
    }, status=status.HTTP_201_CREATED)

@csrf_exempt
@api_view(["POST"])
@permission_classes([permissions.AllowAny])
def webhook_handler(request):
    """
    Razorpay Webhook Endpoint
    Handles subscription renewals, cancellations and failed payments.
    """

    try:
        payload = json.loads(request.body)
        event = payload.get("event")
    except Exception:
        return Response(
            {"error": "Invalid webhook payload"},
            status=status.HTTP_400_BAD_REQUEST
        )

    # -----------------------------
    # Subscription Activated
    # -----------------------------
    if event == "subscription.activated":
        subscription_id = payload["payload"]["subscription"]["entity"]["id"]

        Subscription.objects.filter(
            razorpay_subscription_id=subscription_id
        ).update(status=SubscriptionStatus.ACTIVE)

    # -----------------------------
    # Recurring Payment Success
    # -----------------------------
    elif event == "subscription.charged":
        entity = payload["payload"]["payment"]["entity"]

        subscription = Subscription.objects.filter(
            razorpay_subscription_id=entity["subscription_id"]
        ).first()

        if subscription:
            Payment.objects.create(
                user=subscription.user,
                subscription=subscription,
                amount=entity["amount"] / 100,
                currency=entity["currency"],
                status="SUCCESS",
                transaction_id=entity["id"],
                razorpay_payment_id=entity["id"],
                razorpay_order_id="",
            )

    # -----------------------------
    # Subscription Cancelled
    # -----------------------------
    elif event == "subscription.cancelled":
        subscription_id = payload["payload"]["subscription"]["entity"]["id"]

        Subscription.objects.filter(
            razorpay_subscription_id=subscription_id
        ).update(status=SubscriptionStatus.CANCELLED)

    # -----------------------------
    # Payment Failed
    # -----------------------------
    elif event == "payment.failed":
        entity = payload["payload"]["payment"]["entity"]

        subscription = Subscription.objects.filter(
            razorpay_subscription_id=entity.get("subscription_id")
        ).first()

        if subscription:
            Payment.objects.create(
                user=subscription.user,
                subscription=subscription,
                amount=entity["amount"] / 100,
                currency=entity["currency"],
                status="FAILED",
                transaction_id=entity["id"],
                razorpay_payment_id=entity["id"],
                razorpay_order_id="",
            )

    return Response({"status": "ok"})