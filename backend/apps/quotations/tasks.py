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


def _send_telegram_http(token: str, chat_id: str, text: str) -> dict:
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


@shared_task(name="apps.quotations.tasks.send_telegram_quote_notification", bind=True, max_retries=3)
def send_telegram_quote_notification(self, quote_id: str, target_chat_id: str = None) -> dict:
    """
    Sends an instant structured notification of a new customer order request to the workshop manager via Telegram.
    Includes all 9 required fields:
    1. Request ID / Reference
    2. Customer Name
    3. Phone Number
    4. Email
    5. Product or Service
    6. Product Code (if applicable)
    7. Specifications (Description, Dimensions, Volume, Delivery, Notes)
    8. Quantity
    9. Submission Time
    """
    from apps.quotations.models import Quote

    token = getattr(settings, "TELEGRAM_BOT_TOKEN", "").strip()
    # Send to HARA WORKSHOP Management Group by default, with fallback to Admin/Chat ID
    chat_id = (
        target_chat_id or
        getattr(settings, "TELEGRAM_GROUP_CHAT_ID", None) or
        getattr(settings, "TELEGRAM_ADMIN_CHAT_ID", None) or
        getattr(settings, "TELEGRAM_CHAT_ID", "1774429006")
    ).strip()

    # Map username or placeholder to numeric chat ID
    if chat_id in ("@Manager_Samuel_A", "Manager_Samuel_A", "@haraworkshop", "haraworkshop", ""):
        chat_id = "1774429006"

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

    attachments = list(quote.attachments.all())

    if not token or token.lower() in ("placeholder", "none", "dummy", "your_bot_token"):
        # Simulated mode when token is absent in development environment
        logger.warning(
            f"[TELEGRAM ORDER ALERT SIMULATION]\n"
            f"Target Chat: {chat_id}\n"
            f"Quote: {request_id}\n"
            f"Product Image: {product_image_path}\n"
            f"Attachments count: {len(attachments)}\n"
            f"{message_text}"
        )
        return {
            "status": "simulated",
            "chat_id": chat_id,
            "quote_number": request_id,
            "product_code": prod_code_display,
            "has_product_image": bool(product_image_path),
            "attachments_count": len(attachments),
            "message_preview": message_text[:200] + "..."
        }

    # Live Telegram Bot API Dispatch
    try:
        # 1. Send Main Text Message
        main_resp = _send_telegram_http(token=token, chat_id=chat_id, text=message_text)
        logger.info(f"[TELEGRAM ALERT] Sent order message for {request_id} to chat {chat_id}")

        # 2. Send Selected Product Photo if applicable
        photo_resp = None
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
                    chat_id=chat_id,
                    file_field="photo",
                    file_path=product_image_path,
                    filename=os.path.basename(product_image_path),
                    caption=photo_caption
                )
                logger.info(f"[TELEGRAM ALERT] Sent product photo {prod_code_display} for {request_id}")
            except Exception as photo_err:
                safe_photo_err = _sanitize_for_logging(str(photo_err), token)
                logger.error(f"[TELEGRAM ALERT] Failed sending product photo: {safe_photo_err}")

        # 3. Send Customer Uploaded Reference Files
        doc_resps = []
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
                    resp = _send_telegram_multipart(
                        token=token,
                        method="sendDocument",
                        chat_id=chat_id,
                        file_field="document",
                        file_path=att_path,
                        filename=att.file_name or os.path.basename(att_path),
                        caption=doc_cap
                    )
                    doc_resps.append(resp)
                    logger.info(f"[TELEGRAM ALERT] Sent reference file {att.file_name} for {request_id}")
            except Exception as doc_err:
                safe_doc_err = _sanitize_for_logging(str(doc_err), token)
                logger.error(f"[TELEGRAM ALERT] Failed sending attachment {att.file_name}: {safe_doc_err}")

        return {
            "status": "sent",
            "chat_id": chat_id,
            "quote_number": request_id,
            "main_message": main_resp,
            "product_photo_sent": bool(photo_resp),
            "attachments_sent": len(doc_resps),
        }
    except Exception as exc:
        safe_exc = _sanitize_for_logging(str(exc), token)
        logger.error(f"[TELEGRAM ALERT EXCEPTION] Failed for quote {request_id}: {safe_exc}")
        return {
            "status": "error",
            "quote_number": request_id,
            "detail": safe_exc,
        }
