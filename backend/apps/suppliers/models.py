from django.db import models
from apps.core.models import TimeStampedModel

class Supplier(TimeStampedModel):
    name = models.CharField(max_length=200)
    contact_person = models.CharField(max_length=150, blank=True, null=True)
    phone = models.CharField(max_length=50)
    email = models.EmailField(blank=True, null=True)
    address = models.CharField(max_length=255, default='Addis Ababa')
    materials_supplied = models.CharField(max_length=255, help_text='e.g., Structural steel, hardwood timber, welding rods')
    notes = models.TextField(blank=True, null=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return f'{self.name} ({self.phone})'
