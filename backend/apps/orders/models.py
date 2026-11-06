from django.db import models
from django.conf import settings
from apps.core.models import TimeStampedModel
from datetime import date

class OrderStatus(models.TextChoices):
    QUOTE_REQUESTED = 'QUOTE_REQUESTED', 'Quote Requested'
    QUOTATION_SENT = 'QUOTATION_SENT', 'Quotation Sent'
    QUOTATION_ACCEPTED = 'QUOTATION_ACCEPTED', 'Quotation Accepted'
    QUOTATION_REJECTED = 'QUOTATION_REJECTED', 'Quotation Rejected'
    ORDER_CONFIRMED = 'ORDER_CONFIRMED', 'Order Confirmed'
    PENDING = 'PENDING', 'Pending'
    CONFIRMED = 'CONFIRMED', 'Confirmed'
    IN_PRODUCTION = 'IN_PRODUCTION', 'In Production'
    QUALITY_CHECK = 'QUALITY_CHECK', 'Quality Check'
    READY = 'READY', 'Ready for Delivery'
    DELIVERY = 'DELIVERY', 'Out for Delivery'
    INSTALLATION = 'INSTALLATION', 'Installation'
    COMPLETED = 'COMPLETED', 'Completed'
    CANCELLED = 'CANCELLED', 'Cancelled'

class Order(TimeStampedModel):
    order_number = models.CharField(max_length=50, unique=True, db_index=True)
    quote = models.OneToOneField('quotations.Quote', on_delete=models.SET_NULL, null=True, blank=True, related_name='order')
    customer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='orders')
    status = models.CharField(max_length=30, choices=OrderStatus.choices, default=OrderStatus.PENDING, db_index=True)

    total_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    paid_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)

    delivery_address = models.CharField(max_length=255, blank=True, null=True)
    delivery_city = models.CharField(max_length=100, default='Addis Ababa')
    expected_delivery_date = models.DateField(null=True, blank=True)
    notes = models.TextField(blank=True, null=True)

    # Customer Telegram Notification & Tracking
    telegram_chat_id = models.CharField(max_length=50, blank=True, default='', db_index=True)
    telegram_linked_at = models.DateTimeField(null=True, blank=True)
    telegram_last_notified_status = models.CharField(max_length=50, blank=True, default='')

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.order_number} ({self.customer.get_full_name()})'

    def save(self, *args, **kwargs):
        if not self.order_number:
            year = date.today().year
            last_order = Order.objects.filter(order_number__startswith=f'HW-{year}').order_by('-created_at').first()
            if last_order:
                try:
                    last_seq = int(last_order.order_number.split('-')[-1])
                    seq = last_seq + 1
                except Exception:
                    seq = Order.objects.count() + 1
            else:
                seq = 1
            self.order_number = f'HW-{year}-{seq:04d}'
        super().save(*args, **kwargs)

class OrderItem(TimeStampedModel):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey('products.Product', on_delete=models.SET_NULL, null=True, blank=True)
    item_title = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    quantity = models.PositiveIntegerField(default=1)
    unit_price = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    total_price = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)

    def save(self, *args, **kwargs):
        self.total_price = self.quantity * self.unit_price
        super().save(*args, **kwargs)
