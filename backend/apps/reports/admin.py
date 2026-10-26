from django.contrib import admin
from .models import Report


@admin.register(Report)
class ReportAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "subject",
        "reported_by",
        "priority",
        "status",
        "created_at",
    )

    list_filter = (
        "priority",
        "status",
        "created_at",
    )

    search_fields = (
        "subject",
        "description",
        "reported_by__email",
    )

    readonly_fields = (
        "created_at",
        "updated_at",
        "resolved_at",
    )

    ordering = ("-created_at",)