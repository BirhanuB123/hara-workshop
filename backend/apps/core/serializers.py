from rest_framework import serializers
from .models import WorkshopSettings, AuditLog

class WorkshopSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = WorkshopSettings
        fields = '__all__'

class AuditLogSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)

    class Meta:
        model = AuditLog
        fields = '__all__'
