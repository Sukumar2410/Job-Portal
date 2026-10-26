from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import User, CandidateProfile, HRProfile, UserRole, Resume


class UserRegistrationSerializer(serializers.ModelSerializer):
    """Serializer for user registration"""
    password = serializers.CharField(
        write_only=True,
        required=True,
        validators=[validate_password],
        style={'input_type': 'password'}
    )
    password_confirm = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'}
    )

    class Meta:
        model = User
        fields = ('email', 'first_name', 'last_name', 'phone', 'role', 'password', 'password_confirm')

    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({'password': "Passwords do not match."})

        # Prevent public registration as Super Admin
        if attrs.get('role') == UserRole.SUPER_ADMIN:
            raise serializers.ValidationError(
                {'role': 'Super Admin accounts cannot be created through registration.'}
            )
        return attrs

    def create(self, validated_data):
        validated_data.pop('password_confirm')
        password = validated_data.pop('password')
        user = User.objects.create_user(password=password, **validated_data)

        # Auto-create the appropriate profile based on role
        if user.role == UserRole.CANDIDATE:
            CandidateProfile.objects.create(user=user)
        elif user.role == UserRole.HR:
            HRProfile.objects.create(user=user)

        return user


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Custom JWT token serializer that includes user details in the response"""

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        # Add custom claims
        token['email'] = user.email
        token['role'] = user.role
        token['full_name'] = user.full_name
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        data['user'] = {
            'id': self.user.id,
            'email': self.user.email,
            'first_name': self.user.first_name,
            'last_name': self.user.last_name,
            'role': self.user.role,
            'is_verified': self.user.is_verified,
        }
        return data


class UserSerializer(serializers.ModelSerializer):
    """Basic user serializer for profile viewing"""
    full_name = serializers.CharField(read_only=True)
    profile_picture = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ('id', 'email', 'first_name', 'last_name', 'full_name', 'phone',
                  'role', 'profile_picture', 'is_verified', 'is_active', 'date_joined')
        read_only_fields = ('id', 'email', 'role', 'is_verified', 'date_joined')

    def get_profile_picture(self, obj):
        if not obj.profile_picture:
            return None

        request = self.context.get("request")

        if request:
            return request.build_absolute_uri(obj.profile_picture.url)

        return obj.profile_picture.url


class CandidateProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = CandidateProfile
        fields = '__all__'
        read_only_fields = ('user', 'created_at', 'updated_at')


class HRProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = HRProfile
        fields = '__all__'
        read_only_fields = ('user', 'created_at', 'updated_at')

    def validate(self, attrs):
        required_fields = {
            "headline": "Headline",
            "summary": "Professional Summary",
            "skills": "Skills",
            "experience_years": "Experience",
            "current_location": "Current Location",
        }

        errors = {}

        for field, label in required_fields.items():
            value = attrs.get(field)

            if value in [None, ""]:
                errors[field] = f"{label} is required."

        if errors:
            raise serializers.ValidationError(errors)

        return attrs


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, validators=[validate_password])

    def validate_old_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError('Old password is incorrect.')
        return value
    
class ResumeUploadSerializer(serializers.Serializer):
    """Dedicated serializer for resume upload"""
    resume = serializers.FileField(required=True)

    def validate_resume(self, file):
        from .validators import validate_resume_file
        validate_resume_file(file)
        return file

class AdminResumeSerializer(serializers.ModelSerializer):
    """
    Resume details exposed to Super Admin.
    """

    file_url = serializers.SerializerMethodField()

    class Meta:
        model = Resume
        fields = (
            'id',
            'title',
            'file_url',
            'visibility',
            'is_default',
            'is_boosted',
            'ats_score',
            'download_count',
            'created_at',
            'updated_at',
        )

    def get_file_url(self, obj):
        if not obj.file:
            return None

        request = self.context.get('request')

        try:
            url = obj.file.url
        except ValueError:
            return None

        if request:
            return request.build_absolute_uri(url)

        return url

class AdminCandidateProfileSerializer(serializers.ModelSerializer):
    """
    Complete candidate profile information for Super Admin.
    """

    legacy_resume_url = serializers.SerializerMethodField()
    resumes = serializers.SerializerMethodField()

    class Meta:
        model = CandidateProfile
        fields = (
            'headline',
            'summary',
            'skills',
            'experience_years',
            'current_location',
            'expected_salary',
            'linkedin_url',
            'github_url',
            'portfolio_url',
            'legacy_resume_url',
            'resumes',
            'created_at',
            'updated_at',
        )

    def get_legacy_resume_url(self, obj):
        if not obj.resume:
            return None

        request = self.context.get('request')

        try:
            url = obj.resume.url
        except ValueError:
            return None

        if request:
            return request.build_absolute_uri(url)

        return url

    def get_resumes(self, obj):
        resumes = obj.user.resumes.all()

        return AdminResumeSerializer(
            resumes,
            many=True,
            context=self.context
        ).data

class AdminHRProfileSerializer(serializers.ModelSerializer):
    """
    Complete HR/Recruiter profile information for Super Admin.
    """

    company_id = serializers.IntegerField(
        source='company.id',
        read_only=True,
        allow_null=True
    )

    company_name = serializers.SerializerMethodField()

    class Meta:
        model = HRProfile
        fields = (
            'designation',
            'department',
            'company_id',
            'company_name',
            'created_at',
            'updated_at',
        )

    def get_company_name(self, obj):
        if not obj.company:
            return None

        return str(obj.company)

class AdminUserDetailSerializer(serializers.ModelSerializer):
    """
    Complete user information for Super Admin.

    Includes role-specific profile information:
    - Candidate → CandidateProfile + Resumes
    - HR → HRProfile + Company association
    - Super Admin → no role-specific profile
    """

    full_name = serializers.CharField(read_only=True)
    profile = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            'id',
            'email',
            'first_name',
            'last_name',
            'full_name',
            'phone',
            'role',
            'profile_picture',
            'is_active',
            'is_staff',
            'is_superuser',
            'is_verified',
            'date_joined',
            'last_login',
            'profile',
        )

    def get_profile(self, obj):

        if obj.role == UserRole.CANDIDATE:
            profile = getattr(obj, 'candidate_profile', None)

            if not profile:
                return None

            return AdminCandidateProfileSerializer(
                profile,
                context=self.context
            ).data

        if obj.role == UserRole.HR:
            profile = getattr(obj, 'hr_profile', None)

            if not profile:
                return None

            return AdminHRProfileSerializer(
                profile,
                context=self.context
            ).data

        # SUPER_ADMIN
        return None