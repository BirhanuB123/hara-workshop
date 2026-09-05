from rest_framework import serializers
from .models import Payment
from apps.accounts.serializers import UserSerializer

class PaymentSerializer(serializers.ModelSerializer):
    customer = UserSerializer(read_only=True)
    order_number = serializers.CharField(source='order.order_number', read_only=True)
    recorded_by_name = serializers.CharField(source='recorded_by.get_full_name', read_only=True)

    class Meta:
        model = Payment
        fields = [
            'id', 'payment_number', 'order', 'order_number', 'customer',
            'amount', 'currency', 'payment_method', 'transaction_reference',
            'status', 'payment_date', 'receipt_attachment', 'recorded_by_name',
            'notes', 'created_at'
        ]
        read_only_fields = ['id', 'payment_number', 'customer', 'created_at']

class PaymentCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = ['order', 'amount', 'currency', 'payment_method', 'transaction_reference', 'payment_date', 'receipt_attachment', 'notes']
