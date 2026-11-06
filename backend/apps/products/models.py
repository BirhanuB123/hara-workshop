from django.db import models
from apps.core.models import TimeStampedModel

class Category(TimeStampedModel):
    name = models.CharField(max_length=100, unique=True)
    name_am = models.CharField(max_length=100, blank=True, default='')
    slug = models.SlugField(max_length=120, unique=True)
    description = models.TextField(blank=True, null=True)
    description_am = models.TextField(blank=True, default='')
    image = models.ImageField(upload_to='categories/', blank=True, null=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        verbose_name_plural = 'Categories'
        ordering = ['name']

    def __str__(self):
        return self.name

class ServiceCategoryChoice(models.TextChoices):
    METAL_WORKS = 'METAL_WORKS', 'Metal Works'
    WOOD_WORKS = 'WOOD_WORKS', 'Wood Works'
    HYBRID_METAL_WOOD = 'HYBRID_METAL_WOOD', 'Hybrid Metal + Wood Construction'

class Product(TimeStampedModel):
    class StockStatus(models.TextChoices):
        IN_STOCK = 'IN_STOCK', 'In Stock'
        MADE_TO_ORDER = 'MADE_TO_ORDER', 'Made to Order'
        OUT_OF_STOCK = 'OUT_OF_STOCK', 'Out of Stock'

    name = models.CharField(max_length=200)
    name_am = models.CharField(max_length=200, blank=True, default='')
    slug = models.SlugField(max_length=220, null=True, blank=True, db_index=True)
    sku = models.CharField(max_length=50, unique=True, db_index=True)
    service_category = models.CharField(
        max_length=50,
        choices=ServiceCategoryChoice.choices,
        default=ServiceCategoryChoice.METAL_WORKS,
        db_index=True
    )
    service = models.ForeignKey('services.Service', null=True, blank=True, on_delete=models.SET_NULL, related_name='products')
    category = models.ForeignKey(Category, on_delete=models.PROTECT, related_name='products', null=True, blank=True)
    product_type = models.CharField(max_length=100, blank=True, default='')
    subcategory = models.CharField(max_length=100, blank=True, default='', db_index=True)
    subcategory_am = models.CharField(max_length=100, blank=True, default='')
    
    short_description = models.CharField(max_length=350, blank=True, default='')
    short_description_am = models.CharField(max_length=350, blank=True, default='')
    description = models.TextField()
    description_am = models.TextField(blank=True, default='')
    detailed_description = models.TextField(blank=True, default='')
    
    # Material specifications
    material = models.CharField(max_length=200, help_text='e.g., Stainless Steel, Mahogany, Iron & Teak')
    material_am = models.CharField(max_length=200, blank=True, default='')
    metal_materials = models.CharField(max_length=255, blank=True, default='')
    wood_materials = models.CharField(max_length=255, blank=True, default='')
    finish_options = models.CharField(max_length=255, blank=True, default='')
    applications = models.CharField(max_length=255, blank=True, default='')
    customization_options = models.TextField(blank=True, default='')
    estimated_production_time = models.CharField(max_length=100, default='1-3 weeks')

    dimensions_length = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    dimensions_width = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    dimensions_height = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    dimensions_unit = models.CharField(max_length=10, default='cm')
    starting_price = models.DecimalField(max_digits=12, decimal_places=2, default=0, help_text='Price in ETB')
    unit = models.CharField(max_length=30, default='piece')
    is_featured = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    stock_status = models.CharField(max_length=20, choices=StockStatus.choices, default=StockStatus.MADE_TO_ORDER)
    is_customizable = models.BooleanField(default=True)

    class Meta:
        ordering = ['-is_featured', '-created_at']

    def __str__(self):
        return f'{self.name} ({self.sku})'

    def save(self, *args, **kwargs):
        if not self.slug:
            from django.utils.text import slugify
            import uuid
            base_slug = slugify(self.name)
            slug = base_slug
            counter = 1
            while Product.objects.filter(slug=slug).exclude(id=self.id).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1
            self.slug = slug
        if not self.subcategory and self.product_type:
            self.subcategory = self.product_type
        elif not self.product_type and self.subcategory:
            self.product_type = self.subcategory
        if not self.short_description and self.description:
            self.short_description = self.description[:280]
        if not self.detailed_description and self.description:
            self.detailed_description = self.description
        super().save(*args, **kwargs)

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
