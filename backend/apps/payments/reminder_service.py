from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.conf import settings
from .models import SubscriptionReminder, ReminderType

def send_subscription_reminder(subscription, days_left):
    type_mapping = {
        7: ReminderType.SEVEN_DAYS,
        3: ReminderType.THREE_DAYS,
        1: ReminderType.ONE_DAY,
    }
    reminder_enum = type_mapping.get(days_left, ReminderType.SEVEN_DAYS)

    # Prevent duplicate emails if reminder already exists
    if SubscriptionReminder.objects.filter(
        subscription=subscription, 
        reminder_type=reminder_enum, 
        is_successful=True
    ).exists():
        print(f"Reminder {reminder_enum} already sent for subscription {subscription.id}. Skipping.")
        return False

    company = (
        subscription.company.name
        if hasattr(subscription, 'company') and subscription.company
        else (subscription.user.get_full_name() or subscription.user.email)
    )

    plan_name = subscription.plan.name if subscription.plan else "Subscription"
    expiry_date_str = subscription.expires_at.strftime("%d %B %Y") if subscription.expires_at else "N/A"

    html_content = render_to_string(
        "emails/subscription_expiry.html",
        {
            "company_name": company,
            "plan_name": plan_name,
            "expiry_date": expiry_date_str,
            "days_left": days_left,
            "billing_url": f"{settings.FRONTEND_BASE_URL}/billing"
        }
    )

    recipient_email = "sukumarb.ds24@gmail.com"

    email = EmailMultiAlternatives(
        subject=f"Your subscription expires in {days_left} day(s)",
        body=f"Your {plan_name} subscription will expire on {expiry_date_str}.",
        from_email=settings.DEFAULT_FROM_EMAIL,
        to=[recipient_email]
    )

    email.attach_alternative(html_content, "text/html")
    email.send()

    # Safely create or update record without crashing on UNIQUE constraint
    SubscriptionReminder.objects.update_or_create(
        subscription=subscription,
        reminder_type=reminder_enum,
        defaults={"is_successful": True}
    )
    return True