from django.db.models import Q
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema, OpenApiParameter, OpenApiTypes

from apps.users.models import User, UserRole
from apps.jobs.models import Job, JobStatus
from apps.companies.models import Company
from .serializers import (
    JobSearchResultSerializer,
    CompanySearchResultSerializer,
    CandidateSearchResultSerializer,
)


VALID_TYPES = {'all', 'jobs', 'companies', 'candidates'}


@extend_schema(
    summary='Global Search',
    description=(
        'Search across jobs, companies, and candidates in a single request. '
        'Results are filtered by role-based access:\n\n'
        '- **Candidate**: Jobs + Companies\n'
        '- **HR**: Own company Jobs + Companies + Candidates\n'
        '- **Super Admin**: Everything'
    ),
    parameters=[
        OpenApiParameter(
            name='q',
            type=OpenApiTypes.STR,
            location=OpenApiParameter.QUERY,
            required=True,
            description='Search term (e.g. "django", "bangalore", "python")',
        ),
        OpenApiParameter(
            name='type',
            type=OpenApiTypes.STR,
            location=OpenApiParameter.QUERY,
            required=False,
            description='Filter by result type. Options: all, jobs, companies, candidates',
            enum=['all', 'jobs', 'companies', 'candidates'],
            default='all',
        ),
        OpenApiParameter(
            name='limit',
            type=OpenApiTypes.INT,
            location=OpenApiParameter.QUERY,
            required=False,
            description='Max results per category (1-50). Default: 10',
            default=10,
        ),
    ],
    responses={200: OpenApiTypes.OBJECT},
    tags=['Search'],
)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def global_search(request):
    """
    GET /api/search/?q=<query>&type=<all|jobs|companies|candidates>&limit=10

    Global search across jobs, companies, and candidates.
    Results are filtered by role-based access.
    """
    query = request.query_params.get('q', '').strip()
    search_type = request.query_params.get('type', 'all').lower()
    try:
        limit = int(request.query_params.get('limit', 10))
    except (TypeError, ValueError):
        limit = 10
    limit = max(1, min(limit, 50))  # Clamp 1-50

    if not query:
        return Response({
            'query': '',
            'results': {'jobs': [], 'companies': [], 'candidates': []},
            'total_count': 0,
            'message': 'Please provide a search query using ?q=<term>',
        })

    if search_type not in VALID_TYPES:
        return Response({
            'error': f'Invalid type. Must be one of: {", ".join(VALID_TYPES)}',
        }, status=400)

    user = request.user
    results = {'jobs': [], 'companies': [], 'candidates': []}
    counts = {'jobs': 0, 'companies': 0, 'candidates': 0}

    # ==================== JOBS ====================
    if search_type in ('all', 'jobs'):
        jobs_qs = _search_jobs(user, query)
        counts['jobs'] = jobs_qs.count()
        jobs_page = jobs_qs[:limit]
        results['jobs'] = JobSearchResultSerializer(
            jobs_page, many=True, context={'request': request}
        ).data

    # ==================== COMPANIES ====================
    if search_type in ('all', 'companies'):
        companies_qs = _search_companies(user, query)
        counts['companies'] = companies_qs.count()
        companies_page = companies_qs[:limit]
        results['companies'] = CompanySearchResultSerializer(
            companies_page, many=True, context={'request': request}
        ).data

    # ==================== CANDIDATES ====================
    if search_type in ('all', 'candidates'):
        # Only HR and Super Admin can search candidates
        if user.role in (UserRole.HR, UserRole.SUPER_ADMIN):
            candidates_qs = _search_candidates(query)
            counts['candidates'] = candidates_qs.count()
            candidates_page = candidates_qs[:limit]
            results['candidates'] = CandidateSearchResultSerializer(
                candidates_page, many=True, context={'request': request}
            ).data

    total = counts['jobs'] + counts['companies'] + counts['candidates']

    return Response({
        'query': query,
        'type': search_type,
        'total_count': total,
        'counts': counts,
        'results': results,
    })


# ==================== Helpers ====================

def _search_jobs(user, query):
    """Return searchable jobs based on user role"""
    base_filter = Q(title__icontains=query) | \
                  Q(description__icontains=query) | \
                  Q(skills_required__icontains=query) | \
                  Q(location__icontains=query) | \
                  Q(company__name__icontains=query)

    if user.role == UserRole.CANDIDATE:
        return Job.objects.filter(
            base_filter,
            status=JobStatus.ACTIVE,
            company__is_active=True,
        ).select_related('company').distinct()

    if user.role == UserRole.HR:
        hr_profile = getattr(user, 'hr_profile', None)
        if hr_profile and hr_profile.company:
            return Job.objects.filter(
                base_filter,
                company=hr_profile.company,
            ).select_related('company').distinct()
        return Job.objects.none()

    # SUPER_ADMIN
    return Job.objects.filter(base_filter).select_related('company').distinct()


def _search_companies(user, query):
    """Return searchable companies based on user role"""
    base_filter = Q(name__icontains=query) | \
                  Q(industry__icontains=query) | \
                  Q(headquarters__icontains=query) | \
                  Q(description__icontains=query)

    if user.role == UserRole.SUPER_ADMIN:
        return Company.objects.filter(base_filter).distinct()

    # Candidates and HR see only active companies
    return Company.objects.filter(base_filter, is_active=True).distinct()


def _search_candidates(query):
    """Search candidates by name, email, headline, skills, location"""
    return User.objects.filter(
        Q(first_name__icontains=query) |
        Q(last_name__icontains=query) |
        Q(email__icontains=query) |
        Q(candidate_profile__headline__icontains=query) |
        Q(candidate_profile__skills__icontains=query) |
        Q(candidate_profile__current_location__icontains=query),
        role=UserRole.CANDIDATE,
        is_active=True,
    ).select_related('candidate_profile').distinct()