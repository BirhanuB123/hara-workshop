import os

def w(path, content):
    full_path = os.path.normpath(path)
    os.makedirs(os.path.dirname(os.path.abspath(full_path)), exist_ok=True)
    with open(full_path, 'w', encoding='utf-8') as f:
        f.write(content.strip() + '\n')
    print(f'Created: {full_path}')

# ==========================================
# 1. PRODUCTS APP
# ==========================================
w('backend/apps/products/models.py', '''from django.db import models
from apps.core.models import TimeStampedModel

class Category(TimeStampedModel):
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=120, unique=True)
    description = models.TextField(blank=True, null=True)
    image = models.ImageField(upload_to='categories/', blank=True, null=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        verbose_name_plural = 'Categories'
        ordering = ['name']

    def __str__(self):
        return self.name

class Product(TimeStampedModel):
    class StockStatus(models.TextChoices):
        IN_STOCK = 'IN_STOCK', 'In Stock'
        MADE_TO_ORDER = 'MADE_TO_ORDER', 'Made to Order'
        OUT_OF_STOCK = 'OUT_OF_STOCK', 'Out of Stock'

    name = models.CharField(max_length=200)
    sku = models.CharField(max_length=50, unique=True, db_index=True)
    category = models.ForeignKey(Category, on_delete=models.PROTECT, related_name='products')
    description = models.TextField()
    material = models.CharField(max_length=200, help_text='e.g., Stainless Steel, Mahogany, Iron & Teak')
    dimensions_length = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    dimensions_width = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    dimensions_height = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    dimensions_unit = models.CharField(max_length=10, default='cm')
    starting_price = models.DecimalField(max_digits=12, decimal_places=2, help_text='Price in ETB')
    unit = models.CharField(max_length=30, default='piece')
    is_featured = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    stock_status = models.CharField(max_length=20, choices=StockStatus.choices, default=StockStatus.MADE_TO_ORDER)
    is_customizable = models.BooleanField(default=True)

    class Meta:
        ordering = ['-is_featured', '-created_at']

    def __str__(self):
        return f'{self.name} ({self.sku})'

    @property
    def primary_image_url(self):
        primary = self.images.filter(is_primary=True).first()
        if primary and primary.image:
            return primary.image.url
        first = self.images.first()
        return first.image.url if first and first.image else None

class ProductImage(TimeStampedModel):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='images')
    image = models.ImageField(upload_to='products/')
    is_primary = models.BooleanField(default=False)
    caption = models.CharField(max_length=150, blank=True, null=True)

    class Meta:
        ordering = ['-is_primary', '-created_at']

    def __str__(self):
        return f'Image for {self.product.name}'
''')

w('backend/apps/products/serializers.py', '''from rest_framework import serializers
from .models import Category, Product, ProductImage

class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = ['id', 'image', 'is_primary', 'caption']

class CategorySerializer(serializers.ModelSerializer):
    product_count = serializers.IntegerField(source='products.count', read_only=True)

    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'description', 'image', 'is_active', 'product_count']

class ProductSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    images = ProductImageSerializer(many=True, read_only=True)
    primary_image = serializers.CharField(source='primary_image_url', read_only=True)

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'sku', 'category', 'category_name', 'description',
            'material', 'dimensions_length', 'dimensions_width', 'dimensions_height',
            'dimensions_unit', 'starting_price', 'unit', 'is_featured', 'is_active',
            'stock_status', 'is_customizable', 'images', 'primary_image',
            'created_at', 'updated_at'
        ]
''')

w('backend/apps/products/views.py', '''from rest_framework import viewsets, permissions, filters
from django_filters.rest_framework import DjangoFilterBackend
from .models import Category, Product, ProductImage
from .serializers import CategorySerializer, ProductSerializer, ProductImageSerializer
from apps.accounts.permissions import IsStaffUser

class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['name', 'description']

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        return [IsStaffUser()]

class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.select_related('category').prefetch_related('images').all()
    serializer_class = ProductSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category', 'category__slug', 'is_featured', 'stock_status', 'is_active', 'is_customizable']
    search_fields = ['name', 'sku', 'material', 'description']
    ordering_fields = ['starting_price', 'created_at', 'name']

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        return [IsStaffUser()]

    def get_queryset(self):
        qs = super().get_queryset()
        if not (self.request.user and self.request.user.is_authenticated and self.request.user.role != 'CUSTOMER'):
            qs = qs.filter(is_active=True)
        return qs

class ProductImageViewSet(viewsets.ModelViewSet):
    queryset = ProductImage.objects.all()
    serializer_class = ProductImageSerializer
    permission_classes = [IsStaffUser]
''')

w('backend/apps/products/urls.py', '''from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CategoryViewSet, ProductViewSet, ProductImageViewSet

router = DefaultRouter()
router.register(r'categories', CategoryViewSet, basename='categories')
router.register(r'images', ProductImageViewSet, basename='product-images')
router.register(r'', ProductViewSet, basename='products')

urlpatterns = [
    path('', include(router.urls)),
]
''')

# ==========================================
# 2. SERVICES APP
# ==========================================
w('backend/apps/services/models.py', '''from django.db import models
from apps.core.models import TimeStampedModel

class ServiceCategory(TimeStampedModel):
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=120, unique=True)
    description = models.TextField(blank=True, null=True)

    class Meta:
        verbose_name_plural = 'Service Categories'
        ordering = ['name']

    def __str__(self):
        return self.name

class Service(TimeStampedModel):
    category = models.ForeignKey(ServiceCategory, on_delete=models.CASCADE, related_name='services')
    title = models.CharField(max_length=200)
    slug = models.SlugField(max_length=220, unique=True)
    short_description = models.CharField(max_length=300)
    full_description = models.TextField()
    starting_price = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    price_unit = models.CharField(max_length=50, default='per project')
    turnaround_time = models.CharField(max_length=100, default='1-2 weeks')
    is_active = models.BooleanField(default=True)
    image = models.ImageField(upload_to='services/', blank=True, null=True)

    class Meta:
        ordering = ['category', 'title']

    def __str__(self):
        return self.title
''')

w('backend/apps/services/serializers.py', '''from rest_framework import serializers
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
''')

w('backend/apps/services/views.py', '''from rest_framework import viewsets, permissions, filters
from django_filters.rest_framework import DjangoFilterBackend
from .models import ServiceCategory, Service
from .serializers import ServiceCategorySerializer, ServiceSerializer
from apps.accounts.permissions import IsStaffUser

class ServiceCategoryViewSet(viewsets.ModelViewSet):
    queryset = ServiceCategory.objects.prefetch_related('services').all()
    serializer_class = ServiceCategorySerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        return [IsStaffUser()]

class ServiceViewSet(viewsets.ModelViewSet):
    queryset = Service.objects.select_related('category').all()
    serializer_class = ServiceSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['category', 'is_active']
    search_fields = ['title', 'short_description', 'full_description']

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        return [IsStaffUser()]

    def get_queryset(self):
        qs = super().get_queryset()
        if not (self.request.user and self.request.user.is_authenticated and self.request.user.role != 'CUSTOMER'):
            qs = qs.filter(is_active=True)
        return qs
''')

w('backend/apps/services/urls.py', '''from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ServiceCategoryViewSet, ServiceViewSet

router = DefaultRouter()
router.register(r'categories', ServiceCategoryViewSet, basename='service-categories')
router.register(r'', ServiceViewSet, basename='services')

urlpatterns = [
    path('', include(router.urls)),
]
''')

# ==========================================
# 3. PROJECTS APP (Portfolio / Gallery)
# ==========================================
w('backend/apps/projects/models.py', '''from django.db import models
from apps.core.models import TimeStampedModel

class Project(TimeStampedModel):
    class ProjectCategory(models.TextChoices):
        METAL = 'METAL', 'Metal Works'
        WOOD = 'WOOD', 'Wood Works'
        FURNITURE = 'FURNITURE', 'Furniture'
        DOORS = 'DOORS', 'Doors'
        WINDOWS = 'WINDOWS', 'Windows'
        CUSTOM = 'CUSTOM', 'Custom Solutions'

    class ClientType(models.TextChoices):
        RESIDENTIAL = 'RESIDENTIAL', 'Residential'
        COMMERCIAL = 'COMMERCIAL', 'Commercial'
        OFFICE = 'OFFICE', 'Office'
        SPECIAL = 'SPECIAL', 'Special Construction'

    title = models.CharField(max_length=200)
    slug = models.SlugField(max_length=220, unique=True)
    category = models.CharField(max_length=30, choices=ProjectCategory.choices, default=ProjectCategory.CUSTOM)
    description = models.TextField()
    client_type = models.CharField(max_length=30, choices=ClientType.choices, default=ClientType.RESIDENTIAL)
    materials_used = models.CharField(max_length=255, help_text='e.g., Cast iron, oak wood, powder coating')
    completion_date = models.DateField(null=True, blank=True)
    is_featured = models.BooleanField(default=False)
    is_published = models.BooleanField(default=True)

    class Meta:
        ordering = ['-is_featured', '-completion_date', '-created_at']

    def __str__(self):
        return self.title

    @property
    def primary_image_url(self):
        first = self.images.first()
        return first.image.url if first and first.image else None

class ProjectImage(TimeStampedModel):
    class ImageType(models.TextChoices):
        REGULAR = 'REGULAR', 'Regular Gallery'
        BEFORE = 'BEFORE', 'Before Work'
        AFTER = 'AFTER', 'After Work'

    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='images')
    image = models.ImageField(upload_to='projects/')
    image_type = models.CharField(max_length=20, choices=ImageType.choices, default=ImageType.REGULAR)
    caption = models.CharField(max_length=150, blank=True, null=True)

    class Meta:
        ordering = ['image_type', '-created_at']

    def __str__(self):
        return f'{self.image_type} - {self.project.title}'
''')

w('backend/apps/projects/serializers.py', '''from rest_framework import serializers
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
''')

w('backend/apps/projects/views.py', '''from rest_framework import viewsets, permissions, filters
from django_filters.rest_framework import DjangoFilterBackend
from .models import Project, ProjectImage
from .serializers import ProjectSerializer, ProjectImageSerializer
from apps.accounts.permissions import IsStaffUser

class ProjectViewSet(viewsets.ModelViewSet):
    queryset = Project.objects.prefetch_related('images').all()
    serializer_class = ProjectSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category', 'client_type', 'is_featured', 'is_published']
    search_fields = ['title', 'description', 'materials_used']
    ordering_fields = ['completion_date', 'created_at', 'title']

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        return [IsStaffUser()]

    def get_queryset(self):
        qs = super().get_queryset()
        if not (self.request.user and self.request.user.is_authenticated and self.request.user.role != 'CUSTOMER'):
            qs = qs.filter(is_published=True)
        return qs

class ProjectImageViewSet(viewsets.ModelViewSet):
    queryset = ProjectImage.objects.all()
    serializer_class = ProjectImageSerializer
    permission_classes = [IsStaffUser]
''')

w('backend/apps/projects/urls.py', '''from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ProjectViewSet, ProjectImageViewSet

router = DefaultRouter()
router.register(r'images', ProjectImageViewSet, basename='project-images')
router.register(r'', ProjectViewSet, basename='projects')

urlpatterns = [
    path('', include(router.urls)),
]
''')

print('Products, Services, Projects setup successfully.')
