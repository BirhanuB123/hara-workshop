import os

def w(path, content):
    full_path = os.path.normpath(path)
    os.makedirs(os.path.dirname(os.path.abspath(full_path)), exist_ok=True)
    with open(full_path, 'w', encoding='utf-8') as f:
        f.write(content.strip() + '\n')
    print(f'Updated: {full_path}')

w('backend/apps/inventory/models.py', '''from django.db import models
from django.conf import settings
from decimal import Decimal
from apps.core.models import TimeStampedModel

class MaterialCategory(models.TextChoices):
    STEEL = 'STEEL', 'Structural & Sheet Steel'
    WOOD = 'WOOD', 'Timber & Wood Boards'
    GLASS = 'GLASS', 'Glass & Mirrors'
    PAINT = 'PAINT', 'Paint & Powder Coatings'
    HARDWARE = 'HARDWARE', 'Handles, Hinges & Fasteners'
    ALUMINUM = 'ALUMINUM', 'Aluminum Profiles'
    CONSUMABLE = 'CONSUMABLE', 'Welding Rods & Abrasives'
    OTHER = 'OTHER', 'Other Workshop Materials'

class MaterialUnit(models.TextChoices):
    KG = 'KG', 'Kilograms (kg)'
    METER = 'METER', 'Meters (m)'
    PIECE = 'PIECE', 'Pieces (pcs)'
    SHEET = 'SHEET', 'Sheets'
    LITER = 'LITER', 'Liters'

class Material(TimeStampedModel):
    sku = models.CharField(max_length=50, unique=True, db_index=True)
    name = models.CharField(max_length=200)
    category = models.CharField(max_length=50, choices=MaterialCategory.choices, default=MaterialCategory.STEEL)
    unit = models.CharField(max_length=20, choices=MaterialUnit.choices, default=MaterialUnit.PIECE)
    current_stock = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    minimum_stock = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('5.00'))
    unit_cost = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'), help_text='Cost in ETB')
    supplier = models.ForeignKey('suppliers.Supplier', on_delete=models.SET_NULL, null=True, blank=True, related_name='materials')
    location = models.CharField(max_length=100, default='Main Rack A', help_text='Rack/Bay in workshop')
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['category', 'name']

    def __str__(self):
        return f'{self.name} ({self.current_stock} {self.unit})'

    @property
    def is_low_stock(self):
        return self.current_stock <= self.minimum_stock

class InventoryTransaction(TimeStampedModel):
    class TransactionType(models.TextChoices):
        PURCHASE = 'PURCHASE', 'Stock Purchase / Inward'
        CONSUMPTION = 'CONSUMPTION', 'Workshop Production Consumption'
        ADJUSTMENT = 'ADJUSTMENT', 'Stock Take Adjustment'
        RETURN = 'RETURN', 'Return to Supplier'
        WASTE = 'WASTE', 'Scrap / Waste'

    material = models.ForeignKey(Material, on_delete=models.CASCADE, related_name='transactions')
    transaction_type = models.CharField(max_length=30, choices=TransactionType.choices)
    quantity = models.DecimalField(max_digits=12, decimal_places=2)
    unit_cost = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    total_cost = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    performed_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    notes = models.CharField(max_length=255, blank=True, null=True)

    class Meta:
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        self.total_cost = Decimal(str(self.quantity or 0)) * Decimal(str(self.unit_cost or 0))
        super().save(*args, **kwargs)

        # Update current stock
        m = self.material
        q = Decimal(str(self.quantity or 0))
        if self.transaction_type in [self.TransactionType.PURCHASE, self.TransactionType.RETURN]:
            m.current_stock += q
        elif self.transaction_type in [self.TransactionType.CONSUMPTION, self.TransactionType.WASTE]:
            m.current_stock = max(m.current_stock - q, Decimal('0.00'))
        elif self.transaction_type == self.TransactionType.ADJUSTMENT:
            m.current_stock = q
        m.save()
''')
print('Inventory models rewritten cleanly.')
