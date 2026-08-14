from django.contrib import admin

# Register your models here.
from django.contrib import admin
from .models import AuditLog


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ('created_at', 'action', 'actor_email', 'target_repr', 'severity', 'ip_address')
    list_filter = ('action', 'severity', 'actor_role', 'created_at')
    search_fields = ('actor_email', 'description', 'target_repr')
    readonly_fields = ('action', 'severity', 'actor', 'actor_email', 'actor_role',
                       'target_type', 'target_id', 'target_repr', 'description',
                       'changes', 'metadata', 'ip_address', 'user_agent', 'created_at')
    date_hierarchy = 'created_at'

    def has_add_permission(self, request):
        return False  # Logs are auto-generated only

    def has_change_permission(self, request, obj=None):
        return False  # Immutable