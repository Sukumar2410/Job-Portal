"""Custom validators for file uploads"""
import os
from django.core.exceptions import ValidationError


ALLOWED_RESUME_EXTENSIONS = ['.pdf', '.doc', '.docx']
MAX_RESUME_SIZE_MB = 5
MAX_RESUME_SIZE_BYTES = MAX_RESUME_SIZE_MB * 1024 * 1024


def validate_resume_file(file):
    """
    Validate uploaded resume file.
    - Must be PDF, DOC, or DOCX
    - Must be under 5 MB
    """
    if not file:
        raise ValidationError('No file provided.')

    # Extension check
    ext = os.path.splitext(file.name)[1].lower()
    if ext not in ALLOWED_RESUME_EXTENSIONS:
        raise ValidationError(
            f'Invalid file type. Allowed: {", ".join(ALLOWED_RESUME_EXTENSIONS)}'
        )

    # Size check
    if file.size > MAX_RESUME_SIZE_BYTES:
        raise ValidationError(
            f'File too large. Maximum size: {MAX_RESUME_SIZE_MB} MB. '
            f'Uploaded: {file.size / 1024 / 1024:.2f} MB.'
        )

    return file


ALLOWED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp']
MAX_IMAGE_SIZE_MB = 2
MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024


def validate_image_file(file):
    """Validate profile picture / company logo"""
    if not file:
        raise ValidationError('No file provided.')

    ext = os.path.splitext(file.name)[1].lower()
    if ext not in ALLOWED_IMAGE_EXTENSIONS:
        raise ValidationError(
            f'Invalid image type. Allowed: {", ".join(ALLOWED_IMAGE_EXTENSIONS)}'
        )

    if file.size > MAX_IMAGE_SIZE_BYTES:
        raise ValidationError(
            f'Image too large. Maximum size: {MAX_IMAGE_SIZE_MB} MB.'
        )

    return file