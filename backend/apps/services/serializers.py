from rest_framework import serializers
from .models import ServiceCategory, Service

class ServiceSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)

    class Meta:
        model = Service
        fields = [
            'id', 'category', 'category_name', 'title', 'slug',
            'short_description', 'full_description', 'starting_price',
            'price_unit', 'turnaround_time', 'is_active', 'image', 'created_at'
        ]

class ServiceCategorySerializer(serializers.ModelSerializer):
    services = ServiceSerializer(many=True, read_only=True)

    class Meta:
        model = ServiceCategory
        fields = ['id', 'name', 'slug', 'description', 'services']
