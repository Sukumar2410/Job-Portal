from django.shortcuts import render

# Create your views here.
from rest_framework import status, generics, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.parsers import MultiPartParser, FormParser
from drf_spectacular.utils import extend_schema, OpenApiTypes
from rest_framework import viewsets
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters as drf_filters
from rest_framework.decorators import action

from .models import User, CandidateProfile, HRProfile, UserRole
from .serializers import (
    UserRegistrationSerializer,
    CustomTokenObtainPairSerializer,
    UserSerializer,
    CandidateProfileSerializer,
    HRProfileSerializer,
    ChangePasswordSerializer,
)


class RegisterView(generics.CreateAPIView):
    """POST /api/auth/register/ - Register a new Candidate or HR user"""
    queryset = User.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        # Generate JWT tokens on successful registration
        refresh = RefreshToken.for_user(user)
        refresh['email'] = user.email
        refresh['role'] = user.role
        refresh['full_name'] = user.full_name

        # Create email verification token & send email
        from .models import EmailVerificationToken
        from .emails import send_verification_email
        verify_token = EmailVerificationToken.objects.create(user=user)
        try:
            send_verification_email(user, verify_token.token)
        except Exception as e:
            # Log but don't fail registration
            print(f'[Email Warning] Failed to send verification email: {e}')

        return Response({
            'message': 'Registration successful. Please check your email to verify your account.',
            'user': UserSerializer(user).data,
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }
        }, status=status.HTTP_201_CREATED)


class LoginView(TokenObtainPairView):
    """POST /api/auth/login/ - Login and receive JWT tokens"""
    serializer_class = CustomTokenObtainPairSerializer
    permission_classes = [AllowAny]


class LogoutView(APIView):
    """POST /api/auth/logout/ - Blacklist refresh token"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data.get('refresh')
            if not refresh_token:
                return Response({'error': 'Refresh token is required.'},
                                status=status.HTTP_400_BAD_REQUEST)
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response({'message': 'Logout successful'}, status=status.HTTP_205_RESET_CONTENT)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class CurrentUserView(generics.RetrieveUpdateAPIView):
    """GET/PATCH /api/auth/me/ - Get or update the logged-in user's basic info"""
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user


class CandidateProfileView(generics.RetrieveUpdateAPIView):
    """GET/PATCH /api/auth/candidate-profile/ - Manage candidate profile"""
    serializer_class = CandidateProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        if self.request.user.role != UserRole.CANDIDATE:
            self.permission_denied(self.request, message='Only candidates can access this.')
        profile, _ = CandidateProfile.objects.get_or_create(user=self.request.user)
        return profile


class HRProfileView(generics.RetrieveUpdateAPIView):
    """GET/PATCH /api/auth/hr-profile/ - Manage HR profile"""
    serializer_class = HRProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        if self.request.user.role != UserRole.HR:
            self.permission_denied(self.request, message='Only HR users can access this.')
        profile, _ = HRProfile.objects.get_or_create(user=self.request.user)
        return profile


class ChangePasswordView(generics.UpdateAPIView):
    """PATCH /api/auth/change-password/ - Change password for logged-in user"""
    serializer_class = ChangePasswordSerializer
    permission_classes = [IsAuthenticated]

    def update(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        request.user.set_password(serializer.validated_data['new_password'])
        request.user.save()
        return Response({'message': 'Password changed successfully'}, status=status.HTTP_200_OK)
    
class ResumeUploadView(APIView):
    """
    POST /api/auth/upload-resume/
    Upload/replace resume for the logged-in candidate.
    """
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    @extend_schema(
        summary='Upload Resume',
        description=(
            'Upload or replace resume for the logged-in candidate.\n\n'
            '**Allowed file types:** PDF, DOC, DOCX\n'
            '**Max size:** 5 MB\n\n'
            'Only accessible to users with CANDIDATE role.'
        ),
        request={
            'multipart/form-data': {
                'type': 'object',
                'properties': {
                    'resume': {
                        'type': 'string',
                        'format': 'binary',
                        'description': 'Resume file (PDF/DOC/DOCX, max 5MB)',
                    },
                },
                'required': ['resume'],
            },
        },
        responses={
            200: OpenApiTypes.OBJECT,
            400: OpenApiTypes.OBJECT,
            403: OpenApiTypes.OBJECT,
        },
        tags=['Auth - Resume'],
    )
    def post(self, request):
        if request.user.role != UserRole.CANDIDATE:
            return Response(
                {'detail': 'Only candidates can upload resumes.'},
                status=status.HTTP_403_FORBIDDEN
            )

        from .serializers import ResumeUploadSerializer
        serializer = ResumeUploadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        resume_file = serializer.validated_data['resume']

        # Get or create candidate profile
        profile, _ = CandidateProfile.objects.get_or_create(user=request.user)

        # Delete old resume file (to save space)
        if profile.resume:
            try:
                profile.resume.delete(save=False)
            except Exception:
                pass  # File might already be missing

        # Save new resume
        profile.resume = resume_file
        profile.save()

        return Response({
            'message': 'Resume uploaded successfully.',
            'resume_url': request.build_absolute_uri(profile.resume.url),
            'file_name': resume_file.name,
            'file_size_kb': round(resume_file.size / 1024, 2),
        }, status=status.HTTP_200_OK)


class ResumeDeleteView(APIView):
    """
    DELETE /api/auth/delete-resume/
    Remove resume from candidate profile.
    """
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary='Delete Resume',
        description='Remove the resume from the logged-in candidate\'s profile.',
        responses={
            200: OpenApiTypes.OBJECT,
            403: OpenApiTypes.OBJECT,
            404: OpenApiTypes.OBJECT,
        },
        tags=['Auth - Resume'],
    )
    def delete(self, request):
        if request.user.role != UserRole.CANDIDATE:
            return Response(
                {'detail': 'Only candidates can delete resumes.'},
                status=status.HTTP_403_FORBIDDEN
            )

        profile = getattr(request.user, 'candidate_profile', None)
        if not profile or not profile.resume:
            return Response({'detail': 'No resume to delete.'},
                            status=status.HTTP_404_NOT_FOUND)

        try:
            profile.resume.delete(save=False)
        except Exception:
            pass

        profile.resume = None
        profile.save()

        return Response({'message': 'Resume deleted successfully.'})
    
class VerifyEmailView(APIView):
    """
    POST /api/auth/verify-email/
    Verify email using the token sent via email.
    """
    permission_classes = [AllowAny]

    @extend_schema(
        summary='Verify Email',
        description='Verify a user\'s email address using the token sent via email.',
        request={
            'application/json': {
                'type': 'object',
                'properties': {
                    'token': {'type': 'string', 'description': 'Verification token'},
                },
                'required': ['token'],
            },
        },
        responses={200: OpenApiTypes.OBJECT, 400: OpenApiTypes.OBJECT},
        tags=['Auth - Email'],
    )
    def post(self, request):
        token_str = request.data.get('token', '').strip()
        if not token_str:
            return Response({'detail': 'Token is required.'},
                            status=status.HTTP_400_BAD_REQUEST)

        from .models import EmailVerificationToken
        try:
            token_obj = EmailVerificationToken.objects.select_related('user').get(token=token_str)
        except EmailVerificationToken.DoesNotExist:
            return Response({'detail': 'Invalid or expired token.'},
                            status=status.HTTP_400_BAD_REQUEST)

        if token_obj.is_used:
            return Response({'detail': 'This token has already been used.'},
                            status=status.HTTP_400_BAD_REQUEST)

        if token_obj.is_expired:
            return Response({'detail': 'This token has expired. Please request a new one.'},
                            status=status.HTTP_400_BAD_REQUEST)

        # Mark user as verified
        user = token_obj.user
        user.is_verified = True
        user.save(update_fields=['is_verified'])

        # Mark token as used
        from django.utils import timezone
        token_obj.is_used = True
        token_obj.used_at = timezone.now()
        token_obj.save(update_fields=['is_used', 'used_at'])

        return Response({
            'message': 'Email verified successfully.',
            'user': UserSerializer(user).data,
        })


class ResendVerificationEmailView(APIView):
    """
    POST /api/auth/resend-verification/
    Resend the email verification link.
    """
    permission_classes = [AllowAny]

    @extend_schema(
        summary='Resend Verification Email',
        description='Request a new verification email if the previous one expired or was lost.',
        request={
            'application/json': {
                'type': 'object',
                'properties': {
                    'email': {'type': 'string', 'format': 'email'},
                },
                'required': ['email'],
            },
        },
        responses={200: OpenApiTypes.OBJECT},
        tags=['Auth - Email'],
    )
    def post(self, request):
        email = request.data.get('email', '').strip().lower()
        if not email:
            return Response({'detail': 'Email is required.'},
                            status=status.HTTP_400_BAD_REQUEST)

        # Silent success even if user not found (prevents email enumeration)
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({
                'message': 'If an account with that email exists, a verification link has been sent.'
            })

        if user.is_verified:
            return Response({'detail': 'This account is already verified.'})

        from .models import EmailVerificationToken
        from .emails import send_verification_email

        # Invalidate old tokens
        EmailVerificationToken.objects.filter(user=user, is_used=False).update(is_used=True)

        # Create fresh token & send
        token_obj = EmailVerificationToken.objects.create(user=user)
        try:
            send_verification_email(user, token_obj.token)
        except Exception as e:
            print(f'[Email Warning] Failed to send verification email: {e}')

        return Response({
            'message': 'If an account with that email exists, a verification link has been sent.'
        })
    
class ForgotPasswordView(APIView):
    """
    POST /api/auth/forgot-password/
    Request a password reset link via email.
    """
    permission_classes = [AllowAny]

    @extend_schema(
        summary='Forgot Password',
        description=(
            'Request a password reset link. Response is always success '
            '(regardless of whether email exists) to prevent email enumeration.'
        ),
        request={
            'application/json': {
                'type': 'object',
                'properties': {
                    'email': {'type': 'string', 'format': 'email'},
                },
                'required': ['email'],
            },
        },
        responses={200: OpenApiTypes.OBJECT},
        tags=['Auth - Password'],
    )
    def post(self, request):
        email = request.data.get('email', '').strip().lower()
        if not email:
            return Response({'detail': 'Email is required.'},
                            status=status.HTTP_400_BAD_REQUEST)

        # Always return success to prevent email enumeration attacks
        response_message = {
            'message': 'If an account with that email exists, a password reset link has been sent.'
        }

        try:
            user = User.objects.get(email=email, is_active=True)
        except User.DoesNotExist:
            return Response(response_message)

        from .models import PasswordResetToken
        from .emails import send_password_reset_email

        # Invalidate any previous unused tokens
        PasswordResetToken.objects.filter(user=user, is_used=False).update(is_used=True)

        # Create new token
        ip = request.META.get('HTTP_X_FORWARDED_FOR', '').split(',')[0].strip() or \
             request.META.get('REMOTE_ADDR')
        token_obj = PasswordResetToken.objects.create(user=user, ip_address=ip)

        try:
            send_password_reset_email(user, token_obj.token)
        except Exception as e:
            print(f'[Email Warning] Failed to send password reset email: {e}')

        return Response(response_message)


class ResetPasswordView(APIView):
    """
    POST /api/auth/reset-password/
    Reset password using the token from email.
    """
    permission_classes = [AllowAny]

    @extend_schema(
        summary='Reset Password',
        description='Set a new password using the token received via email.',
        request={
            'application/json': {
                'type': 'object',
                'properties': {
                    'token': {'type': 'string'},
                    'new_password': {'type': 'string', 'format': 'password'},
                    'confirm_password': {'type': 'string', 'format': 'password'},
                },
                'required': ['token', 'new_password', 'confirm_password'],
            },
        },
        responses={200: OpenApiTypes.OBJECT, 400: OpenApiTypes.OBJECT},
        tags=['Auth - Password'],
    )
    def post(self, request):
        from django.contrib.auth.password_validation import validate_password
        from django.core.exceptions import ValidationError as DjangoValidationError

        token_str = request.data.get('token', '').strip()
        new_password = request.data.get('new_password', '')
        confirm_password = request.data.get('confirm_password', '')

        if not token_str or not new_password or not confirm_password:
            return Response({'detail': 'token, new_password and confirm_password are required.'},
                            status=status.HTTP_400_BAD_REQUEST)

        if new_password != confirm_password:
            return Response({'detail': 'Passwords do not match.'},
                            status=status.HTTP_400_BAD_REQUEST)

        from .models import PasswordResetToken
        try:
            token_obj = PasswordResetToken.objects.select_related('user').get(token=token_str)
        except PasswordResetToken.DoesNotExist:
            return Response({'detail': 'Invalid or expired token.'},
                            status=status.HTTP_400_BAD_REQUEST)

        if token_obj.is_used:
            return Response({'detail': 'This token has already been used.'},
                            status=status.HTTP_400_BAD_REQUEST)

        if token_obj.is_expired:
            return Response({'detail': 'This token has expired. Please request a new one.'},
                            status=status.HTTP_400_BAD_REQUEST)

        user = token_obj.user

        # Validate new password
        try:
            validate_password(new_password, user=user)
        except DjangoValidationError as e:
            return Response({'detail': list(e.messages)},
                            status=status.HTTP_400_BAD_REQUEST)

        # Set new password
        user.set_password(new_password)
        user.save(update_fields=['password'])

        # Mark token as used
        from django.utils import timezone
        token_obj.is_used = True
        token_obj.used_at = timezone.now()
        token_obj.save(update_fields=['is_used', 'used_at'])

        # Invalidate any other pending tokens for this user
        PasswordResetToken.objects.filter(user=user, is_used=False).update(is_used=True)

        # Log to audit trail
        from apps.audit_logs.services import log_action
        from apps.audit_logs.models import AuditAction, AuditSeverity
        log_action(
            action=AuditAction.PASSWORD_CHANGED,
            actor=user,
            target=user,
            description=f'{user.email} reset password via email link',
            severity=AuditSeverity.WARNING,
            request=request,
        )

        return Response({'message': 'Password reset successfully. You can now log in with your new password.'})

class AdminUserViewSet(viewsets.ModelViewSet):
    """
    Super Admin only — full CRUD on users.
    - GET /api/auth/admin/users/            → List all users
    - GET /api/auth/admin/users/{id}/       → User detail
    - PATCH /api/auth/admin/users/{id}/     → Update user (activate/verify)
    - POST /api/auth/admin/users/{id}/activate/    → Activate user
    - POST /api/auth/admin/users/{id}/deactivate/  → Deactivate user
    - POST /api/auth/admin/users/{id}/verify/      → Verify user
    """
    queryset = User.objects.all().order_by('-date_joined')
    serializer_class = UserSerializer

    filter_backends = [DjangoFilterBackend, drf_filters.SearchFilter, drf_filters.OrderingFilter]
    filterset_fields = ['role', 'is_active', 'is_verified']
    search_fields = ['email', 'first_name', 'last_name', 'phone']
    ordering_fields = ['date_joined', 'email', 'role']

    def get_permissions(self):
        from apps.users.permissions import IsSuperAdmin
        return [IsSuperAdmin()]

    @extend_schema(
        summary='Activate User',
        responses={200: OpenApiTypes.OBJECT},
        tags=['Admin - Users'],
    )
    @action(detail=True, methods=['post'])
    def activate(self, request, pk=None):
        user = self.get_object()
        user.is_active = True
        user.save(update_fields=['is_active'])
        return Response({
            'message': f'{user.email} activated.',
            'user': UserSerializer(user).data
        })

    @extend_schema(
        summary='Deactivate User',
        responses={200: OpenApiTypes.OBJECT},
        tags=['Admin - Users'],
    )
    @action(detail=True, methods=['post'])
    def deactivate(self, request, pk=None):
        user = self.get_object()
        # Prevent deactivating super admins by other super admins
        if user.role == UserRole.SUPER_ADMIN and user.id != request.user.id:
            # Actually allow, but log warning
            pass
        # Prevent self-deactivation
        if user.id == request.user.id:
            return Response({'detail': 'You cannot deactivate yourself.'},
                            status=status.HTTP_400_BAD_REQUEST)
        user.is_active = False
        user.save(update_fields=['is_active'])
        return Response({
            'message': f'{user.email} deactivated.',
            'user': UserSerializer(user).data
        })

    @extend_schema(
        summary='Verify User',
        responses={200: OpenApiTypes.OBJECT},
        tags=['Admin - Users'],
    )
    @action(detail=True, methods=['post'])
    def verify(self, request, pk=None):
        user = self.get_object()
        user.is_verified = True
        user.save(update_fields=['is_verified'])
        return Response({
            'message': f'{user.email} verified.',
            'user': UserSerializer(user).data
        })