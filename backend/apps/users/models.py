from django.db import models
import secrets
from datetime import timedelta
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.utils import timezone
from django.conf import settings


class UserRole(models.TextChoices):
    """Three roles as per project requirements"""
    CANDIDATE = 'CANDIDATE', 'Candidate'
    HR = 'HR', 'HR/Company'
    SUPER_ADMIN = 'SUPER_ADMIN', 'Super Admin'

class ResumeVisibility(models.TextChoices):
    """
    Controls who can view a candidate's resume.
    """
    PRIVATE = "PRIVATE", "Private"
    RECRUITERS = "RECRUITERS", "Recruiters Only"
    PUBLIC = "PUBLIC", "Public"

class UserManager(BaseUserManager):
    """Custom manager for the User model"""

    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('Email is required')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)
        extra_fields.setdefault('role', UserRole.SUPER_ADMIN)

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')

        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    """
    Custom User model that supports three roles: Candidate, HR, Super Admin.
    Uses email as the unique identifier instead of username.
    """
    email = models.EmailField(unique=True, db_index=True)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    phone = models.CharField(max_length=20, blank=True, null=True)
    role = models.CharField(
        max_length=20,
        choices=UserRole.choices,
        default=UserRole.CANDIDATE,
    )
    profile_picture = models.ImageField(upload_to='profile_pictures/', blank=True, null=True)

    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    is_verified = models.BooleanField(default=False)

    date_joined = models.DateTimeField(default=timezone.now)
    last_login = models.DateTimeField(blank=True, null=True)

    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name']

    class Meta:
        db_table = 'users'
        verbose_name = 'User'
        verbose_name_plural = 'Users'
        ordering = ['-date_joined']

    def __str__(self):
        return f'{self.email} ({self.get_role_display()})'

    @property
    def full_name(self):
        return f'{self.first_name} {self.last_name}'.strip()

    # Role helper methods
    def is_candidate(self):
        return self.role == UserRole.CANDIDATE

    def is_hr(self):
        return self.role == UserRole.HR

    def is_super_admin(self):
        return self.role == UserRole.SUPER_ADMIN


class CandidateProfile(models.Model):
    """Extended profile for Candidates (Job Seekers)"""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='candidate_profile')
    headline = models.CharField(max_length=200, blank=True)
    summary = models.TextField(blank=True)
    resume = models.FileField(upload_to='resumes/', blank=True, null=True)
    skills = models.TextField(blank=True, help_text='Comma-separated skills')
    experience_years = models.PositiveIntegerField(default=0)
    current_location = models.CharField(max_length=200, blank=True)
    expected_salary = models.DecimalField(max_digits=12, decimal_places=2, blank=True, null=True)
    linkedin_url = models.URLField(blank=True)
    github_url = models.URLField(blank=True)
    portfolio_url = models.URLField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'candidate_profiles'

    def __str__(self):
        return f'Candidate: {self.user.email}'

class Resume(models.Model):
    """
    Stores multiple resumes for a candidate.

    CandidateProfile remains unchanged for backward compatibility.
    """

    candidate = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="resumes",
    )

    title = models.CharField(
        max_length=150,
        help_text="Example: Python Developer Resume"
    )

    file = models.FileField(
        upload_to="resumes/"
    )

    visibility = models.CharField(
        max_length=20,
        choices=ResumeVisibility.choices,
        default=ResumeVisibility.RECRUITERS
    )

    is_default = models.BooleanField(default=False)

    # Future subscription features
    is_boosted = models.BooleanField(default=False)
    ats_score = models.PositiveSmallIntegerField(
        blank=True,
        null=True
    )

    download_count = models.PositiveIntegerField(default=0)

    created_at = models.DateTimeField(auto_now_add=True)

    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "candidate_resumes"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.candidate.email} - {self.title}"

    def save(self, *args, **kwargs):
        """
        Ensure only one default resume exists per candidate.
        """
        from django.db import transaction

        with transaction.atomic():
            if self.is_default:
                Resume.objects.filter(
                    candidate=self.candidate,
                    is_default=True
                ).exclude(pk=self.pk).update(
                    is_default=False
                )

            super().save(*args, **kwargs)

class HRProfile(models.Model):
    """Extended profile for HR/Company users"""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='hr_profile')
    designation = models.CharField(max_length=100, blank=True)
    department = models.CharField(max_length=100, blank=True)
    # Link to company will be added when we create Company model in next step
    company = models.ForeignKey(
        'companies.Company',
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name='hr_users'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'hr_profiles'

    def __str__(self):
        return f'HR: {self.user.email}'

def generate_token():
    """Generate a secure random token"""
    return secrets.token_urlsafe(48)


class EmailVerificationToken(models.Model):
    """Token for email verification"""
    user = models.ForeignKey(
        'User', on_delete=models.CASCADE,
        related_name='email_verification_tokens'
    )
    token = models.CharField(max_length=100, unique=True, default=generate_token, db_index=True)
    is_used = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    used_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'email_verification_tokens'
        ordering = ['-created_at']

    def __str__(self):
        return f'EmailVerify: {self.user.email} ({"used" if self.is_used else "pending"})'

    @property
    def is_expired(self):
        from django.conf import settings
        expiry_hours = getattr(settings, 'EMAIL_VERIFICATION_TOKEN_EXPIRY_HOURS', 48)
        return timezone.now() > self.created_at + timedelta(hours=expiry_hours)

    @property
    def is_valid(self):
        return not self.is_used and not self.is_expired

class PasswordResetToken(models.Model):
    """Token for password reset"""
    user = models.ForeignKey(
        'User', on_delete=models.CASCADE,
        related_name='password_reset_tokens'
    )
    token = models.CharField(max_length=100, unique=True, default=generate_token, db_index=True)
    is_used = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    used_at = models.DateTimeField(null=True, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)

    class Meta:
        db_table = 'password_reset_tokens'
        ordering = ['-created_at']

    def __str__(self):
        return f'PasswordReset: {self.user.email} ({"used" if self.is_used else "pending"})'

    @property
    def is_expired(self):
        from django.conf import settings
        expiry_hours = getattr(settings, 'PASSWORD_RESET_TOKEN_EXPIRY_HOURS', 1)
        return timezone.now() > self.created_at + timedelta(hours=expiry_hours)

    @property
    def is_valid(self):
        return not self.is_used and not self.is_expired