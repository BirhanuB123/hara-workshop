from rest_framework import viewsets, permissions, views, status
from rest_framework.response import Response
from .models import WorkshopSettings, AuditLog
from .serializers import WorkshopSettingsSerializer, AuditLogSerializer

class PublicSettingsView(views.APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        settings_obj = WorkshopSettings.objects.first()
        if not settings_obj:
            settings_obj = WorkshopSettings.objects.create()
        return Response(WorkshopSettingsSerializer(settings_obj).data)

class AdminSettingsViewSet(viewsets.ModelViewSet):
    queryset = WorkshopSettings.objects.all()
    serializer_class = WorkshopSettingsSerializer
    permission_classes = [permissions.IsAdminUser]

class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = AuditLog.objects.all()
    serializer_class = AuditLogSerializer
    permission_classes = [permissions.IsAdminUser]
    filterset_fields = ['action', 'resource', 'user']
    search_fields = ['resource', 'resource_id', 'metadata']
