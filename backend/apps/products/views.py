from rest_framework import viewsets, permissions, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .models import Category, Product, ProductImage
from .serializers import CategorySerializer, ProductSerializer, ProductImageSerializer
from apps.accounts.permissions import IsStaffUser
import logging
logger = logging.getLogger(__name__)

class CategoryViewSet(viewsets.ModelViewSet):
    authentication_classes = []
    permission_classes = [permissions.AllowAny]
    queryset = Category.objects.filter(is_active=True)
    serializer_class = CategorySerializer
    pagination_class = None
    filter_backends = [filters.SearchFilter]
    search_fields = ['name', 'description']

    def get_queryset(self):
        qs = Category.objects.all()
        if not (self.request.user and self.request.user.is_authenticated and getattr(self.request.user, 'role', '') != 'CUSTOMER'):
            qs = qs.filter(is_active=True)

        service_category = self.request.query_params.get('service_category')
        service_slug = self.request.query_params.get('service_slug')
        if service_slug:
            slug_mapping = {
                'metal-works': 'METAL_WORKS',
                'wood-works': 'WOOD_WORKS',
                'hybrid-metal-wood': 'HYBRID_METAL_WOOD',
                'hybrid-metal-wood-construction': 'HYBRID_METAL_WOOD',
            }
            service_category = slug_mapping.get(service_slug.lower())

        if service_category:
            qs = qs.filter(products__service_category=service_category.upper(), products__is_active=True).distinct()

        return qs

import uuid
from django.http import Http404
from rest_framework.pagination import PageNumberPagination

class CatalogPagination(PageNumberPagination):
    page_size = 100
    page_size_query_param = 'page_size'
    max_page_size = 200

class ProductViewSet(viewsets.ModelViewSet):
    authentication_classes = []
    permission_classes = [permissions.AllowAny]
    queryset = Product.objects.select_related('category', 'service').prefetch_related('images').all()
    serializer_class = ProductSerializer
    pagination_class = CatalogPagination
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = [
        'service', 'service__slug', 'category', 'category__slug',
        'product_type', 'subcategory', 'is_featured', 'stock_status', 'is_active', 'is_customizable', 'slug'
    ]
    search_fields = [
        'name', 'name_am', 'sku', 'material', 'material_am',
        'description', 'description_am', 'detailed_description',
        'product_type', 'subcategory', 'subcategory_am', 'applications'
    ]
    ordering_fields = ['starting_price', 'created_at', 'name']

    def get_queryset(self):
        qs = super().get_queryset()
        # Robust service_category normalization (supports WOOD_WORKS, wood-works, wood_works, wood)
        service_category = self.request.query_params.get('service_category')
        if service_category:
            cat_norm = service_category.strip().upper().replace('-', '_').replace(' ', '_')
            if 'HYBRID' in cat_norm:
                qs = qs.filter(service_category='HYBRID_METAL_WOOD')
            elif 'WOOD' in cat_norm:
                qs = qs.filter(service_category='WOOD_WORKS')
            elif 'METAL' in cat_norm:
                qs = qs.filter(service_category='METAL_WORKS')
            else:
                qs = qs.filter(service_category=cat_norm)

        service_slug = self.request.query_params.get('service_slug')
        if service_slug:
            slug_mapping = {
                'metal-works': 'METAL_WORKS',
                'wood-works': 'WOOD_WORKS',
                'hybrid-metal-wood': 'HYBRID_METAL_WOOD',
                'hybrid-metal-wood-construction': 'HYBRID_METAL_WOOD',
            }
            mapped_cat = slug_mapping.get(service_slug.lower())
            if mapped_cat:
                qs = qs.filter(service_category=mapped_cat)

        subcategory = self.request.query_params.get('subcategory')
        if subcategory and subcategory.lower() != 'all':
            from django.db.models import Q
            qs = qs.filter(
                Q(subcategory__iexact=subcategory) |
                Q(subcategory_am__iexact=subcategory) |
                Q(category__name__iexact=subcategory) |
                Q(category__name_am__iexact=subcategory) |
                Q(product_type__iexact=subcategory)
            )

        # Safe role inspection using getattr to prevent AttributeError if user model lacks role
        if not (self.request.user and self.request.user.is_authenticated and getattr(self.request.user, 'role', '') != 'CUSTOMER'):
            qs = qs.filter(is_active=True)
        return qs

    def list(self, request, *args, **kwargs):
        """Defensive list handler: logs exceptions and guarantees paginated JSON response without HTTP 500."""
        try:
            return super().list(request, *args, **kwargs)
        except Exception as e:
            logger.error(f"[PRODUCT LIST ERROR] {e}", exc_info=True)
            try:
                qs = self.get_queryset()
                page = self.paginate_queryset(qs)
                if page is not None:
                    serializer = self.get_serializer(page, many=True)
                    return self.get_paginated_response(serializer.data)
                serializer = self.get_serializer(qs, many=True)
                return Response(serializer.data)
            except Exception as fallback_err:
                logger.error(f"[PRODUCT LIST FALLBACK ERROR] {fallback_err}", exc_info=True)
                return Response({
                    "count": 0,
                    "next": None,
                    "previous": None,
                    "results": []
                }, status=status.HTTP_200_OK)

    def get_object(self):
        queryset = self.filter_queryset(self.get_queryset())
        lookup_url_kwarg = self.lookup_url_kwarg or self.lookup_field
        lookup_value = str(self.kwargs.get(lookup_url_kwarg) or '').strip()

        obj = None
        # 1. Try UUID primary key
        try:
            uuid.UUID(lookup_value)
            obj = queryset.filter(pk=lookup_value).first() or Product.objects.filter(pk=lookup_value).first()
        except (ValueError, TypeError, AttributeError):
            pass

        # 2. Try SKU exact / case-insensitive
        if not obj:
            obj = queryset.filter(sku__iexact=lookup_value).first() or Product.objects.filter(sku__iexact=lookup_value).first()

        # 3. Try slug exact / case-insensitive
        if not obj:
            obj = queryset.filter(slug__iexact=lookup_value).first() or Product.objects.filter(slug__iexact=lookup_value).first()

        if not obj:
            raise Http404(f"No Product found matching {lookup_value}")

        self.check_object_permissions(self.request, obj)
        return obj

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        product = serializer.save()

        uploaded_files = request.FILES.getlist('images')
        primary_index = 0
        try:
            primary_index = int(request.data.get('primary_image_index', 0))
        except (ValueError, TypeError):
            primary_index = 0

        for idx, img_file in enumerate(uploaded_files):
            ProductImage.objects.create(
                product=product,
                image=img_file,
                is_primary=(idx == primary_index),
                caption=f"{product.name} Photo {idx + 1}"
            )

        return Response(ProductSerializer(product).data, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        product = serializer.save()

        uploaded_files = request.FILES.getlist('images')
        for idx, img_file in enumerate(uploaded_files):
            ProductImage.objects.create(
                product=product,
                image=img_file,
                is_primary=False,
                caption=f"{product.name} Photo"
            )

        return Response(ProductSerializer(product).data)

    @action(detail=False, methods=['get'])
    def subcategories(self, request):
        """Returns standard and active subcategories grouped by service category with product counts."""
        from django.db.models import Q
        service_category = request.query_params.get('service_category')
        service_slug = request.query_params.get('service_slug')
        
        slug_mapping = {
            'metal-works': 'METAL_WORKS',
            'wood-works': 'WOOD_WORKS',
            'hybrid-metal-wood': 'HYBRID_METAL_WOOD',
            'hybrid-metal-wood-construction': 'HYBRID_METAL_WOOD',
        }
        target_cat = service_category.upper() if service_category else slug_mapping.get(service_slug.lower() if service_slug else '')

        STANDARD_SUBCATEGORIES = {
            'WOOD_WORKS': [
                'Chairs', 'Tables', 'Beds', 'Wardrobes', 'Wooden Doors',
                'Wooden Kitchens', 'Office Desks', 'TV Stands', 'Wooden Cabinets', 'Other Wood Products'
            ],
            'METAL_WORKS': [
                'Metal Gates', 'Metal Windows'
            ],
            'HYBRID_METAL_WOOD': [
                'Chairs', 'Tables', 'Beds', 'Wardrobes', 'Office Desks', 'TV Stands', 'Wooden Cabinets'
            ]
        }

        SUBCATEGORY_AMHARIC_MAP = {
            'Chairs': 'ወንበሮች',
            'Tables': 'ጠረጴዛዎች',
            'Beds': 'አልጋዎች',
            'Wardrobes': 'ቁም ሳጥኖች',
            'Wooden Doors': 'የእንጨት በሮች',
            'Wooden Kitchens': 'የእንጨት ማብሰያ ክፍሎች (ኪችን)',
            'Office Desks': 'የቢሮ ጠረጴዛዎች',
            'TV Stands': 'የቲቪ ማስቀመጫዎች',
            'Wooden Cabinets': 'የእንጨት ካቢኔቶች',
            'Other Wood Products': 'ሌሎች የእንጨት ውጤቶች',
            'Metal Gates': 'የብረት ግቢ በሮች',
            'Metal Windows': 'የብረት መስኮቶች',
        }

        cats_to_process = [target_cat] if target_cat and target_cat in STANDARD_SUBCATEGORIES else list(STANDARD_SUBCATEGORIES.keys())
        result = {}

        for cat in cats_to_process:
            standard_list = STANDARD_SUBCATEGORIES[cat]
            prods = Product.objects.filter(service_category=cat, is_active=True)
            
            subcat_counts = {}
            for item in standard_list:
                am_name = SUBCATEGORY_AMHARIC_MAP.get(item, item)
                c = prods.filter(
                    Q(subcategory__iexact=item) |
                    Q(subcategory_am__iexact=am_name) |
                    Q(category__name__iexact=item) |
                    Q(category__name_am__iexact=am_name) |
                    Q(product_type__iexact=item)
                ).count()
                subcat_counts[item] = c
                
            result[cat] = {
                'service_category': cat,
                'subcategories': standard_list,
                'subcategories_am': [SUBCATEGORY_AMHARIC_MAP.get(i, i) for i in standard_list],
                'subcategory_map': {i: SUBCATEGORY_AMHARIC_MAP.get(i, i) for i in standard_list},
                'counts': subcat_counts,
                'total_products': prods.count()
            }

        if target_cat and target_cat in result:
            return Response(result[target_cat])
        return Response(result)

class ProductImageViewSet(viewsets.ModelViewSet):
    queryset = ProductImage.objects.all()
    serializer_class = ProductImageSerializer
    permission_classes = [IsStaffUser]
