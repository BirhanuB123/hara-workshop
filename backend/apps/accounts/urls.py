from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    RegisterView, CustomTokenObtainPairView, MeView, ChangePasswordView,
    LogoutView, UserAdminViewSet, CustomersListViewSet, EmployeesListViewSet
)

router = DefaultRouter()
router.register(r'users', UserAdminViewSet, basename='admin-users')
router.register(r'customers', CustomersListViewSet, basename='admin-customers')
router.register(r'employees', EmployeesListViewSet, basename='admin-employees')

urlpatterns = [
    path('register/', RegisterView.as_view(), name='auth-register'),
    path('login/', CustomTokenObtainPairView.as_view(), name='auth-login'),
    path('refresh/', TokenRefreshView.as_view(), name='auth-refresh'),
    path('logout/', LogoutView.as_view(), name='auth-logout'),
    path('me/', MeView.as_view(), name='auth-me'),
    path('change-password/', ChangePasswordView.as_view(), name='auth-change-password'),
    path('', include(router.urls)),
]
