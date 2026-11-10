import io
import json
import shutil
import tempfile
from PIL import Image
from django.core.cache import cache
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase, override_settings
from rest_framework.test import APIClient
from apps.accounts.models import User, UserRole
from .models import ServiceCategory, ServiceImage


class ServiceMultipartAndLookupP1Tests(TestCase):
    """P1 regression tests ensuring ServiceViewSet handles large TemporaryUploadedFile uploads and slug lookups cleanly."""

    def setUp(self):
        cache.clear()
        self.temp_media = tempfile.mkdtemp(prefix='hara_p1_services_')
        self.media_override = override_settings(MEDIA_ROOT=self.temp_media)
        self.media_override.enable()

        self.client = APIClient()
        self.admin = User.objects.create_user(
            email='svc_admin@test.com',
            password='Password123!',
            first_name='Admin',
            last_name='Services',
            role=UserRole.ADMIN,
            is_staff=True,
        )
        self.category = ServiceCategory.objects.create(
            name='Custom Carpentry',
            slug='custom-carpentry',
            description='Solid hardwood fabrication.',
        )

    def tearDown(self):
        self.media_override.disable()
        shutil.rmtree(self.temp_media, ignore_errors=True)
        cache.clear()

    def _admin_headers(self):
        resp = self.client.post(
            '/api/auth/login/',
            {'email': 'svc_admin@test.com', 'password': 'Password123!'},
            format='json',
        )
        self.assertEqual(resp.status_code, 200, resp.data)
        return {'HTTP_AUTHORIZATION': f"Bearer {resp.data['access']}"}

    def _make_large_png(self, name='large_service.png', size_bytes=3 * 1024 * 1024):
        buf = io.BytesIO()
        Image.new('RGB', (16, 16), color='green').save(buf, format='PNG')
        raw = buf.getvalue()
        if len(raw) < size_bytes:
            raw += b'\x00' * (size_bytes - len(raw))
        return SimpleUploadedFile(name, raw, content_type='image/png')

    def test_admin_multipart_create_and_update_with_large_temp_uploaded_file(self):
        headers = self._admin_headers()

        create_resp = self.client.post(
            '/api/services/',
            {
                'category': str(self.category.id),
                'title': 'Wood Works',
                'short_description': 'Solid timber furniture and doors.',
                'full_description': 'Mastercrafted solid wood joinery built at Bole Arabsa.',
                'offerings': json.dumps(['Dining Tables', 'Solid Doors']),
                'is_active': 'true',
                'images': [self._make_large_png('svc_1.png')],
            },
            format='multipart',
            **headers,
        )
        self.assertEqual(create_resp.status_code, 201, create_resp.data)
        service_id = create_resp.data['id']
        self.assertEqual(create_resp.data['slug'], 'wood-works')
        self.assertEqual(create_resp.data['offerings'], ['Dining Tables', 'Solid Doors'])
        self.assertEqual(ServiceImage.objects.filter(service_id=service_id).count(), 1)

        update_resp = self.client.patch(
            f'/api/services/{service_id}/',
            {
                'tagline': 'Kiln-Dried Hardwoods',
                'images': [self._make_large_png('svc_2.png')],
            },
            format='multipart',
            **headers,
        )
        self.assertEqual(update_resp.status_code, 200, update_resp.data)
        self.assertEqual(update_resp.data['tagline'], 'Kiln-Dried Hardwoods')
        self.assertEqual(ServiceImage.objects.filter(service_id=service_id).count(), 2)

        # Public slug lookup succeeds and missing slug returns 404
        slug_resp = self.client.get('/api/services/wood-works/')
        self.assertEqual(slug_resp.status_code, 200)
        self.assertEqual(slug_resp.data['title'], 'Wood Works')

        missing_resp = self.client.get('/api/services/non-existent-capability/')
        self.assertEqual(missing_resp.status_code, 404)
