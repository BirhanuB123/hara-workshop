from django.db import models
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
