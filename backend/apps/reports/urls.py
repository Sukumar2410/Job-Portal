from django.urls import path

from .views import (
    CreateReportAPIView,
    MyReportsAPIView,
    AdminReportsAPIView,
    ResolveReportAPIView,
)

urlpatterns = [
    # Candidate & HR
    path("", CreateReportAPIView.as_view(), name="create-report"),
    path("my/", MyReportsAPIView.as_view(), name="my-reports"),

    # Super Admin
    path("admin/", AdminReportsAPIView.as_view(), name="admin-reports"),
    path(
        "admin/<int:pk>/",
        ResolveReportAPIView.as_view(),
        name="resolve-report"
    ),
]