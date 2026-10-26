from django.db import models
from django.conf import settings
from django.utils import timezone


class ReportPriority(models.TextChoices):
    LOW = "LOW", "Low"
    MEDIUM = "MEDIUM", "Medium"
    HIGH = "HIGH", "High"


class ReportStatus(models.TextChoices):
    OPEN = "OPEN", "Open"
    IN_PROGRESS = "IN_PROGRESS", "In Progress"
    RESOLVED = "RESOLVED", "Resolved"


class Report(models.Model):
    """
    Common issue reporting model used by both
    Candidates and HR users.
    """

    reported_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="submitted_reports"
    )

    subject = models.CharField(max_length=200)

    description = models.TextField()

    priority = models.CharField(
        max_length=10,
        choices=ReportPriority.choices,
        default=ReportPriority.MEDIUM
    )

    status = models.CharField(
        max_length=20,
        choices=ReportStatus.choices,
        default=ReportStatus.OPEN
    )

    resolved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="resolved_reports"
    )

    resolved_at = models.DateTimeField(
        null=True,
        blank=True
    )

    admin_remarks = models.TextField(
        blank=True
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    updated_at = models.DateTimeField(
        auto_now=True
    )

    class Meta:
        db_table = "reports"
        ordering = ["-created_at"]
        verbose_name = "Report"
        verbose_name_plural = "Reports"

    def __str__(self):
        return f"#{self.id} - {self.subject}"

    def mark_resolved(self, admin_user, remarks=""):
        self.status = ReportStatus.RESOLVED
        self.resolved_by = admin_user
        self.resolved_at = timezone.now()
        self.admin_remarks = remarks
        self.save()