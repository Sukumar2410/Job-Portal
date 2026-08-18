from rest_framework import serializers
from .models import Company
from apps.applications.models import Application


class CompanyListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for list views"""
    active_job_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Company
        fields = ('id', 'name', 'slug', 'logo', 'industry', 'company_size',
                  'headquarters', 'is_verified', 'active_job_count')


class CompanyDetailSerializer(serializers.ModelSerializer):
    """Full serializer for detail/create/update"""
    active_job_count = serializers.IntegerField(read_only=True)
    created_by_email = serializers.CharField(source='created_by.email', read_only=True)

    class Meta:
        model = Company
        fields = '__all__'
        read_only_fields = ('slug', 'created_by', 'is_verified', 'subscription_tier',
                            'job_post_quota', 'created_at', 'updated_at')

    def create(self, validated_data):
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)

class CompanyAdminDetailSerializer(serializers.ModelSerializer):
    """
    Detailed serializer used by Super Admin when viewing
    a company's complete platform activity.
    """

    active_job_count = serializers.SerializerMethodField()
    total_job_count = serializers.SerializerMethodField()
    closed_job_count = serializers.SerializerMethodField()

    total_application_count = serializers.SerializerMethodField()
    unique_candidate_count = serializers.SerializerMethodField()

    applied_count = serializers.SerializerMethodField()
    under_review_count = serializers.SerializerMethodField()
    shortlisted_count = serializers.SerializerMethodField()
    interview_count = serializers.SerializerMethodField()
    offered_count = serializers.SerializerMethodField()
    hired_count = serializers.SerializerMethodField()
    rejected_count = serializers.SerializerMethodField()

    jobs_used = serializers.SerializerMethodField()
    jobs_remaining = serializers.SerializerMethodField()

    created_by_email = serializers.CharField(
        source='created_by.email',
        read_only=True
    )

    recent_jobs = serializers.SerializerMethodField()

    class Meta:
        model = Company

        fields = (
            'id',
            'name',
            'slug',
            'description',
            'website',
            'logo',
            'cover_image',

            'industry',
            'company_size',
            'headquarters',
            'founded_year',

            'contact_email',
            'contact_phone',

            'linkedin_url',
            'twitter_url',

            'subscription_tier',
            'job_post_quota',

            'created_by',
            'created_by_email',

            'is_verified',
            'is_active',

            'created_at',
            'updated_at',

            # Hiring statistics
            'total_job_count',
            'active_job_count',
            'closed_job_count',

            'total_application_count',
            'unique_candidate_count',

            'applied_count',
            'under_review_count',
            'shortlisted_count',
            'interview_count',
            'offered_count',
            'hired_count',
            'rejected_count',

            # Subscription usage
            'jobs_used',
            'jobs_remaining',

            # Recent jobs
            'recent_jobs',
        )

        read_only_fields = fields

    # ==========================================================
    # JOB STATISTICS
    # ==========================================================

    def get_total_job_count(self, obj):
        return obj.jobs.count()

    def get_active_job_count(self, obj):
        return obj.jobs.filter(
            status='ACTIVE'
        ).count()

    def get_closed_job_count(self, obj):
        return obj.jobs.filter(
            status='CLOSED'
        ).count()

    # ==========================================================
    # APPLICATION STATISTICS
    # ==========================================================

    def get_total_application_count(self, obj):

        return Application.objects.filter(
            job__company=obj
        ).count()

    def get_unique_candidate_count(self, obj):

        return Application.objects.filter(
            job__company=obj
        ).values(
            'candidate'
        ).distinct().count()

    # ==========================================================
    # APPLICATION STATUS COUNTS
    # ==========================================================

    def get_applied_count(self, obj):

        return Application.objects.filter(
            job__company=obj,
            status='APPLIED'
        ).count()

    def get_under_review_count(self, obj):

        return Application.objects.filter(
            job__company=obj,
            status='UNDER_REVIEW'
        ).count()

    def get_shortlisted_count(self, obj):

        return Application.objects.filter(
            job__company=obj,
            status='SHORTLISTED'
        ).count()

    def get_interview_count(self, obj):

        return Application.objects.filter(
            job__company=obj,
            status__in=[
                'INTERVIEW_SCHEDULED',
                'INTERVIEWED',
            ]
        ).count()

    def get_offered_count(self, obj):

        return Application.objects.filter(
            job__company=obj,
            status='OFFERED'
        ).count()

    def get_hired_count(self, obj):

        return Application.objects.filter(
            job__company=obj,
            status='HIRED'
        ).count()

    def get_rejected_count(self, obj):

        return Application.objects.filter(
            job__company=obj,
            status='REJECTED'
        ).count()

    # ==========================================================
    # SUBSCRIPTION / QUOTA
    # ==========================================================

    def get_jobs_used(self, obj):

        return obj.jobs.filter(
            status='ACTIVE'
        ).count()

    def get_jobs_remaining(self, obj):

        active_jobs = obj.jobs.filter(
            status='ACTIVE'
        ).count()

        return max(
            obj.job_post_quota - active_jobs,
            0
        )

    # ==========================================================
    # RECENT JOBS
    # ==========================================================

    def get_recent_jobs(self, obj):

        jobs = obj.jobs.order_by(
            '-created_at'
        )[:5]

        return [
            {
                'id': job.id,
                'title': job.title,
                'slug': job.slug,
                'location': job.location,
                'job_type': job.get_job_type_display(),
                'work_mode': job.get_work_mode_display(),
                'experience_level': job.get_experience_level_display(),
                'status': job.status,
                'status_display': job.get_status_display(),
                'views_count': job.views_count,
                'applications_count': job.applications.count(),
                'posted_at': job.posted_at,
                'created_at': job.created_at,
            }
            for job in jobs
        ]