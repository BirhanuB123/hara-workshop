import os
import django
import io
from PIL import Image

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.core.files.uploadedfile import SimpleUploadedFile
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from apps.accounts.models import UserRole
from apps.projects.models import Project, ProjectImage
from apps.products.models import Product, ProductImage, Category
from apps.services.models import Service, ServiceCategory
from apps.quotations.models import Quote
from apps.orders.models import Order

User = get_user_model()

def run_tests():
    print("==================================================")
    print("STARTING E2E ROLES, PRIVACY & CAMERA UPLOAD TESTS")
    print("==================================================")

    # 1. TEST USER ROLES
    print("\n--- 1. Testing Strict 2-Role Enforcement ---")
    roles = [choice[0] for choice in UserRole.choices]
    print(f"Configured User Roles in system: {roles}")
    assert roles == ['ADMIN', 'CUSTOMER'], f"Expected only ['ADMIN', 'CUSTOMER'], got {roles}"
    print("✓ Strict 2-Role architecture verified. No obsolete roles exist.")

    # Setup Users
    admin_user, _ = User.objects.get_or_create(
        email='admin_test@haraworkshop.com',
        defaults={'role': UserRole.ADMIN, 'first_name': 'Super', 'last_name': 'Admin'}
    )
    admin_user.set_password('AdminPass123!')
    admin_user.role = UserRole.ADMIN
    admin_user.is_staff = True
    admin_user.is_superuser = True
    admin_user.save()

    cust_a, _ = User.objects.get_or_create(
        email='customer_a@test.com',
        defaults={'role': UserRole.CUSTOMER, 'first_name': 'Abebe', 'last_name': 'Kebede', 'phone_number': '+251911000001'}
    )
    cust_a.set_password('CustomerPass123!')
    cust_a.role = UserRole.CUSTOMER
    cust_a.is_active = True
    cust_a.save()

    cust_b, _ = User.objects.get_or_create(
        email='customer_b@test.com',
        defaults={'role': UserRole.CUSTOMER, 'first_name': 'Sara', 'last_name': 'Tesfaye', 'phone_number': '+251911000002'}
    )
    cust_b.set_password('CustomerPass123!')
    cust_b.role = UserRole.CUSTOMER
    cust_b.is_active = True
    cust_b.save()

    # 2. TEST CUSTOMER ISOLATION
    print("\n--- 2. Testing Customer Data Privacy & Isolation ---")
    # Customer A creates a Quote and Order
    quote_a = Quote.objects.create(
        customer=cust_a,
        project_title="Customer A Steel Security Door",
        service_type="Metal Works",
        description="Private specs for Customer A residence",
        total_amount=25000.00
    )
    order_a = Order.objects.create(
        customer=cust_a,
        quote=quote_a,
        total_amount=25000.00
    )

    client_b = APIClient()
    client_b.force_authenticate(user=cust_b)

    # Customer B lists quotes
    res_b_quotes = client_b.get('/api/quotations/')
    assert res_b_quotes.status_code == 200
    b_quotes_data = res_b_quotes.data.get('results', res_b_quotes.data)
    quote_ids_seen_by_b = [q['id'] for q in b_quotes_data]
    assert str(quote_a.id) not in quote_ids_seen_by_b, "SECURITY BREACH: Customer B saw Customer A's quote in list!"
    print("✓ Customer B list does not leak Customer A's quotations.")

    # Customer B attempts direct retrieve of Customer A's quote
    res_b_direct_quote = client_b.get(f'/api/quotations/{quote_a.id}/')
    assert res_b_direct_quote.status_code in [403, 404], f"Expected 403 or 404, got {res_b_direct_quote.status_code}"
    print("✓ Customer B direct retrieve of Customer A's quote is blocked (404/403).")

    # Customer B lists orders
    res_b_orders = client_b.get('/api/orders/')
    assert res_b_orders.status_code == 200
    b_orders_data = res_b_orders.data.get('results', res_b_orders.data)
    order_ids_seen_by_b = [o['id'] for o in b_orders_data]
    assert str(order_a.id) not in order_ids_seen_by_b, "SECURITY BREACH: Customer B saw Customer A's order in list!"
    print("✓ Customer B list does not leak Customer A's orders.")

    # Customer B attempts direct retrieve of Customer A's order
    res_b_direct_order = client_b.get(f'/api/orders/{order_a.id}/')
    assert res_b_direct_order.status_code in [403, 404], f"Expected 403 or 404, got {res_b_direct_order.status_code}"
    print("✓ Customer B direct retrieve of Customer A's order is blocked (404/403).")

    # Customer B attempts to access Customer A's profile
    res_b_user_a = client_b.get(f'/api/users/{cust_a.id}/')
    assert res_b_user_a.status_code in [403, 404], f"Customer B should not access user management endpoint, got {res_b_user_a.status_code}"
    print("✓ Customer B cannot access user management endpoints.")

    # 3. TEST CUSTOMER ACCOUNT MANAGEMENT (ADMIN SIDE)
    print("\n--- 3. Testing Customer Account Management (Admin CRM) ---")
    admin_client = APIClient()
    admin_client.force_authenticate(user=admin_user)

    # Admin lists customers
    res_admin_custs = admin_client.get('/api/customers/')
    assert res_admin_custs.status_code == 200
    custs_data = res_admin_custs.data.get('results', res_admin_custs.data)
    emails = [c['email'] for c in custs_data]
    assert 'customer_a@test.com' in emails and 'customer_b@test.com' in emails
    print("✓ Admin successfully retrieves complete customer directory.")

    # Admin inspects customer A details
    res_cust_detail = admin_client.get(f'/api/customers/{cust_a.id}/')
    assert res_cust_detail.status_code == 200
    assert res_cust_detail.data['quotation_count'] >= 1
    assert res_cust_detail.data['order_count'] >= 1
    print(f"✓ Customer inspection shows quotation_count={res_cust_detail.data['quotation_count']}, order_count={res_cust_detail.data['order_count']}")

    # Admin deactivates Customer A
    res_toggle = admin_client.post(f'/api/customers/{cust_a.id}/toggle_active/')
    assert res_toggle.status_code == 200
    assert res_toggle.data['is_active'] is False
    cust_a.refresh_from_db()
    assert cust_a.is_active is False
    print("✓ Admin deactivated Customer A account.")

    # Customer A tries to login while deactivated
    unauth_client = APIClient()
    res_login_blocked = unauth_client.post('/api/auth/login/', {'email': 'customer_a@test.com', 'password': 'CustomerPass123!'})
    assert res_login_blocked.status_code == 401, f"Expected 401 for deactivated account, got {res_login_blocked.status_code}"
    print("✓ Deactivated Customer A is blocked from logging in (401 Unauthorized).")

    # Admin reactivates Customer A
    res_reactivate = admin_client.post(f'/api/customers/{cust_a.id}/toggle_active/')
    assert res_reactivate.status_code == 200
    assert res_reactivate.data['is_active'] is True
    cust_a.refresh_from_db()
    assert cust_a.is_active is True
    print("✓ Admin reactivated Customer A account.")

    # 4. TEST CAMERA IMAGE UPLOAD & MULTIPART MEDIA STORAGE
    print("\n--- 4. Testing Camera Image Upload & Disk Storage (No Base64) ---")
    # Generate 2 test image buffers
    def generate_image_file(name, color):
        img = Image.new('RGB', (200, 200), color=color)
        buf = io.BytesIO()
        img.save(buf, format='JPEG')
        buf.seek(0)
        return SimpleUploadedFile(name, buf.read(), content_type='image/jpeg')

    cam_photo_1 = generate_image_file('camera_shot_1.jpg', (200, 50, 50))
    cam_photo_2 = generate_image_file('camera_shot_2.jpg', (50, 200, 50))

    # Test Project creation with camera photos
    project_payload = {
        'title': 'E2E Camera Test Pergola Project',
        'category': 'CUSTOM',
        'client_type': 'RESIDENTIAL',
        'materials_used': 'Structural Hollow Section & Cedar Slats',
        'description': 'Built and photographed on site using camera component',
        'is_published': 'true',
        'is_featured': 'true',
        'primary_image_index': '1', # second photo should be primary
        'images': [cam_photo_1, cam_photo_2]
    }

    res_proj = admin_client.post('/api/projects/', project_payload, format='multipart')
    assert res_proj.status_code == 201, f"Expected 201, got {res_proj.status_code}: {res_proj.data}"
    proj_id = res_proj.data['id']
    proj_obj = Project.objects.get(id=proj_id)
    proj_images = proj_obj.images.all()
    assert proj_images.count() == 2, f"Expected 2 images, got {proj_images.count()}"
    print(f"✓ Project created with {proj_images.count()} photos uploaded via multipart form.")

    for img in proj_images:
        assert os.path.exists(img.image.path), f"Image file missing on disk: {img.image.path}"
        assert not img.image.name.startswith('data:image'), "Violation: Image is stored as base64 instead of media file!"
        print(f"  ✓ Verified physical file on disk: {img.image.path} (Size: {os.path.getsize(img.image.path)} bytes)")

    # Verify primary image
    assert proj_obj.primary_image_url is not None
    print(f"✓ Primary image resolved to: {proj_obj.primary_image_url}")

    # Test Product creation with camera photo
    cat, _ = Category.objects.get_or_create(name='Showroom Seating', defaults={'slug': 'showroom-seating'})
    prod_photo = generate_image_file('camera_product.jpg', (30, 30, 200))
    prod_payload = {
        'name': 'E2E Camera Custom Industrial Bench',
        'sku': 'E2E-BENCH-99',
        'category': str(cat.id),
        'material': 'Cast Iron & Hardwood',
        'starting_price': '18500',
        'unit': 'PIECE',
        'stock_status': 'MADE_TO_ORDER',
        'description': 'Showroom prototype photographed with camera',
        'images': [prod_photo],
        'primary_image_index': '0'
    }
    res_prod = admin_client.post('/api/products/', prod_payload, format='multipart')
    assert res_prod.status_code == 201, f"Expected 201, got {res_prod.status_code}: {res_prod.data}"
    prod_id = res_prod.data['id']
    prod_obj = Product.objects.get(id=prod_id)
    assert prod_obj.images.count() == 1
    prod_img = prod_obj.images.first()
    assert os.path.exists(prod_img.image.path)
    print(f"✓ Product created with camera photo saved to disk: {prod_img.image.path}")

    # Test Service update with camera photo
    service_photo = generate_image_file('camera_service.jpg', (150, 100, 50))
    serv_cat, _ = ServiceCategory.objects.get_or_create(name='Structural Fabrication', defaults={'slug': 'structural-fab'})
    service_payload = {
        'title': 'Heavy Industrial Structural Fabrication',
        'category': str(serv_cat.id),
        'short_description': 'Heavy beam welding and truss fabrication',
        'full_description': 'Full industrial scale equipment and on-site crane mounting',
        'starting_price': '35000',
        'turnaround_time': '10-20 Days',
        'image': service_photo
    }
    res_serv = admin_client.post('/api/services/', service_payload, format='multipart')
    assert res_serv.status_code == 201, f"Expected 201, got {res_serv.status_code}: {res_serv.data}"
    serv_id = res_serv.data['id']
    serv_obj = Service.objects.get(id=serv_id)
    assert os.path.exists(serv_obj.image.path)
    print(f"✓ Service created with camera photo saved to disk: {serv_obj.image.path}")

    # 5. TEST COMPLETE ABSENCE OF PAYMENTS & FINANCIALS
    print("\n--- 5. Verifying Zero Payments / Financial Endpoints ---")
    forbidden_endpoints = [
        '/api/payments/',
        '/api/invoices/',
        '/api/expenses/',
        '/api/transactions/',
        '/api/accounting/'
    ]
    for ep in forbidden_endpoints:
        res = admin_client.get(ep)
        assert res.status_code in [404, 405], f"Endpoint {ep} should NOT exist! Status: {res.status_code}"
    print("✓ Verified all financial/payment endpoints are completely absent (404 Not Found).")

    print("\n==================================================")
    print("ALL E2E ROLES, PRIVACY & CAMERA TESTS PASSED 100%!")
    print("==================================================")

if __name__ == '__main__':
    run_tests()
