import uuid
from django.db import models
from django.conf import settings

class TimeStampedModel(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True

class WorkshopSettings(TimeStampedModel):
    name = models.CharField(max_length=255, default='Hara Workshop')
    tagline = models.CharField(max_length=255, default='Metal and Wood Solution')
    phone = models.CharField(max_length=50, default='+251926629999')
    email = models.EmailField(default='info@haraworkshop.com')
    telegram = models.CharField(max_length=100, default='@haraworkshop')
    address = models.CharField(max_length=255, default='Addis Ababa, Bole Arabsa, Water Tanker')
    address_amharic = models.CharField(max_length=255, default='አዲስ አበባ ቦሌ አራብሳ ውሃ ታንከር')
    working_hours = models.CharField(max_length=255, default='Mon - Sat: 8:00 AM - 6:00 PM')
    currency = models.CharField(max_length=10, default='ETB')
    vat_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=15.00)
    quote_validity_days = models.PositiveIntegerField(default=15)
    logo = models.ImageField(upload_to='branding/', blank=True, null=True)

    class Meta:
        verbose_name_plural = 'Workshop Settings'

    def __str__(self):
        return f'{self.name} Settings'

class AuditLog(TimeStampedModel):
    ACTION_CHOICES = (
        ('LOGIN', 'User Login'),
        ('LOGOUT', 'User Logout'),
        ('CREATE', 'Created Resource'),
        ('UPDATE', 'Updated Resource'),
        ('DELETE', 'Deleted Resource'),
        ('STATUS_CHANGE', 'Status Changed'),
        ('PRICE_PROPOSAL', 'Price Proposed'),
        ('QUOTE_ACCEPT', 'Quote Accepted'),
        ('ORDER_CONVERT', 'Order Converted'),
        ('PAYMENT_RECORD', 'Payment Recorded'),
        ('STAGE_ADVANCE', 'Production Stage Advanced'),
        ('STOCK_TRANSACTION', 'Inventory Transaction'),
    )

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='audit_logs')
    action = models.CharField(max_length=50, choices=ACTION_CHOICES)
    resource = models.CharField(max_length=100)
    resource_id = models.CharField(max_length=100, blank=True, null=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    metadata = models.JSONField(default=dict, blank=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.action} on {self.resource} by {self.user}'
