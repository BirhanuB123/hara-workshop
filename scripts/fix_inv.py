import os

with open('backend/apps/inventory/models.py', 'r', encoding='utf-8') as f:
    code = f.read()

code = code.replace(
    'self.total_cost = self.quantity * self.unit_cost',
    'from decimal import Decimal\n        self.total_cost = Decimal(str(self.quantity or 0)) * Decimal(str(self.unit_cost or 0))'
)
code = code.replace(" default=0.00\, \default=Decimal 0.00 \)

with open('backend/apps/inventory/models.py', 'w', encoding='utf-8') as f:
 f.write(code)

print('Inventory model fixed.')
