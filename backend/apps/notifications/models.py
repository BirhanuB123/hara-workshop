from django.db import models
from django.conf import settings
from apps.core.models import TimeStampedModel

class NotificationType(models.TextChoices):
    QUOTE = 'QUOTE', 'Quotation'
    ORDER = 'ORDER', 'Order'
    PRODUCTION = 'PRODUCTION', 'Production'
    PAYMENT = 'PAYMENT', 'Payment'
    INVOICE = 'INVOICE', 'Invoice'
    STOCK = 'STOCK', 'Inventory Stock'
    SYSTEM = 'SYSTEM', 'System'
    MESSAGE = 'MESSAGE', 'Message'

class Notification(TimeStampedModel):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notifications')
    title = models.CharField(max_length=200)
    message = models.TextField()
    notification_type = models.CharField(max_length=30, choices=NotificationType.choices, default=NotificationType.SYSTEM)
    link_url = models.CharField(max_length=255, blank=True, null=True)
    is_read = models.BooleanField(default=False)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.title} for {self.user.email}'
