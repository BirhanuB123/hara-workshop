import os
import json
import hashlib

def get_hash(path):
    if not os.path.exists(path):
        return None, 0
    with open(path, 'rb') as f:
        data = f.read()
    return hashlib.md5(data).hexdigest(), len(data)

with open('scripts/hybrid_summary.json', 'r', encoding='utf-8') as f:
    products = json.load(f)

print(f"Total hybrid products: {len(products)}")
for p in products:
    sku = p['sku']
    media_path = f"backend/media/products/{sku}.jpg"
    public_path = f"frontend/public/images/services/{sku}.jpg"
    m_hash, m_len = get_hash(media_path)
    p_hash, p_len = get_hash(public_path)
    print(f"[{sku}] {p['name']}")
    print(f"   Desc: {p['description']}")
    print(f"   Material: {p.get('material', '')}")
    print(f"   backend/media/products/{sku}.jpg: exists={os.path.exists(media_path)} size={m_len} hash={m_hash}")
    print(f"   frontend/public/images/services/{sku}.jpg: exists={os.path.exists(public_path)} size={p_len} hash={p_hash}")
    print("-" * 70)
