from rest_framework import serializers
from .models import ProductionJob, ProductionTask, ProductionLog
from apps.accounts.serializers import UserSerializer

class ProductionTaskSerializer(serializers.ModelSerializer):
    assigned_to_name = serializers.CharField(source='assigned_to.get_full_name', read_only=True)

    class Meta:
        model = ProductionTask
        fields = ['id', 'title', 'stage', 'assigned_to', 'assigned_to_name', 'is_completed', 'notes']

class ProductionLogSerializer(serializers.ModelSerializer):
    updated_by_name = serializers.CharField(source='updated_by.get_full_name', read_only=True)

    class Meta:
        model = ProductionLog
        fields = ['id', 'previous_stage', 'new_stage', 'progress_percentage', 'updated_by_name', 'notes', 'image', 'created_at']

class ProductionJobSerializer(serializers.ModelSerializer):
    order_number = serializers.CharField(source='order.order_number', read_only=True)
    customer_name = serializers.CharField(source='order.customer.get_full_name', read_only=True)
    supervisor = UserSerializer(read_only=True)
    tasks = ProductionTaskSerializer(many=True, read_only=True)
    logs = ProductionLogSerializer(many=True, read_only=True)

    class Meta:
        model = ProductionJob
        fields = [
            'id', 'job_code', 'order', 'order_number', 'customer_name',
            'stage', 'priority', 'progress_percentage', 'supervisor',
            'start_date', 'expected_completion', 'actual_completion', 'notes',
            'tasks', 'logs', 'created_at', 'updated_at'
        ]
