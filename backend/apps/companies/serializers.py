from rest_framework import serializers
from .models import Company


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