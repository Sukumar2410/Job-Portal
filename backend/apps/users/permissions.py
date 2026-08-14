from rest_framework.permissions import BasePermission
from .models import UserRole


class IsCandidate(BasePermission):
    """Allows access only to Candidate users"""
    message = 'Only candidates can access this resource.'

    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.role == UserRole.CANDIDATE
        )


class IsHR(BasePermission):
    """Allows access only to HR/Company users"""
    message = 'Only HR users can access this resource.'

    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.role == UserRole.HR
        )


class IsSuperAdmin(BasePermission):
    """Allows access only to Super Admin users"""
    message = 'Only super admins can access this resource.'

    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.role == UserRole.SUPER_ADMIN
        )


class IsHROrSuperAdmin(BasePermission):
    """Allows access to HR or Super Admin users"""
    message = 'Only HR or super admins can access this resource.'

    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.role in [UserRole.HR, UserRole.SUPER_ADMIN]
        )


class IsOwnerOrReadOnly(BasePermission):
    """Object-level permission: only owners can edit their own objects"""

    def has_object_permission(self, request, view, obj):
        if request.method in ('GET', 'HEAD', 'OPTIONS'):
            return True
        # Check ownership - assumes object has 'user' attribute
        return hasattr(obj, 'user') and obj.user == request.user