from django.conf import settings
from django.template.loader import render_to_string
from django.core.mail import EmailMultiAlternatives


def send_html_email(subject, recipient, template_name, context):
    """
    Reusable HTML email sender
    """
    html_content = render_to_string(template_name, context)

    message = EmailMultiAlternatives(
        subject=subject,
        body="Please view this email in an HTML compatible email client.",
        from_email=settings.DEFAULT_FROM_EMAIL,
        to=[recipient],
    )

    message.attach_alternative(html_content, "text/html")
    message.send()


def send_verification_email(user, token):
    verify_url = f"{settings.FRONTEND_VERIFY_EMAIL_URL}?token={token}"

    context = {
        "user": user,
        "verify_url": verify_url,
        "expiry_hours": settings.EMAIL_VERIFICATION_TOKEN_EXPIRY_HOURS,
    }

    send_html_email(
        subject="Verify Your Email • Enterprise Job Portal",
        recipient=user.email,
        template_name="emails/verification.html",
        context=context,
    )


def send_password_reset_email(user, token):
    reset_url = f"{settings.FRONTEND_RESET_PASSWORD_URL}?token={token}"

    context = {
        "user": user,
        "reset_url": reset_url,
        "expiry_hours": settings.PASSWORD_RESET_TOKEN_EXPIRY_HOURS,
    }

    send_html_email(
        subject="Reset Your Password • Enterprise Job Portal",
        recipient=user.email,
        template_name="emails/password_reset.html",
        context=context,
    )


def send_application_status_email(application):
    context = {
        "user": application.candidate,
        "job": application.job,
        "company": application.job.company,
        "status": application.get_status_display(),
        "application": application,
    }

    send_html_email(
        subject=f"Application Update • {application.job.title}",
        recipient=application.candidate.email,
        template_name="emails/application_status.html",
        context=context,
    )

def send_welcome_email(user):
    """
    Send welcome email after successful registration.
    """
    context = {
        "user": user,
    }

    send_html_email(
        subject="Welcome to Enterprise Job Portal 🎉",
        recipient=user.email,
        template_name="emails/welcome.html",
        context=context,
    )