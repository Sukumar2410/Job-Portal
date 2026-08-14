from rest_framework import serializers
from .models import AuditLog


class AuditLogSerializer(serializers.ModelSerializer):
    action_display = serializers.CharField(source='get_action_display', read_only=True)
    severity_display = serializers.CharField(source='get_severity_display', read_only=True)
    actor_name = serializers.SerializerMethodField()
    time_since = serializers.SerializerMethodField()

    class Meta:
        model = AuditLog
        fields = (
            'id', 'action', 'action_display', 'severity', 'severity_display',
            'actor', 'actor_email', 'actor_role', 'actor_name',
            'target_type', 'target_id', 'target_repr',
            'description', 'changes', 'metadata',
            'ip_address', 'user_agent', 'created_at', 'time_since',
        )
        read_only_fields = fields

    def get_actor_name(self, obj):
        if obj.actor:
            return obj.actor.full_name
        return obj.actor_email or 'System'

    def get_time_since(self, obj):
        from django.utils.timesince import timesince
        return f'{timesince(obj.created_at)} ago'


class AuditLogStatsSerializer(serializers.Serializer):
    total_logs = serializers.IntegerField()
    logs_today = serializers.IntegerField()
    logs_this_week = serializers.IntegerField()
    critical_count = serializers.IntegerField()
    warning_count = serializers.IntegerField()
    top_actions = serializers.ListField()
    top_actors = serializers.ListField()