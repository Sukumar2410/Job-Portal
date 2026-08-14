from django.contrib import admin
from .models import Application, ApplicationStatusHistory, Interview


class StatusHistoryInline(admin.TabularInline):
    model = ApplicationStatusHistory
    extra = 0
    readonly_fields = ('from_status', 'to_status', 'changed_by', 'note', 'changed_at')
    can_delete = False


class InterviewInline(admin.TabularInline):
    model = Interview
    extra = 0


@admin.register(Application)
class ApplicationAdmin(admin.ModelAdmin):
    list_display = ('id', 'candidate', 'job', 'status', 'rating', 'applied_at')
    list_filter = ('status', 'rating', 'applied_at')
    search_fields = ('candidate__email', 'job__title', 'job__company__name')
    readonly_fields = ('applied_at', 'updated_at', 'status_changed_at')
    inlines = [StatusHistoryInline, InterviewInline]
    date_hierarchy = 'applied_at'


@admin.register(Interview)
class InterviewAdmin(admin.ModelAdmin):
    list_display = ('round_name', 'application', 'mode', 'scheduled_at', 'is_completed')
    list_filter = ('mode', 'is_completed', 'scheduled_at')
    search_fields = ('application__candidate__email', 'round_name')
    date_hierarchy = 'scheduled_at'


@admin.register(ApplicationStatusHistory)
class ApplicationStatusHistoryAdmin(admin.ModelAdmin):
    list_display = ('application', 'from_status', 'to_status', 'changed_by', 'changed_at')
    list_filter = ('to_status', 'changed_at')
    search_fields = ('application__candidate__email',)