from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.utils.html import strip_tags

from .models import Interview, ApplicationStatus

from apps.users.emails import send_html_email

def send_application_status_email(application):
    """
    Beautiful application status email.
    Includes interview details when scheduled.
    """

    interview = (
        Interview.objects
        .filter(application=application)
        .order_by("-scheduled_at")
        .first()
    )

    context = {
        "candidate_name": application.candidate.full_name,
        "job_title": application.job.title,
        "company_name": application.job.company.name,
        "status": application.get_status_display(),
        "note": application.hr_notes,
        "interview": interview,
        "is_interview": application.status == ApplicationStatus.INTERVIEW_SCHEDULED,
    }

    html_content = render_to_string(
        "emails/application_status.html",
        context
    )

    text_content = strip_tags(html_content)

    email = EmailMultiAlternatives(
        subject=f"Application Update • {application.job.title}",
        body=text_content,
        from_email=settings.DEFAULT_FROM_EMAIL,
        to=[application.candidate.email],
    )

    email.attach_alternative(html_content, "text/html")
    email.send()

def send_interview_schedule_email(interview):
    """
    Send interview invitation email.
    Required by ApplicationViewSet and InterviewViewSet.
    """

    application = interview.application

    context = {
        "candidate_name": application.candidate.full_name,
        "job_title": application.job.title,
        "company_name": application.job.company.name,
        "interview": interview,
    }

    send_html_email(
        subject=f"Interview Scheduled • {application.job.title}",
        to_email=application.candidate.email,
        template_name="emails/interview_schedule.html",
        context=context,
    )

def send_offer_email(application, salary=None, joining_date=None):
    """Beautiful Offer email"""

    candidate = application.candidate
    job = application.job

    context = {
        "candidate_name": candidate.full_name,
        "job_title": job.title,
        "company_name": job.company.name,
        "salary": application.expected_salary or "As discussed",
    }

    send_html_email(
        subject=f"🎉 Congratulations! Offer for {job.title}",
        to_email=candidate.email,
        template_name="emails/offer_letter.html",
        context=context
    )


def send_rejection_email(application):
    """Beautiful rejection email"""

    candidate = application.candidate
    job = application.job

    context = {
        "candidate_name": candidate.full_name,
        "job_title": job.title,
        "company_name": job.company.name,
        "reason": application.rejection_reason or ""
    }

    send_html_email(
        subject=f"Application Update | {job.title}",
        to_email=candidate.email,
        template_name="emails/rejection.html",
        context=context
    )