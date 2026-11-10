import io
import shutil
import tempfile
from PIL import Image
from django.core.cache import cache
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase, override_settings
from rest_framework.test import APIClient
from apps.accounts.models import User, UserRole
from .models import Project, ProjectImage


class ProjectMultipartUploadP1Tests(TestCase):
    """P1 regression tests ensuring TemporaryUploadedFile (>2.5 MB) does not break ProjectViewSet create/update."""

    def setUp(self):
        cache.clear()
        self.temp_media = tempfile.mkdtemp(prefix='hara_p1_projects_')
        self.media_override = override_settings(MEDIA_ROOT=self.temp_media)
        self.media_override.enable()

        self.client = APIClient()
        self.admin = User.objects.create_user(
            email='proj_admin@test.com',
            password='Password123!',
            first_name='Admin',
            last_name='Projects',
            role=UserRole.ADMIN,
            is_staff=True,
        )

    def tearDown(self):
        self.media_override.disable()
        shutil.rmtree(self.temp_media, ignore_errors=True)
        cache.clear()

    def _admin_headers(self):
        resp = self.client.post(
            '/api/auth/login/',
            {'email': 'proj_admin@test.com', 'password': 'Password123!'},
            format='json',
        )
        self.assertEqual(resp.status_code, 200, resp.data)
        return {'HTTP_AUTHORIZATION': f"Bearer {resp.data['access']}"}

    def _make_large_png(self, name='large_project.png', size_bytes=3 * 1024 * 1024):
        buf = io.BytesIO()
        Image.new('RGB', (16, 16), color='blue').save(buf, format='PNG')
        raw = buf.getvalue()
        if len(raw) < size_bytes:
            raw += b'\x00' * (size_bytes - len(raw))
        return SimpleUploadedFile(name, raw, content_type='image/png')

    def test_admin_multipart_create_and_update_with_large_temp_uploaded_file(self):
        headers = self._admin_headers()

        create_resp = self.client.post(
            '/api/projects/',
            {
                'title': 'Bole Villa Steel Gate',
                'category': 'METAL',
                'client_type': 'RESIDENTIAL',
                'materials_used': 'Structural mild steel and oak inlay',
                'description': 'Heavy duty architectural driveway gate.',
                'is_published': 'true',
                'is_featured': 'false',
                'images': [self._make_large_png('gate_1.png')],
                'primary_image_index': '0',
            },
            format='multipart',
            **headers,
        )
        self.assertEqual(create_resp.status_code, 201, create_resp.data)
        project_id = create_resp.data['id']
        self.assertEqual(ProjectImage.objects.filter(project_id=project_id).count(), 1)

        update_resp = self.client.patch(
            f'/api/projects/{project_id}/',
            {
                'title': 'Bole Villa Steel Gate v2',
                'images': [self._make_large_png('gate_2.png')],
            },
            format='multipart',
            **headers,
        )
        self.assertEqual(update_resp.status_code, 200, update_resp.data)
        self.assertEqual(update_resp.data['title'], 'Bole Villa Steel Gate v2')
        self.assertEqual(ProjectImage.objects.filter(project_id=project_id).count(), 2)
        self.assertTrue(Project.objects.filter(id=project_id).exists())
