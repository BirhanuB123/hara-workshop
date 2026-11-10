from rest_framework import permissions
from .models import UserRole

class IsAdmin(permissions.BasePermission):
    """
    Allows access only to authenticated Admin users (role=ADMIN, is_superuser, or is_staff).
    """
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            (request.user.role == UserRole.ADMIN or request.user.is_superuser or request.user.is_staff)
        )

class IsCustomer(permissions.BasePermission):
    """
    Allows access only to authenticated Customer users.
    """
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.role == UserRole.CUSTOMER
        )

class IsOwnerOrAdmin(permissions.BasePermission):
    """
    Allows full access to Admins, and restricts Customers strictly to objects they own.
    """
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)

    def has_object_permission(self, request, view, obj):
        if not request.user or not request.user.is_authenticated:
            return False
        # Admins have full access to all objects
        if request.user.role == UserRole.ADMIN or request.user.is_superuser or request.user.is_staff:
            return True
        # Customer ownership validation
        if request.user.role == UserRole.CUSTOMER:
            if hasattr(obj, 'customer'):
                return obj.customer is not None and obj.customer == request.user
            if hasattr(obj, 'user'):
                return obj.user is not None and obj.user == request.user
            if hasattr(obj, 'order') and hasattr(obj.order, 'customer'):
                return obj.order is not None and obj.order.customer is not None and obj.order.customer == request.user
        return False

# Aliases to guarantee 100% backward-compatibility across all existing app viewsets
IsStaffUser = IsAdmin
IsManagerOrAdmin = IsAdmin
IsSuperAdmin = IsAdmin
IsProductionStaff = IsAdmin
IsSalesOrManager = IsAdmin
IsAccountant = IsAdmin
IsOwnerOrStaff = IsOwnerOrAdmin
