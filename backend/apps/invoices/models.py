from django.db import models
from django.conf import settings
from apps.core.models import TimeStampedModel
from datetime import date, timedelta

class InvoiceStatus(models.TextChoices):
    DRAFT = 'DRAFT', 'Draft'
    ISSUED = 'ISSUED', 'Issued'
    PARTIALLY_PAID = 'PARTIALLY_PAID', 'Partially Paid'
    PAID = 'PAID', 'Paid'
    OVERDUE = 'OVERDUE', 'Overdue'
    CANCELLED = 'CANCELLED', 'Cancelled'

class Invoice(TimeStampedModel):
    invoice_number = models.CharField(max_length=50, unique=True, db_index=True)
    order = models.ForeignKey('orders.Order', on_delete=models.CASCADE, related_name='invoices')
    customer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='invoices')

    subtotal = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    discount = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    tax_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0.00, help_text='15% VAT')
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)

    amount_paid = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    amount_remaining = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)

    status = models.CharField(max_length=30, choices=InvoiceStatus.choices, default=InvoiceStatus.ISSUED, db_index=True)
    issue_date = models.DateField(default=date.today)
    due_date = models.DateField(null=True, blank=True)
    notes = models.TextField(blank=True, null=True)

    class Meta:
        ordering = ['-issue_date', '-created_at']

    def __str__(self):
        return f'{self.invoice_number} ({self.status}) - {self.total_amount} ETB'

    def save(self, *args, **kwargs):
        if not self.invoice_number:
            year = date.today().year
            last_inv = Invoice.objects.filter(invoice_number__startswith=f'INV-{year}').order_by('-created_at').first()
            if last_inv:
                try:
                    last_seq = int(last_inv.invoice_number.split('-')[-1])
                    seq = last_seq + 1
                except Exception:
                    seq = Invoice.objects.count() + 1
            else:
                seq = 1
            self.invoice_number = f'INV-{year}-{seq:04d}'

        if not self.due_date:
            self.due_date = date.today() + timedelta(days=30)

        self.amount_remaining = max(self.total_amount - self.amount_paid, 0)
        super().save(*args, **kwargs)
