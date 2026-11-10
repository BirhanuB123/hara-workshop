from unittest.mock import patch, MagicMock
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
