from rest_framework import serializers
from apps.jobs.serializers import JobListSerializer
from apps.users.serializers import UserSerializer, CandidateProfileSerializer
from .models import Application, ApplicationStatusHistory, Interview, ApplicationStatus


class InterviewSerializer(serializers.ModelSerializer):
    scheduled_by_email = serializers.CharField(source='scheduled_by.email', read_only=True)

    class Meta:
        model = Interview
        fields = '__all__'
        read_only_fields = ('scheduled_by', 'created_at', 'updated_at')


class ApplicationStatusHistorySerializer(serializers.ModelSerializer):
    changed_by_email = serializers.CharField(source='changed_by.email', read_only=True)
    to_status_display = serializers.CharField(source='get_to_status_display', read_only=True)

    class Meta:
        model = ApplicationStatusHistory
        fields = ('id', 'from_status', 'to_status', 'to_status_display',
                  'changed_by_email', 'note', 'changed_at')


class ApplicationCreateSerializer(serializers.ModelSerializer):
    """For candidates applying to jobs"""
    resume_snapshot = serializers.FileField(
        required=False,
        allow_null=True,
        help_text='Optional. If omitted, resume from your profile will be used.'
    )

    class Meta:
        model = Application
        fields = ('job', 'cover_letter', 'resume_snapshot',
                  'expected_salary', 'notice_period_days')
        extra_kwargs = {
            'cover_letter': {'required': False, 'allow_blank': True},
            'expected_salary': {'required': False, 'allow_null': True},
            'notice_period_days': {'required': False, 'allow_null': True},
        }

    def validate_job(self, job):
        from apps.jobs.models import JobStatus
        if job.status != JobStatus.ACTIVE:
            raise serializers.ValidationError('This job is not currently accepting applications.')

        from django.utils import timezone
        if job.application_deadline and job.application_deadline < timezone.now().date():
            raise serializers.ValidationError('Application deadline has passed.')

        if job.max_applications and job.applications_count >= job.max_applications:
            raise serializers.ValidationError('This job has reached maximum applications.')

        return job

    def validate(self, attrs):
        user = self.context['request'].user
        job = attrs['job']

        if Application.objects.filter(job=job, candidate=user).exists():
            raise serializers.ValidationError({
                'detail': 'You have already applied to this job.'
            })
        return attrs

class ApplicationListSerializer(serializers.ModelSerializer):
    """For lists - lightweight"""
    job = JobListSerializer(read_only=True)
    candidate_email = serializers.CharField(source='candidate.email', read_only=True)
    candidate_name = serializers.CharField(source='candidate.full_name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = Application
        fields = ('id', 'job', 'candidate_email', 'candidate_name', 'status',
                  'status_display', 'rating', 'applied_at', 'updated_at')


class ApplicationDetailSerializer(serializers.ModelSerializer):
    """Full details for HR/Candidate views"""
    job = JobListSerializer(read_only=True)
    candidate = UserSerializer(read_only=True)
    candidate_profile = serializers.SerializerMethodField()
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    status_history = ApplicationStatusHistorySerializer(many=True, read_only=True)
    interviews = InterviewSerializer(many=True, read_only=True)

    class Meta:
        model = Application
        fields = ('id', 'job', 'candidate', 'candidate_profile',
                  'cover_letter', 'resume_snapshot',
                  'expected_salary', 'notice_period_days',
                  'status', 'status_display', 'hr_notes', 'rating',
                  'rejection_reason', 'applied_at', 'updated_at',
                  'status_history', 'interviews')
        read_only_fields = ('applied_at', 'updated_at')

    def get_candidate_profile(self, obj):
        profile = getattr(obj.candidate, 'candidate_profile', None)
        if profile:
            return CandidateProfileSerializer(profile).data
        return None

    def to_representation(self, instance):
        """Hide HR-only fields from candidates"""
        data = super().to_representation(instance)
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            from apps.users.models import UserRole
            if request.user.role == UserRole.CANDIDATE:
                data.pop('hr_notes', None)
                data.pop('rating', None)
        return data


class ApplicationStatusUpdateSerializer(serializers.Serializer):
    """For HR to update application status"""
    status = serializers.ChoiceField(choices=ApplicationStatus.choices)
    note = serializers.CharField(required=False, allow_blank=True)
    rejection_reason = serializers.CharField(required=False, allow_blank=True)
    rating = serializers.IntegerField(min_value=1, max_value=5, required=False)


class InterviewCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Interview
        fields = ('application', 'round_name', 'mode', 'scheduled_at',
                  'duration_minutes', 'meeting_link', 'location',
                  'interviewer_name', 'interviewer_email', 'instructions')