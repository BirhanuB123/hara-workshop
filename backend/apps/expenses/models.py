from django.db import models
from django.conf import settings
from apps.core.models import TimeStampedModel
from datetime import date

class ExpenseCategory(models.TextChoices):
    MATERIALS = 'MATERIALS', 'Raw Materials Purchase'
    SALARIES = 'SALARIES', 'Staff Wages & Salaries'
    TRANSPORTATION = 'TRANSPORTATION', 'Fuel & Logistics'
    UTILITIES = 'UTILITIES', 'Electricity & Water'
    EQUIPMENT = 'EQUIPMENT', 'Machinery & Tools'
    MAINTENANCE = 'MAINTENANCE', 'Machine Service & Repairs'
    OTHER = 'OTHER', 'Miscellaneous Expenses'

class Expense(TimeStampedModel):
    expense_number = models.CharField(max_length=50, unique=True, db_index=True)
    category = models.CharField(max_length=30, choices=ExpenseCategory.choices, default=ExpenseCategory.MATERIALS)
    amount = models.DecimalField(max_digits=12, decimal_places=2, help_text='Amount in ETB')
    date = models.DateField(default=date.today)
    payment_method = models.CharField(max_length=50, default='CASH')
    description = models.TextField()
    receipt_attachment = models.ImageField(upload_to='expenses/', blank=True, null=True)
    recorded_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)

    class Meta:
        ordering = ['-date', '-created_at']

    def __str__(self):
        return f'{self.expense_number} - {self.category} ({self.amount} ETB)'

    def save(self, *args, **kwargs):
        if not self.expense_number:
            year = date.today().year
            last_exp = Expense.objects.filter(expense_number__startswith=f'EXP-{year}').order_by('-created_at').first()
            if last_exp:
                try:
                    last_seq = int(last_exp.expense_number.split('-')[-1])
                    seq = last_seq + 1
                except Exception:
                    seq = Expense.objects.count() + 1
            else:
                seq = 1
            self.expense_number = f'EXP-{year}-{seq:04d}'
        super().save(*args, **kwargs)
