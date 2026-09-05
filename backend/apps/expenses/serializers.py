from rest_framework import serializers
from .models import Expense

class ExpenseSerializer(serializers.ModelSerializer):
    recorded_by_name = serializers.CharField(source='recorded_by.get_full_name', read_only=True)

    class Meta:
        model = Expense
        fields = ['id', 'expense_number', 'category', 'amount', 'date', 'payment_method', 'description', 'receipt_attachment', 'recorded_by_name', 'created_at']
