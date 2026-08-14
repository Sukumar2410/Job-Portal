from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import (
    User,
    CandidateProfile,
    HRProfile,
    Resume,
)

@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ('email', 'first_name', 'last_name', 'role', 'is_active', 'is_verified', 'date_joined')
    list_filter = ('role', 'is_active', 'is_verified', 'is_staff')
    search_fields = ('email', 'first_name', 'last_name')
    ordering = ('-date_joined',)

    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Personal Info', {'fields': ('first_name', 'last_name', 'phone', 'profile_picture')}),
        ('Role & Permissions', {'fields': ('role', 'is_active', 'is_verified', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Important Dates', {'fields': ('last_login', 'date_joined')}),
    )

    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'first_name', 'last_name', 'role', 'password1', 'password2'),
        }),
    )


@admin.register(CandidateProfile)
class CandidateProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'headline', 'experience_years', 'current_location')
    search_fields = ('user__email', 'headline', 'skills')

@admin.register(Resume)
class ResumeAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "candidate",
        "title",
        "is_default",
        "is_boosted",
        "visibility",
        "ats_score",
        "download_count",
        "created_at",
    )

    list_filter = (
        "is_default",
        "is_boosted",
        "visibility",
    )

    search_fields = (
        "candidate__user__email",
        "title",
    )

    ordering = (
        "-created_at",
    )

    readonly_fields = (
        "download_count",
        "created_at",
        "updated_at",
    )

@admin.register(HRProfile)
class HRProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'designation', 'company')
    search_fields = ('user__email', 'designation')

from .models import EmailVerificationToken, PasswordResetToken

@admin.register(EmailVerificationToken)
class EmailVerificationTokenAdmin(admin.ModelAdmin):
    list_display = ('user', 'is_used', 'is_expired_display', 'created_at', 'used_at')
    list_filter = ('is_used', 'created_at')
    search_fields = ('user__email', 'token')
    readonly_fields = ('token', 'created_at', 'used_at')

    def is_expired_display(self, obj):
        return obj.is_expired
    is_expired_display.boolean = True
    is_expired_display.short_description = 'Expired?'


@admin.register(PasswordResetToken)
class PasswordResetTokenAdmin(admin.ModelAdmin):
    list_display = ('user', 'is_used', 'is_expired_display', 'ip_address', 'created_at', 'used_at')
    list_filter = ('is_used', 'created_at')
    search_fields = ('user__email', 'token', 'ip_address')
    readonly_fields = ('token', 'created_at', 'used_at', 'ip_address')

    def is_expired_display(self, obj):
        return obj.is_expired
    is_expired_display.boolean = True
    is_expired_display.short_description = 'Expired?'