import json
import os

with open('frontend/src/data/catalogProducts.ts', 'r', encoding='utf-8') as f:
    content = f.read()

start = content.find('[')
end = content.rfind(']') + 1
products = json.loads(content[start:end])
hybrid = [p for p in products if p.get('service_category') == 'HYBRID_METAL_WOOD']
print(f'Total hybrid products in frontend: {len(hybrid)}')
for i, p in enumerate(hybrid, 1):
    print(f"{i}. [{p.get('sku')}] {p.get('name')}")
    print(f"   Category: {p.get('category_name')} / {p.get('subcategory')}")
    print(f"   Image: {p.get('primary_image')}")
    print(f"   Desc: {p.get('description')}")
    print('-'*70)
