from rest_framework import serializers

from apps.users.models import Resume
from apps.users.validators import validate_resume_file


class ResumeCreateSerializer(serializers.ModelSerializer):
    """
    Serializer used for uploading a resume.
    """

    file = serializers.FileField(
        validators=[validate_resume_file]
    )

    class Meta:
        model = Resume
        fields = (
            "title",
            "file",
            "visibility",
            "is_default",
        )

    def validate_title(self, value):
        value = value.strip()

        if not value:
            raise serializers.ValidationError(
                "Resume title cannot be empty."
            )

        return value

class ResumeUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer used for updating an existing resume.
    """

    file = serializers.FileField(
        validators=[validate_resume_file],
        required=False,
    )

    class Meta:
        model = Resume
        fields = (
            "title",
            "file",
            "visibility",
            "is_default",
        )
        extra_kwargs = {
            "title": {"required": False},
            "visibility": {"required": False},
            "is_default": {"required": False},
        }

    def validate_title(self, value):
        value = value.strip()

        if not value:
            raise serializers.ValidationError(
                "Resume title cannot be empty."
            )

        return value

class ResumeListSerializer(serializers.ModelSerializer):
    """
    Serializer used when listing resumes.
    """

    class Meta:
        model = Resume
        fields = (
            "id",
            "title",
            "visibility",
            "is_default",
            "is_boosted",
            "ats_score",
            "download_count",
            "created_at",
        )


class ResumeDetailSerializer(serializers.ModelSerializer):
    """
    Serializer used for viewing a single resume.
    """

    class Meta:
        model = Resume
        fields = (
            "id",
            "title",
            "file",
            "visibility",
            "is_default",
            "is_boosted",
            "ats_score",
            "download_count",
            "created_at",
            "updated_at",
        )