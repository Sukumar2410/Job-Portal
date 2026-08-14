from datetime import timedelta
from django.db.models import Count, Q
from django.db.models.functions import TruncDate
from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from apps.users.models import User, UserRole
from apps.users.permissions import IsCandidate, IsHR, IsSuperAdmin
from apps.companies.models import Company
from apps.jobs.models import Job, JobStatus, SavedJob
from apps.applications.models import Application, ApplicationStatus, Interview


def calculate_profile_completion(user):
    """Calculate profile completion percentage for a candidate"""
    profile = getattr(user, 'candidate_profile', None)
    if not profile:
        return 0

    fields_to_check = [
        bool(user.first_name), bool(user.last_name), bool(user.phone),
        bool(user.profile_picture), bool(profile.headline), bool(profile.summary),
        bool(profile.resume), bool(profile.skills), bool(profile.current_location),
        bool(profile.linkedin_url),
    ]
    completed = sum(fields_to_check)
    return int((completed / len(fields_to_check)) * 100)


@api_view(['GET'])
@permission_classes([IsCandidate])
def candidate_dashboard(request):
    """GET /api/analytics/candidate-dashboard/"""
    user = request.user
    applications = Application.objects.filter(candidate=user)

    status_breakdown = dict(
        applications.values('status').annotate(count=Count('id')).values_list('status', 'count')
    )

    recent = applications.select_related('job', 'job__company').order_by('-applied_at')[:5]
    recent_list = [{
        'id': app.id,
        'job_title': app.job.title,
        'company_name': app.job.company.name,
        'status': app.status,
        'applied_at': app.applied_at,
    } for app in recent]

    data = {
        'total_applications': applications.count(),
        'active_applications': applications.exclude(
            status__in=[ApplicationStatus.HIRED, ApplicationStatus.REJECTED,
                        ApplicationStatus.WITHDRAWN]
        ).count(),
        'shortlisted_count': applications.filter(status=ApplicationStatus.SHORTLISTED).count(),
        'interviews_scheduled': applications.filter(
            status=ApplicationStatus.INTERVIEW_SCHEDULED
        ).count(),
        'offers_received': applications.filter(status=ApplicationStatus.OFFERED).count(),
        'rejected_count': applications.filter(status=ApplicationStatus.REJECTED).count(),
        'saved_jobs_count': SavedJob.objects.filter(candidate=user).count(),
        'profile_completion': calculate_profile_completion(user),
        'application_status_breakdown': status_breakdown,
        'recent_applications': recent_list,
    }
    return Response(data)


@api_view(['GET'])
@permission_classes([IsHR])
def hr_dashboard(request):
    """GET /api/analytics/hr-dashboard/"""
    user = request.user
    hr_profile = getattr(user, 'hr_profile', None)
    if not hr_profile or not hr_profile.company:
        return Response(
            {'detail': 'You must be linked to a company to view analytics.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    company = hr_profile.company
    jobs = Job.objects.filter(company=company)
    applications = Application.objects.filter(job__company=company)

    # Hiring funnel
    funnel = {
        'applied': applications.count(),
        'under_review': applications.filter(status=ApplicationStatus.UNDER_REVIEW).count(),
        'shortlisted': applications.filter(status=ApplicationStatus.SHORTLISTED).count(),
        'interview_scheduled': applications.filter(status=ApplicationStatus.INTERVIEW_SCHEDULED).count(),
        'interviewed': applications.filter(status=ApplicationStatus.INTERVIEWED).count(),
        'offered': applications.filter(status=ApplicationStatus.OFFERED).count(),
        'hired': applications.filter(status=ApplicationStatus.HIRED).count(),
        'rejected': applications.filter(status=ApplicationStatus.REJECTED).count(),
    }

    # Applications over last 30 days
    thirty_days_ago = timezone.now() - timedelta(days=30)
    apps_over_time = (
        applications.filter(applied_at__gte=thirty_days_ago)
        .annotate(day=TruncDate('applied_at'))
        .values('day')
        .annotate(count=Count('id'))
        .order_by('day')
    )
    apps_over_time_list = [
        {'date': str(item['day']), 'count': item['count']} for item in apps_over_time
    ]

    # Top jobs by applications
    top_jobs = jobs.annotate(app_count=Count('applications')).order_by('-app_count')[:5]
    top_jobs_list = [{
        'id': j.id,
        'title': j.title,
        'applications': j.app_count,
        'views': j.views_count,
    } for j in top_jobs]

    week_ago = timezone.now() - timedelta(days=7)

    data = {
        'total_jobs': jobs.count(),
        'active_jobs': jobs.filter(status=JobStatus.ACTIVE).count(),
        'draft_jobs': jobs.filter(status=JobStatus.DRAFT).count(),
        'closed_jobs': jobs.filter(status=JobStatus.CLOSED).count(),
        'total_applications': applications.count(),
        'new_applications_this_week': applications.filter(applied_at__gte=week_ago).count(),
        'interviews_scheduled': Interview.objects.filter(
            application__job__company=company, is_completed=False
        ).count(),
        'hired_count': applications.filter(status=ApplicationStatus.HIRED).count(),
        'total_job_views': sum(jobs.values_list('views_count', flat=True)),
        'hiring_funnel': funnel,
        'applications_over_time': apps_over_time_list,
        'top_jobs_by_applications': top_jobs_list,
    }
    return Response(data)


@api_view(['GET'])
@permission_classes([IsSuperAdmin])
def super_admin_dashboard(request):
    """GET /api/analytics/super-admin-dashboard/"""
    thirty_days_ago = timezone.now() - timedelta(days=30)

    # Signups over time
    signups = (
        User.objects.filter(date_joined__gte=thirty_days_ago)
        .annotate(day=TruncDate('date_joined'))
        .values('day')
        .annotate(count=Count('id'))
        .order_by('day')
    )
    signups_list = [{'date': str(item['day']), 'count': item['count']} for item in signups]

    # Jobs over time
    jobs_over_time = (
        Job.objects.filter(created_at__gte=thirty_days_ago)
        .annotate(day=TruncDate('created_at'))
        .values('day')
        .annotate(count=Count('id'))
        .order_by('day')
    )
    jobs_list = [{'date': str(item['day']), 'count': item['count']} for item in jobs_over_time]

    # Top companies by job count
    top_companies = Company.objects.annotate(
        job_count=Count('jobs')
    ).order_by('-job_count')[:10]
    top_companies_list = [{
        'id': c.id,
        'name': c.name,
        'jobs': c.job_count,
        'is_verified': c.is_verified,
    } for c in top_companies]

    role_dist = dict(
        User.objects.values('role').annotate(count=Count('id')).values_list('role', 'count')
    )

    data = {
        'total_users': User.objects.count(),
        'total_candidates': User.objects.filter(role=UserRole.CANDIDATE).count(),
        'total_hr': User.objects.filter(role=UserRole.HR).count(),
        'total_companies': Company.objects.count(),
        'verified_companies': Company.objects.filter(is_verified=True).count(),
        'total_jobs': Job.objects.count(),
        'active_jobs': Job.objects.filter(status=JobStatus.ACTIVE).count(),
        'total_applications': Application.objects.count(),
        'total_hires': Application.objects.filter(status=ApplicationStatus.HIRED).count(),
        'signups_over_time': signups_list,
        'jobs_over_time': jobs_list,
        'top_companies_by_jobs': top_companies_list,
        'role_distribution': role_dist,
    }
    return Response(data)