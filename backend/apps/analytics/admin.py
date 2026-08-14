from django.contrib import admin
from .models import Event


@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = ('event_type', 'user', 'job', 'company', 'created_at')
    list_filter = ('event_type', 'created_at')
    search_fields = ('user__email', 'job__title', 'company__name')
    readonly_fields = ('created_at',)
    date_hierarchy = 'created_at'