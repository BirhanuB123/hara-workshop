from rest_framework import serializers
from .models import ServiceCategory, Service, ServiceImage
from apps.projects.models import Project

class ServiceImageSerializer(serializers.ModelSerializer):
    image = serializers.SerializerMethodField()

    class Meta:
        model = ServiceImage
        fields = ['id', 'image', 'caption', 'description', 'order', 'is_primary', 'created_at']

    def get_image(self, obj):
        return obj.image.url if obj.image else None

class RelatedProjectSummarySerializer(serializers.ModelSerializer):
    primary_image = serializers.CharField(source='primary_image_url', read_only=True)

    class Meta:
        model = Project
        fields = ['id', 'title', 'slug', 'category', 'client_type', 'materials_used', 'primary_image', 'description']

class ServiceSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    gallery_images = ServiceImageSerializer(many=True, read_only=True)
    primary_image = serializers.CharField(source='primary_image_url', read_only=True)
    image = serializers.SerializerMethodField()
    related_projects = serializers.SerializerMethodField()
    related_services = serializers.SerializerMethodField()

    class Meta:
        model = Service
        fields = [
            'id', 'category', 'category_name', 'title', 'title_am', 'slug', 'tagline', 'tagline_am',
            'short_description', 'short_description_am', 'full_description', 'full_description_am',
            'starting_price', 'price_unit', 'turnaround_time', 'is_active', 'image', 'primary_image',
            'offerings', 'applications', 'materials', 'benefits', 'process_steps',
            'customization_info', 'gallery_images', 'related_projects', 'related_services', 'created_at'
        ]

    def get_image(self, obj):
        return obj.image.url if obj.image else None

    def get_related_projects(self, obj):
        cat_map = {
            'Metal Works': ['METAL'],
            'Wood Works': ['WOOD'],
            'Hybrid Metal + Wood Construction': ['CUSTOM', 'FURNITURE', 'DOORS'],
        }
        cats = cat_map.get(obj.title, ['CUSTOM', 'METAL', 'WOOD'])
        projects = Project.objects.filter(category__in=cats, is_published=True).order_by('-is_featured', '-created_at')[:4]
        return RelatedProjectSummarySerializer(projects, many=True).data

    def get_related_services(self, obj):
        other_services = Service.objects.filter(is_active=True).exclude(id=obj.id)[:2]
        return [
            {
                'id': s.id,
                'title': s.title,
                'slug': s.slug,
                'category_name': s.category.name if s.category else '',
                'short_description': s.short_description,
                'image': s.primary_image_url,
                'starting_price': s.starting_price,
                'price_unit': s.price_unit,
                'turnaround_time': s.turnaround_time
            }
            for s in other_services
        ]

class ServiceCategorySerializer(serializers.ModelSerializer):
    services = ServiceSerializer(many=True, read_only=True)

    class Meta:
        model = ServiceCategory
        fields = ['id', 'name', 'name_am', 'slug', 'description', 'services']
