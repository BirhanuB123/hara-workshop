from rest_framework import serializers
from .models import Supplier

class SupplierSerializer(serializers.ModelSerializer):
    material_count = serializers.IntegerField(source='materials.count', read_only=True)

    class Meta:
        model = Supplier
        fields = ['id', 'name', 'contact_person', 'phone', 'email', 'address', 'materials_supplied', 'notes', 'is_active', 'material_count', 'created_at']
