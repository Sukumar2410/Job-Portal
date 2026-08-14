from django.db import models
from django.utils.text import slugify
from django.conf import settings


class CompanySize(models.TextChoices):
    STARTUP = 'STARTUP', '1-10 employees'
    SMALL = 'SMALL', '11-50 employees'
    MEDIUM = 'MEDIUM', '51-200 employees'
    LARGE = 'LARGE', '201-1000 employees'
    ENTERPRISE = 'ENTERPRISE', '1000+ employees'


class SubscriptionTier(models.TextChoices):
    FREE = 'FREE', 'Free'
    PREMIUM = 'PREMIUM', 'Premium'
    ENTERPRISE = 'ENTERPRISE', 'Enterprise'


class Company(models.Model):
    """Company/Enterprise entity"""
    name = models.CharField(max_length=200, unique=True)
    slug = models.SlugField(max_length=250, unique=True, blank=True)
    description = models.TextField(blank=True)
    website = models.URLField(blank=True)
    logo = models.ImageField(upload_to='company_logos/', blank=True, null=True)
    cover_image = models.ImageField(upload_to='company_covers/', blank=True, null=True)

    industry = models.CharField(max_length=100, blank=True)
    company_size = models.CharField(max_length=20, choices=CompanySize.choices, blank=True)
    headquarters = models.CharField(max_length=200, blank=True)
    founded_year = models.PositiveIntegerField(blank=True, null=True)

    # Contact
    contact_email = models.EmailField(blank=True)
    contact_phone = models.CharField(max_length=20, blank=True)

    # Social
    linkedin_url = models.URLField(blank=True)
    twitter_url = models.URLField(blank=True)

    # Subscription & Quota
    subscription_tier = models.CharField(
        max_length=20,
        choices=SubscriptionTier.choices,
        default=SubscriptionTier.FREE
    )
    job_post_quota = models.PositiveIntegerField(default=5, help_text='Max active job posts')

    # Ownership & Status
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='created_companies'
    )
    is_verified = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'companies'
        verbose_name = 'Company'
        verbose_name_plural = 'Companies'
        ordering = ['name']

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    @property
    def active_job_count(self):
        return self.jobs.filter(status='ACTIVE').count()