from datetime import timedelta
from django.db.models import Count
from django.utils import timezone
from rest_framework import viewsets, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend

from apps.users.permissions import IsSuperAdmin
from .models import AuditLog, AuditSeverity
from .serializers import AuditLogSerializer


class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Read-only audit log viewer.
    Only accessible to Super Admin.
    - GET  /api/audit-logs/           → List all (paginated, filterable)
    - GET  /api/audit-logs/{id}/      → Retrieve one
    - GET  /api/audit-logs/stats/     → Dashboard stats
    - GET  /api/audit-logs/actions/   → List available action types
    """
    queryset = AuditLog.objects.all().select_related('actor')
    serializer_class = AuditLogSerializer
    permission_classes = [IsSuperAdmin]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['action', 'severity', 'actor', 'target_type', 'actor_role']
    search_fields = ['description', 'actor_email', 'target_repr']
    ordering_fields = ['created_at']

    @action(detail=False, methods=['get'])
    def stats(self, request):
        """GET /api/audit-logs/stats/ - Dashboard summary"""
        now = timezone.now()
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        week_ago = now - timedelta(days=7)

        top_actions = (
            AuditLog.objects.values('action')
            .annotate(count=Count('id'))
            .order_by('-count')[:10]
        )
        top_actors = (
            AuditLog.objects.exclude(actor_email='')
            .values('actor_email', 'actor_role')
            .annotate(count=Count('id'))
            .order_by('-count')[:10]
        )

        data = {
            'total_logs': AuditLog.objects.count(),
            'logs_today': AuditLog.objects.filter(created_at__gte=today_start).count(),
            'logs_this_week': AuditLog.objects.filter(created_at__gte=week_ago).count(),
            'critical_count': AuditLog.objects.filter(severity=AuditSeverity.CRITICAL).count(),
            'warning_count': AuditLog.objects.filter(severity=AuditSeverity.WARNING).count(),
            'top_actions': list(top_actions),
            'top_actors': list(top_actors),
        }
        return Response(data)

    @action(detail=False, methods=['get'])
    def actions(self, request):
        """GET /api/audit-logs/actions/ - List available action types (for filters)"""
        from .models import AuditAction
        actions_list = [
            {'value': code, 'label': label}
            for code, label in AuditAction.choices
        ]
        return Response(actions_list)