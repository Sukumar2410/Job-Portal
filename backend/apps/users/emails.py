"""
Email sending service.
Uses Django's send_mail with the configured backend (console for dev).
"""
from django.conf import settings
from django.core.mail import send_mail


def send_verification_email(user, token):
    """Send email verification link to a user"""
    verify_url = f'{settings.FRONTEND_VERIFY_EMAIL_URL}?token={token}'
    subject = 'Verify Your Email - Job Portal'
    message = f"""
Hello {user.full_name},

Welcome to Job Portal! Please verify your email address by clicking the link below:

{verify_url}

This link will expire in {settings.EMAIL_VERIFICATION_TOKEN_EXPIRY_HOURS} hours.

If you did not create this account, please ignore this email.

Best regards,
Job Portal Team
"""
    send_mail(
        subject=subject,
        message=message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[user.email],
        fail_silently=False,
    )


def send_password_reset_email(user, token):
    """Send password reset link to a user"""
    reset_url = f'{settings.FRONTEND_RESET_PASSWORD_URL}?token={token}'
    subject = 'Reset Your Password - Job Portal'
    message = f"""
Hello {user.full_name},

We received a request to reset your password. Click the link below to set a new password:

{reset_url}

This link will expire in {settings.PASSWORD_RESET_TOKEN_EXPIRY_HOURS} hour(s).

If you did not request a password reset, please ignore this email — your password will remain unchanged.

Best regards,
Job Portal Team
"""
    send_mail(
        subject=subject,
        message=message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[user.email],
        fail_silently=False,
    )