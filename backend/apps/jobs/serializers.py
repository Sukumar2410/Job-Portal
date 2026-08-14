from rest_framework import serializers
from apps.companies.serializers import CompanyListSerializer
from .models import Job, SavedJob


class JobListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for list views"""
    company = CompanyListSerializer(read_only=True)
    skills_list = serializers.ListField(read_only=True)
    is_saved = serializers.SerializerMethodField()
    has_applied = serializers.SerializerMethodField()

    class Meta:
        model = Job
        fields = ('id', 'title', 'slug', 'company', 'job_type', 'work_mode',
                  'experience_level', 'location', 'min_salary', 'max_salary',
                  'currency', 'show_salary', 'skills_list', 'status',
                  'is_featured', 'views_count', 'applications_count',
                  'posted_at', 'application_deadline', 'is_saved', 'has_applied')

    def get_is_saved(self, obj):
        user = self.context.get('request').user if self.context.get('request') else None
        if user and user.is_authenticated:
            return SavedJob.objects.filter(candidate=user, job=obj).exists()
        return False

    def get_has_applied(self, obj):
        user = self.context.get('request').user if self.context.get('request') else None
        if user and user.is_authenticated:
            from apps.applications.models import Application
            return Application.objects.filter(candidate=user, job=obj).exists()
        return False


class JobDetailSerializer(serializers.ModelSerializer):
    company = CompanyListSerializer(read_only=True)
    company_id = serializers.IntegerField(write_only=True, required=False)
    posted_by_email = serializers.CharField(source='posted_by.email', read_only=True)
    skills_list = serializers.ListField(read_only=True)
    is_saved = serializers.SerializerMethodField()
    has_applied = serializers.SerializerMethodField()  # ✅ ADD

    class Meta:
        model = Job
        fields = '__all__'
        read_only_fields = ('slug', 'posted_by', 'views_count', 'applications_count',
                            'posted_at', 'created_at', 'updated_at')

    def get_is_saved(self, obj):
        user = self.context.get('request').user if self.context.get('request') else None
        if user and user.is_authenticated:
            from apps.jobs.models import SavedJob
            return SavedJob.objects.filter(candidate=user, job=obj).exists()
        return False

    def get_has_applied(self, obj):  # ✅ ADD
        user = self.context.get('request').user if self.context.get('request') else None
        if user and user.is_authenticated:
            from apps.applications.models import Application
            return Application.objects.filter(candidate=user, job=obj).exists()
        return False
    
class SavedJobSerializer(serializers.ModelSerializer):
    job = JobListSerializer(read_only=True)

    class Meta:
        model = SavedJob
        fields = ('id', 'job', 'saved_at')