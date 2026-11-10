from unittest.mock import patch
from datetime import timedelta
from decimal import Decimal
from django.test import TestCase, override_settings
from django.core.management import call_command
from django.utils import timezone
from apps.accounts.models import User, UserRole
from apps.quotations.models import Quote, QuoteStatus
from apps.core.models import AuditLog
from apps.quotations.tasks import send_telegram_quote_notification


class QuotationWorkflowTests(TestCase):
    def setUp(self):
        self.customer = User.objects.create_user(
            email='cust@test.com',
            password='Password123!',
            first_name='Abel',
            last_name='Mulu',
            role=UserRole.CUSTOMER
        )

    def test_quotation_calculations(self):
        quote = Quote.objects.create(
            customer=self.customer,
            project_title='Custom Entrance Door',
            service_type='Metal Works',
            description='Heavy steel door',
            materials_cost=Decimal('20000.00'),
            labor_cost=Decimal('8000.00'),
            transportation_cost=Decimal('2000.00'),
            installation_cost=Decimal('3000.00'),
            additional_charges=Decimal('0.00'),
            discount=Decimal('1000.00')
        )
        quote.calculate_totals()
        # 20,000 + 8,000 + 2,000 + 3,000 - 1,000 = 32,000 ETB
        self.assertEqual(quote.total_amount, Decimal('32000.00'))
        self.assertTrue(quote.quote_number.startswith('QT-'))


@override_settings(
    TELEGRAM_BOT_TOKEN="123456789:ABCDEF1234567890abcdef1234567890",
    TELEGRAM_GROUP_CHAT_ID="-5374750855",
    TELEGRAM_MANAGER_CHAT_ID="860309749",
    TELEGRAM_ADMIN_CHAT_ID="1774429006"
)
class TelegramQuotationNotificationTests(TestCase):
    def setUp(self):
        self.quote = Quote.objects.create(
            customer_name="Abebe Bikila",
            customer_phone="+251911223344",
            customer_email="abebe@example.com",
            project_title="Solid Oak Dining Table",
            service_type="Wood Works",
            description="6-seater dining table crafted from solid timber",
            quantity=1,
            estimated_baseline_amount=Decimal("25000.00"),
            total_amount=Decimal("25000.00")
        )

    @patch("apps.quotations.tasks._send_telegram_http")
    def test_telegram_delivery_both_succeed(self, mock_http):
        """Mocked test: both destinations succeed -> status is 'sent'."""
        mock_http.return_value = {"ok": True, "result": {"message_id": 1001}}

        result = send_telegram_quote_notification(str(self.quote.id))

        self.assertEqual(result["status"], "sent")
        self.assertEqual(result["delivered_count"], 2)
        self.assertEqual(result["destinations"]["-5374750855"]["status"], "sent")
        self.assertEqual(result["destinations"]["860309749"]["status"], "sent")

        # Verify AuditLog entry was recorded
        log_entry = AuditLog.objects.filter(resource="Quote", resource_id=str(self.quote.id), action="TELEGRAM_DISPATCH").latest("created_at")
        self.assertEqual(log_entry.metadata["overall_status"], "sent")
        self.assertIn("-5374750855", log_entry.metadata["delivered_destinations"])
        self.assertIn("860309749", log_entry.metadata["delivered_destinations"])

    @patch("apps.quotations.tasks._send_telegram_http")
    def test_telegram_delivery_group_succeeds_manager_fails(self, mock_http):
        """Mocked test: Group succeeds, Manager fails (bot blocked) -> status is 'partial'."""
        def side_effect(token, chat_id, text):
            if chat_id == "-5374750855":
                return {"ok": True, "result": {"message_id": 2001}}
            elif chat_id == "860309749":
                raise RuntimeError("Telegram API HTTP 403: Forbidden - bot was blocked by the user")
            return {"ok": True}

        mock_http.side_effect = side_effect

        result = send_telegram_quote_notification(str(self.quote.id))

        self.assertEqual(result["status"], "partial")
        self.assertEqual(result["delivered_count"], 1)
        self.assertEqual(result["destinations"]["-5374750855"]["status"], "sent")
        self.assertEqual(result["destinations"]["860309749"]["status"], "failed")
        self.assertIn("start", result["destinations"]["860309749"]["instruction"].lower())

    @patch("apps.quotations.tasks._send_telegram_http")
    def test_telegram_delivery_manager_succeeds_group_fails(self, mock_http):
        """Mocked test: Manager succeeds, Group fails -> status is 'partial'."""
        def side_effect(token, chat_id, text):
            if chat_id == "860309749":
                return {"ok": True, "result": {"message_id": 3001}}
            elif chat_id == "-5374750855":
                raise RuntimeError("Telegram API HTTP 400: Bad Request - chat not found")
            return {"ok": True}

        mock_http.side_effect = side_effect

        result = send_telegram_quote_notification(str(self.quote.id))

        self.assertEqual(result["status"], "partial")
        self.assertEqual(result["delivered_count"], 1)
        self.assertEqual(result["destinations"]["860309749"]["status"], "sent")
        self.assertEqual(result["destinations"]["-5374750855"]["status"], "failed")

    @patch("apps.quotations.tasks._send_telegram_http")
    def test_telegram_delivery_both_fail(self, mock_http):
        """Mocked test: Both destinations fail -> status is 'failed'."""
        mock_http.side_effect = RuntimeError("Telegram API HTTP 500: Internal Server Error")

        result = send_telegram_quote_notification(str(self.quote.id))

        self.assertEqual(result["status"], "failed")
        self.assertEqual(result["delivered_count"], 0)
        self.assertEqual(result["destinations"]["-5374750855"]["status"], "failed")
        self.assertEqual(result["destinations"]["860309749"]["status"], "failed")

    @patch("apps.quotations.tasks._send_telegram_http")
    def test_telegram_delivery_invalid_recipient_configuration(self, mock_http):
        """Invalid recipient format or chat ID -> captured gracefully, fails destination safely."""
        from apps.quotations.tasks import resolve_chat_id
        # Verify handle resolution
        self.assertEqual(resolve_chat_id("@Manager_Samuel_A"), "860309749")
        self.assertEqual(resolve_chat_id("@haraworkshop"), "-5374750855")

        # When targeted with an invalid recipient ID that Telegram rejects
        mock_http.side_effect = RuntimeError("Telegram API HTTP 400: Bad Request - chat not found")
        result = send_telegram_quote_notification(str(self.quote.id), target_chat_id="invalid_recipient_9999")
        self.assertEqual(result["status"], "failed")
        self.assertIn("invalid_recipient_9999", result["destinations"])
        self.assertEqual(result["destinations"]["invalid_recipient_9999"]["status"], "failed")

    @override_settings(TELEGRAM_BOT_TOKEN="")
    def test_telegram_delivery_missing_bot_token(self):
        """Missing bot token -> status is 'simulated', no HTTP calls attempted."""
        result = send_telegram_quote_notification(str(self.quote.id))
        self.assertEqual(result["status"], "simulated")
        self.assertEqual(result["delivered_count"], 0)

    @patch("apps.quotations.tasks._send_telegram_http")
    def test_retry_protection_prevents_duplicate_successful_delivery(self, mock_http):
        """
        Retry Protection:
        1. Attempt 1: Group succeeds, manager fails -> partial.
        2. Attempt 2: Without force, Group is skipped (already_sent), only Manager is attempted.
        """
        def first_attempt(token, chat_id, text):
            if chat_id == "-5374750855":
                return {"ok": True, "result": {"message_id": 4001}}
            raise RuntimeError("Telegram API HTTP 403: Forbidden - chat not started")

        mock_http.side_effect = first_attempt
        res1 = send_telegram_quote_notification(str(self.quote.id))
        self.assertEqual(res1["status"], "partial")
        self.assertEqual(mock_http.call_count, 2)

        # Attempt 2: Manager is now available; Group must NOT be re-sent!
        mock_http.reset_mock()
        mock_http.side_effect = None
        mock_http.return_value = {"ok": True, "result": {"message_id": 4002}}

        res2 = send_telegram_quote_notification(str(self.quote.id), force_resend=False)
        self.assertEqual(res2["status"], "sent")
        self.assertEqual(res2["destinations"]["-5374750855"]["status"], "already_sent")
        self.assertEqual(res2["destinations"]["860309749"]["status"], "sent")
        # mock_http should ONLY have been called 1 time (for Manager)!
        self.assertEqual(mock_http.call_count, 1)

    def test_quotation_preserved_even_when_telegram_fails(self):
        """Quote remains preserved in database regardless of notification failures."""
        quote_id = str(self.quote.id)
        with patch("apps.quotations.tasks._send_telegram_http", side_effect=RuntimeError("Network offline")):
            send_telegram_quote_notification(quote_id)

        # Verify quote is completely intact in DB
        reloaded = Quote.objects.get(id=quote_id)
        self.assertIsNotNone(reloaded)
        self.assertEqual(reloaded.customer_name, "Abebe Bikila")

    def test_retry_command_dry_run_does_not_send(self):
        """retry_failed_telegram_notifications default dry-run does not invoke Telegram."""
        with patch("apps.quotations.management.commands.retry_failed_telegram_notifications.send_telegram_quote_notification") as mock_send:
            call_command("retry_failed_telegram_notifications", quote_id=str(self.quote.id))
            self.assertEqual(mock_send.call_count, 0)

    def test_retry_command_execute_dispatches(self):
        """retry_failed_telegram_notifications with --execute calls dispatch."""
        with patch("apps.quotations.management.commands.retry_failed_telegram_notifications.send_telegram_quote_notification") as mock_send:
            mock_send.return_value = {"status": "sent", "destinations": {}}
            call_command("retry_failed_telegram_notifications", quote_id=str(self.quote.id), execute=True)
            self.assertEqual(mock_send.call_count, 1)


@override_settings(
    TELEGRAM_BOT_TOKEN="123456789:ABCDEF1234567890abcdef1234567890",
    TELEGRAM_GROUP_CHAT_ID="-5374750855",
    TELEGRAM_MANAGER_CHAT_ID="860309749",
    FRONTEND_URL="https://hara-workshop.vercel.app"
)
class TelegramBotInteractionTests(TestCase):
    def setUp(self):
        self.quote = Quote.objects.create(
            customer_name="Dawit Bekele",
            customer_phone="+251911998877",
            customer_email="dawit@example.com",
            project_title="Solid Teak Dining Table",
            service_type="Wood Works",
            description="Custom 8-seater dining table",
            quantity=1,
            estimated_baseline_amount=Decimal("45000.00"),
            total_amount=Decimal("45000.00")
        )

    @patch("apps.quotations.telegram_bot._answer_callback_query")
    @patch("apps.quotations.telegram_bot._send_telegram_http")
    def test_callback_query_my_orders_acknowledged_and_replied(self, mock_http, mock_ack):
        """Verifies callback queries for 'my_orders' are acknowledged via answerCallbackQuery and responded to."""
        from apps.quotations.telegram_bot import process_telegram_update
        mock_http.return_value = {"ok": True, "result": {"message_id": 501}}
        mock_ack.return_value = {"ok": True}

        # Link quote to chat 77777
        self.quote.telegram_chat_id = "77777"
        self.quote.save(update_fields=["telegram_chat_id"])

        update = {
            "update_id": 10001,
            "callback_query": {
                "id": "cq_9999",
                "from": {"id": 77777, "username": "dawit_b"},
                "message": {"chat": {"id": 77777}, "message_id": 50},
                "data": "my_orders"
            }
        }

        res = process_telegram_update(update)

        # 1. Verify answerCallbackQuery was called with callback_query_id
        mock_ack.assert_called_once()
        self.assertEqual(mock_ack.call_args[1]["callback_query_id"], "cq_9999")

        # 2. Verify response sent to user
        mock_http.assert_called_once()
        sent_chat_id = mock_http.call_args[1]["chat_id"]
        sent_text = mock_http.call_args[1]["text"]
        self.assertEqual(sent_chat_id, "77777")
        self.assertIn(self.quote.quote_number, sent_text)
        self.assertEqual(res["status"], "replied_callback")

    @patch("apps.quotations.telegram_bot._answer_callback_query")
    @patch("apps.quotations.telegram_bot._send_telegram_http")
    def test_callback_query_status_check(self, mock_http, mock_ack):
        """Verifies callback query status:REF checks the specific order and acknowledges callback."""
        from apps.quotations.telegram_bot import process_telegram_update
        mock_http.return_value = {"ok": True, "result": {"message_id": 502}}
        mock_ack.return_value = {"ok": True}

        self.quote.telegram_chat_id = "77777"
        self.quote.save(update_fields=["telegram_chat_id"])

        update = {
            "update_id": 10002,
            "callback_query": {
                "id": "cq_8888",
                "from": {"id": 77777, "username": "dawit_b"},
                "message": {"chat": {"id": 77777}, "message_id": 51},
                "data": f"status:{self.quote.quote_number}"
            }
        }

        res = process_telegram_update(update)

        mock_ack.assert_called_once()
        self.assertEqual(mock_ack.call_args[1]["callback_query_id"], "cq_8888")
        mock_http.assert_called_once()
        sent_text = mock_http.call_args[1]["text"]
        self.assertIn("ORDER STATUS", sent_text)
        self.assertIn(self.quote.quote_number, sent_text)

    @patch("apps.quotations.telegram_bot._send_telegram_http")
    def test_text_button_variations_for_my_orders(self, mock_http):
        """Verifies text buttons ('📋 My Orders', 'My Orders', '/my_orders', Amharic) all route to orders handler."""
        from apps.quotations.telegram_bot import process_telegram_update
        mock_http.return_value = {"ok": True, "result": {"message_id": 601}}

        self.quote.telegram_chat_id = "88888"
        self.quote.save(update_fields=["telegram_chat_id"])

        variants = ["📋 My Orders", "My Orders", "/my_orders", "/myorders", "my orders", "📋 ትዕዛዞቼ", "Orders"]

        for var in variants:
            mock_http.reset_mock()
            update = {
                "update_id": 20000,
                "message": {
                    "chat": {"id": 88888},
                    "from": {"id": 88888, "username": "customer"},
                    "text": var
                }
            }
            res = process_telegram_update(update)
            self.assertEqual(res["status"], "replied", f"Failed for variant: {var}")
            sent_text = mock_http.call_args[1]["text"]
            self.assertIn(self.quote.quote_number, sent_text, f"Quote not in output for variant: {var}")

    @patch("apps.quotations.telegram_bot._send_telegram_http")
    def test_account_linking_with_valid_start_token(self, mock_http):
        """Verifies /start <token> links quote to user's Telegram chat and sends confirmation."""
        from apps.quotations.telegram_bot import create_order_linking_token, process_telegram_update
        mock_http.return_value = {"ok": True, "result": {"message_id": 701}}

        token, deep_link = create_order_linking_token(quote=self.quote)

        update = {
            "update_id": 30001,
            "message": {
                "chat": {"id": 99999},
                "from": {"id": 99999, "username": "new_customer", "first_name": "New"},
                "text": f"/start {token}"
            }
        }

        process_telegram_update(update)

        # Reload quote from database
        self.quote.refresh_from_db()
        self.assertEqual(self.quote.telegram_chat_id, "99999")
        self.assertIsNotNone(self.quote.telegram_linked_at)

        # Confirmation message should have been sent to chat 99999
        mock_http.assert_called_once()
        self.assertEqual(mock_http.call_args[1]["chat_id"], "99999")
        self.assertIn("ORDER CONFIRMATION", mock_http.call_args[1]["text"])

    @patch("apps.quotations.telegram_bot._send_telegram_http")
    def test_account_linking_with_expired_token(self, mock_http):
        """Verifies expired linking token is rejected with security message and does not link order."""
        from apps.quotations.telegram_bot import create_order_linking_token, process_telegram_update
        mock_http.return_value = {"ok": True, "result": {"message_id": 702}}

        token, deep_link = create_order_linking_token(quote=self.quote)
        from apps.quotations.models import TelegramOrderLink
        link = TelegramOrderLink.objects.get(token=token)
        link.expires_at = timezone.now() - timedelta(days=2)
        link.save()

        update = {
            "update_id": 30002,
            "message": {
                "chat": {"id": 11111},
                "from": {"id": 11111, "username": "expired_user"},
                "text": f"/start {token}"
            }
        }

        process_telegram_update(update)

        self.quote.refresh_from_db()
        self.assertNotEqual(self.quote.telegram_chat_id, "11111")
        self.assertIn("Expired", mock_http.call_args[1]["text"])

    @patch("apps.quotations.telegram_bot._send_telegram_http")
    def test_unlinked_customer_receives_clear_instructions(self, mock_http):
        """Verifies customer with no linked orders receives clear 3-step instructions and website URL."""
        from apps.quotations.telegram_bot import process_telegram_update
        mock_http.return_value = {"ok": True, "result": {"message_id": 801}}

        update = {
            "update_id": 40001,
            "message": {
                "chat": {"id": 54321},
                "from": {"id": 54321, "username": "unlinked_user"},
                "text": "My Orders"
            }
        }

        process_telegram_update(update)

        mock_http.assert_called_once()
        sent_text = mock_http.call_args[1]["text"]
        self.assertIn("No Linked Orders Found", sent_text)
        self.assertIn("How to link your orders", sent_text)
        self.assertIn("https://hara-workshop.vercel.app", sent_text)

    @patch("apps.quotations.telegram_bot._send_telegram_http")
    def test_manager_samuel_detection_on_start(self, mock_http):
        """Verifies Manager Samuel is greeted with verified chat ID and instructions when connecting."""
        from apps.quotations.telegram_bot import process_telegram_update
        mock_http.return_value = {"ok": True, "result": {"message_id": 901}}

        update = {
            "update_id": 50001,
            "message": {
                "chat": {"id": 860309749},
                "from": {"id": 860309749, "username": "Manager_Samuel_A"},
                "text": "/start"
            }
        }

        process_telegram_update(update)

        mock_http.assert_called_once()
        sent_text = mock_http.call_args[1]["text"]
        self.assertIn("Welcome Workshop Manager Samuel", sent_text)
        self.assertIn("860309749", sent_text)

    def test_webhook_diagnostic_get_endpoint(self):
        """Verifies GET /api/telegram/webhook/ returns 200 with service health info."""
        from rest_framework.test import APIClient
        client = APIClient()
        resp = client.get("/api/telegram/webhook/")
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data.get("status"), "active")
        self.assertEqual(resp.data.get("service"), "hara-workshop-telegram-webhook")

class QuoteSecurityAndUploadP0Tests(TestCase):
    """P0 Security regression tests for QuoteViewSet, file upload validation, and Telegram webhook."""

    def setUp(self):
        import tempfile
        from django.core.cache import cache
        from rest_framework.test import APIClient

        cache.clear()
        self.temp_media = tempfile.mkdtemp(prefix='hara_p0_quotes_')
        self.media_override = override_settings(MEDIA_ROOT=self.temp_media)
        self.media_override.enable()

        self.client = APIClient()
        self.customer_a = User.objects.create_user(
            email='quote_cust_a@test.com',
            password='Password123!',
            first_name='Customer',
            last_name='One',
            role=UserRole.CUSTOMER,
        )
        self.customer_b = User.objects.create_user(
            email='quote_cust_b@test.com',
            password='Password123!',
            first_name='Customer',
            last_name='Two',
            role=UserRole.CUSTOMER,
        )
        self.admin_user = User.objects.create_user(
            email='quote_admin@test.com',
            password='Password123!',
            first_name='Admin',
            last_name='Boss',
            role=UserRole.ADMIN,
            is_staff=True,
        )
        self.quote_a = Quote.objects.create(
            customer=self.customer_a,
            customer_name='Customer One',
            customer_phone='+251911000001',
            customer_email='quote_cust_a@test.com',
            project_title='Steel Stairs A',
            service_type='Metal Works',
            description='Heavy duty steel stairs',
            quantity=1,
        )
        self.quote_b = Quote.objects.create(
            customer=self.customer_b,
            customer_name='Customer Two',
            customer_phone='+251911000002',
            customer_email='quote_cust_b@test.com',
            project_title='Oak Table B',
            service_type='Wood Works',
            description='Solid oak dining table',
            quantity=1,
        )

    def tearDown(self):
        import shutil
        from django.core.cache import cache

        self.media_override.disable()
        shutil.rmtree(self.temp_media, ignore_errors=True)
        cache.clear()

    def _jwt_headers(self, email: str, password: str) -> dict:
        resp = self.client.post('/api/auth/login/', {'email': email, 'password': password}, format='json')
        self.assertEqual(resp.status_code, 200, f"Login failed for {email}: {resp.data}")
        return {'HTTP_AUTHORIZATION': f"Bearer {resp.data['access']}"}

    def _make_valid_png(self, name='drawing.png'):
        import io
        from PIL import Image
        from django.core.files.uploadedfile import SimpleUploadedFile

        buf = io.BytesIO()
        Image.new('RGB', (16, 16), color='red').save(buf, format='PNG')
        return SimpleUploadedFile(name, buf.getvalue(), content_type='image/png')

    def test_anonymous_cannot_list_retrieve_or_mutate_existing_quotes(self):
        endpoints = [
            ('get', '/api/quotations/'),
            ('get', f'/api/quotations/{self.quote_a.id}/'),
            ('patch', f'/api/quotations/{self.quote_a.id}/'),
            ('delete', f'/api/quotations/{self.quote_a.id}/'),
            ('get', f'/api/quotations/{self.quote_a.id}/telegram_link/'),
            ('post', f'/api/quotations/{self.quote_a.id}/telegram_link/'),
            ('post', f'/api/quotations/{self.quote_a.id}/propose_price/'),
            ('post', f'/api/quotations/{self.quote_a.id}/convert_to_order/'),
            ('post', f'/api/quotations/{self.quote_a.id}/send_telegram_alert/'),
            ('post', f'/api/quotations/{self.quote_a.id}/accept/'),
            ('post', f'/api/quotations/{self.quote_a.id}/reject/'),
        ]
        for method, url in endpoints:
            with self.subTest(method=method, url=url):
                resp = getattr(self.client, method)(url, {}, format='json')
                self.assertEqual(resp.status_code, 401)

    @patch('apps.quotations.tasks.send_telegram_quote_notification', side_effect=RuntimeError('bot999:SECRET boom'))
    def test_anonymous_public_quote_submission_works_and_hides_internal_telegram_error(self, mock_send):
        payload = {
            'customer_name': 'Public Guest',
            'customer_phone': '+251911223344',
            'customer_email': 'guest@example.com',
            'project_title': 'Custom Window Frame',
            'service_type': 'Metal Works',
            'description': 'Custom forged window grilles',
            'quantity': 2,
        }
        resp = self.client.post('/api/quotations/', payload, format='json')
        self.assertEqual(resp.status_code, 201)
        self.assertIn('quote_number', resp.data)
        self.assertIn('telegram_link_token', resp.data)
        self.assertIn('telegram_deep_link', resp.data)
        self.assertEqual(resp.data['telegram_status'], 'failed')
        self.assertEqual(resp.data['telegram_details'].get('error'), 'Telegram notification delivery failed.')

    def test_customer_jwt_isolation_and_write_protection(self):
        headers_a = self._jwt_headers('quote_cust_a@test.com', 'Password123!')
        headers_b = self._jwt_headers('quote_cust_b@test.com', 'Password123!')

        # Customer A only sees their own quote
        list_a = self.client.get('/api/quotations/', **headers_a)
        self.assertEqual(list_a.status_code, 200)
        results_a = list_a.data.get('results', list_a.data)
        ids_a = {item['id'] for item in results_a}
        self.assertEqual(ids_a, {str(self.quote_a.id)})

        # Customer B cannot access or act on Customer A's quote
        self.assertIn(self.client.get(f'/api/quotations/{self.quote_a.id}/', **headers_b).status_code, (403, 404))
        self.assertIn(self.client.post(f'/api/quotations/{self.quote_a.id}/accept/', {}, format='json', **headers_b).status_code, (403, 404))
        self.assertIn(self.client.get(f'/api/quotations/{self.quote_a.id}/telegram_link/', **headers_b).status_code, (403, 404))

        # Customer A CAN access their own telegram_link, CANNOT tamper with quote pricing/status or invoke admin actions
        link_a = self.client.get(f'/api/quotations/{self.quote_a.id}/telegram_link/', **headers_a)
        self.assertEqual(link_a.status_code, 200)
        self.assertIn('telegram_link_token', link_a.data)

        self.assertEqual(
            self.client.patch(f'/api/quotations/{self.quote_a.id}/', {'total_amount': '1.00'}, format='json', **headers_a).status_code,
            403
        )
        self.assertEqual(
            self.client.post(f'/api/quotations/{self.quote_a.id}/propose_price/', {'materials_cost': '1.00'}, format='json', **headers_a).status_code,
            403
        )
        self.assertEqual(
            self.client.post(f'/api/quotations/{self.quote_a.id}/convert_to_order/', {}, format='json', **headers_a).status_code,
            403
        )
        self.assertEqual(
            self.client.delete(f'/api/quotations/{self.quote_a.id}/', **headers_a).status_code,
            403
        )

    @patch('apps.quotations.telegram_bot._send_telegram_http', return_value={'ok': True, 'result': {'message_id': 99}})
    def test_admin_jwt_can_list_propose_price_and_convert_to_order(self, mock_http):
        headers_admin = self._jwt_headers('quote_admin@test.com', 'Password123!')

        list_all = self.client.get('/api/quotations/', **headers_admin)
        self.assertEqual(list_all.status_code, 200)
        ids = {item['id'] for item in list_all.data.get('results', list_all.data)}
        self.assertTrue({str(self.quote_a.id), str(self.quote_b.id)}.issubset(ids))

        propose = self.client.post(
            f'/api/quotations/{self.quote_a.id}/propose_price/',
            {'materials_cost': '10000.00', 'labor_cost': '5000.00'},
            format='json',
            **headers_admin
        )
        self.assertEqual(propose.status_code, 200)
        self.assertEqual(propose.data['status'], QuoteStatus.PRICE_PROPOSED)
        self.assertEqual(propose.data['total_amount'], '15000.00')

        convert = self.client.post(
            f'/api/quotations/{self.quote_a.id}/convert_to_order/',
            {},
            format='json',
            **headers_admin
        )
        self.assertEqual(convert.status_code, 200)
        self.quote_a.refresh_from_db()
        self.assertEqual(self.quote_a.status, QuoteStatus.CONVERTED_TO_ORDER)

    def test_quote_upload_validation_rejects_bad_files_with_zero_orphans(self):
        from pathlib import Path
        from django.core.cache import cache
        from django.core.files.uploadedfile import SimpleUploadedFile
        from apps.quotations.models import QuoteAttachment

        base_payload = {
            'customer_name': 'Upload Checker',
            'customer_phone': '+251911334455',
            'customer_email': 'upload@example.com',
            'project_title': 'Upload Validation Test',
            'service_type': 'Wood Works',
            'description': 'Testing upload security',
            'quantity': 1,
        }

        invalid_batches = [
            ('svg_xss', [SimpleUploadedFile('xss.svg', b'<svg onload="alert(1)"/>', content_type='image/svg+xml')]),
            ('no_ext', [SimpleUploadedFile('payload', b'rawdata', content_type='application/octet-stream')]),
            ('empty_png', [SimpleUploadedFile('empty.png', b'', content_type='image/png')]),
            ('fake_pdf', [SimpleUploadedFile('fake.pdf', b'NOT_A_PDF_HEADER', content_type='application/pdf')]),
            ('fake_png', [SimpleUploadedFile('shell.png', b'<?php system($_GET["c"]); ?>', content_type='image/png')]),
            ('oversized_pdf', [SimpleUploadedFile('huge.pdf', b'%PDF-' + b'0' * (25 * 1024 * 1024 + 16), content_type='application/pdf')]),
            ('too_many_files', [self._make_valid_png(f'img_{i}.png') for i in range(11)]),
            ('mixed_valid_and_svg', [
                self._make_valid_png('good_first.png'),
                SimpleUploadedFile('bad_second.svg', b'<svg><script>1</script></svg>', content_type='image/svg+xml'),
            ]),
        ]

        before_quotes = Quote.objects.count()
        before_atts = QuoteAttachment.objects.count()

        for label, files in invalid_batches:
            with self.subTest(case=label):
                cache.clear()
                data = {**base_payload, 'attachments': files}
                resp = self.client.post('/api/quotations/', data, format='multipart')
                self.assertEqual(resp.status_code, 400, f"Expected 400 for {label}, got {resp.status_code}: {resp.data}")
                self.assertEqual(Quote.objects.count(), before_quotes)
                self.assertEqual(QuoteAttachment.objects.count(), before_atts)
                saved_files = [p for p in Path(self.temp_media).rglob('*') if p.is_file()]
                self.assertEqual(saved_files, [], f"Orphan files left on disk for {label}: {saved_files}")

    @patch('apps.quotations.tasks.send_telegram_quote_notification', return_value={'status': 'simulated', 'destinations': {}})
    def test_quote_upload_accepts_valid_png_pdf_and_dxf(self, mock_send):
        from pathlib import Path
        from PIL import Image
        from django.core.files.uploadedfile import SimpleUploadedFile
        from apps.quotations.models import QuoteAttachment

        valid_png = self._make_valid_png('design.png')
        # 3 MB PDF exercises TemporaryUploadedFile (> 2.5MB FILE_UPLOAD_MAX_MEMORY_SIZE)
        valid_pdf = SimpleUploadedFile('blueprint.pdf', b'%PDF-1.4\n' + b'0' * (3 * 1024 * 1024) + b'\n%%EOF\n', content_type='application/pdf')
        valid_dxf = SimpleUploadedFile('frame.dxf', b'0\nSECTION\n2\nHEADER\n0\nENDSEC\n0\nEOF\n', content_type='application/dxf')

        resp = self.client.post(
            '/api/quotations/',
            {
                'customer_name': 'Valid Uploader',
                'customer_phone': '+251911445566',
                'customer_email': 'valid@example.com',
                'project_title': 'Valid Multi Upload',
                'service_type': 'Hybrid Metal + Wood Construction',
                'description': 'Conference table with drawings',
                'quantity': 1,
                'attachments': [valid_png, valid_pdf, valid_dxf],
            },
            format='multipart',
        )
        self.assertEqual(resp.status_code, 201, resp.data)
        atts = QuoteAttachment.objects.filter(quote_id=resp.data['id'])
        self.assertEqual(atts.count(), 3)
        disk_files = [p for p in Path(self.temp_media).rglob('*') if p.is_file()]
        self.assertEqual(len(disk_files), 3)

        # Ensure seek(0) preserved full binary content after validation
        png_att = atts.get(file_name='design.png')
        with Image.open(png_att.file.path) as saved_img:
            self.assertEqual(saved_img.size, (16, 16))
        pdf_att = atts.get(file_name='blueprint.pdf')
        with open(pdf_att.file.path, 'rb') as fp:
            self.assertTrue(fp.read(5) == b'%PDF-')

    def test_telegram_webhook_secret_token_fail_closed_and_verified(self):
        # 1. Fail closed when TELEGRAM_WEBHOOK_SECRET is unset
        with override_settings(TELEGRAM_WEBHOOK_SECRET=''):
            get_resp = self.client.get('/api/telegram/webhook/')
            self.assertEqual(get_resp.status_code, 200)
            self.assertFalse(get_resp.data['webhook_secret_configured'])

            self.assertEqual(self.client.post('/api/telegram/webhook/', {'update_id': 1}, format='json').status_code, 403)
            self.assertEqual(self.client.post('/api/quotations/telegram-webhook/', {'update_id': 1}, format='json').status_code, 403)

        # 2. Enforce exact header match via X-Telegram-Bot-Api-Secret-Token
        with override_settings(TELEGRAM_WEBHOOK_SECRET='super-secret-hook-token'):
            self.assertEqual(self.client.post('/api/telegram/webhook/', {'update_id': 1}, format='json').status_code, 403)
            self.assertEqual(
                self.client.post(
                    '/api/telegram/webhook/',
                    {'update_id': 1},
                    format='json',
                    HTTP_X_TELEGRAM_BOT_API_SECRET_TOKEN='wrong-secret',
                ).status_code,
                403,
            )

            with patch('apps.quotations.telegram_bot.process_telegram_update', return_value={'status': 'ignored'}) as mock_proc:
                ok_resp = self.client.post(
                    '/api/telegram/webhook/',
                    {'update_id': 42},
                    format='json',
                    HTTP_X_TELEGRAM_BOT_API_SECRET_TOKEN='super-secret-hook-token',
                )
                self.assertEqual(ok_resp.status_code, 200)
                self.assertEqual(ok_resp.data['status'], 'ignored')
                mock_proc.assert_called_once()

            # Ensure exceptions do not leak internal error text in HTTP 200 fallback
            with patch('apps.quotations.telegram_bot.process_telegram_update', side_effect=RuntimeError('sensitive db traceback')):
                err_resp = self.client.post(
                    '/api/telegram/webhook/',
                    {'update_id': 43},
                    format='json',
                    HTTP_X_TELEGRAM_BOT_API_SECRET_TOKEN='super-secret-hook-token',
                )
                self.assertEqual(err_resp.status_code, 200)
                self.assertEqual(err_resp.data, {'ok': True})

    def test_setup_telegram_webhook_command_requires_and_registers_secret_token(self):
        import io
        import json

        # Fails without TELEGRAM_WEBHOOK_SECRET and makes no network request
        with override_settings(TELEGRAM_BOT_TOKEN='123:test', TELEGRAM_WEBHOOK_SECRET=''):
            with patch('urllib.request.urlopen') as mock_open:
                out = io.StringIO()
                call_command('setup_telegram_webhook', stdout=out)
                self.assertIn('TELEGRAM_WEBHOOK_SECRET is not configured', out.getvalue())
                mock_open.assert_not_called()

        # Sends secret_token in setWebhook payload when configured
        captured_payloads = []

        class DummyResp:
            def __init__(self, body):
                self._body = body
            def read(self):
                return self._body
            def __enter__(self):
                return self
            def __exit__(self, *args):
                return False

        def fake_urlopen(req, timeout=15):
            if 'setWebhook' in req.full_url:
                captured_payloads.append(json.loads(req.data.decode('utf-8')))
                return DummyResp(b'{"ok": true, "description": "Webhook was set"}')
            if 'setMyCommands' in req.full_url:
                return DummyResp(b'{"ok": true}')
            return DummyResp(b'{"ok": true, "result": {"url": "https://example.com"}}')

        with override_settings(TELEGRAM_BOT_TOKEN='123:test', TELEGRAM_WEBHOOK_SECRET='my-hook-secret-77'):
            with patch('urllib.request.urlopen', side_effect=fake_urlopen):
                out = io.StringIO()
                call_command('setup_telegram_webhook', url='https://example.com/api/telegram/webhook/', stdout=out)
                self.assertEqual(len(captured_payloads), 1)
                self.assertEqual(captured_payloads[0]['secret_token'], 'my-hook-secret-77')


class QuoteAndOrderConversionP1Tests(TestCase):
    """P1 regression tests for quote submission, validation, guest conversion, and order search."""

    def setUp(self):
        import tempfile
        from django.core.cache import cache
        from rest_framework.test import APIClient
        from apps.products.models import Product, ServiceCategoryChoice

        cache.clear()
        self.temp_media = tempfile.mkdtemp(prefix='hara_p1_quotes_')
        self.media_override = override_settings(MEDIA_ROOT=self.temp_media)
        self.media_override.enable()

        self.client = APIClient()
        self.admin_user = User.objects.create_user(
            email='p1_admin@test.com',
            password='Password123!',
            first_name='Sam',
            last_name='Workshop',
            role=UserRole.ADMIN,
            is_staff=True,
        )
        self.product = Product.objects.create(
            name='Solid Oak Dining Table',
            sku='TBL-001',
            slug='solid-oak-dining-table',
            service_category=ServiceCategoryChoice.WOOD_WORKS,
            subcategory='Tables',
            description='6-seater solid oak dining table',
            material='Solid Oak',
            starting_price=Decimal('15000.00'),
        )

    def tearDown(self):
        import shutil
        from django.core.cache import cache

        self.media_override.disable()
        shutil.rmtree(self.temp_media, ignore_errors=True)
        cache.clear()

    def _admin_headers(self):
        resp = self.client.post(
            '/api/auth/login/',
            {'email': 'p1_admin@test.com', 'password': 'Password123!'},
            format='json',
        )
        self.assertEqual(resp.status_code, 200, resp.data)
        return {'HTTP_AUTHORIZATION': f"Bearer {resp.data['access']}"}

    @patch('apps.quotations.tasks.send_telegram_quote_notification', return_value={'status': 'simulated', 'destinations': {}})
    def test_non_uuid_product_identifier_does_not_500_and_resolves_catalog_sku(self, mock_send):
        # 1. A 36-char non-UUID product string must not trigger Django UUID ValidationError (500)
        custom_36 = 'CUSTOM-36-CHARACTER-NON-UUID-STRNG01'
        self.assertEqual(len(custom_36), 36)
        resp_custom = self.client.post(
            '/api/quotations/',
            {
                'customer_name': 'Bespoke Client',
                'customer_phone': '+251911887766',
                'customer_email': 'bespoke@example.com',
                'project_title': 'Bespoke Gate Design',
                'service_type': 'metal-works',
                'description': 'Custom ornamental sliding gate.',
                'product': custom_36,
                'quantity': 3,
            },
            format='json',
            REMOTE_ADDR='10.30.0.1',
        )
        self.assertEqual(resp_custom.status_code, 201, resp_custom.data)
        self.assertFalse(resp_custom.data['has_predefined_price'])
        self.assertEqual(resp_custom.data['quantity'], 3)
        self.assertEqual(resp_custom.data['service_category'], 'Metal Works')

        # 2. Catalog SKU resolves Product and calculates predefined baseline pricing + quantity
        from django.core.cache import cache
        cache.clear()
        resp_catalog = self.client.post(
            '/api/quotations/',
            {
                'customer_name': 'Catalog Client',
                'customer_phone': '0911665544',
                'customer_email': 'catalog@example.com',
                'project_title': 'Solid Oak Dining Table',
                'service_type': 'wood-works',
                'description': 'Order for 2 dining tables with delivery.',
                'product': 'TBL-001',
                'quantity': 2,
                'delivery_required': True,
            },
            format='json',
            REMOTE_ADDR='10.30.0.2',
        )
        self.assertEqual(resp_catalog.status_code, 201, resp_catalog.data)
        self.assertTrue(resp_catalog.data['has_predefined_price'])
        self.assertEqual(resp_catalog.data['product_code'], 'TBL-001')
        self.assertEqual(resp_catalog.data['quantity'], 2)
        self.assertEqual(resp_catalog.data['estimated_baseline'], 31500.0)

    def test_quote_validation_rejects_invalid_dates_dimensions_and_caps(self):
        from django.core.cache import cache

        invalid_cases = [
            ('bad_calendar_date', {'preferred_completion_date': '2026-99-99'}),
            ('bad_date_format', {'preferred_completion_date': 'not-a-date'}),
            ('nan_dim', {'length_cm': 'NaN'}),
            ('inf_dim', {'width_cm': 'Infinity'}),
            ('neg_dim', {'height_cm': '-12.5'}),
            ('huge_dim', {'length_cm': '1000000'}),
            ('zero_qty', {'quantity': 0}),
            ('oversized_qty', {'quantity': 1000001}),
            ('nonint_qty', {'quantity': 'two'}),
            ('bad_email', {'customer_email': 'not-an-email'}),
            ('oversized_title', {'project_title': 'T' * 201}),
            ('null_name', {'customer_name': None}),
        ]
        for label, patch_fields in invalid_cases:
            with self.subTest(case=label):
                cache.clear()
                payload = {
                    'customer_name': 'Tester',
                    'customer_phone': '+251911223344',
                    'customer_email': 'tester@example.com',
                    'project_title': 'Valid Project',
                    'service_type': 'Wood Works',
                    'description': 'Valid description.',
                    'quantity': 1,
                    **patch_fields,
                }
                resp = self.client.post('/api/quotations/', payload, format='json', REMOTE_ADDR='10.30.0.3')
                self.assertEqual(resp.status_code, 400, f"Expected 400 for {label}, got {resp.status_code}: {resp.data}")

    @patch('apps.quotations.telegram_bot._send_telegram_http', return_value={'ok': True, 'result': {'message_id': 88}})
    @patch('apps.quotations.tasks.send_telegram_quote_notification', return_value={'status': 'simulated', 'destinations': {}})
    def test_guest_quote_propose_price_and_convert_to_order_and_search(self, mock_send, mock_http):
        from apps.orders.models import Order, OrderItem
        from apps.production.models import ProductionJob

        # 1. Guest submits bespoke quote (customer is None)
        submit_resp = self.client.post(
            '/api/quotations/',
            {
                'customer_name': 'Birtukan Mekonnen',
                'customer_phone': '+251922334455',
                'customer_email': 'birtukan@example.com',
                'project_title': 'Hybrid Executive Desk',
                'service_type': 'hybrid-metal-wood',
                'description': 'Steel frame with seasoned walnut top.',
                'site_location': 'Bole Bulbula',
                'quantity': 1,
            },
            format='json',
            REMOTE_ADDR='10.30.0.4',
        )
        self.assertEqual(submit_resp.status_code, 201, submit_resp.data)
        quote_id = submit_resp.data['id']
        self.assertEqual(submit_resp.data['service_category'], 'Hybrid Metal + Wood Construction')

        headers_admin = self._admin_headers()

        # 2. Admin proposes price (must handle quote.customer=None safely)
        propose_resp = self.client.post(
            f'/api/quotations/{quote_id}/propose_price/',
            {'materials_cost': '20000.00', 'labor_cost': '5000.00'},
            format='json',
            **headers_admin,
        )
        self.assertEqual(propose_resp.status_code, 200, propose_resp.data)
        self.assertEqual(propose_resp.data['status'], QuoteStatus.PRICE_PROPOSED)

        # 3. Admin converts guest quote to Order + ProductionJob (must handle customer=None)
        convert_resp = self.client.post(
            f'/api/quotations/{quote_id}/convert_to_order/',
            {},
            format='json',
            **headers_admin,
        )
        self.assertEqual(convert_resp.status_code, 200, convert_resp.data)
        order_id = convert_resp.data['order_id']

        order = Order.objects.get(id=order_id)
        self.assertIsNone(order.customer)
        self.assertEqual(order.customer_name, 'Birtukan Mekonnen')
        self.assertEqual(order.customer_phone, '+251922334455')
        self.assertEqual(order.customer_email, 'birtukan@example.com')
        self.assertEqual(OrderItem.objects.filter(order=order).count(), 1)
        self.assertEqual(ProductionJob.objects.filter(order=order).count(), 1)

        # 4. Duplicate conversion returns 400
        dup_resp = self.client.post(
            f'/api/quotations/{quote_id}/convert_to_order/',
            {},
            format='json',
            **headers_admin,
        )
        self.assertEqual(dup_resp.status_code, 400)

        # 5. Admin orders search & production serializer return guest customer fields cleanly
        orders_search = self.client.get('/api/orders/?search=Birtukan', **headers_admin)
        self.assertEqual(orders_search.status_code, 200)
        order_results = orders_search.data.get('results', orders_search.data)
        self.assertEqual(len(order_results), 1)
        self.assertEqual(order_results[0]['customer_name'], 'Birtukan Mekonnen')
        self.assertEqual(order_results[0]['paid_amount'], '0.00')

        prod_list = self.client.get('/api/production/', **headers_admin)
        self.assertEqual(prod_list.status_code, 200)
        prod_results = prod_list.data.get('results', prod_list.data)
        matching_jobs = [j for j in prod_results if str(j['order']) == str(order.id)]
        self.assertEqual(len(matching_jobs), 1)
        self.assertEqual(matching_jobs[0]['customer_name'], 'Birtukan Mekonnen')

        # 6. Admin quotations search by guest customer name succeeds
        quotes_search = self.client.get('/api/quotations/?search=Birtukan', **headers_admin)
        self.assertEqual(quotes_search.status_code, 200)
        quote_results = quotes_search.data.get('results', quotes_search.data)
        self.assertTrue(any(str(q['id']) == str(quote_id) for q in quote_results))

