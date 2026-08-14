from django.db import models
from django.conf import settings


class NotificationType(models.TextChoices):
    APPLICATION_STATUS = 'APPLICATION_STATUS', 'Application Status Change'
    INTERVIEW_SCHEDULED = 'INTERVIEW_SCHEDULED', 'Interview Scheduled'
    NEW_APPLICATION = 'NEW_APPLICATION', 'New Application Received'
    JOB_MATCH = 'JOB_MATCH', 'New Job Match'
    COMPANY_VERIFIED = 'COMPANY_VERIFIED', 'Company Verified'
    PAYMENT_SUCCESS = 'PAYMENT_SUCCESS', 'Payment Successful'
    PAYMENT_FAILED = 'PAYMENT_FAILED', 'Payment Failed'
    SUBSCRIPTION_EXPIRING = 'SUBSCRIPTION_EXPIRING', 'Subscription Expiring Soon'
    ANNOUNCEMENT = 'ANNOUNCEMENT', 'System Announcement'
    OTHER = 'OTHER', 'Other'


class NotificationPriority(models.TextChoices):
    LOW = 'LOW', 'Low'
    NORMAL = 'NORMAL', 'Normal'
    HIGH = 'HIGH', 'High'
    URGENT = 'URGENT', 'Urgent'


class Notification(models.Model):
    """In-app notification for users"""
    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notifications',
        db_index=True
    )
    notification_type = models.CharField(
        max_length=30,
        choices=NotificationType.choices,
        default=NotificationType.OTHER
    )
    priority = models.CharField(
        max_length=10,
        choices=NotificationPriority.choices,
        default=NotificationPriority.NORMAL
    )
    title = models.CharField(max_length=200)
    message = models.TextField()

    # Optional link to redirect on click (frontend uses this)
    action_url = models.CharField(max_length=500, blank=True,
                                   help_text='Frontend route, e.g. /candidate/applications/5')

    # Optional references (for context)
    related_object_type = models.CharField(max_length=50, blank=True,
                                            help_text='e.g. application, job, interview')
    related_object_id = models.PositiveIntegerField(null=True, blank=True)

    # State
    is_read = models.BooleanField(default=False, db_index=True)
    read_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        db_table = 'notifications'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['recipient', 'is_read', '-created_at']),
        ]

    def __str__(self):
        return f'{self.title} → {self.recipient.email}'

    def mark_as_read(self):
        if not self.is_read:
            from django.utils import timezone
            self.is_read = True
            self.read_at = timezone.now()
            self.save(update_fields=['is_read', 'read_at'])