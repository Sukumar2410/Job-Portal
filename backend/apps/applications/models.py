from django.db import models
from django.conf import settings
from django.utils import timezone


class ApplicationStatus(models.TextChoices):
    APPLIED = 'APPLIED', 'Applied'
    UNDER_REVIEW = 'UNDER_REVIEW', 'Under Review'
    SHORTLISTED = 'SHORTLISTED', 'Shortlisted'
    INTERVIEW_SCHEDULED = 'INTERVIEW_SCHEDULED', 'Interview Scheduled'
    INTERVIEWED = 'INTERVIEWED', 'Interviewed'
    OFFERED = 'OFFERED', 'Offer Extended'
    HIRED = 'HIRED', 'Hired'
    REJECTED = 'REJECTED', 'Rejected'
    WITHDRAWN = 'WITHDRAWN', 'Withdrawn by Candidate'


class InterviewMode(models.TextChoices):
    ONLINE = 'ONLINE', 'Online (Video Call)'
    OFFLINE = 'OFFLINE', 'In-Person'
    PHONE = 'PHONE', 'Phone'


class Application(models.Model):
    """Job application linking a candidate to a job posting"""
    job = models.ForeignKey(
        'jobs.Job',
        on_delete=models.CASCADE,
        related_name='applications'
    )
    candidate = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='applications'
    )

    # Application content
    cover_letter = models.TextField(blank=True)
    resume_snapshot = models.FileField(
        upload_to='application_resumes/',
        blank=True,
        null=True,
        help_text='Copy of resume at time of application'
    )
    expected_salary = models.DecimalField(
        max_digits=12, decimal_places=2, blank=True, null=True
    )
    notice_period_days = models.PositiveIntegerField(blank=True, null=True)

    # Status
    status = models.CharField(
        max_length=30,
        choices=ApplicationStatus.choices,
        default=ApplicationStatus.APPLIED
    )

    # HR fields (private)
    hr_notes = models.TextField(blank=True, help_text='Internal notes visible only to HR')
    rating = models.PositiveSmallIntegerField(
        blank=True, null=True,
        help_text='HR rating 1-5'
    )

    # Rejection reason (visible to candidate if provided)
    rejection_reason = models.TextField(blank=True)

    # Timestamps
    applied_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    status_changed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'applications'
        unique_together = ('job', 'candidate')  # Prevent duplicate applications
        ordering = ['-applied_at']
        indexes = [
            models.Index(fields=['candidate', '-applied_at']),
            models.Index(fields=['job', 'status']),
            models.Index(fields=['status']),
        ]

    def __str__(self):
        return f'{self.candidate.email} → {self.job.title} ({self.status})'


class ApplicationStatusHistory(models.Model):
    """Track every status change for audit trail"""
    application = models.ForeignKey(
        Application,
        on_delete=models.CASCADE,
        related_name='status_history'
    )
    from_status = models.CharField(max_length=30, choices=ApplicationStatus.choices, blank=True)
    to_status = models.CharField(max_length=30, choices=ApplicationStatus.choices)
    changed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='status_changes'
    )
    note = models.TextField(blank=True)
    changed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'application_status_history'
        ordering = ['-changed_at']

    def __str__(self):
        return f'{self.application.id}: {self.from_status} → {self.to_status}'


class Interview(models.Model):
    """Interview scheduling for an application"""
    application = models.ForeignKey(
        Application,
        on_delete=models.CASCADE,
        related_name='interviews'
    )
    scheduled_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='scheduled_interviews'
    )

    round_name = models.CharField(max_length=100, help_text='e.g. Technical Round 1, HR Round')
    mode = models.CharField(max_length=20, choices=InterviewMode.choices, default=InterviewMode.ONLINE)
    scheduled_at = models.DateTimeField()
    duration_minutes = models.PositiveIntegerField(default=60)

    meeting_link = models.URLField(blank=True, help_text='For online interviews')
    location = models.CharField(max_length=300, blank=True, help_text='For in-person interviews')
    interviewer_name = models.CharField(max_length=200, blank=True)
    interviewer_email = models.EmailField(blank=True)

    instructions = models.TextField(blank=True)

    is_completed = models.BooleanField(default=False)
    feedback = models.TextField(blank=True)
    rating = models.PositiveSmallIntegerField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'interviews'
        ordering = ['scheduled_at']

    def __str__(self):
        return f'{self.round_name} - {self.application.candidate.email}'