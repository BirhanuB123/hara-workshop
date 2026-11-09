from unittest.mock import patch, MagicMock
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
