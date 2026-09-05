from rest_framework import permissions
from .models import UserRole

class IsSuperAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == UserRole.SUPER_ADMIN)

class IsManagerOrAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role in [UserRole.SUPER_ADMIN, UserRole.MANAGER])

class IsSalesOrManager(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role in [UserRole.SUPER_ADMIN, UserRole.MANAGER, UserRole.SALES])

class IsProductionStaff(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role in [UserRole.SUPER_ADMIN, UserRole.MANAGER, UserRole.PRODUCTION])

class IsAccountant(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role in [UserRole.SUPER_ADMIN, UserRole.MANAGER, UserRole.ACCOUNTANT])

class IsStaffUser(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role != UserRole.CUSTOMER)

class IsOwnerOrStaff(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.role != UserRole.CUSTOMER:
            return True
        # Check customer ownership
        if hasattr(obj, 'customer'):
            return obj.customer == request.user
        if hasattr(obj, 'user'):
            return obj.user == request.user
        return False
