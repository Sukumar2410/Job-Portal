from django.db import transaction
from django.utils import timezone

from .models import Subscription, SubscriptionStatus


@transaction.atomic
def process_expired_trials():
    """
    Convert expired trial subscriptions into ACTIVE subscriptions
    when auto-renew is enabled.

    Otherwise mark them as EXPIRED.
    """

    now = timezone.now()

    expired_trials = Subscription.objects.select_for_update().filter(
        status=SubscriptionStatus.TRIAL,
        is_trial=True,
        trial_ends_at__lte=now,
    )

    activated = 0
    expired = 0

    for subscription in expired_trials:

        if subscription.auto_renew:
            subscription.status = SubscriptionStatus.ACTIVE
            subscription.is_trial = False
            subscription.starts_at = now

            # Preserve the existing expiry period
            if subscription.plan.billing_cycle == "YEARLY":
                subscription.expires_at = now + timezone.timedelta(days=365)
            else:
                subscription.expires_at = now + timezone.timedelta(days=30)

            activated += 1

        else:
            subscription.status = SubscriptionStatus.EXPIRED
            expired += 1

        subscription.save()

    return {
        "activated": activated,
        "expired": expired,
        "processed": activated + expired,
    }