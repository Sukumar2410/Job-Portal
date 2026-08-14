from rest_framework import serializers
from .models import Event


class EventSerializer(serializers.ModelSerializer):
    user_email = serializers.CharField(source='user.email', read_only=True)
    job_title = serializers.CharField(source='job.title', read_only=True)

    class Meta:
        model = Event
        fields = ('id', 'event_type', 'user_email', 'job_title',
                  'metadata', 'created_at')


class CandidateDashboardSerializer(serializers.Serializer):
    total_applications = serializers.IntegerField()
    active_applications = serializers.IntegerField()
    shortlisted_count = serializers.IntegerField()
    interviews_scheduled = serializers.IntegerField()
    offers_received = serializers.IntegerField()
    rejected_count = serializers.IntegerField()
    saved_jobs_count = serializers.IntegerField()
    profile_completion = serializers.IntegerField()
    application_status_breakdown = serializers.DictField()
    recent_applications = serializers.ListField()


class HRDashboardSerializer(serializers.Serializer):
    total_jobs = serializers.IntegerField()
    active_jobs = serializers.IntegerField()
    draft_jobs = serializers.IntegerField()
    closed_jobs = serializers.IntegerField()
    total_applications = serializers.IntegerField()
    new_applications_this_week = serializers.IntegerField()
    interviews_scheduled = serializers.IntegerField()
    hired_count = serializers.IntegerField()
    total_job_views = serializers.IntegerField()
    hiring_funnel = serializers.DictField()
    applications_over_time = serializers.ListField()
    top_jobs_by_applications = serializers.ListField()


class SuperAdminDashboardSerializer(serializers.Serializer):
    total_users = serializers.IntegerField()
    total_candidates = serializers.IntegerField()
    total_hr = serializers.IntegerField()
    total_companies = serializers.IntegerField()
    verified_companies = serializers.IntegerField()
    total_jobs = serializers.IntegerField()
    active_jobs = serializers.IntegerField()
    total_applications = serializers.IntegerField()
    total_hires = serializers.IntegerField()
    signups_over_time = serializers.ListField()
    jobs_over_time = serializers.ListField()
    top_companies_by_jobs = serializers.ListField()
    role_distribution = serializers.DictField()