from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend

from apps.users.permissions import IsHR, IsSuperAdmin, IsHROrSuperAdmin
from apps.users.models import UserRole, HRProfile
from .models import Company
from .serializers import CompanyListSerializer, CompanyDetailSerializer, CompanyAdminDetailSerializer


class CompanyViewSet(viewsets.ModelViewSet):
    """
    Full CRUD for Companies.
    - List/Retrieve: All authenticated users
    - Create: HR users only (creates their company)
    - Update: HR (own company) or Super Admin
    - Delete: Super Admin only
    - Verify: Super Admin only
    """
    queryset = Company.objects.filter(is_active=True)
    lookup_field = 'slug'
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['industry', 'company_size', 'is_verified']
    search_fields = ['name', 'industry', 'headquarters']
    ordering_fields = ['name', 'created_at']

    def get_serializer_class(self):
        if self.action == 'list':
            return CompanyListSerializer
        return CompanyDetailSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [IsAuthenticated()]
        elif self.action == 'create':
            return [IsHR()]
        elif self.action in ['update', 'partial_update']:
            return [IsHROrSuperAdmin()]
        elif self.action == 'destroy':
            return [IsSuperAdmin()]
        elif self.action in ['verify', 'unverify', 'all_companies', 'admin_details']:
            return [IsSuperAdmin()]
        elif self.action == 'my_company':
            return [IsHR()]
        return [IsAuthenticated()]

    def perform_create(self, serializer):
        company = serializer.save(created_by=self.request.user)
        # Auto-link the HR user to the company they just created
        hr_profile, _ = HRProfile.objects.get_or_create(user=self.request.user)
        hr_profile.company = company
        hr_profile.save()

    def update(self, request, *args, **kwargs):
        company = self.get_object()
        # HR can only update their own company
        if request.user.role == UserRole.HR:
            hr_profile = getattr(request.user, 'hr_profile', None)
            if not hr_profile or hr_profile.company_id != company.id:
                return Response(
                    {'detail': 'You can only update your own company.'},
                    status=status.HTTP_403_FORBIDDEN
                )
        return super().update(request, *args, **kwargs)

    @action(detail=False, methods=['get'], url_path='my-company')
    def my_company(self, request):
        """GET /api/companies/my-company/ - Get the HR user's company"""
        hr_profile = getattr(request.user, 'hr_profile', None)
        if not hr_profile or not hr_profile.company:
            return Response(
                {'detail': 'No company linked to your account.'},
                status=status.HTTP_404_NOT_FOUND
            )
        serializer = CompanyDetailSerializer(hr_profile.company, context={'request': request})
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def verify(self, request, slug=None):
        """POST /api/companies/{slug}/verify/ - Super Admin verifies a company"""
        company = self.get_object()
        company.is_verified = True
        company.save()
        return Response({'message': f'{company.name} has been verified.'})

    @action(detail=True, methods=['post'])
    def unverify(self, request, slug=None):
        """POST /api/companies/{slug}/unverify/"""
        company = self.get_object()
        company.is_verified = False
        company.save()
        return Response({'message': f'{company.name} verification revoked.'})

    @action(detail=False, methods=['get'], url_path='all')
    def all_companies(self, request):
        """GET /api/companies/all/ - Super Admin sees all (including inactive)"""
        companies = Company.objects.all()
        serializer = CompanyListSerializer(companies, many=True)
        return Response(serializer.data)

    @action(
        detail=True,
        methods=['get'],
        url_path='admin-details'
    )
    def admin_details(self, request, slug=None):
        """
        GET /api/companies/{slug}/admin-details/

        Returns complete company information and
        hiring/platform statistics for Super Admin.
        """

        company = self.get_object()

        serializer = CompanyAdminDetailSerializer(
            company,
            context={'request': request}
        )

        return Response(serializer.data)