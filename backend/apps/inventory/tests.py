from django.test import TestCase
from decimal import Decimal
from apps.inventory.models import Material, MaterialCategory, MaterialUnit, InventoryTransaction

class InventoryStockTests(TestCase):
    def test_stock_recalculation_on_transaction(self):
        mat = Material.objects.create(
            sku='TEST-MAT-01',
            name='Test Square Tube',
            category=MaterialCategory.STEEL,
            unit=MaterialUnit.PIECE,
            current_stock=Decimal('10.00'),
            minimum_stock=Decimal('5.00'),
            unit_cost=Decimal('500.00')
        )

        # Purchase 20 units
        InventoryTransaction.objects.create(
            material=mat,
            transaction_type='PURCHASE',
            quantity=Decimal('20.00'),
            unit_cost=Decimal('500.00')
        )
        mat.refresh_from_db()
        self.assertEqual(mat.current_stock, Decimal('30.00'))

        # Consume 15 units
        InventoryTransaction.objects.create(
            material=mat,
            transaction_type='CONSUMPTION',
            quantity=Decimal('15.00')
        )
        mat.refresh_from_db()
        self.assertEqual(mat.current_stock, Decimal('15.00'))
