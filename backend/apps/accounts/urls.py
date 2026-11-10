from django.urls import path, include
from rest_framework import permissions
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from .permissions import IsAdmin
from .views import (
    RegisterView, CustomTokenObtainPairView, MeView, ChangePasswordView,
    LogoutView, UserAdminViewSet, CustomersViewSet
)

class SecureAdminRouter(DefaultRouter):
    """
    Restricts the default router API root view to authenticated Admin users only.
    """
    def get_api_root_view(self, api_urls=None):
        root_view = super().get_api_root_view(api_urls=api_urls)
        root_view.cls.permission_classes = [permissions.IsAuthenticated, IsAdmin]
        return root_view

router = SecureAdminRouter()
router.register(r'users', UserAdminViewSet, basename='admin-users')
router.register(r'customers', CustomersViewSet, basename='admin-customers')

customer_router = SecureAdminRouter()
customer_router.register(r'', CustomersViewSet, basename='customers-direct')

user_router = SecureAdminRouter()
user_router.register(r'', UserAdminViewSet, basename='users-direct')

urlpatterns = [
    path('register/', RegisterView.as_view(), name='auth-register'),
    path('login/', CustomTokenObtainPairView.as_view(), name='auth-login'),
    path('refresh/', TokenRefreshView.as_view(), name='auth-refresh'),
    path('logout/', LogoutView.as_view(), name='auth-logout'),
    path('me/', MeView.as_view(), name='auth-me'),
    path('profile/', MeView.as_view(), name='auth-profile'),
    path('change-password/', ChangePasswordView.as_view(), name='auth-change-password'),
    path('', include(router.urls)),
]
