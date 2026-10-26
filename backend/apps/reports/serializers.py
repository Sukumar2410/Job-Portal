from rest_framework import serializers
from .models import Report


class ReportCreateSerializer(serializers.ModelSerializer):
    """
    Used by Candidate & HR while creating a report.
    """

    class Meta:
        model = Report
        fields = [
            "id",
            "subject",
            "description",
            "priority",
            "status",
            "created_at",
        ]
        read_only_fields = [
            "id",
            "status",
            "created_at",
        ]


class MyReportSerializer(serializers.ModelSerializer):
    """
    Candidate & HR can view their own reports.
    """

    class Meta:
        model = Report
        fields = [
            "id",
            "subject",
            "description",
            "priority",
            "status",
            "admin_remarks",
            "created_at",
            "resolved_at",
        ]


class AdminReportSerializer(serializers.ModelSerializer):
    """
    Super Admin view.
    """

    reporter_name = serializers.CharField(
        source="reported_by.full_name",
        read_only=True
    )

    reporter_email = serializers.EmailField(
        source="reported_by.email",
        read_only=True
    )

    reporter_role = serializers.CharField(
        source="reported_by.role",
        read_only=True
    )

    class Meta:
        model = Report
        fields = [
            "id",
            "reporter_name",
            "reporter_email",
            "reporter_role",
            "subject",
            "description",
            "priority",
            "status",
            "admin_remarks",
            "created_at",
            "resolved_at",
        ]


class ReportResolveSerializer(serializers.ModelSerializer):
    """
    Super Admin updates report status.
    """

    class Meta:
        model = Report
        fields = [
            "status",
            "admin_remarks",
        ]