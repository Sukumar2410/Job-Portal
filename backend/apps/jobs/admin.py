from django.contrib import admin
from .models import Job, SavedJob


@admin.register(Job)
class JobAdmin(admin.ModelAdmin):
    list_display = ('title', 'company', 'job_type', 'work_mode', 'status',
                    'views_count', 'applications_count', 'posted_at')
    list_filter = ('status', 'job_type', 'work_mode', 'experience_level', 'is_featured')
    search_fields = ('title', 'company__name', 'location', 'skills_required')
    readonly_fields = ('slug', 'views_count', 'applications_count', 'created_at', 'updated_at')
    date_hierarchy = 'created_at'


@admin.register(SavedJob)
class SavedJobAdmin(admin.ModelAdmin):
    list_display = ('candidate', 'job', 'saved_at')
    search_fields = ('candidate__email', 'job__title')