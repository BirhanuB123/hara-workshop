import json
import logging
import urllib.request
import urllib.error
from django.core.management.base import BaseCommand
from django.conf import settings
from apps.quotations.tasks import _sanitize_for_logging

logger = logging.getLogger(__name__)

DEFAULT_WEBHOOK_URL = "https://hara-workshop.onrender.com/api/telegram/webhook/"

BOT_COMMANDS = [
    {"command": "myorders", "description": "View all orders linked to your account"},
    {"command": "status", "description": "Check live status of your order"},
    {"command": "start", "description": "Welcome guide & order-linking instructions"},
    {"command": "help", "description": "Workshop contact details & atelier location"},
]


class Command(BaseCommand):
    help = "Configure Telegram Bot webhook and register client menu commands with Telegram API."

    def add_arguments(self, parser):
        parser.add_argument(
            '--url',
            type=str,
            default=DEFAULT_WEBHOOK_URL,
            help=f'The HTTPS webhook URL to configure (default: {DEFAULT_WEBHOOK_URL})'
        )
        parser.add_argument(
            '--info',
            action='store_true',
            help='Retrieve and display current Telegram webhook info without making changes.'
        )
        parser.add_argument(
            '--delete',
            action='store_true',
            help='Delete the current webhook from Telegram.'
        )
        parser.add_argument(
            '--drop-pending',
            action='store_true',
            help='Drop all pending updates currently buffered on Telegram servers.'
        )

    def handle(self, *args, **options):
        token = getattr(settings, 'TELEGRAM_BOT_TOKEN', '').strip()
        if not token:
            self.stdout.write(self.style.ERROR("[TELEGRAM SETUP ERROR] TELEGRAM_BOT_TOKEN is not configured on the backend."))
            return

        bot_username = getattr(settings, 'TELEGRAM_BOT_USERNAME', 'HaraWorkshopOrdersBot')

        # Mode: Display Webhook Info
        if options.get('info'):
            self._display_webhook_info(token, bot_username)
            return

        # Mode: Delete Webhook
        if options.get('delete'):
            self._delete_webhook(token)
            return

        # Mode: Configure Webhook & Commands
        target_url = options.get('url') or DEFAULT_WEBHOOK_URL
        drop_pending = options.get('drop_pending', False)

        self.stdout.write(f"=== HARA WORKSHOP TELEGRAM SETUP ===")
        self.stdout.write(f"Bot: @{bot_username}")
        self.stdout.write(f"Target Webhook: {target_url}")
        self.stdout.write(f"Drop pending updates: {drop_pending}")

        # 1. Set Webhook
        webhook_success = self._set_webhook(token, target_url, drop_pending)

        # 2. Set Bot Menu Commands
        commands_success = self._set_bot_commands(token)

        # 3. Confirm with getWebhookInfo
        self._display_webhook_info(token, bot_username)

        if webhook_success and commands_success:
            self.stdout.write(self.style.SUCCESS("\n[SUCCESS] Telegram Bot webhook and interactive menu successfully configured!"))
        else:
            self.stdout.write(self.style.WARNING("\n[WARNING] Webhook setup completed with warnings. Check logs above."))

    def _set_webhook(self, token: str, url: str, drop_pending: bool = False) -> bool:
        api_url = f"https://api.telegram.org/bot{token}/setWebhook"
        payload = {
            "url": url,
            "allowed_updates": ["message", "edited_message", "callback_query"],
            "drop_pending_updates": drop_pending,
            "max_connections": 40
        }
        data = json.dumps(payload).encode('utf-8')
        req = urllib.request.Request(
            api_url,
            data=data,
            headers={"Content-Type": "application/json", "User-Agent": "HaraWorkshop-Setup/1.0"},
            method="POST"
        )
        try:
            with urllib.request.urlopen(req, timeout=15) as resp:
                res = json.loads(resp.read().decode('utf-8'))
            if res.get('ok'):
                self.stdout.write(self.style.SUCCESS(f"  [OK] Webhook registered: {res.get('description', 'OK')}"))
                return True
            else:
                self.stdout.write(self.style.ERROR(f"  [FAIL] Webhook registration failed: {res}"))
                return False
        except Exception as exc:
            safe_err = _sanitize_for_logging(str(exc), token)
            self.stdout.write(self.style.ERROR(f"  [ERROR] setWebhook API request failed: {safe_err}"))
            return False

    def _set_bot_commands(self, token: str) -> bool:
        api_url = f"https://api.telegram.org/bot{token}/setMyCommands"
        payload = {"commands": BOT_COMMANDS}
        data = json.dumps(payload).encode('utf-8')
        req = urllib.request.Request(
            api_url,
            data=data,
            headers={"Content-Type": "application/json", "User-Agent": "HaraWorkshop-Setup/1.0"},
            method="POST"
        )
        try:
            with urllib.request.urlopen(req, timeout=15) as resp:
                res = json.loads(resp.read().decode('utf-8'))
            if res.get('ok'):
                self.stdout.write(self.style.SUCCESS("  [OK] Client menu commands registered successfully (/myorders, /status, /start, /help)"))
                return True
            else:
                self.stdout.write(self.style.WARNING(f"  [WARN] setMyCommands returned: {res}"))
                return False
        except Exception as exc:
            safe_err = _sanitize_for_logging(str(exc), token)
            self.stdout.write(self.style.WARNING(f"  [WARN] setMyCommands API request failed: {safe_err}"))
            return False

    def _delete_webhook(self, token: str):
        api_url = f"https://api.telegram.org/bot{token}/deleteWebhook"
        req = urllib.request.Request(
            api_url,
            headers={"User-Agent": "HaraWorkshop-Setup/1.0"},
            method="POST"
        )
        try:
            with urllib.request.urlopen(req, timeout=15) as resp:
                res = json.loads(resp.read().decode('utf-8'))
            self.stdout.write(self.style.SUCCESS(f"Webhook deleted: {res}"))
        except Exception as exc:
            safe_err = _sanitize_for_logging(str(exc), token)
            self.stdout.write(self.style.ERROR(f"deleteWebhook failed: {safe_err}"))

    def _display_webhook_info(self, token: str, bot_username: str):
        api_url = f"https://api.telegram.org/bot{token}/getWebhookInfo"
        req = urllib.request.Request(
            api_url,
            headers={"User-Agent": "HaraWorkshop-Setup/1.0"},
            method="GET"
        )
        try:
            with urllib.request.urlopen(req, timeout=15) as resp:
                data = json.loads(resp.read().decode('utf-8'))
            res = data.get('result', {})
            self.stdout.write("\n--- Current Telegram Webhook State ---")
            self.stdout.write(f"Bot: @{bot_username}")
            self.stdout.write(f"Webhook URL: {res.get('url') or '<NONE (Not Configured)>'}")
            self.stdout.write(f"Custom Certificate: {res.get('has_custom_certificate')}")
            self.stdout.write(f"Pending Updates: {res.get('pending_update_count', 0)}")
            self.stdout.write(f"Max Connections: {res.get('max_connections')}")
            self.stdout.write(f"Allowed Updates: {res.get('allowed_updates')}")
            if res.get('last_error_message'):
                self.stdout.write(self.style.WARNING(f"Last Error Date: {res.get('last_error_date')}"))
                self.stdout.write(self.style.WARNING(f"Last Error Message: {res.get('last_error_message')}"))
            self.stdout.write("--------------------------------------")
        except Exception as exc:
            safe_err = _sanitize_for_logging(str(exc), token)
            self.stdout.write(self.style.ERROR(f"getWebhookInfo failed: {safe_err}"))
