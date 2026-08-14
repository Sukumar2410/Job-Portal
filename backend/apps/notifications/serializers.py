from rest_framework import serializers
from .models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    notification_type_display = serializers.CharField(source='get_notification_type_display', read_only=True)
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)
    time_since = serializers.SerializerMethodField()

    class Meta:
        model = Notification
        fields = (
            'id', 'notification_type', 'notification_type_display',
            'priority', 'priority_display', 'title', 'message',
            'action_url', 'related_object_type', 'related_object_id',
            'is_read', 'read_at', 'created_at', 'time_since',
        )
        read_only_fields = fields

    def get_time_since(self, obj):
        from django.utils.timesince import timesince
        return f'{timesince(obj.created_at)} ago'


class BroadcastNotificationSerializer(serializers.Serializer):
    """For Super Admin to broadcast announcements"""
    title = serializers.CharField(max_length=200)
    message = serializers.CharField()
    target_role = serializers.ChoiceField(
        choices=['ALL', 'CANDIDATE', 'HR', 'SUPER_ADMIN'],
        default='ALL'
    )
    priority = serializers.ChoiceField(
        choices=['LOW', 'NORMAL', 'HIGH', 'URGENT'],
        default='NORMAL'
    )
    action_url = serializers.CharField(required=False, allow_blank=True)