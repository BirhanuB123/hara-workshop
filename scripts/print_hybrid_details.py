import json

with open('scripts/hybrid_summary.json', encoding='utf-8') as f:
    products = json.load(f)

categories = ['Hybrid Chairs', 'Hybrid Tables', 'Hybrid Beds', 'Hybrid Shelving', 'Hybrid Wardrobes & Cabinets']
for cat in categories:
    print(f"\n==========================================")
    print(f"=== {cat.upper()} ===")
    print(f"==========================================")
    cat_prods = [p for p in products if p['category'] == cat]
    for p in sorted(cat_prods, key=lambda x: x['sku']):
        print(f"[{p['sku']}] {p['name']}")
        print(f"  Description: {p['description']}")
        print(f"  Material:    {p.get('material', '')}")
