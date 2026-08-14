from django.db import models
from django.conf import settings


class AuditAction(models.TextChoices):
    # Auth
    LOGIN = 'LOGIN', 'User Login'
    LOGOUT = 'LOGOUT', 'User Logout'
    REGISTER = 'REGISTER', 'User Registered'
    PASSWORD_CHANGED = 'PASSWORD_CHANGED', 'Password Changed'

    # Company
    COMPANY_CREATED = 'COMPANY_CREATED', 'Company Created'
    COMPANY_UPDATED = 'COMPANY_UPDATED', 'Company Updated'
    COMPANY_VERIFIED = 'COMPANY_VERIFIED', 'Company Verified'
    COMPANY_UNVERIFIED = 'COMPANY_UNVERIFIED', 'Company Unverified'
    COMPANY_DELETED = 'COMPANY_DELETED', 'Company Deleted'

    # Job
    JOB_CREATED = 'JOB_CREATED', 'Job Created'
    JOB_UPDATED = 'JOB_UPDATED', 'Job Updated'
    JOB_STATUS_CHANGED = 'JOB_STATUS_CHANGED', 'Job Status Changed'
    JOB_DELETED = 'JOB_DELETED', 'Job Deleted'

    # Application
    APPLICATION_SUBMITTED = 'APPLICATION_SUBMITTED', 'Application Submitted'
    APPLICATION_STATUS_CHANGED = 'APPLICATION_STATUS_CHANGED', 'Application Status Changed'
    APPLICATION_WITHDRAWN = 'APPLICATION_WITHDRAWN', 'Application Withdrawn'

    # Interview
    INTERVIEW_SCHEDULED = 'INTERVIEW_SCHEDULED', 'Interview Scheduled'
    INTERVIEW_UPDATED = 'INTERVIEW_UPDATED', 'Interview Updated'

    # Payment
    SUBSCRIPTION_CREATED = 'SUBSCRIPTION_CREATED', 'Subscription Created'
    PAYMENT_SUCCESS = 'PAYMENT_SUCCESS', 'Payment Successful'
    PAYMENT_FAILED = 'PAYMENT_FAILED', 'Payment Failed'

    # Admin
    BROADCAST_SENT = 'BROADCAST_SENT', 'Broadcast Sent'
    USER_ACTIVATED = 'USER_ACTIVATED', 'User Activated'
    USER_DEACTIVATED = 'USER_DEACTIVATED', 'User Deactivated'

    # Files
    RESUME_DOWNLOADED = 'RESUME_DOWNLOADED', 'Resume Downloaded'

    OTHER = 'OTHER', 'Other'


class AuditSeverity(models.TextChoices):
    INFO = 'INFO', 'Info'
    WARNING = 'WARNING', 'Warning'
    CRITICAL = 'CRITICAL', 'Critical'


class AuditLog(models.Model):
    """Immutable audit trail of all important actions in the system"""
    action = models.CharField(
        max_length=50, choices=AuditAction.choices,
        default=AuditAction.OTHER, db_index=True
    )
    severity = models.CharField(
        max_length=10, choices=AuditSeverity.choices,
        default=AuditSeverity.INFO
    )
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL, null=True, blank=True,
        related_name='audit_logs',
        help_text='User who performed the action'
    )
    actor_email = models.EmailField(blank=True,
                                     help_text='Snapshot in case user is later deleted')
    actor_role = models.CharField(max_length=30, blank=True)

    # Target object (what was acted upon)
    target_type = models.CharField(max_length=50, blank=True,
                                    help_text='e.g. Company, Job, Application, User')
    target_id = models.PositiveIntegerField(null=True, blank=True)
    target_repr = models.CharField(max_length=300, blank=True,
                                    help_text='Human-readable string representation')

    # Details
    description = models.TextField(blank=True)
    changes = models.JSONField(default=dict, blank=True,
                                help_text='Before/after values for updates')
    metadata = models.JSONField(default=dict, blank=True)

    # Request context
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        db_table = 'audit_logs'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['action', '-created_at']),
            models.Index(fields=['actor', '-created_at']),
            models.Index(fields=['target_type', 'target_id']),
        ]

    def __str__(self):
        return f'[{self.created_at:%Y-%m-%d %H:%M}] {self.action} by {self.actor_email or "System"}'