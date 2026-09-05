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
    customer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='quotes')
    project_title = models.CharField(max_length=200)
    service_type = models.CharField(max_length=100, help_text='e.g., Metal Door, Kitchen Cabinets, Custom Gate')
    description = models.TextField()
    material_preference = models.CharField(max_length=200, blank=True, null=True)

    width_cm = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    height_cm = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    length_cm = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    quantity = models.PositiveIntegerField(default=1)

    preferred_completion_date = models.DateField(null=True, blank=True)
    installation_required = models.BooleanField(default=False)
    delivery_required = models.BooleanField(default=True)
    delivery_address = models.CharField(max_length=255, blank=True, null=True)

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

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.quote_number} - {self.project_title} ({self.customer.get_full_name()})'

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
            self.file_name = os.path.basename(self.file.name)
        super().save(*args, **kwargs)
