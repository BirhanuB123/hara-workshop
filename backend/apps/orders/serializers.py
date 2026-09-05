from rest_framework import serializers
from .models import Order, OrderItem
from apps.accounts.serializers import UserSerializer

class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = ['id', 'product', 'item_title', 'description', 'quantity', 'unit_price', 'total_price']

class OrderSerializer(serializers.ModelSerializer):
    customer = UserSerializer(read_only=True)
    items = OrderItemSerializer(many=True, read_only=True)
    production_job = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = [
            'id', 'order_number', 'quote', 'customer', 'status', 'total_amount',
            'paid_amount', 'delivery_address', 'delivery_city', 'expected_delivery_date',
            'notes', 'items', 'production_job', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'order_number', 'customer', 'created_at', 'updated_at']

    def get_production_job(self, obj):
        if hasattr(obj, 'production_job'):
            job = obj.production_job
            return {
                'id': job.id,
                'job_code': job.job_code,
                'stage': job.stage,
                'progress_percentage': job.progress_percentage,
                'priority': job.priority,
            }
        return None
