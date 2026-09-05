from rest_framework import serializers
from .models import Invoice
from apps.accounts.serializers import UserSerializer

class InvoiceSerializer(serializers.ModelSerializer):
    customer = UserSerializer(read_only=True)
    order_number = serializers.CharField(source='order.order_number', read_only=True)

    class Meta:
        model = Invoice
        fields = [
            'id', 'invoice_number', 'order', 'order_number', 'customer',
            'subtotal', 'discount', 'tax_amount', 'total_amount',
            'amount_paid', 'amount_remaining', 'status', 'issue_date',
            'due_date', 'notes', 'created_at'
        ]
