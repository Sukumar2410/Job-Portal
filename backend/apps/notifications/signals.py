"""
Auto-trigger notifications on important events using Django signals.
"""
from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver

from apps.applications.models import Application, Interview, ApplicationStatus
from apps.companies.models import Company
from apps.payments.models import Payment, PaymentStatus
from .services import send_notification
from .models import NotificationType, NotificationPriority


# ==================== Track previous status of Application ====================
@receiver(pre_save, sender=Application)
def cache_previous_status(sender, instance, **kwargs):
    """Store old status before save so post_save can compare"""
    if instance.pk:
        try:
            instance._previous_status = Application.objects.get(pk=instance.pk).status
        except Application.DoesNotExist:
            instance._previous_status = None
    else:
        instance._previous_status = None


# ==================== Application Events ====================
@receiver(post_save, sender=Application)
def notify_on_application_change(sender, instance, created, **kwargs):
    if created:
        # Notify HR when a new application is received
        hr_users = instance.job.company.hr_users.select_related('user').all()
        for hr_profile in hr_users:
            if hr_profile.user:
                send_notification(
                    recipient=hr_profile.user,
                    title=f'New Application: {instance.job.title}',
                    message=f'{instance.candidate.full_name} applied to your job "{instance.job.title}".',
                    notification_type=NotificationType.NEW_APPLICATION,
                    priority=NotificationPriority.NORMAL,
                    action_url=f'/hr/applications/{instance.id}',
                    related_object_type='application',
                    related_object_id=instance.id,
                )
        return

    # Status change → notify candidate
    prev = getattr(instance, '_previous_status', None)
    if prev and prev != instance.status:
        status_messages = {
            ApplicationStatus.UNDER_REVIEW: (
                'Application Under Review',
                f'Your application for "{instance.job.title}" is now being reviewed.',
                NotificationPriority.NORMAL,
            ),
            ApplicationStatus.SHORTLISTED: (
                '🎉 You\'ve been Shortlisted!',
                f'Great news! You\'ve been shortlisted for "{instance.job.title}" at {instance.job.company.name}.',
                NotificationPriority.HIGH,
            ),
            ApplicationStatus.INTERVIEW_SCHEDULED: (
                'Interview Scheduled',
                f'An interview has been scheduled for your "{instance.job.title}" application.',
                NotificationPriority.HIGH,
            ),
            ApplicationStatus.INTERVIEWED: (
                'Interview Completed',
                f'Your interview for "{instance.job.title}" has been marked as completed.',
                NotificationPriority.NORMAL,
            ),
            ApplicationStatus.OFFERED: (
                '🎊 Job Offer Extended!',
                f'Congratulations! You have received an offer for "{instance.job.title}" at {instance.job.company.name}.',
                NotificationPriority.URGENT,
            ),
            ApplicationStatus.HIRED: (
                '🎉 Welcome Aboard!',
                f'You have been hired for "{instance.job.title}" at {instance.job.company.name}!',
                NotificationPriority.URGENT,
            ),
            ApplicationStatus.REJECTED: (
                'Application Update',
                f'Your application for "{instance.job.title}" was not selected this time. Keep applying!',
                NotificationPriority.NORMAL,
            ),
        }

        if instance.status in status_messages:
            title, message, priority = status_messages[instance.status]
            send_notification(
                recipient=instance.candidate,
                title=title,
                message=message,
                notification_type=NotificationType.APPLICATION_STATUS,
                priority=priority,
                action_url=f'/candidate/applications/{instance.id}',
                related_object_type='application',
                related_object_id=instance.id,
            )


# ==================== Interview Scheduled ====================
@receiver(post_save, sender=Interview)
def notify_on_interview_scheduled(sender, instance, created, **kwargs):
    if created:
        candidate = instance.application.candidate
        send_notification(
            recipient=candidate,
            title=f'Interview Scheduled: {instance.round_name}',
            message=(
                f'Your {instance.get_mode_display()} interview for '
                f'"{instance.application.job.title}" is scheduled on '
                f'{instance.scheduled_at.strftime("%d %b %Y, %I:%M %p")}.'
            ),
            notification_type=NotificationType.INTERVIEW_SCHEDULED,
            priority=NotificationPriority.HIGH,
            action_url=f'/candidate/applications/{instance.application.id}',
            related_object_type='interview',
            related_object_id=instance.id,
        )


# ==================== Company Verified ====================
@receiver(pre_save, sender=Company)
def cache_previous_verification(sender, instance, **kwargs):
    if instance.pk:
        try:
            instance._previous_verified = Company.objects.get(pk=instance.pk).is_verified
        except Company.DoesNotExist:
            instance._previous_verified = False
    else:
        instance._previous_verified = False


@receiver(post_save, sender=Company)
def notify_on_company_verified(sender, instance, created, **kwargs):
    if created:
        return
    prev = getattr(instance, '_previous_verified', False)
    if not prev and instance.is_verified:
        # Notify all HR users of this company
        hr_users = instance.hr_users.select_related('user').all()
        for hr_profile in hr_users:
            if hr_profile.user:
                send_notification(
                    recipient=hr_profile.user,
                    title='✅ Company Verified',
                    message=f'{instance.name} has been verified by our team. Verified badge is now visible.',
                    notification_type=NotificationType.COMPANY_VERIFIED,
                    priority=NotificationPriority.HIGH,
                    action_url=f'/hr/company',
                    related_object_type='company',
                    related_object_id=instance.id,
                )


# ==================== Payment Events ====================
@receiver(post_save, sender=Payment)
def notify_on_payment(sender, instance, created, **kwargs):
    if created:
        return
    if instance.status == PaymentStatus.SUCCESS and instance.user:
        plan_name = instance.subscription.plan.name
        send_notification(
            recipient=instance.user,
            title='💳 Payment Successful',
            message=f'Your payment of ₹{instance.amount} for {plan_name} was successful. Subscription is now active.',
            notification_type=NotificationType.PAYMENT_SUCCESS,
            priority=NotificationPriority.HIGH,
            action_url='/settings/subscription',
            related_object_type='payment',
            related_object_id=instance.id,
        )
    elif instance.status == PaymentStatus.FAILED and instance.user:
        send_notification(
            recipient=instance.user,
            title='❌ Payment Failed',
            message=f'Your payment of ₹{instance.amount} could not be processed. Please try again.',
            notification_type=NotificationType.PAYMENT_FAILED,
            priority=NotificationPriority.HIGH,
            action_url='/settings/subscription',
            related_object_type='payment',
            related_object_id=instance.id,
        )