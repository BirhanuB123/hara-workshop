from rest_framework import serializers
from .models import Material, InventoryTransaction

class InventoryTransactionSerializer(serializers.ModelSerializer):
    performed_by_name = serializers.CharField(source='performed_by.get_full_name', read_only=True)
    material_name = serializers.CharField(source='material.name', read_only=True)

    class Meta:
        model = InventoryTransaction
        fields = ['id', 'material', 'material_name', 'transaction_type', 'quantity', 'unit_cost', 'total_cost', 'performed_by_name', 'notes', 'created_at']

class MaterialSerializer(serializers.ModelSerializer):
    supplier_name = serializers.CharField(source='supplier.name', read_only=True)
    is_low_stock = serializers.BooleanField(read_only=True)

    class Meta:
        model = Material
        fields = [
            'id', 'sku', 'name', 'category', 'unit', 'current_stock',
            'minimum_stock', 'unit_cost', 'supplier', 'supplier_name',
            'location', 'is_active', 'is_low_stock', 'created_at', 'updated_at'
        ]
