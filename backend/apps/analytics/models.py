from django.db import models
from django.conf import settings


class EventType(models.TextChoices):
    JOB_VIEW = 'JOB_VIEW', 'Job Viewed'
    JOB_SAVE = 'JOB_SAVE', 'Job Saved'
    JOB_APPLY = 'JOB_APPLY', 'Job Applied'
    JOB_POST = 'JOB_POST', 'Job Posted'
    COMPANY_VIEW = 'COMPANY_VIEW', 'Company Viewed'
    LOGIN = 'LOGIN', 'User Login'
    SEARCH = 'SEARCH', 'Search Performed'


class Event(models.Model):
    """Generic event tracking for platform analytics"""
    event_type = models.CharField(max_length=30, choices=EventType.choices, db_index=True)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='events'
    )
    # Optional references
    job = models.ForeignKey(
        'jobs.Job',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='events'
    )
    company = models.ForeignKey(
        'companies.Company',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='events'
    )
    metadata = models.JSONField(default=dict, blank=True)
    ip_address = models.GenericIPAddressField(blank=True, null=True)
    user_agent = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        db_table = 'analytics_events'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['event_type', '-created_at']),
            models.Index(fields=['user', '-created_at']),
        ]

    def __str__(self):
        return f'{self.event_type} by {self.user} at {self.created_at}'