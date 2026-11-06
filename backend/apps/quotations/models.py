import os
from django.db import models
from django.conf import settings
from apps.core.models import TimeStampedModel
from datetime import date, timedelta
from decimal import Decimal

class QuoteStatus(models.TextChoices):
    DRAFT = 'DRAFT', 'Draft'
    SUBMITTED = 'SUBMITTED', 'Submitted'
    UNDER_REVIEW = 'UNDER_REVIEW', 'Under Review'
    PRICE_PROPOSED = 'PRICE_PROPOSED', 'Price Proposed'
    CUSTOMER_ACCEPTED = 'CUSTOMER_ACCEPTED', 'Accepted by Customer'
    CUSTOMER_REJECTED = 'CUSTOMER_REJECTED', 'Rejected by Customer'
    EXPIRED = 'EXPIRED', 'Expired'
    CONVERTED_TO_ORDER = 'CONVERTED_TO_ORDER', 'Converted to Order'

class Quote(TimeStampedModel):
    quote_number = models.CharField(max_length=50, unique=True, db_index=True)
    customer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='quotes')
    
    # Guest customer information (no login required)
    customer_name = models.CharField(max_length=200, blank=True, default='')
    customer_phone = models.CharField(max_length=50, blank=True, default='')
    customer_email = models.EmailField(blank=True, default='')

    # Selected product details (attached when requested from product card/page)
    product = models.ForeignKey('products.Product', on_delete=models.SET_NULL, null=True, blank=True, related_name='quotes')
    product_code = models.CharField(max_length=100, blank=True, default='')
    product_name = models.CharField(max_length=200, blank=True, default='')
    product_category = models.CharField(max_length=100, blank=True, default='')
    product_image_url = models.CharField(max_length=500, blank=True, default='')

    project_title = models.CharField(max_length=200)
    service_type = models.CharField(max_length=100, help_text='e.g., Metal Works, Wood Works, Hybrid Metal + Wood')
    description = models.TextField()
    material_preference = models.CharField(max_length=200, blank=True, null=True)

    width_cm = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    height_cm = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    length_cm = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    quantity = models.PositiveIntegerField(default=1)

    # Calculated metrics
    calculated_volume_m3 = models.DecimalField(max_digits=10, decimal_places=4, null=True, blank=True)
    estimated_baseline_amount = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)

    preferred_completion_date = models.DateField(null=True, blank=True)
    installation_required = models.BooleanField(default=False)
    delivery_required = models.BooleanField(default=True)
    delivery_address = models.CharField(max_length=255, blank=True, null=True)
    site_location = models.CharField(max_length=255, blank=True, default='')

    status = models.CharField(max_length=30, choices=QuoteStatus.choices, default=QuoteStatus.SUBMITTED, db_index=True)

    # Cost breakdown in ETB
    materials_cost = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    labor_cost = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    transportation_cost = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    installation_cost = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    additional_charges = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    discount = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    subtotal = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))

    expiration_date = models.DateField(null=True, blank=True)
    workshop_notes = models.TextField(blank=True, null=True)
    customer_notes = models.TextField(blank=True, null=True)

    # Customer Telegram Notification & Order Tracking
    telegram_chat_id = models.CharField(max_length=50, blank=True, default='', db_index=True)
    telegram_link_token = models.CharField(max_length=64, blank=True, default='', db_index=True)
    telegram_token_expires_at = models.DateTimeField(null=True, blank=True)
    telegram_linked_at = models.DateTimeField(null=True, blank=True)
    telegram_last_notified_status = models.CharField(max_length=50, blank=True, default='')

    class Meta:
        ordering = ['-created_at']

    def get_customer_name(self):
        if self.customer_name:
            return self.customer_name
        if self.customer:
            return self.customer.get_full_name() or self.customer.email
        return "Customer"

    def get_customer_phone(self):
        if self.customer_phone:
            return self.customer_phone
        if self.customer:
            return getattr(self.customer, 'phone_number', '') or ''
        return ""

    def get_customer_email(self):
        if self.customer_email:
            return self.customer_email
        if self.customer:
            return self.customer.email
        return ""

    def __str__(self):
        return f'{self.quote_number} - {self.project_title} ({self.get_customer_name()})'

    def calculate_totals(self):
        self.subtotal = (
            Decimal(str(self.materials_cost or 0)) +
            Decimal(str(self.labor_cost or 0)) +
            Decimal(str(self.transportation_cost or 0)) +
            Decimal(str(self.installation_cost or 0)) +
            Decimal(str(self.additional_charges or 0)) -
            Decimal(str(self.discount or 0))
        )
        self.total_amount = max(self.subtotal, Decimal('0.00'))
        return self.total_amount

    def save(self, *args, **kwargs):
        if not self.quote_number:
            year = date.today().year
            last_quote = Quote.objects.filter(quote_number__startswith=f'QT-{year}').order_by('-created_at').first()
            if last_quote:
                try:
                    last_seq = int(last_quote.quote_number.split('-')[-1])
                    seq = last_seq + 1
                except Exception:
                    seq = Quote.objects.count() + 1
            else:
                seq = 1
            self.quote_number = f'QT-{year}-{seq:04d}'

        if not self.expiration_date:
            self.expiration_date = date.today() + timedelta(days=15)

        self.calculate_totals()
        super().save(*args, **kwargs)

class QuoteItem(TimeStampedModel):
    quote = models.ForeignKey(Quote, on_delete=models.CASCADE, related_name='items')
    description = models.CharField(max_length=255)
    quantity = models.PositiveIntegerField(default=1)
    unit_cost = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    total_cost = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))

    def save(self, *args, **kwargs):
        self.total_cost = Decimal(str(self.quantity)) * Decimal(str(self.unit_cost))
        super().save(*args, **kwargs)

class QuoteAttachment(TimeStampedModel):
    quote = models.ForeignKey(Quote, on_delete=models.CASCADE, related_name='attachments')
    file = models.FileField(upload_to='quotes/')
    file_name = models.CharField(max_length=255, blank=True)

    def save(self, *args, **kwargs):
        if not self.file_name and self.file:
            self.file_name = os.path.basename(getattr(self.file, 'name', '') or 'attachment')
        super().save(*args, **kwargs)


class TelegramOrderLink(TimeStampedModel):
    """
    Manages secure, unpredictable, single-use linking tokens that associate
    a customer's Telegram account with an order request for automated updates.
    """
    quote = models.ForeignKey(Quote, on_delete=models.CASCADE, related_name='telegram_links', null=True, blank=True)
    order = models.ForeignKey('orders.Order', on_delete=models.CASCADE, related_name='telegram_links', null=True, blank=True)
    token = models.CharField(max_length=64, unique=True, db_index=True)
    is_used = models.BooleanField(default=False)
    expires_at = models.DateTimeField()

    telegram_user_id = models.CharField(max_length=50, blank=True, default='', db_index=True)
    telegram_username = models.CharField(max_length=100, blank=True, default='')
    telegram_first_name = models.CharField(max_length=100, blank=True, default='')
    linked_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']

    def is_valid(self):
        from django.utils import timezone
        return not self.is_used and self.expires_at > timezone.now()

    def __str__(self):
        ref = self.quote.quote_number if self.quote else (self.order.order_number if self.order else 'Unassigned')
        return f'TelegramLink {ref} (Used: {self.is_used})'

