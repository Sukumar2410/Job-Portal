from django.utils import timezone
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend

from apps.users.models import User, UserRole
from apps.users.permissions import IsSuperAdmin
from .models import Notification, NotificationType, NotificationPriority
from .serializers import NotificationSerializer, BroadcastNotificationSerializer
from .services import send_bulk_notification


class NotificationViewSet(viewsets.ReadOnlyModelViewSet):
    """
    List and manage notifications for the logged-in user.
    - GET /api/notifications/               → List all
    - GET /api/notifications/{id}/          → Retrieve one
    - GET /api/notifications/unread/        → Unread only
    - GET /api/notifications/unread-count/  → Just the count
    - POST /api/notifications/{id}/mark-read/
    - POST /api/notifications/mark-all-read/
    - DELETE /api/notifications/{id}/delete/
    - DELETE /api/notifications/clear-all/
    """
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['notification_type', 'priority', 'is_read']
    ordering_fields = ['created_at', 'priority']

    def get_queryset(self):
        return Notification.objects.filter(recipient=self.request.user)

    @action(detail=False, methods=['get'])
    def unread(self, request):
        """GET /api/notifications/unread/"""
        qs = self.get_queryset().filter(is_read=False)
        page = self.paginate_queryset(qs)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='unread-count')
    def unread_count(self, request):
        """GET /api/notifications/unread-count/ - For bell badge"""
        count = self.get_queryset().filter(is_read=False).count()
        return Response({'unread_count': count})

    @action(detail=True, methods=['post'], url_path='mark-read')
    def mark_read(self, request, pk=None):
        """POST /api/notifications/{id}/mark-read/"""
        notification = self.get_object()
        notification.mark_as_read()
        return Response({'message': 'Marked as read.', 'notification': NotificationSerializer(notification).data})

    @action(detail=False, methods=['post'], url_path='mark-all-read')
    def mark_all_read(self, request):
        """POST /api/notifications/mark-all-read/"""
        updated = self.get_queryset().filter(is_read=False).update(
            is_read=True, read_at=timezone.now()
        )
        return Response({'message': f'{updated} notifications marked as read.'})

    @action(detail=True, methods=['delete'], url_path='delete')
    def delete_notification(self, request, pk=None):
        """DELETE /api/notifications/{id}/delete/"""
        notification = self.get_object()
        notification.delete()
        return Response({'message': 'Notification deleted.'}, status=status.HTTP_204_NO_CONTENT)

    @action(detail=False, methods=['delete'], url_path='clear-all')
    def clear_all(self, request):
        """DELETE /api/notifications/clear-all/"""
        deleted, _ = self.get_queryset().delete()
        return Response({'message': f'{deleted} notifications cleared.'},
                        status=status.HTTP_204_NO_CONTENT)


@api_view(['POST'])
@permission_classes([IsSuperAdmin])
def broadcast_notification(request):
    """
    POST /api/notifications/broadcast/
    Super Admin sends announcement to all users or a role.
    """
    serializer = BroadcastNotificationSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    data = serializer.validated_data

    target_role = data['target_role']
    if target_role == 'ALL':
        recipients = User.objects.filter(is_active=True).exclude(pk=request.user.pk)
    else:
        recipients = User.objects.filter(is_active=True, role=target_role).exclude(pk=request.user.pk)

    created = send_bulk_notification(
        recipients=recipients,
        title=data['title'],
        message=data['message'],
        notification_type=NotificationType.ANNOUNCEMENT,
        priority=data['priority'],
        action_url=data.get('action_url', ''),
    )

    # Log to audit trail
    from apps.audit_logs.services import log_action
    from apps.audit_logs.models import AuditAction
    log_action(
        action=AuditAction.BROADCAST_SENT,
        actor=request.user,
        description=f'Broadcast "{data["title"]}" sent to {len(created)} users (target: {target_role})',
        metadata={'target_role': target_role, 'recipient_count': len(created)},
        request=request,
    )

    return Response({
        'message': f'Broadcast sent to {len(created)} users.',
        'recipient_count': len(created),
    }, status=status.HTTP_201_CREATED)