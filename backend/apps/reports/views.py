from django.utils import timezone

from rest_framework import generics, permissions
from rest_framework.response import Response

from apps.users.permissions import (
    IsCandidate,
    IsHR,
    IsSuperAdmin,
)

from .models import Report, ReportStatus
from .serializers import (
    ReportCreateSerializer,
    MyReportSerializer,
    AdminReportSerializer,
    ReportResolveSerializer,
)


class CreateReportAPIView(generics.CreateAPIView):
    """
    Candidate & HR submit a report.
    """

    serializer_class = ReportCreateSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(
            reported_by=self.request.user
        )

    def create(self, request, *args, **kwargs):
        if request.user.role not in ["CANDIDATE", "HR"]:
            return Response(
                {"detail": "Only Candidate or HR can submit reports."},
                status=403
            )

        return super().create(request, *args, **kwargs)


class MyReportsAPIView(generics.ListAPIView):
    """
    Logged-in user sees only their reports.
    """

    serializer_class = MyReportSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Report.objects.filter(
            reported_by=self.request.user
        )


class AdminReportsAPIView(generics.ListAPIView):
    """
    Super Admin sees all reports.
    """

    serializer_class = AdminReportSerializer
    permission_classes = [IsSuperAdmin]

    queryset = Report.objects.select_related(
        "reported_by",
        "resolved_by"
    )


class ResolveReportAPIView(generics.UpdateAPIView):
    """
    Super Admin resolves report.
    """

    serializer_class = ReportResolveSerializer
    permission_classes = [IsSuperAdmin]
    queryset = Report.objects.all()

    def perform_update(self, serializer):
        report = serializer.save()

        if report.status == ReportStatus.RESOLVED:
            report.resolved_by = self.request.user
            report.resolved_at = timezone.now()
            report.save()