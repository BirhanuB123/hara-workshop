import time
import json
import logging
import urllib.request
import urllib.error
from django.core.management.base import BaseCommand
from django.conf import settings
from apps.quotations.telegram_bot import process_telegram_update
from apps.quotations.tasks import _sanitize_for_logging

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = "Run the HARA WORKSHOP Telegram Bot long-polling daemon to process customer commands and order linking."

    def add_arguments(self, parser):
        parser.add_argument(
            '--once',
            action='store_true',
            help='Run a single poll iteration and exit (useful for testing or cron jobs).'
        )
        parser.add_argument(
            '--timeout',
            type=int,
            default=15,
            help='Long polling timeout in seconds.'
        )

    def handle(self, *args, **options):
        token = getattr(settings, 'TELEGRAM_BOT_TOKEN', '').strip()
        if not token:
            self.stdout.write(self.style.ERROR("TELEGRAM_BOT_TOKEN is not configured on the backend."))
            return

        run_once = options.get('once', False)
        timeout = options.get('timeout', 15)

        self.stdout.write(self.style.SUCCESS(f"Starting HARA WORKSHOP Telegram Bot polling daemon (once={run_once}, timeout={timeout}s)..."))
        from django.core.cache import cache
        from apps.core.models import AuditLog

        last_update_id = cache.get('telegram_last_update_id')
        if not last_update_id:
            try:
                last_log = AuditLog.objects.filter(resource='TelegramBot', action='UPDATE').first()
                if last_log and last_log.metadata.get('last_update_id'):
                    last_update_id = int(last_log.metadata['last_update_id'])
            except Exception:
                pass
        last_update_id = last_update_id or 0

        while True:
            try:
                url = f"https://api.telegram.org/bot{token}/getUpdates?timeout={timeout}"
                if last_update_id:
                    url += f"&offset={last_update_id + 1}"

                req = urllib.request.Request(
                    url,
                    headers={"User-Agent": "HaraWorkshop-BotDaemon/1.0"},
                    method="GET"
                )

                with urllib.request.urlopen(req, timeout=timeout + 5) as resp:
                    payload = json.loads(resp.read().decode('utf-8'))

                if payload.get('ok'):
                    updates = payload.get('result', [])
                    for upd in updates:
                        upd_id = upd.get('update_id')
                        if upd_id:
                            last_update_id = max(last_update_id, upd_id)
                            cache.set('telegram_last_update_id', last_update_id, timeout=86400 * 30)

                        try:
                            res = process_telegram_update(upd)
                            self.stdout.write(f"Processed update {upd_id}: {res.get('status')}")
                        except Exception as proc_err:
                            safe_err = _sanitize_for_logging(str(proc_err), token)
                            logger.error(f"Error processing update {upd_id}: {safe_err}")

                    # Acknowledge processed updates with Telegram if any received
                    if updates and last_update_id:
                        ack_url = f"https://api.telegram.org/bot{token}/getUpdates?offset={last_update_id + 1}&limit=1"
                        try:
                            ack_req = urllib.request.Request(ack_url, headers={"User-Agent": "HaraWorkshop-BotDaemon/1.0"}, method="GET")
                            urllib.request.urlopen(ack_req, timeout=5)
                        except Exception:
                            pass
                else:
                    self.stdout.write(self.style.WARNING(f"Telegram getUpdates returned not ok: {payload}"))

            except urllib.error.HTTPError as e:
                safe_err = _sanitize_for_logging(str(e), token)
                self.stdout.write(self.style.ERROR(f"HTTPError in bot polling: {safe_err}"))
                time.sleep(3)
            except Exception as e:
                safe_err = _sanitize_for_logging(str(e), token)
                self.stdout.write(self.style.ERROR(f"Exception in bot polling: {safe_err}"))
                time.sleep(3)

            if run_once:
                self.stdout.write(self.style.SUCCESS("Completed single poll iteration."))
                break
