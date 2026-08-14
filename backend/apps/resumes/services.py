from rest_framework.exceptions import ValidationError

from apps.users.models import Resume

MAX_RESUMES_PER_CANDIDATE = 5


class ResumeService:
    """
    Business logic for Resume Management.
    """

    @staticmethod
    def create_resume(*, user, validated_data):
        """
        Create a new resume for the given candidate.
        """

        # Maximum resume limit
        resume_count = Resume.objects.filter(
            candidate=user
        ).count()

        if resume_count >= MAX_RESUMES_PER_CANDIDATE:
            raise ValidationError(
                {
                    "detail": (
                        f"You can upload a maximum of "
                        f"{MAX_RESUMES_PER_CANDIDATE} resumes. "
                        "Please delete an existing resume before "
                        "uploading a new one."
                    )
                }
            )

        # First uploaded resume becomes the default
        is_first_resume = not Resume.objects.filter(
            candidate=user
        ).exists()

        if is_first_resume:
            validated_data["is_default"] = True

        resume = Resume.objects.create(
            candidate=user,
            **validated_data,
        )

        return resume

    @staticmethod
    def update_resume(*, resume, validated_data):
        """
        Update an existing resume.
        """

        for field, value in validated_data.items():
            setattr(resume, field, value)

        resume.save()

        return resume

    @staticmethod
    def delete_resume(*, resume):
        """
        Delete a resume.
        """

        candidate = resume.candidate
        was_default = resume.is_default

        # Delete physical file
        if resume.file:
            resume.file.delete(save=False)

        # Delete database record
        resume.delete()

        # If default resume was deleted,
        # make the newest remaining resume the default
        if was_default:
            new_default = (
                candidate.resumes
                .order_by("-created_at")
                .first()
            )

            if new_default:
                new_default.is_default = True
                new_default.save()