from django.db import transaction
from django.db.models import F

from apps.payments.models import (
    Subscription,
    SubscriptionStatus,
    SubscriptionUsage,
    SubscriptionFeature,
)

from apps.jobs.models import Job, JobStatus
from apps.payments.models import SubscriptionUsage, SubscriptionFeature

PLAN_FEATURE_MAPPING = {
    SubscriptionFeature.JOB_POST: "job_post_quota",
    SubscriptionFeature.FEATURED_JOB: "featured_job_quota",
}

@transaction.atomic
def create_subscription_usage(subscription):
    """
    Create usage records for a subscription based on its selected plan.
    """

    plan = subscription.plan

    usage_records = []

    for feature_code, plan_field in PLAN_FEATURE_MAPPING.items():

        allowed_limit = getattr(plan, plan_field, 0)

        usage_records.append(
            SubscriptionUsage(
                subscription=subscription,
                feature_code=feature_code,
                allowed_limit=allowed_limit,
                used=0,
            )
        )

    SubscriptionUsage.objects.bulk_create(
        usage_records,
        ignore_conflicts=True
    )

    return usage_records

def has_remaining_usage(subscription, feature_code):
    """
    Check whether the subscription has remaining quota
    for the requested feature.
    """

    try:
        usage = SubscriptionUsage.objects.get(
            subscription=subscription,
            feature_code=feature_code,
        )
    except SubscriptionUsage.DoesNotExist:
        return False

    return usage.remaining > 0

@transaction.atomic
def consume_usage(subscription, feature_code):
    """
    Consume one unit of the specified feature.

    Returns:
        True  -> Usage consumed successfully.
        False -> No remaining quota.
    """

    try:
        usage = SubscriptionUsage.objects.select_for_update().get(
            subscription=subscription,
            feature_code=feature_code,
        )
    except SubscriptionUsage.DoesNotExist:
        return False

    if usage.remaining <= 0:
        return False

    SubscriptionUsage.objects.filter(
        pk=usage.pk
    ).update(
        used=F("used") + 1
    )

    return True

@transaction.atomic
def release_usage(subscription, feature_code):
    """
    Release one unit of the specified feature.

    Returns:
        True  -> Usage released successfully.
        False -> Usage record not found or already zero.
    """

    try:
        usage = SubscriptionUsage.objects.select_for_update().get(
            subscription=subscription,
            feature_code=feature_code,
        )
    except SubscriptionUsage.DoesNotExist:
        return False

    if usage.used <= 0:
        return False

    SubscriptionUsage.objects.filter(
        pk=usage.pk
    ).update(
        used=F("used") - 1
    )

    return True

@transaction.atomic
def reset_usage(subscription):
    """
    Reset all feature usage for a subscription.

    This is intended to be called at the beginning of a new
    billing cycle (monthly/yearly) or when an administrator
    manually resets a subscription.

    Returns:
        Number of usage records that were reset.
    """

    updated_count = SubscriptionUsage.objects.filter(
        subscription=subscription
    ).update(
        used=0
    )

    return updated_count

@transaction.atomic
def sync_job_post_usage(subscription, company):
    """
    Synchronize JOB_POST usage with the company's ACTIVE jobs.

    This keeps SubscriptionUsage as the single source of truth while
    allowing slot-based subscriptions.

    Returns:
        int: Current number of active jobs.
    """

    active_jobs = Job.objects.filter(
        company=company,
        status=JobStatus.ACTIVE
    ).count()

    SubscriptionUsage.objects.filter(
        subscription=subscription,
        feature_code=SubscriptionFeature.JOB_POST
    ).update(
        used=active_jobs
    )

    return active_jobs

def can_create_job(subscription):
    """
    Check whether another ACTIVE job can be created.

    Returns:
        (bool, str)
    """

    if not subscription.company:
        return False, "No company is associated with this subscription."

    try:
        usage = SubscriptionUsage.objects.get(
            subscription=subscription,
            feature_code=SubscriptionFeature.JOB_POST,
        )
    except SubscriptionUsage.DoesNotExist:
        return (
            False,
            "Job posting feature is not configured for this subscription."
        )

    active_jobs = Job.objects.filter(
        company=subscription.company,
        status=JobStatus.ACTIVE,
    ).count()

    if active_jobs >= usage.allowed_limit:
        return (
            False,
            f"Job posting quota reached ({usage.allowed_limit} active jobs). "
            "Upgrade your subscription to post more jobs."
        )

    return True, ""

def get_active_subscription(company):
    """
    Return the company's active or trial subscription.
    """
    return (
        Subscription.objects.filter(
            company=company,
            status__in=[
                SubscriptionStatus.ACTIVE,
                SubscriptionStatus.TRIAL,
            ],
        )
        .order_by("-created_at")
        .first()
    )

def validate_job_post(company):
    """
    Validate whether the company can create another job.
    """
    subscription = get_active_subscription(company)

    if not subscription:
        return False, "Your company does not have an active subscription."

    return can_create_job(subscription)

def update_job_post_usage(company):
    """
    Synchronize job posting usage after job creation.
    """
    subscription = get_active_subscription(company)

    if subscription:
        sync_job_post_usage(subscription, company)

def can_feature_job(company):
    """
    Check whether the company can feature another job.

    Returns:
        (bool, str)
    """

    subscription = get_active_subscription(company)

    if not subscription:
        return False, "Your company does not have an active subscription."

    try:
        usage = SubscriptionUsage.objects.get(
            subscription=subscription,
            feature_code=SubscriptionFeature.FEATURED_JOB,
        )
    except SubscriptionUsage.DoesNotExist:
        return (
            False,
            "Featured job feature is not configured for this subscription."
        )

    if usage.remaining <= 0:
        return (
            False,
            f"Featured job quota reached ({usage.allowed_limit}). "
            "Upgrade your subscription to feature more jobs."
        )

    return True, ""

@transaction.atomic
def feature_job(company):
    """
    Consume one FEATURED_JOB quota.

    Returns:
        (bool, str)
    """

    subscription = get_active_subscription(company)

    if not subscription:
        return False, "Your company does not have an active subscription."

    success = consume_usage(
        subscription,
        SubscriptionFeature.FEATURED_JOB,
    )

    if not success:
        return (
            False,
            "Featured job quota has been exhausted."
        )

    return True, ""

@transaction.atomic
def unfeature_job(company):
    """
    Release one FEATURED_JOB quota.
    """

    subscription = get_active_subscription(company)

    if not subscription:
        return False

    return release_usage(
        subscription,
        SubscriptionFeature.FEATURED_JOB,
    )