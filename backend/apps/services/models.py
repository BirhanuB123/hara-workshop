from django.db import models
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
