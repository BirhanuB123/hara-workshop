from rest_framework import serializers
from .models import Category, Product, ProductImage

class ProductImageSerializer(serializers.ModelSerializer):
    image = serializers.SerializerMethodField()

    class Meta:
        model = ProductImage
        fields = ['id', 'image', 'is_primary', 'caption']

    def get_image(self, obj):
        try:
            return obj.image.url if obj.image else None
        except Exception:
            return None

class CategorySerializer(serializers.ModelSerializer):
    product_count = serializers.IntegerField(source='products.count', read_only=True)
    image = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = ['id', 'name', 'name_am', 'slug', 'description', 'description_am', 'image', 'is_active', 'product_count']

    def get_image(self, obj):
        try:
            return obj.image.url if obj.image else None
        except Exception:
            return None

class ProductSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True, default='')
    service_category_display = serializers.CharField(source='get_service_category_display', read_only=True)
    service_slug = serializers.SerializerMethodField()
    images = ProductImageSerializer(many=True, read_only=True)
    primary_image = serializers.CharField(source='primary_image_url', read_only=True)

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'name_am', 'slug', 'sku', 'service_category', 'service_category_display',
            'service', 'service_slug', 'category', 'category_name', 'product_type', 'subcategory', 'subcategory_am',
            'short_description', 'short_description_am', 'description', 'description_am', 'detailed_description',
            'material', 'material_am', 'metal_materials', 'wood_materials', 'finish_options',
            'applications', 'customization_options', 'estimated_production_time',
            'dimensions_length', 'dimensions_width', 'dimensions_height',
            'dimensions_unit', 'starting_price', 'unit', 'is_featured', 'is_active',
            'stock_status', 'is_customizable', 'images', 'primary_image',
            'created_at', 'updated_at'
        ]

    def get_service_slug(self, obj):
        if obj.service and obj.service.slug:
            return obj.service.slug
        mapping = {
            'METAL_WORKS': 'metal-works',
            'WOOD_WORKS': 'wood-works',
            'HYBRID_METAL_WOOD': 'hybrid-metal-wood'
        }
        return mapping.get(obj.service_category, 'metal-works')
