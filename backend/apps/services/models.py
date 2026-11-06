from django.db import models
from apps.core.models import TimeStampedModel

class ServiceCategory(TimeStampedModel):
    name = models.CharField(max_length=100, unique=True)
    name_am = models.CharField(max_length=100, blank=True, default='')
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
    title_am = models.CharField(max_length=200, blank=True, default='')
    slug = models.SlugField(max_length=220, unique=True)
    tagline = models.CharField(max_length=255, blank=True, default='')
    tagline_am = models.CharField(max_length=255, blank=True, default='')
    short_description = models.CharField(max_length=300)
    short_description_am = models.CharField(max_length=300, blank=True, default='')
    full_description = models.TextField()
    full_description_am = models.TextField(blank=True, default='')
    starting_price = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    price_unit = models.CharField(max_length=50, default='per project')
    turnaround_time = models.CharField(max_length=100, default='1-2 weeks')
    is_active = models.BooleanField(default=True)
    image = models.ImageField(upload_to='services/', blank=True, null=True)
    
    # Structured dynamic specifications
    offerings = models.JSONField(default=list, blank=True)
    applications = models.JSONField(default=list, blank=True)
    materials = models.JSONField(default=list, blank=True)
    benefits = models.JSONField(default=list, blank=True)
    process_steps = models.JSONField(default=list, blank=True)
    customization_info = models.TextField(blank=True, default='')

    class Meta:
        ordering = ['category', 'title']

    def __str__(self):
        return self.title

    @property
    def primary_image_url(self):
        primary = self.gallery_images.filter(is_primary=True).first()
        if primary and primary.image:
            return primary.image.url
        if self.image:
            return self.image.url
        first = self.gallery_images.first()
        return first.image.url if first and first.image else None

class ServiceImage(TimeStampedModel):
    service = models.ForeignKey(Service, on_delete=models.CASCADE, related_name='gallery_images')
    image = models.ImageField(upload_to='services/gallery/')
    caption = models.CharField(max_length=200, blank=True, null=True)
    description = models.TextField(blank=True, default='')
    order = models.PositiveIntegerField(default=0)
    is_primary = models.BooleanField(default=False)

    class Meta:
        ordering = ['order', 'created_at']

    def __str__(self):
        return f'{self.service.title} - {self.caption or "Image"}'
