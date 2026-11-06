from django.core.management.base import BaseCommand
from django.conf import settings
from apps.quotations.models import Quote
from apps.quotations.tasks import send_telegram_quote_notification

class Command(BaseCommand):
    help = "Test the Celery Telegram notification task for quotations"

    def add_arguments(self, parser):
        parser.add_argument("--quote-id", type=str, help="Specific quote ID to test")
        parser.add_argument("--chat-id", type=str, help="Override target Telegram chat ID")
        parser.add_argument("--sync", action="store_true", help="Run synchronously without Celery")

    def handle(self, *args, **options):
        quote_id = options.get("quote_id")
        chat_id = options.get("chat_id")
        run_sync = options.get("sync")

        if quote_id:
            try:
                quote = Quote.objects.get(id=quote_id)
            except Quote.DoesNotExist:
                self.stderr.write(self.style.ERROR(f"Quote with ID {quote_id} not found."))
                return
        else:
            quote = Quote.objects.first()
            if not quote:
                self.stderr.write(self.style.ERROR("No quotations found in database to test."))
                return

        self.stdout.write(self.style.NOTICE(f"Testing Telegram alert for quote: {quote.quote_number} - {quote.project_title}"))
        self.stdout.write(f"Customer: {quote.customer.get_full_name()} ({quote.customer.email})")
        self.stdout.write(f"Telegram Bot Token configured: {'Yes' if getattr(settings, 'TELEGRAM_BOT_TOKEN', '') else 'No (Simulated Mode)'}")
        self.stdout.write(f"Target Chat ID: {chat_id or getattr(settings, 'TELEGRAM_CHAT_ID', '@haraworkshop')}")

        if run_sync:
            self.stdout.write("Dispatching synchronously...")
            res = send_telegram_quote_notification(str(quote.id), target_chat_id=chat_id)
            self.stdout.write(self.style.SUCCESS(f"Synchronous execution result: {res}"))
        else:
            self.stdout.write("Dispatching asynchronously via Celery worker...")
            task = send_telegram_quote_notification.delay(str(quote.id), target_chat_id=chat_id)
            self.stdout.write(self.style.SUCCESS(f"Celery task dispatched! Task ID: {task.id}"))
