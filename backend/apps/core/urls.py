from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PublicSettingsView, AdminSettingsViewSet, AuditLogViewSet

router = DefaultRouter()
router.register(r'settings', AdminSettingsViewSet, basename='admin-settings')
router.register(r'audit-logs', AuditLogViewSet, basename='audit-logs')

urlpatterns = [
    path('public-settings/', PublicSettingsView.as_view(), name='public-settings'),
    path('', include(router.urls)),
]
