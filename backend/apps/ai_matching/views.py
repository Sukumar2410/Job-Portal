from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from apps.users.models import User, UserRole
from apps.users.permissions import IsCandidate, IsHR
from apps.jobs.models import Job, JobStatus
from .openai_client import fetch_mock_interview_questions, AI_PROMPT_SETS, score_mock_interview_responses
from .serializers import MockInterviewEvaluationSerializer
from .services import calculate_match_score


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def match_score(request, job_id):
    """
    GET /api/ai/match-score/<job_id>/
    Get match score between current candidate and a specific job.
    """
    if request.user.role != UserRole.CANDIDATE:
        return Response({'detail': 'Only candidates can check match scores.'},
                        status=status.HTTP_403_FORBIDDEN)

    try:
        job = Job.objects.get(pk=job_id, status=JobStatus.ACTIVE)
    except Job.DoesNotExist:
        return Response({'detail': 'Job not found or not active.'},
                        status=status.HTTP_404_NOT_FOUND)

    result = calculate_match_score(request.user, job)
    result['job_id'] = job.id
    result['job_title'] = job.title
    return Response(result)


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsCandidate])
def get_mock_interview_questions(request, session_slug):
    questions = fetch_mock_interview_questions(session_slug, getattr(request.user, 'candidate_profile', None))
    if questions is None:
        return Response({'detail': 'Assessment not found.'}, status=status.HTTP_404_NOT_FOUND)
    return Response(questions)


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsCandidate])
def evaluate_mock_interview(request, session_slug):
    questions = AI_PROMPT_SETS.get(session_slug)
    if questions is None:
        return Response({'detail': 'Assessment not found.'}, status=status.HTTP_404_NOT_FOUND)

    serializer = MockInterviewEvaluationSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    responses = serializer.validated_data['responses']
    result = score_mock_interview_responses(session_slug, responses, getattr(request.user, 'candidate_profile', None))
    return Response(result)


@api_view(['GET'])
@permission_classes([IsCandidate])
def recommended_jobs(request):
    """
    GET /api/ai/recommended-jobs/
    Return top N active jobs matched to the candidate, sorted by score.
    Query: ?limit=10
    """
    limit = int(request.query_params.get('limit', 10))
    profile = getattr(request.user, 'candidate_profile', None)

    if not profile or not profile.skills:
        return Response({
            'detail': 'Please complete your profile with skills to get recommendations.',
            'results': []
        })

    active_jobs = Job.objects.filter(
        status=JobStatus.ACTIVE,
        company__is_active=True
    ).select_related('company')[:200]  # Cap for performance

    scored = []
    for job in active_jobs:
        result = calculate_match_score(request.user, job)
        scored.append({
            'job_id': job.id,
            'job_slug': job.slug,
            'job_title': job.title,
            'company_name': job.company.name,
            'company_logo': job.company.logo.url if job.company.logo else None,
            'location': job.location,
            'work_mode': job.work_mode,
            'job_type': job.job_type,
            'min_salary': job.min_salary,
            'max_salary': job.max_salary,
            'match_score': result['total_score'],
            'matched_skills': result['matched_skills'],
            'missing_skills': result['missing_skills'],
        })

    scored.sort(key=lambda x: x['match_score'], reverse=True)
    return Response({'count': len(scored[:limit]), 'results': scored[:limit]})


@api_view(['GET'])
@permission_classes([IsHR])
def top_candidates_for_job(request, job_id):
    """
    GET /api/ai/top-candidates/<job_id>/
    Return top matching candidates for a job (based on all candidates in DB).
    Query: ?limit=10
    """
    limit = int(request.query_params.get('limit', 10))

    try:
        job = Job.objects.get(pk=job_id)
    except Job.DoesNotExist:
        return Response({'detail': 'Job not found.'}, status=status.HTTP_404_NOT_FOUND)

    # Verify HR owns this job
    hr_profile = getattr(request.user, 'hr_profile', None)
    if not hr_profile or hr_profile.company_id != job.company_id:
        return Response({'detail': 'You can only view candidates for your company\'s jobs.'},
                        status=status.HTTP_403_FORBIDDEN)

    candidates = User.objects.filter(
        role=UserRole.CANDIDATE,
        is_active=True,
        candidate_profile__isnull=False,
    ).select_related('candidate_profile')[:500]  # Cap for performance

    scored = []
    for candidate in candidates:
        profile = getattr(candidate, 'candidate_profile', None)
        if not profile or not profile.skills:
            continue

        result = calculate_match_score(candidate, job)
        if result['total_score'] < 20:  # Filter very low matches
            continue

        scored.append({
            'candidate_id': candidate.id,
            'email': candidate.email,
            'full_name': candidate.full_name,
            'headline': profile.headline,
            'experience_years': profile.experience_years,
            'current_location': profile.current_location,
            'match_score': result['total_score'],
            'matched_skills': result['matched_skills'],
            'missing_skills': result['missing_skills'],
        })

    scored.sort(key=lambda x: x['match_score'], reverse=True)
    return Response({
        'job_id': job.id,
        'job_title': job.title,
        'count': len(scored[:limit]),
        'results': scored[:limit]
    })