from django.db import models
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
