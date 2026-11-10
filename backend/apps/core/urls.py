from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PublicSettingsView, AdminSettingsViewSet, AuditLogViewSet, ContactInquiryView

router = DefaultRouter()
router.register(r'settings', AdminSettingsViewSet, basename='admin-settings')
router.register(r'audit-logs', AuditLogViewSet, basename='audit-logs')

settings_router = DefaultRouter()
settings_router.register(r'', AdminSettingsViewSet, basename='settings-direct')

audit_log_router = DefaultRouter()
audit_log_router.register(r'', AuditLogViewSet, basename='audit-logs-direct')

urlpatterns = [
    path('public-settings/', PublicSettingsView.as_view(), name='public-settings'),
    path('contact/', ContactInquiryView.as_view(), name='contact-inquiry'),
    path('', include(router.urls)),
]

