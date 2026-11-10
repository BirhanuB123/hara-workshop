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

class RateLimitingAndSecurityConfigP0Tests(TestCase):
    """P0 security tests for DRF rate limiting and JWT/contact fallback configuration."""

    def setUp(self):
        from django.core.cache import cache
        from rest_framework.test import APIClient

        cache.clear()
        self.api_client = APIClient()

    def tearDown(self):
        from django.core.cache import cache
        cache.clear()

    @override_settings(
        REST_FRAMEWORK={
            'DEFAULT_AUTHENTICATION_CLASSES': (
                'rest_framework_simplejwt.authentication.JWTAuthentication',
                'rest_framework.authentication.SessionAuthentication',
            ),
            'DEFAULT_PERMISSION_CLASSES': (
                'rest_framework.permissions.IsAuthenticated',
            ),
            'DEFAULT_THROTTLE_CLASSES': (
                'rest_framework.throttling.AnonRateThrottle',
                'rest_framework.throttling.UserRateThrottle',
            ),
            'DEFAULT_THROTTLE_RATES': {
                'anon': '120/minute',
                'user': '300/minute',
                'quote_submit': '2/hour',
                'contact_submit': '2/hour',
                'auth_login': '2/minute',
                'auth_register': '2/hour',
            },
        }
    )
    def test_public_and_auth_endpoints_enforce_rate_limits(self):
        from django.core.cache import cache

        # 1. Quote creation throttle
        cache.clear()
        for idx in range(2):
            r = self.api_client.post('/api/quotations/', {}, format='json', REMOTE_ADDR='10.10.0.1')
            self.assertNotEqual(r.status_code, 429, f"Unexpected 429 on quote request {idx}")
        r_limit = self.api_client.post('/api/quotations/', {}, format='json', REMOTE_ADDR='10.10.0.1')
        self.assertEqual(r_limit.status_code, 429)

        # 2. Contact inquiry throttle
        cache.clear()
        for idx in range(2):
            r = self.api_client.post('/api/contact/', {}, format='json', REMOTE_ADDR='10.10.0.2')
            self.assertNotEqual(r.status_code, 429, f"Unexpected 429 on contact request {idx}")
        r_limit = self.api_client.post('/api/contact/', {}, format='json', REMOTE_ADDR='10.10.0.2')
        self.assertEqual(r_limit.status_code, 429)

        # 3. Login throttle
        cache.clear()
        for idx in range(2):
            r = self.api_client.post('/api/auth/login/', {'email': 'nobody@example.com', 'password': 'bad'}, format='json', REMOTE_ADDR='10.10.0.3')
            self.assertNotEqual(r.status_code, 429, f"Unexpected 429 on login attempt {idx}")
        r_limit = self.api_client.post('/api/auth/login/', {'email': 'nobody@example.com', 'password': 'bad'}, format='json', REMOTE_ADDR='10.10.0.3')
        self.assertEqual(r_limit.status_code, 429)

        # 4. Registration throttle
        cache.clear()
        for idx in range(2):
            r = self.api_client.post('/api/auth/register/', {}, format='json', REMOTE_ADDR='10.10.0.4')
            self.assertNotEqual(r.status_code, 429, f"Unexpected 429 on register attempt {idx}")
        r_limit = self.api_client.post('/api/auth/register/', {}, format='json', REMOTE_ADDR='10.10.0.4')
        self.assertEqual(r_limit.status_code, 429)

    @override_settings(
        TELEGRAM_BOT_TOKEN='',
        TELEGRAM_GROUP_CHAT_ID='',
        TELEGRAM_MANAGER_CHAT_ID='',
        TELEGRAM_ADMIN_CHAT_ID='',
    )
    def test_contact_inquiry_handles_empty_telegram_settings_safely(self):
        resp = self.api_client.post(
            '/api/contact/',
            {
                'name': 'Selamawit Tadesse',
                'phone': '+251911778899',
                'email': 'selam@example.com',
                'subject': 'Custom Gate Inquiry',
                'message': 'Interested in a steel sliding gate.',
            },
            format='json',
            REMOTE_ADDR='10.10.0.5',
        )
        self.assertEqual(resp.status_code, 200)
        self.assertTrue(resp.data['success'])
        self.assertFalse(resp.data['telegram_delivered'])


class ContactInquiryValidationP1Tests(TestCase):
    """P1 regression tests for ContactInquiryView sanitization and validation."""

    def setUp(self):
        from django.core.cache import cache
        from rest_framework.test import APIClient

        cache.clear()
        self.client = APIClient()

    def tearDown(self):
        from django.core.cache import cache

        cache.clear()

    def test_contact_inquiry_rejects_null_and_container_fields_without_none_string(self):
        from apps.core.models import AuditLog

        resp = self.client.post(
            '/api/contact/',
            {
                'name': None,
                'phone': '+251911223344',
                'subject': {'bad': 'object'},
                'message': ['bad-list'],
            },
            format='json',
            REMOTE_ADDR='10.20.0.1',
        )
        self.assertEqual(resp.status_code, 400)
        self.assertIn('name', resp.data.get('errors', {}))
        self.assertIn('message', resp.data.get('errors', {}))
        self.assertEqual(AuditLog.objects.filter(resource='ContactInquiry').count(), 0)

    def test_contact_inquiry_validates_email_and_length_limits(self):
        from django.core.cache import cache

        cases = [
            ('invalid_email', {'email': 'not-an-email'}, 'email'),
            ('oversized_email', {'email': ('a' * 245) + '@example.com'}, 'email'),
            ('oversized_subject', {'subject': 'S' * 201}, 'subject'),
            ('oversized_message', {'message': 'M' * 5001}, 'message'),
        ]
        for label, extra, err_key in cases:
            with self.subTest(case=label):
                cache.clear()
                payload = {
                    'name': 'Valid Customer',
                    'phone': '+251911223344',
                    'email': 'ok@example.com',
                    'subject': 'Valid Subject',
                    'message': 'Valid inquiry body.',
                    **extra,
                }
                resp = self.client.post('/api/contact/', payload, format='json', REMOTE_ADDR='10.20.0.2')
                self.assertEqual(resp.status_code, 400, f"Expected 400 for {label}, got {resp.status_code}: {resp.data}")
                self.assertIn(err_key, resp.data.get('errors', {}))

    @override_settings(
        TELEGRAM_BOT_TOKEN='',
        TELEGRAM_GROUP_CHAT_ID='',
        TELEGRAM_MANAGER_CHAT_ID='',
        TELEGRAM_ADMIN_CHAT_ID='',
    )
    def test_contact_inquiry_accepts_ethiopian_and_international_phones(self):
        from django.core.cache import cache
        from apps.core.models import AuditLog

        for idx, (raw_phone, expected_phone) in enumerate([
            ('0911223344', '0911223344'),
            ('251911223344', '+251911223344'),
            ('+14155552671', '+14155552671'),
        ], start=10):
            cache.clear()
            resp = self.client.post(
                '/api/contact/',
                {
                    'name': f'Client {idx}',
                    'phone': raw_phone,
                    'subject': None,
                    'message': 'Interested in a custom steel pergola.',
                },
                format='json',
                REMOTE_ADDR=f'10.20.0.{idx}',
            )
            self.assertEqual(resp.status_code, 200, resp.data)
            self.assertTrue(resp.data['success'])
            latest = AuditLog.objects.filter(resource='ContactInquiry').latest('created_at')
            self.assertEqual(latest.metadata['phone'], expected_phone)
            self.assertEqual(latest.metadata['subject'], '')


class DirectRouterAndActionEndpointsP2Tests(TestCase):
    """P2 regression tests for direct /api/users/, /api/settings/, /api/audit-logs/, and notification mark_read."""

    def setUp(self):
        from django.contrib.auth import get_user_model
        from rest_framework.test import APIClient
        from apps.accounts.models import UserRole

        User = get_user_model()
        self.admin = User.objects.create_user(
            email='p2_admin@haraworkshop.com',
            password='Password123!',
            first_name='Admin',
            last_name='User',
            role=UserRole.ADMIN,
            is_staff=True,
        )
        self.customer = User.objects.create_user(
            email='p2_customer@haraworkshop.com',
            password='Password123!',
            first_name='Customer',
            last_name='User',
            role=UserRole.CUSTOMER,
        )
        self.client = APIClient()

    def test_direct_users_settings_and_audit_logs_routes(self):
        # Customer forbidden
        self.client.force_authenticate(user=self.customer)
        self.assertEqual(self.client.get('/api/users/').status_code, 403)
        self.assertEqual(self.client.get('/api/settings/').status_code, 403)
        self.assertEqual(self.client.patch('/api/settings/update_settings/', {'phone': '+251900000000'}, format='json').status_code, 403)
        self.assertEqual(self.client.get('/api/audit-logs/').status_code, 403)

        # Admin succeeds
        self.client.force_authenticate(user=self.admin)
        users_resp = self.client.get('/api/users/')
        self.assertEqual(users_resp.status_code, 200)
        self.assertEqual(self.client.get(f'/api/users/{self.customer.id}/').status_code, 200)
        self.assertEqual(self.client.get('/api/audit-logs/').status_code, 200)
        self.assertEqual(self.client.get('/api/settings/').status_code, 200)

        upd_resp = self.client.patch(
            '/api/settings/update_settings/',
            {'phone': '+251926629999', 'vat_percentage': '15.00'},
            format='json',
        )
        self.assertEqual(upd_resp.status_code, 200)
        self.assertEqual(upd_resp.data['phone'], '+251926629999')

    def test_notification_mark_read_endpoint_scoped_to_owner(self):
        from apps.notifications.models import Notification

        notif = Notification.objects.create(
            user=self.customer,
            title='Quote Update',
            message='Your quote is ready for review.',
            notification_type='QUOTE',
        )

        # Other user cannot mark someone else's notification read (404 from queryset scoping)
        self.client.force_authenticate(user=self.admin)
        self.assertEqual(self.client.post(f'/api/notifications/{notif.id}/mark_read/').status_code, 404)

        # Owner marks read
        self.client.force_authenticate(user=self.customer)
        res = self.client.post(f'/api/notifications/{notif.id}/mark_read/')
        self.assertEqual(res.status_code, 200)
        self.assertTrue(res.data['is_read'])
        notif.refresh_from_db()
        self.assertTrue(notif.is_read)

