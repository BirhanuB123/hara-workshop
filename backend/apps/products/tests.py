from decimal import Decimal
from django.test import TestCase
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
