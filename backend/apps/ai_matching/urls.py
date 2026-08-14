from django.urls import path
from .views import (
    evaluate_mock_interview,
    get_mock_interview_questions,
    match_score,
    recommended_jobs,
    top_candidates_for_job,
)

urlpatterns = [
    path('match-score/<int:job_id>/', match_score, name='match_score'),
    path('recommended-jobs/', recommended_jobs, name='recommended_jobs'),
    path('top-candidates/<int:job_id>/', top_candidates_for_job, name='top_candidates'),
    path('mock-interview/<slug:session_slug>/questions/', get_mock_interview_questions, name='mock_interview_questions'),
    path('mock-interview/<slug:session_slug>/evaluate/', evaluate_mock_interview, name='mock_interview_evaluate'),
]