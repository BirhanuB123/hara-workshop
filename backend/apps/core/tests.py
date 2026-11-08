from django.test import TestCase, Client, override_settings
from django.conf import settings
from corsheaders.checks import check_settings
from corsheaders.conf import conf
from config.settings import _normalize_origin


class CorsConfigurationTests(TestCase):
    """
    Tests ensuring CORS origin normalization, system check validation,
    and HTTP request handling for production and development origins.
    """

    def setUp(self):
        self.client = Client()

    def test_normalize_origin_strips_trailing_slash_and_path(self):
        """Verify _normalize_origin cleans trailing slashes per RFC 6454."""
        self.assertEqual(
            _normalize_origin('https://hara-workshop.vercel.app/'),
            'https://hara-workshop.vercel.app'
        )
        self.assertEqual(
            _normalize_origin('https://hara-workshop.vercel.app'),
            'https://hara-workshop.vercel.app'
        )
        self.assertEqual(
            _normalize_origin('http://localhost:5173/'),
            'http://localhost:5173'
        )
        self.assertEqual(
            _normalize_origin('http://localhost:5173'),
            'http://localhost:5173'
        )
        self.assertEqual(
            _normalize_origin('  https://hara-workshop.vercel.app///  '),
            'https://hara-workshop.vercel.app'
        )
        self.assertEqual(_normalize_origin(''), '')

    def test_cors_system_check_accepts_clean_origin(self):
        """Verify check_settings produces 0 errors for the valid production origin."""
        with override_settings(CORS_ALLOWED_ORIGINS=['https://hara-workshop.vercel.app']):
            errors = check_settings()
            cors_e014_errors = [e for e in errors if e.id == 'corsheaders.E014']
            self.assertEqual(len(cors_e014_errors), 0)

    def test_cors_system_check_rejects_trailing_slash(self):
        """Verify check_settings raises corsheaders.E014 when an origin has a trailing slash."""
        with override_settings(CORS_ALLOWED_ORIGINS=['https://hara-workshop.vercel.app/']):
            errors = check_settings()
            cors_e014_errors = [e for e in errors if e.id == 'corsheaders.E014']
            self.assertGreater(len(cors_e014_errors), 0)
            self.assertIn("should not have path", cors_e014_errors[0].msg)

    def test_cors_request_allowed_for_production_origin(self):
        """Verify HTTP GET with valid production origin receives Access-Control-Allow-Origin."""
        res = self.client.get('/api/health/', HTTP_ORIGIN='https://hara-workshop.vercel.app')
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.headers.get('Access-Control-Allow-Origin'), 'https://hara-workshop.vercel.app')
        self.assertEqual(res.headers.get('Access-Control-Allow-Credentials'), 'true')

    def test_cors_request_rejected_for_unauthorized_origin(self):
        """Verify HTTP GET with unauthorized origin receives no CORS headers."""
        res = self.client.get('/api/health/', HTTP_ORIGIN='https://malicious-site.com')
        self.assertEqual(res.status_code, 200)
        self.assertNotIn('Access-Control-Allow-Origin', res.headers)

    def test_cors_preflight_allowed_for_production_origin(self):
        """Verify OPTIONS preflight request succeeds for production origin."""
        res = self.client.options(
            '/api/health/',
            HTTP_ORIGIN='https://hara-workshop.vercel.app',
            HTTP_ACCESS_CONTROL_REQUEST_METHOD='GET'
        )
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.headers.get('Access-Control-Allow-Origin'), 'https://hara-workshop.vercel.app')

    def test_cors_preflight_rejected_for_unauthorized_origin(self):
        """Verify OPTIONS preflight request is rejected for unauthorized origin."""
        res = self.client.options(
            '/api/health/',
            HTTP_ORIGIN='https://malicious-site.com',
            HTTP_ACCESS_CONTROL_REQUEST_METHOD='GET'
        )
        self.assertNotIn('Access-Control-Allow-Origin', res.headers)
