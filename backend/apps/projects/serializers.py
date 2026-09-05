from rest_framework import serializers
from .models import Project, ProjectImage

class ProjectImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProjectImage
        fields = ['id', 'image', 'image_type', 'caption']

class ProjectSerializer(serializers.ModelSerializer):
    images = ProjectImageSerializer(many=True, read_only=True)
    primary_image = serializers.CharField(source='primary_image_url', read_only=True)

    class Meta:
        model = Project
        fields = [
            'id', 'title', 'slug', 'category', 'description', 'client_type',
            'materials_used', 'completion_date', 'is_featured', 'is_published',
            'images', 'primary_image', 'created_at'
        ]
