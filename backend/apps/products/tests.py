from decimal import Decimal
from django.test import TestCase, override_settings
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from apps.products.models import Product, Category, ServiceCategoryChoice
from apps.products.serializers import ProductSerializer, CategorySerializer

User = get_user_model()


class ProductsApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()

        # Create Categories
        self.cat_wood = Category.objects.create(
            name="Wooden Furniture",
            slug="wooden-furniture",
            description="Wood craftsmanship"
        )
        self.cat_metal = Category.objects.create(
            name="Metal Structures",
            slug="metal-structures",
            description="Precision steel and iron fabrication"
        )
        self.cat_hybrid = Category.objects.create(
            name="Hybrid Pieces",
            slug="hybrid-pieces",
            description="Metal and wood fusion"
        )

        # Create Products
        self.prod_wood = Product.objects.create(
            name="Executive Wood Desk",
            slug="executive-wood-desk",
            sku="WD-DESK-01",
            category=self.cat_wood,
            service_category=ServiceCategoryChoice.WOOD_WORKS,
            material="Solid Wanza / Oak",
            description="High-end executive timber desk",
            starting_price=Decimal("18000.00"),
            is_active=True,
            is_featured=True
        )
        self.prod_metal = Product.objects.create(
            name="Security Metal Gate",
            slug="security-metal-gate",
            sku="MT-GATE-01",
            category=self.cat_metal,
            service_category=ServiceCategoryChoice.METAL_WORKS,
            material="Reinforced Steel Tubing",
            description="Perimeter security swing gate",
            starting_price=Decimal("35000.00"),
            is_active=True,
            is_featured=False
        )
        self.prod_hybrid = Product.objects.create(
            name="Industrial Coffee Table",
            slug="industrial-coffee-table",
            sku="HY-TABL-01",
            category=self.cat_hybrid,
            service_category=ServiceCategoryChoice.HYBRID_METAL_WOOD,
            material="Steel Frame & Hardwood Top",
            description="Modern industrial coffee table",
            starting_price=Decimal("12500.00"),
            is_active=True,
            is_featured=True
        )

    def test_products_list_endpoint_default(self):
        """Verifies GET /api/products/ returns HTTP 200 and all active products."""
        resp = self.client.get("/api/products/")
        self.assertEqual(resp.status_code, 200)
        results = resp.data.get("results", resp.data)
        self.assertGreaterEqual(len(results), 3)

    def test_products_list_with_service_category_wood_works_and_page_size_100(self):
        """Verifies GET /api/products/?service_category=WOOD_WORKS&page_size=100 returns 200 without error."""
        resp = self.client.get("/api/products/?service_category=WOOD_WORKS&page_size=100")
        self.assertEqual(resp.status_code, 200)
        results = resp.data.get("results", resp.data)
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]["sku"], "WD-DESK-01")
        self.assertEqual(results[0]["service_category"], ServiceCategoryChoice.WOOD_WORKS)

    def test_products_service_category_case_and_delimiter_normalization(self):
        """Verifies case-insensitive and hyphenated variants normalize accurately to the DB choices."""
        variants = [
            ("wood-works", "WD-DESK-01"),
            ("WOOD_WORKS", "WD-DESK-01"),
            ("wood_works", "WD-DESK-01"),
            ("wood", "WD-DESK-01"),
            ("metal-works", "MT-GATE-01"),
            ("METAL_WORKS", "MT-GATE-01"),
            ("metal", "MT-GATE-01"),
            ("hybrid", "HY-TABL-01"),
            ("HYBRID", "HY-TABL-01"),
            ("hybrid-metal-wood", "HY-TABL-01"),
            ("HYBRID_METAL_WOOD", "HY-TABL-01"),
        ]
        for query_val, expected_sku in variants:
            with self.subTest(query=query_val):
                resp = self.client.get(f"/api/products/?service_category={query_val}")
                self.assertEqual(resp.status_code, 200)
                results = resp.data.get("results", resp.data)
                self.assertEqual(len(results), 1)
                self.assertEqual(results[0]["sku"], expected_sku)

    def test_products_service_category_invalid_fallback(self):
        """Verifies unknown service category does not raise 400 or 500, but returns an empty list gracefully."""
        resp = self.client.get("/api/products/?service_category=NONEXISTENT_CATEGORY")
        self.assertEqual(resp.status_code, 200)
        results = resp.data.get("results", resp.data)
        self.assertEqual(len(results), 0)

    def test_user_without_role_attribute_does_not_crash(self):
        """Verifies that an authenticated user lacking a 'role' attribute does not cause an AttributeError."""
        user = User.objects.create_user(
            email="staff@test.com",
            password="Password123!",
            first_name="Staff",
            last_name="Member"
        )
        self.client.force_authenticate(user=user)
        resp = self.client.get("/api/products/?service_category=WOOD_WORKS")
        self.assertEqual(resp.status_code, 200)

    def test_primary_image_url_safe_when_no_image(self):
        """Verifies primary_image_url returns None when no image is associated."""
        prod = Product.objects.create(
            name="Image-less Chair",
            slug="imageless-chair",
            sku="NO-IMG-01",
            category=self.cat_wood,
            service_category=ServiceCategoryChoice.WOOD_WORKS,
            material="Wood",
            description="Basic wooden chair",
            starting_price=Decimal("5000.00"),
            is_active=True
        )
        self.assertIsNone(prod.primary_image_url)

        serializer = ProductSerializer(prod)
        self.assertIsNone(serializer.data.get("primary_image_url"))

    def test_category_serializer_safe_without_image(self):
        """Verifies CategorySerializer handles missing image gracefully without throwing exceptions."""
        serializer = CategorySerializer(self.cat_wood)
        self.assertIsNone(serializer.data.get("image_url"))

class CatalogAndServiceSecurityP0Tests(TestCase):
    """P0 Security regression tests locking down product/category/service writes while preserving public reads."""

    def setUp(self):
        import tempfile
        from django.core.cache import cache
        from apps.services.models import ServiceCategory, Service

        cache.clear()
        self.temp_media = tempfile.mkdtemp(prefix='hara_p0_catalog_')
        self.media_override = override_settings(MEDIA_ROOT=self.temp_media)
        self.media_override.enable()

        self.client = APIClient()
        self.customer = User.objects.create_user(
            email='cat_customer@test.com',
            password='Password123!',
            first_name='Cat',
            last_name='Customer',
            role='CUSTOMER',
        )
        self.admin = User.objects.create_user(
            email='cat_admin@test.com',
            password='Password123!',
            first_name='Cat',
            last_name='Admin',
            role='ADMIN',
            is_staff=True,
        )

        self.category = Category.objects.create(name='Sec Wood', slug='sec-wood', is_active=True)
        self.active_prod = Product.objects.create(
            name='Active Table',
            slug='active-table',
            sku='SEC-ACT-01',
            category=self.category,
            service_category=ServiceCategoryChoice.WOOD_WORKS,
            material='Oak',
            description='Publicly visible',
            starting_price=Decimal('10000.00'),
            is_active=True,
        )
        self.inactive_prod = Product.objects.create(
            name='Draft Secret Table',
            slug='draft-secret-table',
            sku='SEC-DRF-01',
            category=self.category,
            service_category=ServiceCategoryChoice.WOOD_WORKS,
            material='Oak',
            description='Hidden inactive draft',
            starting_price=Decimal('99999.00'),
            is_active=False,
        )

        self.srv_cat = ServiceCategory.objects.create(name='Metal Fabrication', slug='metal-fab')
        self.service = Service.objects.create(
            title='Custom Steel Doors',
            slug='custom-steel-doors',
            category=self.srv_cat,
            short_description='Steel doors',
            full_description='Full steel fabrication',
            is_active=True,
        )

    def tearDown(self):
        import shutil
        from django.core.cache import cache

        self.media_override.disable()
        shutil.rmtree(self.temp_media, ignore_errors=True)
        cache.clear()

    def _jwt_headers(self, email: str, password: str) -> dict:
        resp = self.client.post('/api/auth/login/', {'email': email, 'password': password}, format='json')
        self.assertEqual(resp.status_code, 200)
        return {'HTTP_AUTHORIZATION': f"Bearer {resp.data['access']}"}

    def test_public_reads_succeed_and_inactive_product_is_hidden(self):
        for url in [
            '/api/products/',
            f'/api/products/{self.active_prod.sku}/',
            '/api/products/subcategories/',
            '/api/products/categories/',
            '/api/services/',
            f'/api/services/{self.service.id}/',
            '/api/services/categories/',
        ]:
            with self.subTest(url=url):
                self.assertEqual(self.client.get(url).status_code, 200)

        # Inactive product fallback must not expose unpublished products to anonymous users
        self.assertEqual(self.client.get(f'/api/products/{self.inactive_prod.sku}/').status_code, 404)

    def test_anonymous_cannot_mutate_catalog_or_services(self):
        writes = [
            ('post', '/api/products/', {'name': 'Hacked'}),
            ('patch', f'/api/products/{self.active_prod.id}/', {'name': 'Hacked'}),
            ('delete', f'/api/products/{self.active_prod.id}/', {}),
            ('post', '/api/products/categories/', {'name': 'Hacked Cat'}),
            ('post', '/api/products/images/', {}),
            ('post', '/api/services/', {'title': 'Hacked Service'}),
            ('patch', f'/api/services/{self.service.id}/', {'title': 'Hacked Service'}),
            ('delete', f'/api/services/{self.service.id}/', {}),
            ('post', '/api/services/categories/', {'name': 'Hacked SCat'}),
            ('post', f'/api/services/{self.service.id}/upload_image/', {}),
            ('post', f'/api/services/{self.service.id}/delete_image/', {}),
        ]
        for method, url, data in writes:
            with self.subTest(method=method, url=url):
                resp = getattr(self.client, method)(url, data, format='json')
                self.assertEqual(resp.status_code, 401)

    def test_customer_jwt_forbidden_from_catalog_or_service_mutations(self):
        cust_headers = self._jwt_headers('cat_customer@test.com', 'Password123!')
        writes = [
            ('post', '/api/products/', {'name': 'Cust Hacked'}),
            ('patch', f'/api/products/{self.active_prod.id}/', {'starting_price': '1.00'}),
            ('delete', f'/api/products/{self.active_prod.id}/', {}),
            ('post', '/api/products/categories/', {'name': 'Cust Cat', 'slug': 'cust-cat'}),
            ('post', '/api/services/', {'title': 'Cust Service'}),
            ('patch', f'/api/services/{self.service.id}/', {'title': 'Cust Hacked'}),
            ('delete', f'/api/services/{self.service.id}/', {}),
            ('post', '/api/services/categories/', {'name': 'Cust SCat', 'slug': 'cust-scat'}),
            ('post', f'/api/services/{self.service.id}/upload_image/', {}),
        ]
        for method, url, data in writes:
            with self.subTest(method=method, url=url):
                resp = getattr(self.client, method)(url, data, format='json', **cust_headers)
                self.assertEqual(resp.status_code, 403)

    def test_admin_jwt_can_create_update_catalog_and_upload_service_image(self):
        import io
        from PIL import Image
        from django.core.files.uploadedfile import SimpleUploadedFile

        admin_headers = self._jwt_headers('cat_admin@test.com', 'Password123!')

        cat_res = self.client.post(
            '/api/products/categories/',
            {'name': 'New Admin Category', 'slug': 'new-admin-cat', 'is_active': True},
            format='json',
            **admin_headers,
        )
        self.assertEqual(cat_res.status_code, 201, cat_res.data)

        prod_res = self.client.post(
            '/api/products/',
            {
                'name': 'Admin Sofa',
                'slug': 'admin-sofa',
                'sku': 'ADM-SOFA-01',
                'category': self.category.id,
                'service_category': ServiceCategoryChoice.WOOD_WORKS,
                'material': 'Teak',
                'description': 'Handcrafted sofa',
                'starting_price': '22000.00',
            },
            format='json',
            **admin_headers,
        )
        self.assertEqual(prod_res.status_code, 201, prod_res.data)

        srv_cat_res = self.client.post(
            '/api/services/categories/',
            {'name': 'Glass & Metal', 'slug': 'glass-metal'},
            format='json',
            **admin_headers,
        )
        self.assertEqual(srv_cat_res.status_code, 201, srv_cat_res.data)

        buf = io.BytesIO()
        Image.new('RGB', (12, 12), color='blue').save(buf, format='PNG')
        img_file = SimpleUploadedFile('srv_gallery.png', buf.getvalue(), content_type='image/png')
        upload_res = self.client.post(
            f'/api/services/{self.service.id}/upload_image/',
            {'image': img_file, 'caption': 'Workshop Door'},
            format='multipart',
            **admin_headers,
        )
        self.assertEqual(upload_res.status_code, 201, upload_res.data)


class SubcategoriesAndSeedLocalizationP2Tests(TestCase):
    """P2 regression tests for 18 official subcategories (including Metal Handrails & Hybrid) and seed Amharic materials."""

    def setUp(self):
        self.client = APIClient()

    def test_subcategories_endpoint_returns_18_official_categories_and_amharic_map(self):
        resp = self.client.get('/api/products/subcategories/')
        self.assertEqual(resp.status_code, 200)

        data = resp.data
        self.assertEqual(
            data['METAL_WORKS']['subcategories'],
            ['Metal Gates', 'Metal Windows', 'Metal Handrails'],
        )
        self.assertEqual(
            data['HYBRID_METAL_WOOD']['subcategories'],
            ['Hybrid Chairs', 'Hybrid Tables', 'Hybrid Beds', 'Hybrid Shelving', 'Hybrid Wardrobes & Cabinets'],
        )
        self.assertEqual(len(data['WOOD_WORKS']['subcategories']), 10)

        # Verify every subcategory across all 3 services has a distinct Amharic translation
        for svc_key in ('WOOD_WORKS', 'METAL_WORKS', 'HYBRID_METAL_WOOD'):
            svc_data = data[svc_key]
            for en_name, am_name in svc_data['subcategory_map'].items():
                self.assertTrue(am_name and am_name != en_name, f"Missing Amharic name for {svc_key}: {en_name}")

        # Verify filtering by service_slug works for hybrid-metal-wood
        hybrid_resp = self.client.get('/api/products/subcategories/?service_slug=hybrid-metal-wood')
        self.assertEqual(hybrid_resp.status_code, 200)
        self.assertEqual(hybrid_resp.data['service_category'], 'HYBRID_METAL_WOOD')
        self.assertIn('Hybrid Tables', hybrid_resp.data['subcategories'])

    def test_seed_catalog_has_translated_amharic_material_for_all_90_products(self):
        from apps.products.management.commands.seed_official_catalog import CATALOG_DATA, MATERIAL_AMHARIC_MAP

        self.assertEqual(len(CATALOG_DATA), 90)
        for item in CATALOG_DATA:
            mat = item['material']
            am_mat = MATERIAL_AMHARIC_MAP.get(mat)
            self.assertTrue(am_mat and am_mat != mat, f"Missing Amharic material mapping for SKU {item['sku']}: {mat}")

