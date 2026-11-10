import json
import logging
import urllib.request
import urllib.error
import html
import os
import re
import mimetypes
import uuid
from decimal import Decimal
from celery import shared_task
from django.conf import settings
from django.utils import timezone

logger = logging.getLogger(__name__)


def _sanitize_for_logging(text: str, token: str = "") -> str:
    """
    Safely strips out sensitive Telegram Bot tokens from log messages or exception strings.
    """
    if not text:
        return ""
    text_str = str(text)
    if token and token in text_str:
        text_str = text_str.replace(token, "[BOT_TOKEN_REDACTED]")
    # Redact any standard Telegram bot token pattern 'bot<digits>:<alphanumeric>'
    text_str = re.sub(r'bot\d+:[A-Za-z0-9_-]+', 'bot[BOT_TOKEN_REDACTED]', text_str)
    # Redact raw bot token pattern if it appears anywhere
    text_str = re.sub(r'\b\d{8,12}:[A-Za-z0-9_-]{30,45}\b', '[BOT_TOKEN_REDACTED]', text_str)
    return text_str


def _send_telegram_http(token: str, chat_id: str, text: str, reply_markup: dict = None) -> dict:
    """
    Sends a text message via the Telegram Bot API using Python's standard library.
    Safely traps and sanitizes any HTTP error to prevent token exposure in logs.
    """
    url = f"https://api.telegram.org/bot{token}/sendMessage"
    payload = {
        "chat_id": chat_id,
        "text": text,
        "parse_mode": "HTML",
        "disable_web_page_preview": True,
    }
    if reply_markup:
        payload["reply_markup"] = reply_markup
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=data,
        headers={"Content-Type": "application/json", "User-Agent": "HaraWorkshop-TelegramAlert/2.0"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=15) as response:
            return json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        safe_reason = _sanitize_for_logging(str(e.reason or e), token)
        safe_body = ""
        try:
            safe_body = _sanitize_for_logging(e.read().decode("utf-8", errors="replace"), token)
        except Exception:
            pass
        logger.error(f"[TELEGRAM API ERROR] HTTP {e.code}: {safe_reason} | response: {safe_body}")
        raise RuntimeError(f"Telegram API HTTP {e.code}: {safe_reason} - {safe_body}")
    except Exception as e:
        safe_err = _sanitize_for_logging(str(e), token)
        logger.error(f"[TELEGRAM API ERROR] Failed to send message: {safe_err}")
        raise RuntimeError(f"Telegram API request failed: {safe_err}")


def _send_telegram_multipart(token: str, method: str, chat_id: str, file_field: str, file_path: str, filename: str, caption: str = "") -> dict:
    """
    Sends a file (photo or document) via Telegram Bot API using multipart/form-data.
    Safely traps and sanitizes any HTTP error to prevent token exposure in logs.
    """
    boundary = f"----WebKitFormBoundary{uuid.uuid4().hex}"
    body = bytearray()

    # chat_id field
    body.extend(f"--{boundary}\r\nContent-Disposition: form-data; name=\"chat_id\"\r\n\r\n{chat_id}\r\n".encode("utf-8"))

    # caption field
    if caption:
        body.extend(f"--{boundary}\r\nContent-Disposition: form-data; name=\"caption\"\r\n\r\n{caption}\r\n".encode("utf-8"))
        body.extend(f"--{boundary}\r\nContent-Disposition: form-data; name=\"parse_mode\"\r\n\r\nHTML\r\n".encode("utf-8"))

    # file field
    mime_type, _ = mimetypes.guess_type(filename)
    mime_type = mime_type or "application/octet-stream"
    body.extend(f"--{boundary}\r\nContent-Disposition: form-data; name=\"{file_field}\"; filename=\"{filename}\"\r\nContent-Type: {mime_type}\r\n\r\n".encode("utf-8"))

    with open(file_path, "rb") as f:
        body.extend(f.read())

    body.extend(f"\r\n--{boundary}--\r\n".encode("utf-8"))

    url = f"https://api.telegram.org/bot{token}/{method}"
    req = urllib.request.Request(
        url,
        data=bytes(body),
        headers={
            "Content-Type": f"multipart/form-data; boundary={boundary}",
            "User-Agent": "HaraWorkshop-TelegramAlert/2.0"
        },
        method="POST"
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as response:
            return json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        safe_reason = _sanitize_for_logging(str(e.reason or e), token)
        safe_body = ""
        try:
            safe_body = _sanitize_for_logging(e.read().decode("utf-8", errors="replace"), token)
        except Exception:
            pass
        logger.error(f"[TELEGRAM API ERROR] {method} HTTP {e.code}: {safe_reason} | response: {safe_body}")
        raise RuntimeError(f"Telegram API {method} HTTP {e.code}: {safe_reason} - {safe_body}")
    except Exception as e:
        safe_err = _sanitize_for_logging(str(e), token)
        logger.error(f"[TELEGRAM API ERROR] {method} failed: {safe_err}")
        raise RuntimeError(f"Telegram API {method} failed: {safe_err}")


def resolve_chat_id(target: str) -> str:
    """
    Normalizes known username handles or aliases to verified numeric Telegram IDs.
    - @Manager_Samuel_A -> 860309749
    - @haraworkshop -> -5374750855
    """
    if not target:
        return ""
    t = str(target).strip()
    if t in ("@Manager_Samuel_A", "Manager_Samuel_A"):
        return getattr(settings, "TELEGRAM_MANAGER_CHAT_ID", "860309749").strip()
    if t in ("@haraworkshop", "haraworkshop"):
        return getattr(settings, "TELEGRAM_GROUP_CHAT_ID", "-5374750855").strip()
    return t


@shared_task(name="apps.quotations.tasks.send_telegram_quote_notification", bind=True, max_retries=3)
def send_telegram_quote_notification(self, quote_id: str, target_chat_id: str = None, force_resend: bool = False) -> dict:
    """
    Sends an instant structured notification of a new customer order request to:
    1. HARA WORKSHOP Management Group (-5374750855)
    2. Workshop Manager Samuel (860309749)

    Each destination is delivered and verified independently.
    Returns granular status:
    - 'sent': all required destinations succeeded
    - 'partial': at least one destination succeeded and another failed
    - 'failed': all destinations failed
    - 'simulated': simulated mode (missing or placeholder token)

    Includes idempotency & retry protection via AuditLog.
    """
    from apps.quotations.models import Quote
    from apps.core.models import AuditLog

    token = getattr(settings, "TELEGRAM_BOT_TOKEN", "").strip()

    try:
        quote = Quote.objects.select_related("customer", "product").prefetch_related("attachments").get(id=quote_id)
    except Quote.DoesNotExist:
        logger.error(f"[TELEGRAM ALERT] Quote with ID {quote_id} not found.")
        return {"status": "error", "message": f"Quote {quote_id} not found"}

    # 1. Request ID
    request_id = quote.quote_number or str(quote.id)

    # 2. Customer Name
    customer_name = html.escape(quote.get_customer_name() or "Valued Customer")

    # 3. Phone Number
    customer_phone = html.escape(quote.get_customer_phone() or "Not provided")

    # 4. Email
    customer_email = html.escape(quote.get_customer_email() or "Not provided")

    # 5. Product or Service
    prod_name = quote.product_name or (quote.product.name if quote.product else "")
    service_type = html.escape(quote.service_type or "General Fabrication")
    if prod_name:
        product_or_service = f"{html.escape(prod_name)} ({service_type})"
    else:
        product_or_service = f"Custom Commission — {service_type}"

    # 6. Product Code if applicable
    raw_prod_code = quote.product_code or (quote.product.sku if quote.product else "")
    prod_code_display = html.escape(raw_prod_code) if raw_prod_code else "Custom / N/A"

    # 7. Specifications
    project_title = html.escape(quote.project_title or "Custom Workshop Project")
    description = html.escape(quote.description or "No description provided")
    material_pref = html.escape(quote.material_preference or "Standard Workshop Materials")

    len_val = f"{quote.length_cm}" if quote.length_cm else None
    wid_val = f"{quote.width_cm}" if quote.width_cm else None
    hgt_val = f"{quote.height_cm}" if quote.height_cm else None
    dimensions_str = f"{len_val} × {wid_val} × {hgt_val} cm" if (len_val and wid_val and hgt_val) else None

    vol_str = f"{quote.calculated_volume_m3:.2f} m³" if quote.calculated_volume_m3 else None

    transport_str = "Yes" if quote.delivery_required else "No"
    installation_str = "Yes" if quote.installation_required else "No"
    location_str = html.escape(quote.site_location or quote.delivery_address or "Addis Ababa")
    pref_date_str = quote.preferred_completion_date.strftime("%b %d, %Y") if quote.preferred_completion_date else "Flexible"

    has_listed_price = bool(quote.product and quote.product.starting_price and quote.product.starting_price > 0 and quote.estimated_baseline_amount and quote.estimated_baseline_amount > 0)
    if has_listed_price:
        baseline_num = quote.estimated_baseline_amount or quote.total_amount or Decimal("0.00")
        baseline_str = f"{float(baseline_num):,.2f} ETB (Catalog Listed Price)"
    else:
        baseline_str = "Price will be provided after reviewing your request (Custom Order)"

    customer_notes = html.escape(quote.customer_notes) if quote.customer_notes else "None"

    # 8. Quantity
    qty_val = f"{quote.quantity}"

    # 9. Uploaded attachments
    attachments = list(quote.attachments.all())
    uploaded_files_str = ", ".join([html.escape(att.file_name or os.path.basename(att.file.name)) for att in attachments]) if attachments else "None"

    # 10. Submission Time
    if quote.created_at:
        try:
            local_time = timezone.localtime(quote.created_at)
            submission_time = local_time.strftime("%Y-%m-%d %I:%M:%S %p %Z")
        except Exception:
            submission_time = quote.created_at.strftime("%Y-%m-%d %H:%M:%S UTC")
    else:
        submission_time = timezone.now().strftime("%Y-%m-%d %H:%M:%S UTC")

    # Build Structured Specifications block
    specs_bullets = [
        f"   • <b>Project:</b> {project_title}",
        f"   • <b>Description:</b> {description}",
        f"   • <b>Materials:</b> {material_pref}",
    ]
    if dimensions_str:
        specs_bullets.append(f"   • <b>Dimensions:</b> {dimensions_str}")
    if vol_str:
        specs_bullets.append(f"   • <b>Volume:</b> {vol_str}")
    specs_bullets.extend([
        f"   • <b>Delivery:</b> {transport_str} (Site: {location_str})",
        f"   • <b>Installation:</b> {installation_str}",
        f"   • <b>Target Date:</b> {pref_date_str}",
        f"   • <b>Est. Baseline:</b> {baseline_str}",
        f"   • <b>Notes:</b> {customer_notes}",
    ])
    specs_formatted = "\n".join(specs_bullets)

    # Build Comprehensive Telegram message with all required fields
    message_text = (
        f"🔨 <b>HARA WORKSHOP — NEW ORDER REQUEST</b>\n\n"
        f"<b>1. Request ID:</b> <code>{request_id}</code>\n"
        f"<b>2. Customer Name:</b> {customer_name}\n"
        f"<b>3. Phone Number:</b> {customer_phone}\n"
        f"<b>4. Email:</b> {customer_email}\n"
        f"<b>5. Product / Service:</b> {product_or_service}\n"
        f"<b>6. Product Code:</b> <code>{prod_code_display}</code>\n"
        f"<b>7. Specifications:</b>\n"
        f"{specs_formatted}\n"
        f"<b>8. Quantity:</b> <b>{qty_val}</b>\n"
        f"<b>9. Uploaded Files:</b> {uploaded_files_str}\n"
        f"<b>10. Submission Time:</b> {submission_time}\n\n"
        f"<i>HARA WORKSHOP • Metal and Wood Solution</i>"
    )

    # Determine product image file path on disk if available
    product_image_path = None
    if quote.product:
        prim_img = quote.product.images.filter(is_primary=True).first() or quote.product.images.first()
        if prim_img and prim_img.image:
            try:
                candidate = prim_img.image.path
                if os.path.exists(candidate):
                    product_image_path = candidate
            except Exception:
                pass

    # Build destinations list
    group_chat_id = getattr(settings, "TELEGRAM_GROUP_CHAT_ID", "-5374750855").strip()
    manager_chat_id = getattr(settings, "TELEGRAM_MANAGER_CHAT_ID", "860309749").strip()

    if target_chat_id:
        resolved_target = resolve_chat_id(target_chat_id)
        destinations = (
            [{"id": resolved_target, "label": "Specified Recipient", "is_required": True}]
            if resolved_target else []
        )
    else:
        destinations = []
        if group_chat_id:
            destinations.append({"id": group_chat_id, "label": "Management Group", "is_required": True})
        if manager_chat_id:
            destinations.append({"id": manager_chat_id, "label": "Manager Samuel", "is_required": True})

    # Inspect prior successful dispatches for idempotency / retry protection
    previously_delivered = set()
    try:
        past_logs = AuditLog.objects.filter(
            resource="Quote",
            resource_id=str(quote.id),
            action="TELEGRAM_DISPATCH"
        )
        for pl in past_logs:
            if isinstance(pl.metadata, dict):
                deliv = pl.metadata.get("delivered_destinations", [])
                for d in deliv:
                    previously_delivered.add(str(d))
    except Exception as audit_read_err:
        logger.warning(f"[TELEGRAM ALERT] Could not check past audit logs for {quote_id}: {audit_read_err}")

    # Check for Simulation Mode (e.g. development without real bot token)
    if not token or token.lower() in ("placeholder", "none", "dummy", "your_bot_token"):
        sim_destinations = {}
        for d in destinations:
            sim_destinations[d["id"]] = {
                "label": d["label"],
                "status": "simulated",
                "message": "TELEGRAM_BOT_TOKEN not configured; alert simulated.",
            }
        logger.warning(
            f"[TELEGRAM ORDER ALERT SIMULATION]\n"
            f"Quote: {request_id}\n"
            f"Destinations: {[d['id'] for d in destinations]}\n"
            f"{message_text}"
        )
        return {
            "status": "simulated",
            "quote_number": request_id,
            "destinations": sim_destinations,
            "delivered_count": 0,
            "total_destinations": len(destinations),
            "has_product_image": bool(product_image_path),
            "attachments_count": len(attachments),
        }

    # Execute Independent Delivery to Each Destination
    results = {}
    for dest in destinations:
        cid = dest["id"]
        label = dest["label"]

        if cid in previously_delivered and not force_resend:
            logger.info(f"[TELEGRAM ALERT] Skipping already delivered recipient {label} ({cid}) for quote {request_id}")
            results[cid] = {
                "label": label,
                "status": "already_sent",
                "chat_id": cid,
                "message": "Previously delivered successfully. Skipped to prevent duplicate alert.",
            }
            continue

        dest_result = {
            "label": label,
            "chat_id": cid,
            "main_message": False,
            "product_photo": False,
            "attachments_sent": 0,
            "status": "failed",
            "error": None,
        }

        try:
            # 1. Main Message
            main_resp = _send_telegram_http(token=token, chat_id=cid, text=message_text)
            dest_result["main_message"] = True
            dest_result["message_id"] = main_resp.get("result", {}).get("message_id")
            dest_result["status"] = "sent"
            logger.info(f"[TELEGRAM ALERT] Sent main message for {request_id} to {label} ({cid})")

            # 2. Product Photo
            if product_image_path and os.path.exists(product_image_path):
                photo_caption = (
                    f"<b>HARA WORKSHOP — SELECTED PRODUCT</b>\n\n"
                    f"<b>Product:</b> {html.escape(prod_name)}\n"
                    f"<b>Code:</b> <code>{prod_code_display}</code>\n"
                    f"<b>Request Ref:</b> <code>{request_id}</code>\n"
                    f"<b>Customer:</b> {customer_name}"
                )
                try:
                    photo_resp = _send_telegram_multipart(
                        token=token,
                        method="sendPhoto",
                        chat_id=cid,
                        file_field="photo",
                        file_path=product_image_path,
                        filename=os.path.basename(product_image_path),
                        caption=photo_caption
                    )
                    dest_result["product_photo"] = True
                    logger.info(f"[TELEGRAM ALERT] Sent product photo to {label} ({cid}) for {request_id}")
                except Exception as photo_err:
                    safe_p_err = _sanitize_for_logging(str(photo_err), token)
                    logger.error(f"[TELEGRAM ALERT] Failed sending product photo to {label}: {safe_p_err}")

            # 3. Customer Uploaded Files
            for att in attachments:
                try:
                    att_path = att.file.path if hasattr(att.file, 'path') else None
                    if att_path and os.path.exists(att_path):
                        doc_cap = (
                            f"📎 <b>HARA WORKSHOP — Reference File</b>\n"
                            f"<b>File:</b> {html.escape(att.file_name)}\n"
                            f"<b>Request Ref:</b> <code>{request_id}</code>\n"
                            f"<b>Customer:</b> {customer_name}"
                        )
                        _send_telegram_multipart(
                            token=token,
                            method="sendDocument",
                            chat_id=cid,
                            file_field="document",
                            file_path=att_path,
                            filename=att.file_name or os.path.basename(att_path),
                            caption=doc_cap
                        )
                        dest_result["attachments_sent"] += 1
                except Exception as doc_err:
                    safe_d_err = _sanitize_for_logging(str(doc_err), token)
                    logger.error(f"[TELEGRAM ALERT] Failed sending attachment to {label}: {safe_d_err}")

        except Exception as exc:
            safe_exc = _sanitize_for_logging(str(exc), token)
            dest_result["status"] = "failed"
            dest_result["error"] = safe_exc
            if "bot was blocked" in safe_exc.lower() or "chat not found" in safe_exc.lower() or "403" in safe_exc:
                dest_result["instruction"] = f"Recipient must open @{getattr(settings, 'TELEGRAM_BOT_USERNAME', 'HaraWorkshopOrdersBot')} and press /start"
            logger.error(f"[TELEGRAM ALERT ERROR] Delivery to {label} ({cid}) failed for {request_id}: {safe_exc}")

        results[cid] = dest_result

    # Determine Overall Granular Status across required destinations
    total_req = len(destinations)
    succeeded_cids = [cid for cid, r in results.items() if r["status"] in ("sent", "already_sent")]
    failed_cids = [cid for cid, r in results.items() if r["status"] == "failed"]

    if len(succeeded_cids) == total_req:
        overall_status = "sent"
    elif len(succeeded_cids) > 0 and len(failed_cids) > 0:
        overall_status = "partial"
    else:
        overall_status = "failed"

    # Persist attempt and recipient outcomes in AuditLog
    try:
        AuditLog.objects.create(
            user=None,
            action="TELEGRAM_DISPATCH",
            resource="Quote",
            resource_id=str(quote.id),
            metadata={
                "quote_number": request_id,
                "overall_status": overall_status,
                "destinations": results,
                "delivered_destinations": succeeded_cids,
                "failed_destinations": failed_cids,
                "dispatch_time": timezone.now().isoformat(),
            }
        )
    except Exception as audit_err:
        logger.error(f"[TELEGRAM AUDIT ERROR] Failed to record dispatch in AuditLog: {audit_err}")

    return {
        "status": overall_status,
        "quote_number": request_id,
        "destinations": results,
        "delivered_count": len(succeeded_cids),
        "total_destinations": total_req,
    }
