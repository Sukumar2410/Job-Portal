from rest_framework import serializers


class JobSearchResultSerializer(serializers.Serializer):
    """Lightweight job result for search"""
    id = serializers.IntegerField()
    slug = serializers.CharField()
    title = serializers.CharField()
    company_name = serializers.CharField()
    company_logo = serializers.SerializerMethodField()
    location = serializers.CharField()
    work_mode = serializers.CharField()
    job_type = serializers.CharField()
    experience_level = serializers.CharField()
    result_type = serializers.CharField(default='job')

    def get_company_logo(self, obj):
        if obj.company and obj.company.logo:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.company.logo.url)
            return obj.company.logo.url
        return None

    def to_representation(self, instance):
        return {
            'id': instance.id,
            'slug': instance.slug,
            'title': instance.title,
            'company_name': instance.company.name if instance.company else '',
            'company_logo': self.get_company_logo(instance),
            'location': instance.location,
            'work_mode': instance.work_mode,
            'job_type': instance.job_type,
            'experience_level': instance.experience_level,
            'result_type': 'job',
        }


class CompanySearchResultSerializer(serializers.Serializer):
    """Lightweight company result for search"""

    def to_representation(self, instance):
        request = self.context.get('request')
        logo_url = None
        if instance.logo:
            logo_url = request.build_absolute_uri(instance.logo.url) if request else instance.logo.url

        return {
            'id': instance.id,
            'slug': instance.slug,
            'name': instance.name,
            'logo': logo_url,
            'industry': instance.industry,
            'headquarters': instance.headquarters,
            'is_verified': instance.is_verified,
            'active_job_count': instance.jobs.filter(status='ACTIVE').count(),
            'result_type': 'company',
        }


class CandidateSearchResultSerializer(serializers.Serializer):
    """Lightweight candidate result (for HR/Admin only)"""

    def to_representation(self, instance):
        profile = getattr(instance, 'candidate_profile', None)
        return {
            'id': instance.id,
            'full_name': instance.full_name,
            'email': instance.email,
            'headline': profile.headline if profile else '',
            'experience_years': profile.experience_years if profile else 0,
            'current_location': profile.current_location if profile else '',
            'skills': profile.skills if profile else '',
            'result_type': 'candidate',
        }