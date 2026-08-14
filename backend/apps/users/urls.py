from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    RegisterView,
    LoginView,
    LogoutView,
    CurrentUserView,
    CandidateProfileView,
    HRProfileView,
    ChangePasswordView,
    ResumeUploadView,
    ResumeDeleteView,
    VerifyEmailView,
    ResendVerificationEmailView,
    ForgotPasswordView,
    ResetPasswordView,
    AdminUserViewSet,   # ✅ NEW
)

# Router for admin
router = DefaultRouter()
router.register(r'admin/users', AdminUserViewSet, basename='admin-user')

urlpatterns = [
    # Auth endpoints
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # Profile endpoints
    path('me/', CurrentUserView.as_view(), name='current_user'),
    path('candidate-profile/', CandidateProfileView.as_view(), name='candidate_profile'),
    path('hr-profile/', HRProfileView.as_view(), name='hr_profile'),
    path('change-password/', ChangePasswordView.as_view(), name='change_password'),

    # Resume management
    path('upload-resume/', ResumeUploadView.as_view(), name='upload_resume'),
    path('delete-resume/', ResumeDeleteView.as_view(), name='delete_resume'),

    # Email verification
    path('verify-email/', VerifyEmailView.as_view(), name='verify_email'),
    path('resend-verification/', ResendVerificationEmailView.as_view(), name='resend_verification'),

    # Password reset
    path('forgot-password/', ForgotPasswordView.as_view(), name='forgot_password'),
    path('reset-password/', ResetPasswordView.as_view(), name='reset_password'),

    # Admin routes
    path('', include(router.urls)),   # ✅ NEW
]