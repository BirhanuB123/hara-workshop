import html
import logging
import secrets
from datetime import timedelta
from decimal import Decimal
import json
import urllib.request
from django.conf import settings
from django.db.models import Q
from django.utils import timezone
from .models import Quote, QuoteStatus, TelegramOrderLink
from .tasks import _send_telegram_http, _sanitize_for_logging

logger = logging.getLogger(__name__)

BOT_USERNAME = getattr(settings, 'TELEGRAM_BOT_USERNAME', 'HaraWorkshopOrdersBot').lstrip('@')

def get_main_reply_keyboard() -> dict:
    """
    Persistent reply keyboard displayed in the Telegram client.
    Allows one-tap access to My Orders, Order Status, Help, and Website.
    """
    return {
        "keyboard": [
            [{"text": "📋 My Orders"}, {"text": "📦 Order Status"}],
            [{"text": "🛠️ Help & Contact"}, {"text": "🌐 Website"}]
        ],
        "resize_keyboard": True,
        "one_time_keyboard": False,
        "is_persistent": True
    }


def get_unlinked_inline_keyboard(frontend_url: str) -> dict:
    return {
        "inline_keyboard": [
            [{"text": "🌐 Visit Website to Request Quote", "url": frontend_url}],
            [{"text": "📞 Contact Workshop Manager", "url": "https://t.me/Manager_Samuel_A"}],
            [{"text": "🔄 Check My Orders Again", "callback_data": "my_orders"}]
        ]
    }


def get_myorders_inline_keyboard(quotes) -> dict:
    buttons = []
    for q in quotes[:5]:
        ref = q.quote_number
        buttons.append([{"text": f"🔍 Status: {ref}", "callback_data": f"status:{ref}"}])
    buttons.append([{"text": "🔄 Refresh Orders", "callback_data": "my_orders"}])
    return {"inline_keyboard": buttons}


def _answer_callback_query(token: str, callback_query_id: str, text: str = None, show_alert: bool = False) -> dict:
    """
    Acknowledges incoming callback queries to stop the Telegram client button spinner.
    """
    if not token or not callback_query_id:
        return {}
    url = f"https://api.telegram.org/bot{token}/answerCallbackQuery"
    payload = {"callback_query_id": str(callback_query_id)}
    if text:
        payload["text"] = str(text)[:200]
    if show_alert:
        payload["show_alert"] = True
    data_bytes = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=data_bytes,
        headers={"Content-Type": "application/json", "User-Agent": "HaraWorkshop-TelegramAlert/2.0"},
        method="POST"
    )
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except Exception as exc:
        safe_exc = _sanitize_for_logging(str(exc), token)
        logger.warning(f"[TELEGRAM] answerCallbackQuery error: {safe_exc}")
        return {"ok": False, "error": safe_exc}


STATUS_DISPLAY_MAP = {
    # Quote statuses
    'SUBMITTED': {
        'title': 'Request Received',
        'desc': 'Your request has been received and logged in our workshop management system.',
    },
    'UNDER_REVIEW': {
        'title': 'Under Review',
        'desc': 'Our engineering team is evaluating your project specifications and material requirements.',
    },
    'PRICE_PROPOSED': {
        'title': 'Price Proposal Ready',
        'desc': 'An itemized quotation has been prepared and is ready for your review.',
    },
    'CUSTOMER_ACCEPTED': {
        'title': 'Approved',
        'desc': 'Your quotation has been approved and queued for fabrication planning.',
    },
    'CUSTOMER_REJECTED': {
        'title': 'Cancelled',
        'desc': 'The request has been marked as cancelled.',
    },
    'EXPIRED': {
        'title': 'Expired',
        'desc': 'The quotation proposal has expired.',
    },
    'CONVERTED_TO_ORDER': {
        'title': 'Order Confirmed',
        'desc': 'Your request has been approved and converted to an active workshop fabrication order.',
    },
    # Order statuses
    'PENDING': {
        'title': 'Request Received',
        'desc': 'Your order is pending initial workshop scheduling.',
    },
    'CONFIRMED': {
        'title': 'Approved & Confirmed',
        'desc': 'Your order is confirmed and scheduled for fabrication at our Bole Arabsa atelier.',
    },
    'ORDER_CONFIRMED': {
        'title': 'Approved & Confirmed',
        'desc': 'Your order is confirmed and scheduled for fabrication at our Bole Arabsa atelier.',
    },
    'IN_PRODUCTION': {
        'title': 'In Production',
        'desc': 'Master craftsmen are actively cutting, welding, and assembling your project.',
    },
    'QUALITY_CHECK': {
        'title': 'Quality Inspection',
        'desc': 'Your pieces are undergoing dimensional inspection and weld/finish checks.',
    },
    'READY': {
        'title': 'Ready for Delivery',
        'desc': 'Fabrication is complete and your order is prepared for site dispatch.',
    },
    'READY_FOR_DELIVERY': {
        'title': 'Ready for Delivery',
        'desc': 'Fabrication is complete and your order is prepared for site dispatch.',
    },
    'DELIVERY': {
        'title': 'Out for Delivery',
        'desc': 'Your order is in transit to your specified site in Addis Ababa.',
    },
    'INSTALLATION': {
        'title': 'On-Site Installation',
        'desc': 'Our fitting technicians are installing and anchoring your pieces on site.',
    },
    'COMPLETED': {
        'title': 'Completed',
        'desc': 'Your order has been successfully completed and delivered.',
    },
    'CANCELLED': {
        'title': 'Cancelled',
        'desc': 'This order has been cancelled.',
    },
}


def get_status_display_info(status_code: str) -> dict:
    code = (status_code or '').strip().upper()
    if code in STATUS_DISPLAY_MAP:
        return STATUS_DISPLAY_MAP[code]
    clean_title = code.replace('_', ' ').title()
    return {
        'title': clean_title,
        'desc': f'Current workshop status is {clean_title}.',
    }


def create_order_linking_token(quote=None, order=None, valid_hours=72) -> tuple:
    """
    Generates a cryptographically secure, unpredictable, single-use linking token
    and returns (token, deep_link).
    Does NOT leak personal info, phone numbers, or database IDs.
    """
    token = secrets.token_urlsafe(32)  # 43 URL-safe chars
    expires_at = timezone.now() + timedelta(hours=valid_hours)

    TelegramOrderLink.objects.create(
        quote=quote,
        order=order,
        token=token,
        expires_at=expires_at,
        is_used=False
    )

    if quote:
        quote.telegram_link_token = token
        quote.telegram_token_expires_at = expires_at
        quote.save(update_fields=['telegram_link_token', 'telegram_token_expires_at'])

    bot_user = getattr(settings, 'TELEGRAM_BOT_USERNAME', 'HaraWorkshopOrdersBot').lstrip('@')
    deep_link = f"https://t.me/{bot_user}?start={token}"
    return token, deep_link


def send_customer_order_confirmation(quote, chat_id: str) -> dict:
    """
    Sends the official order confirmation to the customer after linking Telegram.
    Includes all 8 required fields:
    1. Order reference
    2. Product name and product code, when applicable
    3. Service category
    4. Project title
    5. Quantity
    6. Submission date
    7. Current order status
    8. Instructions for contacting HARA WORKSHOP
    Does NOT send personal info or raw attachments.
    """
    token = getattr(settings, 'TELEGRAM_BOT_TOKEN', '').strip()
    if not token:
        logger.warning(f"[TELEGRAM CONFIRMATION] Bot token not set. Simulating confirmation for chat {chat_id}")
        return {'status': 'simulated', 'chat_id': chat_id}

    ref = quote.quote_number or str(quote.id)
    project_title = quote.project_title or 'Custom Fabrication'
    service_cat = quote.service_type or 'General Fabrication'
    prod_name = quote.product_name or (quote.product.name if quote.product else '')
    prod_code = quote.product_code or (quote.product.sku if quote.product else '')
    qty = quote.quantity or 1

    try:
        local_created = timezone.localtime(quote.created_at)
        sub_date = local_created.strftime("%b %d, %Y")
    except Exception:
        sub_date = quote.created_at.strftime("%b %d, %Y") if quote.created_at else "Recently"

    status_info = get_status_display_info(quote.status)
    status_title = status_info['title']

    prod_line = ""
    if prod_name and prod_code:
        prod_line = f"• <b>Product:</b> {html.escape(prod_name)} (<code>{html.escape(prod_code)}</code>)\n"
    elif prod_name:
        prod_line = f"• <b>Product:</b> {html.escape(prod_name)}\n"
    elif prod_code:
        prod_line = f"• <b>Product Code:</b> <code>{html.escape(prod_code)}</code>\n"

    confirmation_text = (
        "🔨 <b>HARA WORKSHOP — ORDER CONFIRMATION</b>\n\n"
        "Thank you for connecting your Telegram account! Your order has been successfully linked for live status updates.\n\n"
        "📋 <b>Order Details:</b>\n"
        f"• <b>Order Reference:</b> <code>{html.escape(ref)}</code>\n"
        f"• <b>Project Title:</b> {html.escape(project_title)}\n"
        f"• <b>Service Category:</b> {html.escape(service_cat)}\n"
        f"{prod_line}"
        f"• <b>Quantity:</b> {qty}\n"
        f"• <b>Submission Date:</b> {html.escape(sub_date)}\n"
        f"• <b>Current Status:</b> <b>{html.escape(status_title)}</b>\n\n"
        "📞 <b>Contact HARA WORKSHOP:</b>\n"
        "If you have questions, design references, or site modifications, contact us directly:\n"
        "• Telegram: @Manager_Samuel_A\n"
        "• Phone: +251 926 629 999\n"
        "• Atelier: Bole Arabsa, Near Water Tanker, Addis Ababa\n\n"
        "<i>You will receive automated updates here whenever your order status changes!</i>\n\n"
        "💡 <i>Commands: /myorders to view your orders, /status to check status, /help for help.</i>"
    )

    try:
        res = _send_telegram_http(token=token, chat_id=chat_id, text=confirmation_text, reply_markup=get_main_reply_keyboard())
        logger.info(f"[TELEGRAM CONFIRMATION] Delivered confirmation for {ref} to customer chat {chat_id}")
        return {'status': 'sent', 'result': res}
    except Exception as exc:
        safe_exc = _sanitize_for_logging(str(exc), token)
        logger.error(f"[TELEGRAM CONFIRMATION ERROR] Failed to send confirmation for {ref}: {safe_exc}")
        return {'status': 'failed', 'error': safe_exc}


def handle_start_command(chat_id: str, user_id: str, user_info: dict, token: str = None) -> str:
    """
    Handles /start and /start <linking_token>.
    If token provided: validates token, links order to user_id, marks token used, and dispatches confirmation.
    """
    token_str = (token or '').strip()

    if token_str:
        link = TelegramOrderLink.objects.select_related('quote', 'order').filter(token=token_str).first()
        if not link:
            return (
                "⚠️ <b>Invalid Linking Token</b>\n\n"
                "This order linking link is not recognized or does not exist. "
                "Please verify the link from your order confirmation on our website, or contact our workshop manager at @Manager_Samuel_A."
            )

        if not link.is_valid():
            if link.is_used:
                return (
                    "ℹ️ <b>Link Already Used</b>\n\n"
                    "This order linking token has already been used. "
                    "Type /myorders to see all orders connected to your Telegram account."
                )
            else:
                return (
                    "⚠️ <b>Link Expired</b>\n\n"
                    "This order linking token has expired for security reasons. "
                    "Please visit our website or contact our workshop manager at @Manager_Samuel_A."
                )

        # Mark link as used and record user info
        link.is_used = True
        link.telegram_user_id = str(chat_id)
        link.telegram_username = user_info.get('username', '') or ''
        link.telegram_first_name = user_info.get('first_name', '') or ''
        link.linked_at = timezone.now()
        link.save()

        # Associate with quote
        quote = link.quote
        if quote:
            quote.telegram_chat_id = str(chat_id)
            quote.telegram_linked_at = timezone.now()
            quote.save(update_fields=['telegram_chat_id', 'telegram_linked_at'])

            if hasattr(quote, 'order') and quote.order:
                quote.order.telegram_chat_id = str(chat_id)
                quote.order.telegram_linked_at = timezone.now()
                quote.order.save(update_fields=['telegram_chat_id', 'telegram_linked_at'])

            # Send order confirmation
            send_customer_order_confirmation(quote, str(chat_id))
            return ""  # Confirmation already sent as comprehensive message

        order = link.order
        if order:
            order.telegram_chat_id = str(chat_id)
            order.telegram_linked_at = timezone.now()
            order.save(update_fields=['telegram_chat_id', 'telegram_linked_at'])
            return (
                f"✅ <b>Order Linked Successfully!</b>\n\n"
                f"Order <code>{html.escape(order.order_number)}</code> is now securely connected to your Telegram account. "
                f"You will receive live status updates as fabrication progresses.\n\n"
                f"Type /status {html.escape(order.order_number)} to view full details."
            )

    # Standard welcome without linking token
    username = (user_info.get('username') or '').strip().lstrip('@')
    manager_chat_id = getattr(settings, 'TELEGRAM_MANAGER_CHAT_ID', '860309749').strip()
    if username.lower() == 'manager_samuel_a' or str(chat_id) == manager_chat_id:
        logger.info(f"[TELEGRAM MANAGER IDENTIFIED] Manager Samuel (@{username}) connected with Chat ID {chat_id}")
        return (
            "👋 <b>Welcome Workshop Manager Samuel!</b>\n\n"
            f"Your Telegram account (<code>@{html.escape(username or 'Manager_Samuel_A')}</code>) is recognized.\n"
            f"Your verified Telegram Chat ID is: <code>{chat_id}</code>\n\n"
            "<b>Management Status:</b>\n"
            "• You are now primed to receive private customer quotation alerts.\n"
            "• Tap <b>📋 My Orders</b> to inspect customer ledger entries.\n"
            "• Use /status <ref> to check any quotation or order.\n\n"
            "<i>HARA WORKSHOP Management Bot • Bole Arabsa</i>"
        )

    bot_name = getattr(settings, 'WORKSHOP_NAME', 'HARA WORKSHOP')
    frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')
    return (
        f"Welcome to {html.escape(bot_name)}! 👋\n\n"
        "Thank you for contacting us.\n\n"
        "You can use this bot to:\n"
        "• Connect your Telegram account to a product or project request.\n"
        "• Receive order confirmations.\n"
        "• Check your order status.\n"
        "• Receive updates from our workshop team.\n\n"
        f"To get started, submit your order through the HARA WORKSHOP website ({html.escape(frontend_url)}) and use the Telegram order-linking instructions provided after submission.\n\n"
        "Type /help to see available commands."
    )


def handle_myorders_command(chat_id: str, user_id: str) -> str:
    """
    Shows orders securely linked to this customer's Telegram account.
    Never exposes other customers' orders.
    """
    chat_str = str(chat_id)
    user_str = str(user_id) if user_id else chat_str
    chat_ids = {chat_str, user_str} - {'', 'None'}

    quotes = Quote.objects.filter(
        Q(telegram_chat_id__in=chat_ids) |
        Q(telegram_links__telegram_user_id__in=chat_ids, telegram_links__is_used=True)
    ).distinct().order_by('-created_at')[:10]

    from apps.orders.models import Order
    orders = Order.objects.filter(
        Q(telegram_chat_id__in=chat_ids) |
        Q(telegram_links__telegram_user_id__in=chat_ids, telegram_links__is_used=True) |
        Q(quote__telegram_chat_id__in=chat_ids)
    ).distinct().order_by('-created_at')[:10]

    frontend_url = getattr(settings, 'FRONTEND_URL', 'https://hara-workshop.vercel.app').rstrip('/')

    if not quotes.exists() and not orders.exists():
        return (
            "ℹ️ <b>No Linked Orders Found</b>\n\n"
            "You do not have any workshop quotations or orders connected to this Telegram account yet.\n\n"
            "<b>How to link your orders:</b>\n"
            f"1. Submit your project request on our website: {html.escape(frontend_url)}\n"
            "2. On the submission confirmation screen, tap <b>'Get Order Updates on Telegram'</b>.\n"
            "3. Tap <b>Start</b> when prompted by Telegram.\n\n"
            "Your order will then be permanently linked, and you will receive instant updates as fabrication progresses!\n\n"
            "<i>Have an existing reference number? Contact Workshop Manager Samuel at @Manager_Samuel_A or call +251 926 629 999.</i>"
        )

    lines = ["📋 <b>YOUR HARA WORKSHOP ORDERS</b>\n\nHere are the orders currently linked to your Telegram account:\n"]
    counter = 1

    for q in quotes:
        status_info = get_status_display_info(q.status)
        try:
            local_dt = timezone.localtime(q.created_at)
            dt_str = local_dt.strftime("%b %d, %Y")
        except Exception:
            dt_str = q.created_at.strftime("%b %d, %Y") if q.created_at else ""

        prod_part = f" ({html.escape(q.product_name)})" if q.product_name else ""
        lines.append(
            f"<b>{counter}. <code>{html.escape(q.quote_number)}</code></b>\n"
            f"• <b>Project:</b> {html.escape(q.project_title)}{prod_part}\n"
            f"• <b>Service:</b> {html.escape(q.service_type or 'Fabrication')}\n"
            f"• <b>Status:</b> <b>{html.escape(status_info['title'])}</b>\n"
            f"• <b>Date:</b> {dt_str}\n"
        )
        counter += 1

    for o in orders:
        if quotes.filter(quote_number=o.order_number).exists():
            continue
        status_info = get_status_display_info(o.status)
        lines.append(
            f"<b>{counter}. <code>{html.escape(o.order_number)}</code></b>\n"
            f"• <b>Status:</b> <b>{html.escape(status_info['title'])}</b>\n"
            f"• <b>Total:</b> {o.total_amount:,.2f} ETB\n"
        )
        counter += 1

    lines.append("💡 <i>Type <code>/status &lt;REFERENCE&gt;</code> (e.g. <code>/status QT-2026-0001</code>) to view full details.</i>")
    return "\n".join(lines)


def handle_status_command(chat_id: str, user_id: str, arg: str = "") -> str:
    """
    Checks order status.
    Strictly verifies ownership server-side: allows checking ONLY orders linked to this Telegram account.
    """
    chat_str = str(chat_id)
    arg_clean = (arg or '').strip()

    if arg_clean:
        # User specified an order reference
        quote = Quote.objects.filter(quote_number__iexact=arg_clean).first()
        from apps.orders.models import Order
        order = Order.objects.filter(order_number__iexact=arg_clean).first()

        target = quote or order
        if not target:
            return (
                f"⚠️ <b>Order Not Found</b>\n\n"
                f"No order with reference <code>{html.escape(arg_clean)}</code> was found in our system.\n\n"
                f"Please check the reference number or type /myorders to see your linked orders."
            )

        # SECURITY CHECK: Ownership verification
        is_owner = (
            target.telegram_chat_id == chat_str or
            TelegramOrderLink.objects.filter(telegram_user_id=chat_str, quote=quote).exists() or
            (order and TelegramOrderLink.objects.filter(telegram_user_id=chat_str, order=order).exists())
        )

        if not is_owner:
            logger.warning(f"[SECURITY] Telegram user {chat_str} attempted unauthorized access to {arg_clean}")
            return (
                f"⚠️ <b>Access Restricted</b>\n\n"
                f"Order <code>{html.escape(arg_clean)}</code> is not linked to your Telegram account. "
                f"For your security and privacy, you can only view orders connected to your account.\n\n"
                f"Type /myorders to see your orders, or contact @Manager_Samuel_A for help."
            )

        # Format complete status response
        ref = quote.quote_number if quote else order.order_number
        project_title = quote.project_title if quote else f"Order {order.order_number}"
        service_type = quote.service_type if quote else "Custom Metal and Wood Fabrication"
        prod_name = quote.product_name if quote else ""
        prod_code = quote.product_code if quote else ""
        qty = quote.quantity if quote else 1
        status_code = quote.status if quote else order.status
        status_info = get_status_display_info(status_code)

        try:
            sub_date = timezone.localtime(target.created_at).strftime("%b %d, %Y")
        except Exception:
            sub_date = target.created_at.strftime("%b %d, %Y") if target.created_at else "Recently"

        prod_line = ""
        if prod_name and prod_code:
            prod_line = f"• <b>Product:</b> {html.escape(prod_name)} (<code>{html.escape(prod_code)}</code>)\n"
        elif prod_name:
            prod_line = f"• <b>Product:</b> {html.escape(prod_name)}\n"

        return (
            "📦 <b>HARA WORKSHOP — ORDER STATUS</b>\n\n"
            f"• <b>Order Reference:</b> <code>{html.escape(ref)}</code>\n"
            f"• <b>Project Title:</b> {html.escape(project_title)}\n"
            f"• <b>Service Category:</b> {html.escape(service_type)}\n"
            f"{prod_line}"
            f"• <b>Quantity:</b> {qty}\n"
            f"• <b>Submission Date:</b> {html.escape(sub_date)}\n"
            f"• <b>Current Status:</b> <b>{html.escape(status_info['title'])}</b>\n\n"
            "<b>Status Overview:</b>\n"
            f"{html.escape(status_info['desc'])}\n\n"
            "📞 <b>Workshop Support:</b>\n"
            "• Telegram: @Manager_Samuel_A\n"
            "• Phone: +251 926 629 999\n"
            "• Atelier: Bole Arabsa, Addis Ababa"
        )

    # If no argument, inspect user's linked orders
    quotes = Quote.objects.filter(telegram_chat_id=chat_str).order_by('-created_at')
    if quotes.count() == 1:
        # Exactly one order: display it directly
        return handle_status_command(chat_id, user_id, quotes.first().quote_number)
    elif quotes.count() > 1:
        bullets = "\n".join([f"• <code>{html.escape(q.quote_number)}</code> — {html.escape(q.project_title)}" for q in quotes])
        return (
            "🔍 <b>Check Order Status</b>\n\n"
            "You have multiple orders linked. Please specify which order reference you would like to check:\n\n"
            f"<code>/status &lt;REFERENCE&gt;</code>\n\n"
            f"<b>Your Linked Orders:</b>\n{bullets}\n\n"
            "<i>Example: <code>/status {quotes.first().quote_number}</code></i>"
        )
    else:
        return (
            "ℹ️ <b>No Orders Linked</b>\n\n"
            "You don't have any orders linked to this Telegram account yet.\n"
            "Submit a request on our website and click 'Get Order Updates on Telegram' on the confirmation screen."
        )


def handle_help_command(chat_id: str, user_id: str) -> str:
    """
    Returns helpful information, website link, and contact details.
    """
    bot_name = getattr(settings, 'WORKSHOP_NAME', 'HARA WORKSHOP')
    frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')
    return (
        f"🛠️ <b>{html.escape(bot_name)} Bot Assistance</b>\n\n"
        "<b>Available Commands:</b>\n"
        "• /start — Welcome message and order-linking guide\n"
        "• /myorders — View all orders linked to your account\n"
        "• /status &lt;ref&gt; — View detailed status of a linked order\n"
        "• /help — Show this assistance message\n\n"
        f"<b>Website:</b> {html.escape(frontend_url)}\n\n"
        "<b>Workshop Contact & Location:</b>\n"
        "• Workshop Manager: @Manager_Samuel_A\n"
        "• Telephone: +251 926 629 999\n"
        "• Email: info@haraworkshop.com\n"
        "• Atelier: Bole Arabsa, Near Water Tanker, Addis Ababa\n"
        "• Operating Hours: Mon - Sat: 8:00 AM - 6:00 PM\n\n"
        "<i>All metal, wood, and hybrid projects are handcrafted in Bole Arabsa with 10-stage quality assurance.</i>"
    )


def notify_customer_status_change(instance, new_status: str, reason: str = "") -> dict:
    """
    Notifies the customer via Telegram when an administrator changes their order/quote status.
    - Uses actual statuses supported by the application.
    - Prevents duplicate notifications if the same status is submitted repeatedly.
    - Safely logs errors without leaking bot tokens.
    """
    from apps.orders.models import Order

    # Determine chat_id
    chat_id = getattr(instance, 'telegram_chat_id', '').strip()
    if not chat_id and isinstance(instance, Order) and instance.quote:
        chat_id = getattr(instance.quote, 'telegram_chat_id', '').strip()

    if not chat_id:
        # Check TelegramOrderLink table
        link = None
        if hasattr(instance, 'telegram_links'):
            link = instance.telegram_links.filter(is_used=True).first()
        if not link and isinstance(instance, Order) and instance.quote:
            link = instance.quote.telegram_links.filter(is_used=True).first()
        if link and link.telegram_user_id:
            chat_id = link.telegram_user_id

    if not chat_id:
        return {'status': 'skipped', 'reason': 'No Telegram account linked to this order'}

    # Guard against duplicate notification for same status
    last_notified = getattr(instance, 'telegram_last_notified_status', '')
    if last_notified == new_status:
        logger.info(f"[TELEGRAM STATUS ALERT] Duplicate notification for {new_status} skipped.")
        return {'status': 'skipped', 'reason': 'Duplicate status notification prevented'}

    token = getattr(settings, 'TELEGRAM_BOT_TOKEN', '').strip()
    if not token:
        logger.warning(f"[TELEGRAM STATUS ALERT] Bot token not set. Simulating status update for chat {chat_id}")
        instance.telegram_last_notified_status = new_status
        instance.save(update_fields=['telegram_last_notified_status'])
        return {'status': 'simulated', 'chat_id': chat_id, 'new_status': new_status}

    ref = getattr(instance, 'quote_number', None) or getattr(instance, 'order_number', None) or str(instance.id)
    project_title = getattr(instance, 'project_title', '') or (instance.quote.project_title if hasattr(instance, 'quote') and instance.quote else 'Workshop Order')
    service_type = getattr(instance, 'service_type', '') or (instance.quote.service_type if hasattr(instance, 'quote') and instance.quote else 'Metal & Wood Fabrication')
    prod_name = getattr(instance, 'product_name', '') or (instance.quote.product_name if hasattr(instance, 'quote') and instance.quote else '')

    status_info = get_status_display_info(new_status)
    status_title = status_info['title']
    status_desc = status_info['desc']

    prod_line = f"• <b>Product:</b> {html.escape(prod_name)}\n" if prod_name else ""
    reason_line = f"\n<b>Note from Workshop:</b>\n{html.escape(reason)}\n" if reason else ""

    message_text = (
        "🔔 <b>HARA WORKSHOP — ORDER STATUS UPDATE</b>\n\n"
        f"• <b>Order Reference:</b> <code>{html.escape(ref)}</code>\n"
        f"• <b>Project:</b> {html.escape(project_title)}\n"
        f"• <b>Service Category:</b> {html.escape(service_type)}\n"
        f"{prod_line}"
        f"• <b>New Status:</b> <b>{html.escape(status_title)}</b>\n\n"
        "<b>Status Details:</b>\n"
        f"{html.escape(status_desc)}\n"
        f"{reason_line}\n"
        "📞 <b>Questions or Site Updates?</b>\n"
        "• Manager Samuel: @Manager_Samuel_A\n"
        "• Phone: +251 926 629 999\n\n"
        "<i>HARA WORKSHOP • Metal & Wood Solution, Bole Arabsa</i>"
    )

    try:
        res = _send_telegram_http(token=token, chat_id=chat_id, text=message_text)
        # Update last notified status upon confirmed dispatch
        instance.telegram_last_notified_status = new_status
        instance.save(update_fields=['telegram_last_notified_status'])
        logger.info(f"[TELEGRAM STATUS ALERT] Successfully notified chat {chat_id} of status {new_status} for {ref}")
        return {'status': 'sent', 'result': res}
    except Exception as exc:
        safe_exc = _sanitize_for_logging(str(exc), token)
        logger.error(f"[TELEGRAM STATUS ALERT ERROR] Failed to send status update for {ref}: {safe_exc}")
        return {'status': 'failed', 'error': safe_exc}


def process_telegram_update(update: dict) -> dict:
    """
    Central processor for incoming Telegram updates (via Webhook or Polling worker).
    Handles:
    - callback_query (inline buttons: 'my_orders', 'status:<ref>', 'help', etc.)
    - message / edited_message commands (/start, /myorders, /status, /help)
    - text buttons ('📋 My Orders', '📦 Order Status', '🛠️ Help & Contact', '🌐 Website')
    - acknowledges callback queries immediately via answerCallbackQuery
    - returns persistent main reply keyboard markup
    """
    if not isinstance(update, dict):
        return {'status': 'ignored', 'reason': 'Invalid update payload format'}

    token = getattr(settings, 'TELEGRAM_BOT_TOKEN', '').strip()
    frontend_url = getattr(settings, 'FRONTEND_URL', 'https://hara-workshop.vercel.app').rstrip('/')
    main_keyboard = get_main_reply_keyboard()

    # -------------------------------------------------------------
    # 1. HANDLE INLINE CALLBACK QUERIES
    # -------------------------------------------------------------
    callback_query = update.get('callback_query')
    if callback_query:
        cq_id = str(callback_query.get('id', ''))
        from_user = callback_query.get('from', {})
        user_id = str(from_user.get('id', ''))
        msg = callback_query.get('message') or {}
        chat = msg.get('chat', {})
        chat_id = str(chat.get('id') or user_id)
        raw_data = str(callback_query.get('data') or '').strip()
        data_clean = raw_data.lower()

        logger.info(f"[TELEGRAM CALLBACK] Processing '{raw_data}' from user {user_id} in chat {chat_id}")

        # Always acknowledge callback query to dismiss button progress indicator
        if token and cq_id:
            _answer_callback_query(token=token, callback_query_id=cq_id, text="Processing...")

        reply_text = ""
        if data_clean in ('my_orders', 'myorders', 'orders', 'refresh_orders'):
            reply_text = handle_myorders_command(chat_id=chat_id, user_id=user_id)
        elif data_clean.startswith('status:') or data_clean.startswith('status_'):
            ref = raw_data.split(':', 1)[1] if ':' in raw_data else raw_data.split('_', 1)[1]
            reply_text = handle_status_command(chat_id=chat_id, user_id=user_id, arg=ref.strip())
        elif data_clean in ('help', 'support', 'contact'):
            reply_text = handle_help_command(chat_id=chat_id, user_id=user_id)
        elif data_clean == 'start':
            reply_text = handle_start_command(chat_id=chat_id, user_id=user_id, user_info=from_user)
        else:
            reply_text = handle_myorders_command(chat_id=chat_id, user_id=user_id)

        if reply_text and token:
            try:
                res = _send_telegram_http(token=token, chat_id=chat_id, text=reply_text, reply_markup=main_keyboard)
                return {'status': 'replied_callback', 'chat_id': chat_id, 'data': raw_data, 'result': res}
            except Exception as exc:
                safe_exc = _sanitize_for_logging(str(exc), token)
                logger.error(f"[TELEGRAM CALLBACK ERROR] Failed replying to {chat_id}: {safe_exc}")
                return {'status': 'error', 'error': safe_exc}

        return {'status': 'processed_callback', 'chat_id': chat_id, 'data': raw_data}

    # -------------------------------------------------------------
    # 2. HANDLE TEXT MESSAGES & BOT COMMANDS
    # -------------------------------------------------------------
    message = update.get('message') or update.get('edited_message')
    if not message:
        return {'status': 'ignored', 'reason': 'No recognized message or callback_query content'}

    chat = message.get('chat', {})
    chat_id = str(chat.get('id', ''))
    from_user = message.get('from', {})
    user_id = str(from_user.get('id', ''))
    text = (message.get('text') or '').strip()

    if not chat_id:
        return {'status': 'ignored', 'reason': 'Missing chat_id in update'}

    if not text:
        return {'status': 'ignored', 'reason': 'Empty text message'}

    clean_text = text.lower()
    logger.info(f"[TELEGRAM MESSAGE] Received text from user {user_id} in chat {chat_id}: '{text[:60]}'")

    # Route /start and /start <linking_token>
    if text.startswith('/start'):
        parts = text.split(maxsplit=1)
        deep_token = parts[1].strip() if len(parts) > 1 else None
        reply = handle_start_command(chat_id=chat_id, user_id=user_id, user_info=from_user, token=deep_token)

    # Route My Orders (Command, button text, or localized variant)
    elif (
        text.startswith('/myorders') or
        text.startswith('/my_orders') or
        text.startswith('/orders') or
        'my orders' in clean_text or
        'myorders' in clean_text or
        'my_orders' in clean_text or
        'ትዕዛዞቼ' in clean_text or
        'ትእዛዞቼ' in clean_text or
        clean_text == 'orders'
    ):
        reply = handle_myorders_command(chat_id=chat_id, user_id=user_id)

    # Route Order Status
    elif (
        text.startswith('/status') or
        clean_text.startswith('status') or
        'order status' in clean_text or
        'check status' in clean_text or
        'ሁኔታ' in clean_text
    ):
        parts = text.split(maxsplit=1)
        arg = parts[1].strip() if len(parts) > 1 else ""
        if 'order status' in clean_text or 'check status' in clean_text:
            arg = ""
        reply = handle_status_command(chat_id=chat_id, user_id=user_id, arg=arg)

    # Route Help & Contact
    elif (
        text.startswith('/help') or
        clean_text.startswith('help') or
        'contact' in clean_text or
        'support' in clean_text or
        'እርዳታ' in clean_text or
        'አግኙን' in clean_text
    ):
        reply = handle_help_command(chat_id=chat_id, user_id=user_id)

    # Route Website button
    elif 'website' in clean_text or 'ዌብሳይት' in clean_text:
        reply = (
            "🌐 <b>HARA WORKSHOP Official Website:</b>\n\n"
            f"{html.escape(frontend_url)}\n\n"
            "Explore our full 90-product catalog across Metal Works, Wood Works, and Hybrid Metal + Wood Construction, or submit a custom fabrication request!"
        )

    else:
        reply = (
            "👋 Hello! I didn't recognize that message.\n\n"
            "Use the buttons below or commands to interact:\n"
            "• <b>📋 My Orders</b> — View your connected workshop orders\n"
            "• <b>📦 Order Status</b> — Check live fabrication progress\n"
            "• <b>🛠️ Help & Contact</b> — Contact details and atelier address\n"
            "• <b>🌐 Website</b> — Browse the official catalog\n\n"
            f"Visit our website to request fabrication:\n{html.escape(frontend_url)}\n\n"
            "<i>To speak directly with our workshop manager, message @Manager_Samuel_A or call +251 926 629 999.</i>"
        )

    if reply and token:
        try:
            res = _send_telegram_http(
                token=token,
                chat_id=chat_id,
                text=reply,
                reply_markup=main_keyboard
            )
            return {'status': 'replied', 'chat_id': chat_id, 'result': res}
        except Exception as exc:
            safe_exc = _sanitize_for_logging(str(exc), token)
            logger.error(f"[TELEGRAM BOT UPDATE ERROR] Failed sending reply to {chat_id}: {safe_exc}")
            return {'status': 'error', 'error': safe_exc}

    return {'status': 'processed', 'reply_preview': reply[:100] if reply else ''}
