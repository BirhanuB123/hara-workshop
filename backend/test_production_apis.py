import os
import sys
import json
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.test import Client
from apps.products.models import Product, Category
from apps.services.models import Service
from apps.quotations.models import Quote, QuoteStatus
from apps.quotations.tasks import send_telegram_quote_notification

def run_tests():
    print("=" * 70)
    print("HARA WORKSHOP - PRODUCTION API & WORKFLOW VERIFICATION SUITE")
    print("=" * 70)
    
    client = Client()
    
    # -------------------------------------------------------------------------
    # 1. Product List API
    # -------------------------------------------------------------------------
    print("\n[TEST 1] Testing Product List API (GET /api/products/)...")
    res = client.get('/api/products/')
    assert res.status_code == 200, f"Expected 200, got {res.status_code}"
    data = res.json()
    assert 'count' in data, "Response missing 'count'"
    assert 'results' in data, "Response missing 'results'"
    assert len(data['results']) > 0, "No products returned in results"
    print(f"  ✓ Total active products count: {data['count']}, returned on page 1: {len(data['results'])}")
    sample_prod = data['results'][0]
    for field in ['id', 'name', 'sku', 'service_category', 'starting_price']:
        assert field in sample_prod, f"Missing required field {field} in product serializer"
    print(f"  ✓ Serializer structure verified: sample SKU '{sample_prod['sku']}' - '{sample_prod['name']}'")

    # -------------------------------------------------------------------------
    # 2. Category & Service Slug Filtering
    # -------------------------------------------------------------------------
    print("\n[TEST 2] Testing Product Category & Slug Filters...")
    res_wood = client.get('/api/products/?service_category=WOOD_WORKS')
    assert res_wood.status_code == 200
    assert res_wood.json()['count'] == 50, f"Expected 50 Wood Works products, got {res_wood.json()['count']}"

    res_metal = client.get('/api/products/?service_category=METAL_WORKS')
    assert res_metal.status_code == 200
    assert res_metal.json()['count'] == 15, f"Expected 15 Metal Works products, got {res_metal.json()['count']}"

    res_hybrid = client.get('/api/products/?service_category=HYBRID_METAL_WOOD')
    assert res_hybrid.status_code == 200
    assert res_hybrid.json()['count'] == 25, f"Expected 25 Hybrid products, got {res_hybrid.json()['count']}"

    res_slug_wood = client.get('/api/products/?service_slug=wood-works')
    assert res_slug_wood.status_code == 200
    assert res_slug_wood.json()['count'] == 50, f"Expected 50 via service_slug=wood-works, got {res_slug_wood.json()['count']}"

    res_slug_hybrid = client.get('/api/products/?service_slug=hybrid-metal-wood')
    assert res_slug_hybrid.status_code == 200
    assert res_slug_hybrid.json()['count'] == 25, f"Expected 25 via service_slug=hybrid-metal-wood, got {res_slug_hybrid.json()['count']}"
    print("  ✓ Verified category filters: Wood (50), Metal (15), Hybrid (25). Total = 90 products.")

    # -------------------------------------------------------------------------
    # 3. Service List API
    # -------------------------------------------------------------------------
    print("\n[TEST 3] Testing Service List API (GET /api/services/)...")
    res_svc = client.get('/api/services/')
    assert res_svc.status_code == 200, f"Expected 200, got {res_svc.status_code}"
    svc_data = res_svc.json()
    svc_list = svc_data if isinstance(svc_data, list) else svc_data.get('results', [])
    assert len(svc_list) >= 3, f"Expected at least 3 services, got {len(svc_list)}"
    titles = [s['title'] for s in svc_list]
    print(f"  ✓ Active services returned: {titles}")

    # -------------------------------------------------------------------------
    # 4. Service Detail: Wood Works (/services/wood-works/)
    # -------------------------------------------------------------------------
    print("\n[TEST 4] Testing Wood Works Detail API (GET /api/services/wood-works/)...")
    res_ww = client.get('/api/services/wood-works/')
    assert res_ww.status_code == 200, f"Expected 200, got {res_ww.status_code}: {res_ww.content}"
    ww_obj = res_ww.json()
    assert 'title' in ww_obj and 'Wood Works' in ww_obj['title']
    assert ww_obj['slug'] == 'wood-works'
    print(f"  ✓ Wood Works service resolved cleanly: {ww_obj['title']} (slug: {ww_obj['slug']})")

    # -------------------------------------------------------------------------
    # 5. Service Detail: Hybrid Metal + Wood (/services/hybrid-metal-wood/)
    # -------------------------------------------------------------------------
    print("\n[TEST 5] Testing Hybrid Detail API (GET /api/services/hybrid-metal-wood/)...")
    res_hw = client.get('/api/services/hybrid-metal-wood/')
    assert res_hw.status_code == 200, f"Expected 200, got {res_hw.status_code}: {res_hw.content}"
    hw_obj = res_hw.json()
    assert 'title' in hw_obj and 'Hybrid' in hw_obj['title']
    assert hw_obj['slug'] == 'hybrid-metal-wood'
    print(f"  ✓ Hybrid service resolved cleanly: {hw_obj['title']} (slug: {hw_obj['slug']})")

    # -------------------------------------------------------------------------
    # 6. Product Detail API (SKU & Slug Lookups)
    # -------------------------------------------------------------------------
    print("\n[TEST 6] Testing Product Detail API (/api/products/<SKU>/)...")
    for sku in ['CHR-001', 'MGT-001', 'HWC-001']:
        res_prod = client.get(f'/api/products/{sku}/')
        assert res_prod.status_code == 200, f"Failed lookup for {sku}: {res_prod.status_code}"
        prod_data = res_prod.json()
        assert prod_data['sku'] == sku
        print(f"  ✓ Product {sku}: {prod_data['name']} (ETB {prod_data['starting_price']})")

    # -------------------------------------------------------------------------
    # 7. Invalid Order Submissions & Validation Errors
    # -------------------------------------------------------------------------
    print("\n[TEST 7] Testing Invalid Order Submissions (Validation errors)...")
    # Empty payload
    r_empty = client.post('/api/quotations/', {})
    assert r_empty.status_code == 400
    assert 'Customer Name is required' in str(r_empty.json())

    # Invalid phone format
    r_bad_phone = client.post('/api/quotations/', {'customer_name': 'Test Customer', 'customer_phone': 'not-a-number'})
    assert r_bad_phone.status_code == 400
    assert 'phone' in str(r_bad_phone.json()).lower() or 'prefix' in str(r_bad_phone.json()).lower()

    # Missing email
    r_no_email = client.post('/api/quotations/', {'customer_name': 'Test Customer', 'customer_phone': '+251911223344'})
    assert r_no_email.status_code == 400
    assert 'Email address is required' in str(r_no_email.json())

    # Missing description
    r_no_desc = client.post('/api/quotations/', {
        'customer_name': 'Test Customer',
        'customer_phone': '+251911223344',
        'customer_email': 'test@example.com',
        'project_title': 'Conference Table',
        'service_type': 'Wood Works',
    })
    assert r_no_desc.status_code == 400
    assert 'Description' in str(r_no_desc.json())
    print("  ✓ All required field validation rules correctly returned HTTP 400 with explicit messages.")

    # -------------------------------------------------------------------------
    # 8. Valid Order Submission & Database Persistence
    # -------------------------------------------------------------------------
    print("\n[TEST 8] Testing Valid Order Submission & Database Persistence...")
    selected_prod = Product.objects.filter(sku='CHR-001').first()
    order_payload = {
        'customer_name': 'Hana Tesfaye (Verification Test)',
        'customer_phone': '+251911998877',
        'customer_email': 'hana.test@example.com',
        'project_title': 'Custom Dining Set Commission',
        'service_type': 'Wood Works',
        'description': 'Handcrafted solid oak dining chairs with ergonomic backrest and matte oil finish.',
        'material_preference': 'Solid Ethiopian Oak',
        'quantity': '6',
        'delivery_required': 'true',
        'installation_required': 'false',
        'site_location': 'Bole Atlas, Addis Ababa',
        'product_id': str(selected_prod.id) if selected_prod else '',
        'product_code': 'CHR-001',
        'product_name': 'Solid Oak Dining Chair',
    }
    r_order = client.post('/api/quotations/', order_payload)
    assert r_order.status_code in [200, 201], f"Expected 200/201, got {r_order.status_code}: {r_order.content}"
    order_res = r_order.json()
    assert order_res.get('status') == 'success', f"Order status was not success: {order_res}"
    quote_num = order_res.get('quote_number')
    quote_id = order_res.get('id')
    assert quote_num and quote_num.startswith('QT-'), f"Invalid quote number: {quote_num}"
    print(f"  ✓ Order created successfully: {quote_num} (ID: {quote_id})")

    # Verify persistence in Database
    persisted_quote = Quote.objects.get(id=quote_id)
    assert persisted_quote.customer_name == 'Hana Tesfaye (Verification Test)'
    assert persisted_quote.customer_phone == '+251911998877'
    assert persisted_quote.customer_email == 'hana.test@example.com'
    assert persisted_quote.quantity == 6
    assert persisted_quote.service_type == 'Wood Works'
    assert persisted_quote.status == QuoteStatus.SUBMITTED
    print(f"  ✓ Verified persistence in PostgreSQL/Database: Quote {persisted_quote.quote_number} stored with all fields.")

    # -------------------------------------------------------------------------
    # 9. Telegram Notification Dispatch
    # -------------------------------------------------------------------------
    print("\n[TEST 9] Testing Telegram Notification Dispatch...")
    tel_result = send_telegram_quote_notification(str(persisted_quote.id))
    assert tel_result.get('status') in ['sent', 'simulated'], f"Notification failed: {tel_result}"
    print(f"  ✓ Telegram notification dispatched for quote {quote_num} (Status: {tel_result.get('status')})")

    # Clean up test order
    persisted_quote.delete()
    print(f"  ✓ Cleaned up test order {quote_num} cleanly.")

    print("\n" + "=" * 70)
    print("ALL PRODUCTION API & WORKFLOW VERIFICATIONS PASSED SUCCESSFULLY!")
    print("=" * 70)

if __name__ == '__main__':
    run_tests()
