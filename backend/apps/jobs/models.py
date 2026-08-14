from django.db import models
from django.utils.text import slugify
from django.conf import settings


class JobType(models.TextChoices):
    FULL_TIME = 'FULL_TIME', 'Full Time'
    PART_TIME = 'PART_TIME', 'Part Time'
    CONTRACT = 'CONTRACT', 'Contract'
    INTERNSHIP = 'INTERNSHIP', 'Internship'
    FREELANCE = 'FREELANCE', 'Freelance'


class WorkMode(models.TextChoices):
    ONSITE = 'ONSITE', 'On-site'
    REMOTE = 'REMOTE', 'Remote'
    HYBRID = 'HYBRID', 'Hybrid'


class ExperienceLevel(models.TextChoices):
    ENTRY = 'ENTRY', 'Entry Level (0-2 years)'
    MID = 'MID', 'Mid Level (2-5 years)'
    SENIOR = 'SENIOR', 'Senior Level (5-10 years)'
    LEAD = 'LEAD', 'Lead/Principal (10+ years)'


class JobStatus(models.TextChoices):
    DRAFT = 'DRAFT', 'Draft'
    ACTIVE = 'ACTIVE', 'Active'
    PAUSED = 'PAUSED', 'Paused'
    CLOSED = 'CLOSED', 'Closed'
    EXPIRED = 'EXPIRED', 'Expired'


class Job(models.Model):
    """Job posting"""
    company = models.ForeignKey(
        'companies.Company',
        on_delete=models.CASCADE,
        related_name='jobs'
    )
    posted_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='posted_jobs'
    )

    title = models.CharField(max_length=200)
    slug = models.SlugField(max_length=250, unique=True, blank=True)
    description = models.TextField()
    responsibilities = models.TextField(blank=True)
    requirements = models.TextField(blank=True)
    benefits = models.TextField(blank=True)

    # Categorization
    job_type = models.CharField(max_length=20, choices=JobType.choices, default=JobType.FULL_TIME)
    work_mode = models.CharField(max_length=20, choices=WorkMode.choices, default=WorkMode.ONSITE)
    experience_level = models.CharField(max_length=20, choices=ExperienceLevel.choices, default=ExperienceLevel.ENTRY)

    # Location & Salary
    location = models.CharField(max_length=200)
    min_salary = models.DecimalField(max_digits=12, decimal_places=2, blank=True, null=True)
    max_salary = models.DecimalField(max_digits=12, decimal_places=2, blank=True, null=True)
    currency = models.CharField(max_length=10, default='INR')
    show_salary = models.BooleanField(default=True)

    # Skills (comma-separated - simple approach for MVP)
    skills_required = models.TextField(blank=True, help_text='Comma-separated skills')

    # Application
    application_deadline = models.DateField(blank=True, null=True)
    max_applications = models.PositiveIntegerField(blank=True, null=True)

    # Status & Metrics
    status = models.CharField(max_length=20, choices=JobStatus.choices, default=JobStatus.DRAFT)
    is_featured = models.BooleanField(default=False)
    views_count = models.PositiveIntegerField(default=0)
    applications_count = models.PositiveIntegerField(default=0)

    # Timestamps
    posted_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'jobs'
        ordering = ['-posted_at', '-created_at']
        indexes = [
            models.Index(fields=['status', '-posted_at']),
            models.Index(fields=['company', 'status']),
        ]

    def __str__(self):
        return f'{self.title} @ {self.company.name}'

    def save(self, *args, **kwargs):
        if not self.slug:
            base_slug = slugify(f'{self.title}-{self.company.name}')
            self.slug = base_slug
            counter = 1
            while Job.objects.filter(slug=self.slug).exclude(pk=self.pk).exists():
                self.slug = f'{base_slug}-{counter}'
                counter += 1

        # Set posted_at when going from DRAFT to ACTIVE for the first time
        if self.status == JobStatus.ACTIVE and not self.posted_at:
            from django.utils import timezone
            self.posted_at = timezone.now()

        super().save(*args, **kwargs)

    @property
    def skills_list(self):
        return [s.strip() for s in self.skills_required.split(',') if s.strip()]


class SavedJob(models.Model):
    """Candidates can save jobs for later"""
    candidate = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='saved_jobs'
    )
    job = models.ForeignKey(Job, on_delete=models.CASCADE, related_name='saved_by')
    saved_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'saved_jobs'
        unique_together = ('candidate', 'job')
        ordering = ['-saved_at']

    def __str__(self):
        return f'{self.candidate.email} saved {self.job.title}'