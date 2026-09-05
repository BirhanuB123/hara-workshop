from django.db import models
from django.conf import settings
from apps.core.models import TimeStampedModel
from datetime import date

class PaymentMethod(models.TextChoices):
    TELEBIRR = 'TELEBIRR', 'Telebirr'
    CBE_BIRR = 'CBE_BIRR', 'CBE Birr / Commercial Bank of Ethiopia'
    BANK_TRANSFER = 'BANK_TRANSFER', 'Bank Wire Transfer'
    CASH = 'CASH', 'Cash Payment'
    CHEQUE = 'CHEQUE', 'Cheque'

class PaymentStatus(models.TextChoices):
    PENDING = 'PENDING', 'Pending Verification'
    PROCESSING = 'PROCESSING', 'Processing'
    SUCCESS = 'SUCCESS', 'Payment Received'
    FAILED = 'FAILED', 'Failed'
    REFUNDED = 'REFUNDED', 'Refunded'

class Payment(TimeStampedModel):
    payment_number = models.CharField(max_length=50, unique=True, db_index=True)
    order = models.ForeignKey('orders.Order', on_delete=models.CASCADE, related_name='payments')
    customer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='payments')
    amount = models.DecimalField(max_digits=12, decimal_places=2, help_text='Amount in ETB')
    currency = models.CharField(max_length=10, default='ETB')
    payment_method = models.CharField(max_length=30, choices=PaymentMethod.choices, default=PaymentMethod.TELEBIRR)
    transaction_reference = models.CharField(max_length=100, blank=True, null=True, help_text='Telebirr or CBE Transaction ID')
    status = models.CharField(max_length=30, choices=PaymentStatus.choices, default=PaymentStatus.SUCCESS)
    payment_date = models.DateField(default=date.today)
    receipt_attachment = models.ImageField(upload_to='receipts/', blank=True, null=True)
    recorded_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='recorded_payments')
    notes = models.TextField(blank=True, null=True)

    class Meta:
        ordering = ['-payment_date', '-created_at']

    def __str__(self):
        return f'{self.payment_number} - {self.amount} {self.currency} ({self.status})'

    def save(self, *args, **kwargs):
        if not self.payment_number:
            year = date.today().year
            last_pay = Payment.objects.filter(payment_number__startswith=f'PAY-{year}').order_by('-created_at').first()
            if last_pay:
                try:
                    last_seq = int(last_pay.payment_number.split('-')[-1])
                    seq = last_seq + 1
                except Exception:
                    seq = Payment.objects.count() + 1
            else:
                seq = 1
            self.payment_number = f'PAY-{year}-{seq:04d}'
        super().save(*args, **kwargs)

        # Update order paid amount
        if self.status == PaymentStatus.SUCCESS:
            order = self.order
            total_paid = Payment.objects.filter(order=order, status=PaymentStatus.SUCCESS).aggregate(models.Sum('amount'))['amount__sum'] or 0
            order.paid_amount = total_paid
            if order.paid_amount >= order.total_amount:
                order.status = 'PAID'
            elif order.paid_amount > 0:
                order.status = 'PAYMENT_PENDING'
            order.save()

            # Update invoice
            invoice = order.invoices.first()
            if invoice:
                invoice.amount_paid = total_paid
                invoice.amount_remaining = max(invoice.total_amount - total_paid, 0)
                if invoice.amount_remaining <= 0:
                    invoice.status = 'PAID'
                elif invoice.amount_paid > 0:
                    invoice.status = 'PARTIALLY_PAID'
                invoice.save()
