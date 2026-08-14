import os
import mimetypes
from django.http import FileResponse, Http404
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import F
from django.utils import timezone
from drf_spectacular.utils import extend_schema, OpenApiTypes, OpenApiParameter

from apps.users.permissions import IsCandidate, IsHR, IsHROrSuperAdmin
from apps.users.models import UserRole
from apps.jobs.models import Job
from .models import Application, ApplicationStatus, ApplicationStatusHistory, Interview
from .serializers import (
    ApplicationCreateSerializer,
    ApplicationListSerializer,
    ApplicationDetailSerializer,
    ApplicationStatusUpdateSerializer,
    InterviewSerializer,
    InterviewCreateSerializer,
)


class ApplicationViewSet(viewsets.ModelViewSet):
    """
    - Candidate: List/create their own applications, withdraw
    - HR: List applications for their company's jobs, update status
    - Super Admin: View all
    """
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'job']
    search_fields = ['candidate__email', 'candidate__first_name', 'candidate__last_name', 'job__title']
    ordering_fields = ['applied_at', 'updated_at', 'rating']

    def get_queryset(self):
        user = self.request.user
        qs = Application.objects.select_related('job', 'job__company', 'candidate')

        if user.role == UserRole.CANDIDATE:
            return qs.filter(candidate=user)

        if user.role == UserRole.HR:
            hr_profile = getattr(user, 'hr_profile', None)
            if hr_profile and hr_profile.company:
                return qs.filter(job__company=hr_profile.company)
            return Application.objects.none()

        if user.role == UserRole.SUPER_ADMIN:
            return qs.all()

        return Application.objects.none()

    def get_serializer_class(self):
        if self.action == 'create':
            return ApplicationCreateSerializer
        if self.action == 'list':
            return ApplicationListSerializer
        return ApplicationDetailSerializer

    def get_permissions(self):
        if self.action == 'create':
            return [IsCandidate()]
        if self.action == 'withdraw':
            return [IsCandidate()]
        if self.action in ['update_status', 'add_note']:
            return [IsHR()]
        return [IsAuthenticated()]

    def perform_create(self, serializer):
        user = self.request.user
        # If no resume in application, fallback to profile resume
        candidate_profile = getattr(user, 'candidate_profile', None)
        resume = serializer.validated_data.get('resume_snapshot')
        if not resume and candidate_profile and candidate_profile.resume:
            application = serializer.save(
                candidate=user,
                resume_snapshot=candidate_profile.resume
            )
        else:
            application = serializer.save(candidate=user)

        # Increment applications_count on the job
        Job.objects.filter(pk=application.job.pk).update(
            applications_count=F('applications_count') + 1
        )

        # Create initial status history
        ApplicationStatusHistory.objects.create(
            application=application,
            from_status='',
            to_status=ApplicationStatus.APPLIED,
            changed_by=user,
            note='Application submitted'
        )

    # ---------- Candidate Actions ----------
    @action(detail=True, methods=['post'])
    def withdraw(self, request, pk=None):
        """POST /api/applications/{id}/withdraw/ - Candidate withdraws"""
        application = self.get_object()
        if application.candidate != request.user:
            return Response(
                {'detail': 'You can only withdraw your own applications.'},
                status=status.HTTP_403_FORBIDDEN
            )
        if application.status in [ApplicationStatus.HIRED, ApplicationStatus.REJECTED,
                                   ApplicationStatus.WITHDRAWN]:
            return Response(
                {'detail': f'Cannot withdraw an application with status {application.status}.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        old_status = application.status
        application.status = ApplicationStatus.WITHDRAWN
        application.status_changed_at = timezone.now()
        application.save()

        ApplicationStatusHistory.objects.create(
            application=application,
            from_status=old_status,
            to_status=ApplicationStatus.WITHDRAWN,
            changed_by=request.user,
            note=request.data.get('reason', 'Withdrawn by candidate')
        )
        return Response({'message': 'Application withdrawn successfully.'})

    # ---------- HR Actions ----------
    @action(detail=True, methods=['post'], url_path='update-status')
    def update_status(self, request, pk=None):
        """POST /api/applications/{id}/update-status/ - HR updates status"""
        application = self.get_object()

        # Ensure HR belongs to the job's company
        hr_profile = getattr(request.user, 'hr_profile', None)
        if not hr_profile or hr_profile.company_id != application.job.company_id:
            return Response(
                {'detail': 'You cannot update applications for jobs of other companies.'},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = ApplicationStatusUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        new_status = serializer.validated_data['status']
        note = serializer.validated_data.get('note', '')
        rejection_reason = serializer.validated_data.get('rejection_reason', '')
        rating = serializer.validated_data.get('rating')

        old_status = application.status
        application.status = new_status
        application.status_changed_at = timezone.now()
        if rejection_reason:
            application.rejection_reason = rejection_reason
        if rating is not None:
            application.rating = rating
        application.save()

        ApplicationStatusHistory.objects.create(
            application=application,
            from_status=old_status,
            to_status=new_status,
            changed_by=request.user,
            note=note
        )

        return Response({
            'message': f'Status updated from {old_status} to {new_status}.',
            'application': ApplicationDetailSerializer(application, context={'request': request}).data
        })

    @action(detail=True, methods=['post'], url_path='add-note')
    def add_note(self, request, pk=None):
        """POST /api/applications/{id}/add-note/ - HR adds internal note"""
        application = self.get_object()
        hr_profile = getattr(request.user, 'hr_profile', None)
        if not hr_profile or hr_profile.company_id != application.job.company_id:
            return Response({'detail': 'Forbidden.'}, status=status.HTTP_403_FORBIDDEN)

        note = request.data.get('note', '').strip()
        if not note:
            return Response({'detail': 'Note is required.'}, status=status.HTTP_400_BAD_REQUEST)

        existing = application.hr_notes or ''
        timestamp = timezone.now().strftime('%Y-%m-%d %H:%M')
        application.hr_notes = f'{existing}\n[{timestamp} - {request.user.email}]\n{note}\n'.strip()
        application.save()

        return Response({'message': 'Note added successfully.', 'hr_notes': application.hr_notes})
    
    @extend_schema(
        summary='Download Resume (HR/Admin only)',
        description=(
            'Download the resume attached to a specific application.\n\n'
            'Only HR of the job\'s company or Super Admin can download. '
            'The download action is auto-logged in audit logs.'
        ),
        responses={
            200: OpenApiTypes.BINARY,
            403: OpenApiTypes.OBJECT,
            404: OpenApiTypes.OBJECT,
        },
        tags=['Applications'],
    )
    @action(detail=True, methods=['get'], url_path='download-resume')
    def download_resume(self, request, pk=None):
        """
        GET /api/applications/{id}/download-resume/
        HR/Super Admin downloads the candidate's resume for this application.
        """
        application = self.get_object()

        # RBAC: HR must belong to the job's company; Super Admin allowed
        if request.user.role == UserRole.HR:
            hr_profile = getattr(request.user, 'hr_profile', None)
            if not hr_profile or hr_profile.company_id != application.job.company_id:
                return Response(
                    {'detail': 'You can only download resumes for your company\'s applications.'},
                    status=status.HTTP_403_FORBIDDEN
                )
        elif request.user.role != UserRole.SUPER_ADMIN:
            return Response(
                {'detail': 'Only HR or Super Admin can download resumes.'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Prefer application resume snapshot; fall back to profile resume
        resume_field = application.resume_snapshot
        if not resume_field:
            candidate_profile = getattr(application.candidate, 'candidate_profile', None)
            resume_field = candidate_profile.resume if candidate_profile else None

        if not resume_field or not resume_field.name:
            return Response(
                {'detail': 'No resume available for this application.'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Verify file exists on disk
        try:
            file_path = resume_field.path
        except (ValueError, NotImplementedError):
            file_path = None

        if not file_path or not os.path.exists(file_path):
            return Response(
                {'detail': 'Resume file not found on server.'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Log the download to audit trail
        from apps.audit_logs.services import log_action
        from apps.audit_logs.models import AuditAction
        log_action(
            action=AuditAction.RESUME_DOWNLOADED,
            actor=request.user,
            target=application,
            description=(
                f'{request.user.email} downloaded resume of '
                f'{application.candidate.email} for application #{application.id} '
                f'({application.job.title})'
            ),
            metadata={
                'candidate_id': application.candidate.id,
                'candidate_email': application.candidate.email,
                'job_id': application.job.id,
                'job_title': application.job.title,
            },
            request=request,
        )

        # Build the download filename: <CandidateName>_Resume<ext>
        original_name = os.path.basename(resume_field.name)
        ext = os.path.splitext(original_name)[1] or '.pdf'
        safe_name = application.candidate.full_name.replace(' ', '_') or 'Candidate'
        download_name = f'{safe_name}_Resume{ext}'

        # Guess content type
        content_type, _ = mimetypes.guess_type(file_path)
        content_type = content_type or 'application/octet-stream'

        response = FileResponse(
            open(file_path, 'rb'),
            content_type=content_type,
            as_attachment=True,
            filename=download_name,
        )
        return response
    
    @extend_schema(
        summary='List Resumes for a Job',
        description=(
            'Returns all applications for a job with download URLs for each resume. '
            'HR can only see jobs from their own company.'
        ),
        parameters=[
            OpenApiParameter(
                name='job_id',
                type=OpenApiTypes.INT,
                location=OpenApiParameter.PATH,
                required=True,
                description='ID of the job',
            ),
        ],
        responses={200: OpenApiTypes.OBJECT},
        tags=['Applications'],
    )
    @action(detail=False, methods=['get'], url_path='resumes-for-job/(?P<job_id>[^/.]+)')
    def resumes_for_job(self, request, job_id=None):
        """
        GET /api/applications/resumes-for-job/{job_id}/
        HR lists all resumes for applications on a specific job.
        Returns download URLs, not the files themselves.
        """
        if request.user.role not in [UserRole.HR, UserRole.SUPER_ADMIN]:
            return Response(
                {'detail': 'Only HR or Super Admin can access this.'},
                status=status.HTTP_403_FORBIDDEN
            )

        from apps.jobs.models import Job
        try:
            job = Job.objects.get(pk=job_id)
        except Job.DoesNotExist:
            return Response({'detail': 'Job not found.'}, status=status.HTTP_404_NOT_FOUND)

        # RBAC check
        if request.user.role == UserRole.HR:
            hr_profile = getattr(request.user, 'hr_profile', None)
            if not hr_profile or hr_profile.company_id != job.company_id:
                return Response(
                    {'detail': 'You can only view your company\'s jobs.'},
                    status=status.HTTP_403_FORBIDDEN
                )

        applications = Application.objects.filter(job=job).select_related(
            'candidate', 'candidate__candidate_profile'
        )

        results = []
        for app in applications:
            resume_field = app.resume_snapshot
            if not resume_field:
                profile = getattr(app.candidate, 'candidate_profile', None)
                resume_field = profile.resume if profile else None

            results.append({
                'application_id': app.id,
                'candidate_id': app.candidate.id,
                'candidate_name': app.candidate.full_name,
                'candidate_email': app.candidate.email,
                'status': app.status,
                'applied_at': app.applied_at,
                'has_resume': bool(resume_field and resume_field.name),
                'download_url': (
                    request.build_absolute_uri(
                        f'/api/applications/{app.id}/download-resume/'
                    )
                    if (resume_field and resume_field.name) else None
                ),
            })

        return Response({
            'job_id': job.id,
            'job_title': job.title,
            'total_applications': len(results),
            'applications': results,
        })

    @action(detail=False, methods=['get'], url_path='my-applications')
    def my_applications(self, request):
        """GET /api/applications/my-applications/ - Candidate's own applications"""
        if request.user.role != UserRole.CANDIDATE:
            return Response({'detail': 'Only candidates can access this.'},
                            status=status.HTTP_403_FORBIDDEN)
        applications = self.get_queryset()
        page = self.paginate_queryset(applications)
        if page is not None:
            serializer = ApplicationListSerializer(page, many=True, context={'request': request})
            return self.get_paginated_response(serializer.data)
        serializer = ApplicationListSerializer(applications, many=True, context={'request': request})
        return Response(serializer.data)


class InterviewViewSet(viewsets.ModelViewSet):
    """
    - HR: Schedule/manage interviews
    - Candidate: View their own interviews
    """
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['application', 'mode', 'is_completed']
    ordering_fields = ['scheduled_at', 'created_at']

    def get_queryset(self):
        user = self.request.user
        qs = Interview.objects.select_related('application', 'application__job', 'application__candidate')

        if user.role == UserRole.CANDIDATE:
            return qs.filter(application__candidate=user)

        if user.role == UserRole.HR:
            hr_profile = getattr(user, 'hr_profile', None)
            if hr_profile and hr_profile.company:
                return qs.filter(application__job__company=hr_profile.company)
            return Interview.objects.none()

        if user.role == UserRole.SUPER_ADMIN:
            return qs.all()

        return Interview.objects.none()

    def get_serializer_class(self):
        if self.action == 'create':
            return InterviewCreateSerializer
        return InterviewSerializer

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsHR()]
        return [IsAuthenticated()]

    def perform_create(self, serializer):
        application = serializer.validated_data['application']
        hr_profile = getattr(self.request.user, 'hr_profile', None)
        if not hr_profile or hr_profile.company_id != application.job.company_id:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied('You can only schedule interviews for your company\'s jobs.')

        interview = serializer.save(scheduled_by=self.request.user)

        # Auto-update application status to INTERVIEW_SCHEDULED
        old_status = application.status
        if application.status != ApplicationStatus.INTERVIEW_SCHEDULED:
            application.status = ApplicationStatus.INTERVIEW_SCHEDULED
            application.status_changed_at = timezone.now()
            application.save()

            ApplicationStatusHistory.objects.create(
                application=application,
                from_status=old_status,
                to_status=ApplicationStatus.INTERVIEW_SCHEDULED,
                changed_by=self.request.user,
                note=f'Interview scheduled: {interview.round_name} on {interview.scheduled_at}'
            )