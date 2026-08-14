from rest_framework import viewsets, status, filters, generics
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q, F

from apps.users.permissions import IsHR, IsCandidate, IsHROrSuperAdmin
from apps.users.models import UserRole
from .models import Job, JobStatus, SavedJob
from .serializers import JobListSerializer, JobDetailSerializer, SavedJobSerializer

from apps.payments.subscription_service import (
    validate_job_post,
    update_job_post_usage,
    can_feature_job,
    feature_job,
    unfeature_job,
)


class JobViewSet(viewsets.ModelViewSet):
    """
    Full CRUD for Jobs.
    - List: All authenticated users see ACTIVE jobs (unless HR/Admin who see their own)
    - Create/Update/Delete: HR only (their company's jobs) or Super Admin
    """
    lookup_field = 'slug'
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['job_type', 'work_mode', 'experience_level', 'status', 'company', 'is_featured']
    search_fields = ['title', 'description', 'skills_required', 'location', 'company__name']
    ordering_fields = ['posted_at', 'created_at', 'views_count', 'applications_count']

    def get_queryset(self):
        user = self.request.user

        # HR sees only their company's jobs
        if user.role == UserRole.HR:
            hr_profile = getattr(user, 'hr_profile', None)
            if hr_profile and hr_profile.company:
                return Job.objects.filter(company=hr_profile.company).select_related('company', 'posted_by')
            return Job.objects.none()

        # Super Admin sees all jobs
        if user.role == UserRole.SUPER_ADMIN:
            return Job.objects.all().select_related('company', 'posted_by')

        # Candidates only see ACTIVE jobs from active companies
        return Job.objects.filter(
            status=JobStatus.ACTIVE,
            company__is_active=True
        ).select_related('company', 'posted_by')

    def get_serializer_class(self):
        if self.action == 'list':
            return JobListSerializer
        return JobDetailSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve', 'save_job', 'unsave_job', 'saved_jobs']:
            return [IsAuthenticated()]
        elif self.action in ['create', 'update', 'partial_update', 'destroy',
                             'activate', 'pause', 'close']:
            return [IsHROrSuperAdmin()]
        return [IsAuthenticated()]

    def perform_create(self, serializer):
        user = self.request.user
        hr_profile = getattr(user, "hr_profile", None)

        if not hr_profile or not hr_profile.company:
            raise ValidationError({
                "company": "You must be linked to a company to post jobs."
            })

        company = hr_profile.company

        # Validate whether another job can be posted
        allowed, message = validate_job_post(company)

        if not allowed:
            raise ValidationError({
                "quota": message
            })

        # Create the job
        job = serializer.save(
            company=company,
            posted_by=user,
        )

        # Update subscription usage
        update_job_post_usage(company)

        return job

    def destroy(self, request, *args, **kwargs):
        job = self.get_object()
        company = job.company

        response = super().destroy(request, *args, **kwargs)

        update_job_post_usage(company)

        return response

    def update(self, request, *args, **kwargs):
        job = self.get_object()
        if request.user.role == UserRole.HR:
            hr_profile = getattr(request.user, 'hr_profile', None)
            if not hr_profile or hr_profile.company_id != job.company_id:
                return Response(
                    {'detail': 'You can only update jobs of your own company.'},
                    status=status.HTTP_403_FORBIDDEN
                )
        return super().update(request, *args, **kwargs)

    def retrieve(self, request, *args, **kwargs):
        """Increment views_count on retrieve (only for candidates)"""
        instance = self.get_object()
        if request.user.role == UserRole.CANDIDATE:
            Job.objects.filter(pk=instance.pk).update(views_count=F('views_count') + 1)
            instance.refresh_from_db()
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    # ---------- Status Actions (HR only) ----------
    @action(detail=True, methods=['post'])
    def activate(self, request, slug=None):
        job = self.get_object()
        job.status = JobStatus.ACTIVE
        job.save()

        update_job_post_usage(job.company)

        return Response({
            'message': 'Job activated.',
            'status': job.status
        })

    @action(detail=True, methods=['post'])
    def pause(self, request, slug=None):
        job = self.get_object()
        job.status = JobStatus.PAUSED
        job.save()

        update_job_post_usage(job.company)

        return Response({
            'message': 'Job paused.',
            'status': job.status
        })

    @action(detail=True, methods=['post'])
    def close(self, request, slug=None):
        job = self.get_object()
        job.status = JobStatus.CLOSED
        job.save()

        update_job_post_usage(job.company)

        return Response({
            'message': 'Job closed.',
            'status': job.status
        })

    @action(detail=True, methods=['post'])
    def feature(self, request, slug=None):
        job = self.get_object()

        if job.is_featured:
            return Response(
                {"message": "Job is already featured."},
                status=status.HTTP_400_BAD_REQUEST
            )

        allowed, message = can_feature_job(job.company)

        if not allowed:
            return Response(
                {"detail": message},
                status=status.HTTP_400_BAD_REQUEST
            )

        success, message = feature_job(job.company)

        if not success:
            return Response(
                {"detail": message},
                status=status.HTTP_400_BAD_REQUEST
            )

        job.is_featured = True
        job.save(update_fields=["is_featured"])

        return Response({
            "message": "Job marked as featured.",
            "is_featured": True
        })

    @action(detail=True, methods=['post'])
    def unfeature(self, request, slug=None):
        job = self.get_object()

        if not job.is_featured:
            return Response(
                {"message": "Job is not featured."},
                status=status.HTTP_400_BAD_REQUEST
            )

        unfeature_job(job.company)

        job.is_featured = False
        job.save(update_fields=["is_featured"])

        return Response({
            "message": "Job is no longer featured.",
            "is_featured": False
        })

    # ---------- Candidate Actions ----------
    @action(detail=True, methods=['post'], url_path='save', permission_classes=[IsCandidate])
    def save_job(self, request, slug=None):
        """POST /api/jobs/{slug}/save/ - Save a job (Candidate only)"""
        job = self.get_object()
        saved, created = SavedJob.objects.get_or_create(candidate=request.user, job=job)
        if not created:
            return Response({'message': 'Job already saved.'}, status=status.HTTP_200_OK)
        return Response({'message': 'Job saved successfully.'}, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['delete'], url_path='unsave', permission_classes=[IsCandidate])
    def unsave_job(self, request, slug=None):
        """DELETE /api/jobs/{slug}/unsave/ - Unsave a job"""
        job = self.get_object()
        deleted, _ = SavedJob.objects.filter(candidate=request.user, job=job).delete()
        if deleted:
            return Response({'message': 'Job removed from saved.'}, status=status.HTTP_200_OK)
        return Response({'message': 'Job was not saved.'}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=False, methods=['get'], url_path='saved', permission_classes=[IsCandidate])
    def saved_jobs(self, request):
        """GET /api/jobs/saved/ - List all saved jobs of the logged-in candidate"""
        saved = SavedJob.objects.filter(candidate=request.user).select_related('job', 'job__company')
        serializer = SavedJobSerializer(saved, many=True, context={'request': request})
        return Response(serializer.data)