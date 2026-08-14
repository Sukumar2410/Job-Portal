from django.db import models
from django.conf import settings
from django.utils import timezone
import uuid


class PlanType(models.TextChoices):
    COMPANY = 'COMPANY', 'Company Plan'
    CANDIDATE = 'CANDIDATE', 'Candidate Plan'


class BillingCycle(models.TextChoices):
    MONTHLY = 'MONTHLY', 'Monthly'
    YEARLY = 'YEARLY', 'Yearly'
    ONE_TIME = 'ONE_TIME', 'One Time'


class SubscriptionPlan(models.Model):
    """Available subscription plans (managed by Super Admin)"""
    name = models.CharField(max_length=100, unique=True)
    plan_type = models.CharField(max_length=20, choices=PlanType.choices)
    tier_code = models.CharField(
        max_length=30, unique=True,
        help_text='e.g. FREE, PREMIUM, ENTERPRISE, CANDIDATE_PREMIUM'
    )
    description = models.TextField(blank=True)

    price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    currency = models.CharField(max_length=10, default='INR')
    billing_cycle = models.CharField(
        max_length=20, choices=BillingCycle.choices, default=BillingCycle.MONTHLY
    )

    # Feature quotas
    job_post_quota = models.PositiveIntegerField(default=5)
    featured_job_quota = models.PositiveIntegerField(default=0)
    resume_boost = models.BooleanField(default=False)
    priority_listing = models.BooleanField(default=False)
    advanced_analytics = models.BooleanField(default=False)
    direct_messaging = models.BooleanField(default=False)
    ai_recommendations = models.BooleanField(default=True)

    # NEW: Trial support
    trial_period_days = models.PositiveIntegerField(
        default=0,
        help_text='Free trial in days. 0 = no trial.'
    )

    features_list = models.JSONField(default=list, blank=True,
                                     help_text='List of feature strings for display')

    is_active = models.BooleanField(default=True)
    sort_order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'subscription_plans'
        ordering = ['plan_type', 'sort_order', 'price']

    def __str__(self):
        return f'{self.name} ({self.get_plan_type_display()})'


class CouponDiscountType(models.TextChoices):
    PERCENTAGE = 'PERCENTAGE', 'Percentage'
    FIXED = 'FIXED', 'Fixed Amount'


class Coupon(models.Model):
    """Discount coupons for subscription purchases"""
    code = models.CharField(max_length=50, unique=True, db_index=True)
    description = models.CharField(max_length=200, blank=True)

    discount_type = models.CharField(
        max_length=20,
        choices=CouponDiscountType.choices,
        default=CouponDiscountType.PERCENTAGE
    )
    discount_value = models.DecimalField(
        max_digits=10, decimal_places=2,
        help_text='For PERCENTAGE: 20 = 20% off. For FIXED: 100 = ₹100 off.'
    )

    # Validity window
    valid_from = models.DateTimeField(default=timezone.now)
    valid_until = models.DateTimeField(null=True, blank=True)

    # Usage limits
    max_uses = models.PositiveIntegerField(
        null=True, blank=True,
        help_text='Total redemptions allowed. Leave blank for unlimited.'
    )
    current_uses = models.PositiveIntegerField(default=0)

    max_uses_per_user = models.PositiveIntegerField(default=1)

    # Applicability
    applicable_plans = models.ManyToManyField(
        SubscriptionPlan,
        blank=True,
        related_name='coupons',
        help_text='Leave empty to apply to all plans.'
    )

    is_active = models.BooleanField(default=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL, null=True, blank=True,
        related_name='created_coupons'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'coupons'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.code} ({self.discount_type_display_short})'

    @property
    def discount_type_display_short(self):
        if self.discount_type == CouponDiscountType.PERCENTAGE:
            return f'{self.discount_value}% off'
        return f'₹{self.discount_value} off'

    @property
    def is_expired(self):
        if not self.valid_until:
            return False
        return timezone.now() > self.valid_until

    @property
    def is_started(self):
        return timezone.now() >= self.valid_from

    @property
    def is_exhausted(self):
        if self.max_uses is None:
            return False
        return self.current_uses >= self.max_uses

    @property
    def is_valid_now(self):
        return (
            self.is_active and
            self.is_started and
            not self.is_expired and
            not self.is_exhausted
        )

    def calculate_discount(self, amount):
        """Calculate the discount amount for a given subtotal"""
        if self.discount_type == CouponDiscountType.PERCENTAGE:
            return round(float(amount) * float(self.discount_value) / 100, 2)
        return min(float(self.discount_value), float(amount))


class SubscriptionStatus(models.TextChoices):
    PENDING = 'PENDING', 'Pending Payment'
    TRIAL = 'TRIAL', 'On Trial'
    ACTIVE = 'ACTIVE', 'Active'
    EXPIRED = 'EXPIRED', 'Expired'
    CANCELLED = 'CANCELLED', 'Cancelled'


class Subscription(models.Model):
    """Active subscription for a company or candidate"""
    plan = models.ForeignKey(SubscriptionPlan, on_delete=models.PROTECT, related_name='subscriptions')

    company = models.ForeignKey(
        'companies.Company', on_delete=models.CASCADE,
        null=True, blank=True, related_name='subscriptions'
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        null=True, blank=True, related_name='subscriptions'
    )

    status = models.CharField(
        max_length=20, choices=SubscriptionStatus.choices,
        default=SubscriptionStatus.PENDING
    )
    starts_at = models.DateTimeField(default=timezone.now)
    expires_at = models.DateTimeField(null=True, blank=True)
    auto_renew = models.BooleanField(default=False)

    # NEW: Trial support
    is_trial = models.BooleanField(default=False)
    trial_ends_at = models.DateTimeField(null=True, blank=True)

    # NEW: Coupon tracking
    coupon_used = models.ForeignKey(
        Coupon, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='subscriptions'
    )
    discount_applied = models.DecimalField(
        max_digits=10, decimal_places=2, default=0
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'subscriptions'
        ordering = ['-created_at']

    def __str__(self):
        target = self.company.name if self.company else (self.user.email if self.user else 'Unknown')
        return f'{target} - {self.plan.name} ({self.status})'

    @property
    def is_active_now(self):
        if self.status not in [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIAL]:
            return False
        if self.expires_at and self.expires_at < timezone.now():
            return False
        return True

    @property
    def days_remaining(self):
        target_date = self.trial_ends_at if self.is_trial else self.expires_at
        if not target_date:
            return None
        delta = target_date - timezone.now()
        return max(0, delta.days)


class PaymentStatus(models.TextChoices):
    PENDING = 'PENDING', 'Pending'
    SUCCESS = 'SUCCESS', 'Success'
    FAILED = 'FAILED', 'Failed'
    REFUNDED = 'REFUNDED', 'Refunded'
    PARTIALLY_REFUNDED = 'PARTIALLY_REFUNDED', 'Partially Refunded'

class SubscriptionFeature(models.TextChoices):
    JOB_POST = "JOB_POST", "Job Posts"
    FEATURED_JOB = "FEATURED_JOB", "Featured Job Posts"

    AI_CREDITS = "AI_CREDITS", "AI Credits"
    AI_RESUME_ANALYSIS = "AI_RESUME_ANALYSIS", "AI Resume Analysis"
    AI_RESUME_REWRITE = "AI_RESUME_REWRITE", "AI Resume Rewrite"
    AI_CAREER_COACH = "AI_CAREER_COACH", "AI Career Coach"
    MOCK_INTERVIEW = "MOCK_INTERVIEW", "Mock Interview"

    DIRECT_MESSAGES = "DIRECT_MESSAGES", "Direct Messages"
    RESUME_BOOST = "RESUME_BOOST", "Resume Boost"

    REPORT_EXPORT = "REPORT_EXPORT", "Report Export"

class Payment(models.Model):
    """Payment transaction records"""
    transaction_id = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    subscription = models.ForeignKey(
        Subscription, on_delete=models.CASCADE, related_name='payments'
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, related_name='payments'
    )
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=10, default='INR')
    status = models.CharField(
        max_length=25, choices=PaymentStatus.choices, default=PaymentStatus.PENDING
    )
    payment_method = models.CharField(max_length=50, default='RAZORPAY',
                                       help_text='e.g. CARD, UPI, NETBANKING, RAZORPAY, MOCK')

    # NEW: Razorpay fields
    razorpay_order_id = models.CharField(max_length=100, blank=True, db_index=True)
    razorpay_payment_id = models.CharField(max_length=100, blank=True, db_index=True)
    razorpay_signature = models.CharField(max_length=255, blank=True)

    # NEW: Refund tracking
    refunded_amount = models.DecimalField(
        max_digits=10, decimal_places=2, default=0
    )
    refund_reason = models.TextField(blank=True)
    refunded_at = models.DateTimeField(null=True, blank=True)
    refunded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL, null=True, blank=True,
        related_name='refunds_processed'
    )

    gateway_reference = models.CharField(max_length=200, blank=True)
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'payments'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.transaction_id} - {self.amount} {self.currency} ({self.status})'

    @property
    def net_amount(self):
        """Amount after refunds"""
        return float(self.amount) - float(self.refunded_amount)

class SubscriptionUsage(models.Model):
    """
    Tracks feature usage for each subscription.
    One record = One feature usage.
    """

    subscription = models.ForeignKey(
        Subscription,
        on_delete=models.CASCADE,
        related_name="usage_records"
    )

    feature_code = models.CharField(
        max_length=50,
        choices=SubscriptionFeature.choices
    )

    allowed_limit = models.PositiveIntegerField(
        default=0,
        help_text="Maximum allowed usage for this feature."
    )

    used = models.PositiveIntegerField(default=0)

    last_reset_at = models.DateTimeField(
        default=timezone.now
    )

    created_at = models.DateTimeField(auto_now_add=True)

    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "subscription_usage"

        unique_together = ("subscription", "feature_code")

        ordering = ["subscription", "feature_code"]

    def __str__(self):
        return (
            f"{self.subscription} - "
            f"{self.feature_code} "
            f"({self.used}/{self.allowed_limit})"
        )

    @property
    def remaining(self):
        return max(self.allowed_limit - self.used, 0)