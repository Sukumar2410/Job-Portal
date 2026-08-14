"""
Auto-log audit trails via Django signals.
"""
from django.db.models.signals import post_save, pre_save, post_delete
from django.dispatch import receiver
from django.contrib.auth.signals import user_logged_in, user_logged_out

from apps.users.models import User
from apps.companies.models import Company
from apps.jobs.models import Job
from apps.applications.models import Application, Interview
from apps.payments.models import Payment, Subscription, PaymentStatus
from .services import log_action
from .models import AuditAction, AuditSeverity


# ==================== Auth ====================
@receiver(user_logged_in)
def on_login(sender, request, user, **kwargs):
    log_action(
        action=AuditAction.LOGIN,
        actor=user,
        target=user,
        description=f'{user.email} logged in',
        request=request,
    )


@receiver(user_logged_out)
def on_logout(sender, request, user, **kwargs):
    if user:
        log_action(
            action=AuditAction.LOGOUT,
            actor=user,
            target=user,
            description=f'{user.email} logged out',
            request=request,
        )


# ==================== User ====================
@receiver(post_save, sender=User)
def on_user_created(sender, instance, created, **kwargs):
    if created:
        log_action(
            action=AuditAction.REGISTER,
            actor=instance,
            target=instance,
            description=f'New user registered: {instance.email} ({instance.role})',
            metadata={'role': instance.role},
        )


# ==================== Company ====================
@receiver(pre_save, sender=Company)
def cache_company_state(sender, instance, **kwargs):
    if instance.pk:
        try:
            old = Company.objects.get(pk=instance.pk)
            instance._old_verified = old.is_verified
            instance._old_name = old.name
        except Company.DoesNotExist:
            instance._old_verified = None
            instance._old_name = None


@receiver(post_save, sender=Company)
def on_company_save(sender, instance, created, **kwargs):
    if created:
        log_action(
            action=AuditAction.COMPANY_CREATED,
            actor=instance.created_by,
            target=instance,
            description=f'Company created: {instance.name}',
        )
    else:
        old_verified = getattr(instance, '_old_verified', None)
        if old_verified is False and instance.is_verified:
            log_action(
                action=AuditAction.COMPANY_VERIFIED,
                target=instance,
                description=f'Company verified: {instance.name}',
                severity=AuditSeverity.INFO,
            )
        elif old_verified is True and not instance.is_verified:
            log_action(
                action=AuditAction.COMPANY_UNVERIFIED,
                target=instance,
                description=f'Company unverified: {instance.name}',
                severity=AuditSeverity.WARNING,
            )


@receiver(post_delete, sender=Company)
def on_company_deleted(sender, instance, **kwargs):
    log_action(
        action=AuditAction.COMPANY_DELETED,
        target=instance,
        description=f'Company deleted: {instance.name}',
        severity=AuditSeverity.WARNING,
    )


# ==================== Job ====================
@receiver(pre_save, sender=Job)
def cache_job_state(sender, instance, **kwargs):
    if instance.pk:
        try:
            instance._old_status = Job.objects.get(pk=instance.pk).status
        except Job.DoesNotExist:
            instance._old_status = None


@receiver(post_save, sender=Job)
def on_job_save(sender, instance, created, **kwargs):
    if created:
        log_action(
            action=AuditAction.JOB_CREATED,
            actor=instance.posted_by,
            target=instance,
            description=f'Job posted: "{instance.title}" at {instance.company.name}',
            metadata={'company': instance.company.name, 'status': instance.status},
        )
    else:
        old_status = getattr(instance, '_old_status', None)
        if old_status and old_status != instance.status:
            log_action(
                action=AuditAction.JOB_STATUS_CHANGED,
                actor=instance.posted_by,
                target=instance,
                description=f'Job "{instance.title}" status: {old_status} → {instance.status}',
                changes={'status': {'before': old_status, 'after': instance.status}},
            )


@receiver(post_delete, sender=Job)
def on_job_deleted(sender, instance, **kwargs):
    log_action(
        action=AuditAction.JOB_DELETED,
        target=instance,
        description=f'Job deleted: "{instance.title}"',
        severity=AuditSeverity.WARNING,
    )


# ==================== Application ====================
@receiver(pre_save, sender=Application)
def cache_application_state(sender, instance, **kwargs):
    if instance.pk:
        try:
            instance._old_app_status = Application.objects.get(pk=instance.pk).status
        except Application.DoesNotExist:
            instance._old_app_status = None


@receiver(post_save, sender=Application)
def on_application_save(sender, instance, created, **kwargs):
    if created:
        log_action(
            action=AuditAction.APPLICATION_SUBMITTED,
            actor=instance.candidate,
            target=instance,
            description=f'{instance.candidate.email} applied to "{instance.job.title}"',
        )
    else:
        old = getattr(instance, '_old_app_status', None)
        if old and old != instance.status:
            action = (
                AuditAction.APPLICATION_WITHDRAWN
                if instance.status == 'WITHDRAWN'
                else AuditAction.APPLICATION_STATUS_CHANGED
            )
            log_action(
                action=action,
                target=instance,
                description=f'Application #{instance.id} status: {old} → {instance.status}',
                changes={'status': {'before': old, 'after': instance.status}},
            )


# ==================== Interview ====================
@receiver(post_save, sender=Interview)
def on_interview_save(sender, instance, created, **kwargs):
    if created:
        log_action(
            action=AuditAction.INTERVIEW_SCHEDULED,
            actor=instance.scheduled_by,
            target=instance,
            description=(
                f'Interview scheduled: {instance.round_name} '
                f'for {instance.application.candidate.email} at '
                f'{instance.scheduled_at:%Y-%m-%d %H:%M}'
            ),
        )


# ==================== Payment ====================
@receiver(post_save, sender=Subscription)
def on_subscription_created(sender, instance, created, **kwargs):
    if created:
        target_repr = instance.company.name if instance.company else (
            instance.user.email if instance.user else 'Unknown'
        )
        log_action(
            action=AuditAction.SUBSCRIPTION_CREATED,
            actor=instance.user,
            target=instance,
            description=f'Subscription created: {instance.plan.name} for {target_repr}',
        )


@receiver(pre_save, sender=Payment)
def cache_payment_state(sender, instance, **kwargs):
    if instance.pk:
        try:
            instance._old_status = Payment.objects.get(pk=instance.pk).status
        except Payment.DoesNotExist:
            instance._old_status = None


@receiver(post_save, sender=Payment)
def on_payment_save(sender, instance, created, **kwargs):
    if created:
        return
    old = getattr(instance, '_old_status', None)
    if old != instance.status:
        if instance.status == PaymentStatus.SUCCESS:
            log_action(
                action=AuditAction.PAYMENT_SUCCESS,
                actor=instance.user,
                target=instance,
                description=f'Payment successful: ₹{instance.amount} ({instance.transaction_id})',
                metadata={'amount': str(instance.amount), 'method': instance.payment_method},
            )
        elif instance.status == PaymentStatus.FAILED:
            log_action(
                action=AuditAction.PAYMENT_FAILED,
                actor=instance.user,
                target=instance,
                description=f'Payment failed: ₹{instance.amount} ({instance.transaction_id})',
                severity=AuditSeverity.WARNING,
                metadata={'amount': str(instance.amount)},
            )