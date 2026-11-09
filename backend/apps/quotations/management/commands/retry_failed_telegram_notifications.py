import logging
from django.core.management.base import BaseCommand
from django.conf import settings
from django.db.models import Q
from apps.quotations.models import Quote
from apps.core.models import AuditLog
from apps.quotations.tasks import send_telegram_quote_notification

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = (
        "Safely retries or recovers Telegram notifications for customer quotations with failed "
        "or missing dispatches. Default execution is DRY-RUN. To send real messages, pass --execute."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--execute",
            action="store_true",
            default=False,
            help="Explicitly authorizes sending real Telegram notifications. If omitted, runs in safe DRY-RUN mode.",
        )
        parser.add_argument(
            "--quote-id",
            type=str,
            default=None,
            help="Target a specific quote by ID or quote number (e.g. QT-2026-0046).",
        )
        parser.add_argument(
            "--limit",
            type=int,
            default=10,
            help="Maximum number of quotations to evaluate/process (default: 10, max: 50).",
        )
        parser.add_argument(
            "--force",
            action="store_true",
            default=False,
            help="Force resending even to destinations previously recorded as delivered.",
        )
        parser.add_argument(
            "--chat-id",
            type=str,
            default=None,
            help="Optional single destination chat ID override.",
        )

    def handle(self, *args, **options):
        is_execute = options["execute"]
        quote_id_arg = options["quote_id"]
        limit = min(options["limit"], 50)
        force = options["force"]
        chat_id_arg = options["chat_id"]

        mode_label = "LIVE EXECUTION" if is_execute else "DRY-RUN (Safe Simulation)"
        self.stdout.write(self.style.MIGRATE_HEADING(f"=== HARA WORKSHOP — TELEGRAM NOTIFICATION RECOVERY ==="))
        self.stdout.write(f"Mode: {mode_label}")
        self.stdout.write(f"Limit: {limit} | Force: {force}\n")

        group_chat_id = getattr(settings, "TELEGRAM_GROUP_CHAT_ID", "-5374750855").strip()
        manager_chat_id = getattr(settings, "TELEGRAM_MANAGER_CHAT_ID", "860309749").strip()
        required_destinations = {group_chat_id, manager_chat_id}

        # 1. Fetch candidate quotations
        if quote_id_arg:
            clean_arg = quote_id_arg.strip()
            candidates = list(Quote.objects.filter(Q(id__iexact=clean_arg) | Q(quote_number__iexact=clean_arg)))
            if not candidates:
                self.stdout.write(self.style.ERROR(f"No quotation found matching identifier: '{quote_id_arg}'"))
                return
        else:
            # Query recent quotations (up to 100 to evaluate against limit)
            candidates = list(Quote.objects.order_by("-created_at")[:100])

        # 2. Filter candidates for missing or failed delivery
        actionable_quotes = []
        for q in candidates:
            delivered = set()
            past_logs = AuditLog.objects.filter(
                resource="Quote",
                resource_id=str(q.id),
                action="TELEGRAM_DISPATCH"
            )
            for pl in past_logs:
                if isinstance(pl.metadata, dict):
                    for d in pl.metadata.get("delivered_destinations", []):
                        delivered.add(str(d))

            missing = required_destinations - delivered
            if missing or force:
                actionable_quotes.append({
                    "quote": q,
                    "delivered": delivered,
                    "missing": missing,
                })
                if len(actionable_quotes) >= limit:
                    break

        if not actionable_quotes:
            self.stdout.write(self.style.SUCCESS("All evaluated quotations have verified successful delivery. No action required."))
            return

        self.stdout.write(f"Found {len(actionable_quotes)} quotation(s) requiring notification recovery:\n")

        # 3. Process actionable quotations
        processed_count = 0
        success_count = 0
        partial_count = 0
        failed_count = 0

        for item in actionable_quotes:
            quote = item["quote"]
            q_num = quote.quote_number or str(quote.id)
            missing = item["missing"]
            delivered = item["delivered"]
            created = quote.created_at.strftime("%Y-%m-%d %H:%M") if quote.created_at else "Unknown"

            missing_labels = []
            if group_chat_id in missing:
                missing_labels.append("Management Group (-5374750855)")
            if manager_chat_id in missing:
                missing_labels.append("Manager Samuel (860309749)")

            if not is_execute:
                # DRY RUN: Report only
                self.stdout.write(
                    f"  • [DRY-RUN] Quote {self.style.WARNING(q_num)} ({created}) - Customer: {quote.get_customer_name()}"
                )
                self.stdout.write(f"      Missing destinations: {', '.join(missing_labels) if missing_labels else 'None (forced)'}")
                self.stdout.write(f"      Already delivered: {list(delivered) if delivered else 'None'}\n")
            else:
                # EXECUTE: Dispatch independently
                self.stdout.write(f"  • [EXECUTING] Dispatching notifications for {q_num}...")
                try:
                    result = send_telegram_quote_notification(
                        quote_id=str(quote.id),
                        target_chat_id=chat_id_arg,
                        force_resend=force
                    )
                    status_str = result.get("status", "unknown")
                    processed_count += 1

                    if status_str == "sent":
                        success_count += 1
                        self.stdout.write(self.style.SUCCESS(f"    --> Status: SENT (All destinations delivered)"))
                    elif status_str == "partial":
                        partial_count += 1
                        self.stdout.write(self.style.WARNING(f"    --> Status: PARTIAL (Delivered to some destinations)"))
                        for cid, dinfo in result.get("destinations", {}).items():
                            if dinfo.get("status") == "failed":
                                self.stdout.write(f"        Destination {dinfo.get('label')} ({cid}) failed: {dinfo.get('error')}")
                    elif status_str == "simulated":
                        self.stdout.write(self.style.NOTICE(f"    --> Status: SIMULATED (No real token)"))
                    else:
                        failed_count += 1
                        self.stdout.write(self.style.ERROR(f"    --> Status: FAILED (All attempted destinations failed)"))

                except Exception as exc:
                    failed_count += 1
                    self.stdout.write(self.style.ERROR(f"    --> Exception dispatching {q_num}: {exc}"))

        # 4. Summary Output
        self.stdout.write("\n" + "=" * 55)
        if not is_execute:
            self.stdout.write(
                self.style.NOTICE(
                    f"[DRY-RUN COMPLETE] Evaluated {len(actionable_quotes)} quotation(s). "
                    f"Zero live notifications were sent.\n"
                    f"To execute live notification recovery, run:\n"
                    f"  python manage.py retry_failed_telegram_notifications --execute --limit {len(actionable_quotes)}"
                )
            )
        else:
            self.stdout.write(
                self.style.SUCCESS(
                    f"[EXECUTION COMPLETE] Processed: {processed_count} | "
                    f"Full Success: {success_count} | Partial: {partial_count} | Failed: {failed_count}"
                )
            )
        self.stdout.write("=" * 55)
