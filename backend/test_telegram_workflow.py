import os
import sys
import django
import secrets
from datetime import timedelta
from django.utils import timezone

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.quotations.models import Quote, QuoteStatus, TelegramOrderLink
from apps.orders.models import Order
from apps.products.models import Product
from apps.quotations.telegram_bot import (
    create_order_linking_token,
    handle_start_command,
    handle_myorders_command,
    handle_status_command,
    handle_help_command,
    notify_customer_status_change,
    send_customer_order_confirmation,
    process_telegram_update
)

def run_tests():
    print("=" * 70)
    print("HARA WORKSHOP - COMPREHENSIVE TELEGRAM NOTIFICATION TEST SUITE")
    print("=" * 70)
    
    test_chat_id = "1774429006" # Authorized customer chat ID (Samuel / Manager_Samuel_A)
    unauthorized_chat_id = "999999999" # Attacker / unauthorized chat ID
    
    # -------------------------------------------------------------------------
    # SCENARIO 1: Customer submits order request on website
    # -------------------------------------------------------------------------
    print("\n[Scenario 1] Customer submits order request via API endpoint...")
    product = Product.objects.first()
    product_name = product.name if product else "Bespoke Metal Gate"
    product_code = product.sku if product else "HW-MG-001"
    
    quote = Quote.objects.create(
        customer_name="Abebe Bikila",
        customer_phone="+251911234567",
        customer_email="abebe@example.com",
        project_title="Executive Conference Table",
        product=product,
        product_name=product_name,
        product_code=product_code,
        service_type="Wood Works",
        description="Fine walnut executive conference table with cable management slots.",
        quantity=2,
        status=QuoteStatus.SUBMITTED
    )
    
    token, deep_link = create_order_linking_token(quote=quote)
    print(f"  Created Quote: {quote.quote_number}")
    print(f"  Generated Token: {token[:12]}...")
    print(f"  Generated Deep Link: {deep_link}")
    
    assert quote.quote_number.startswith("QT-"), "Quote number must start with QT-"
    assert "start=" in deep_link, "Deep link must include start parameter"
    assert quote.telegram_link_token == token, "Token must be saved on quote"
    
    link_record = TelegramOrderLink.objects.filter(token=token).first()
    assert link_record is not None, "TelegramOrderLink record must exist in DB"
    assert link_record.is_valid(), "TelegramOrderLink must be valid"
    print("  ✓ Scenario 1 PASSED: Unique reference and secure deep link generated.")

    # -------------------------------------------------------------------------
    # SCENARIO 2 & 3: Customer opens deep link and Telegram confirmation is sent
    # -------------------------------------------------------------------------
    print("\n[Scenario 2 & 3] Customer opens deep link (/start <TOKEN>) & receives order confirmation...")
    user_info = {
        "id": int(test_chat_id),
        "first_name": "Samuel",
        "username": "Manager_Samuel_A"
    }
    
    # Execute /start <token>
    reply = handle_start_command(test_chat_id, user_info["id"], user_info, token)
    
    # Refresh quote from DB
    quote.refresh_from_db()
    assert str(quote.telegram_chat_id) == str(test_chat_id), f"Quote telegram_chat_id should be {test_chat_id}"
    assert quote.telegram_linked_at is not None, "telegram_linked_at should be timestamped"
    
    link_record.refresh_from_db()
    assert link_record.is_used, "Token must be marked as used"
    assert str(link_record.telegram_user_id) == str(test_chat_id), "Link record must store user_id"
    
    # Test dispatching the 8-field order confirmation directly to verify payload delivery
    conf_res = send_customer_order_confirmation(quote, test_chat_id)
    print(f"  Confirmation delivery status: {conf_res.get('status')}")
    assert conf_res.get('status') in ['sent', 'simulated'], f"Confirmation send failed: {conf_res}"
    print("  ✓ Scenario 2 & 3 PASSED: Linked securely, token consumed, and 8-field confirmation delivered to Telegram.")

    # -------------------------------------------------------------------------
    # SCENARIO 4: Administrator updates order status & duplicate suppression
    # -------------------------------------------------------------------------
    print("\n[Scenario 4] Admin updates order status & tests duplicate notification suppression...")
    # Change status to UNDER_REVIEW
    quote.status = QuoteStatus.UNDER_REVIEW
    quote.save()
    
    res1 = notify_customer_status_change(quote, new_status=QuoteStatus.UNDER_REVIEW, reason="Workshop craftsmen are reviewing the technical drawings.")
    print(f"  First status update dispatched: {res1.get('status')}")
    assert res1.get('status') in ['sent', 'simulated'], "Status update notification should be dispatched"
    
    quote.refresh_from_db()
    assert quote.telegram_last_notified_status == QuoteStatus.UNDER_REVIEW, "Last notified status must be recorded"
    
    # Attempt to send same status again
    res2 = notify_customer_status_change(quote, new_status=QuoteStatus.UNDER_REVIEW, reason="Duplicate admin click")
    print(f"  Duplicate status update dispatch result: {res2.get('status')} ({res2.get('reason')})")
    assert res2.get('status') == 'skipped', "Duplicate notification for identical status must be suppressed"
    print("  ✓ Scenario 4 PASSED: Status notification delivered; duplicate prevented.")

    # -------------------------------------------------------------------------
    # SCENARIO 5: Customer sends /myorders
    # -------------------------------------------------------------------------
    print("\n[Scenario 5] Customer sends /myorders...")
    my_orders_msg = handle_myorders_command(test_chat_id, int(test_chat_id))
    print(f"  /myorders output preview:\n{'-'*40}\n{my_orders_msg[:300]}...\n{'-'*40}")
    assert quote.quote_number in my_orders_msg, f"/myorders must list quote {quote.quote_number}"
    print("  ✓ Scenario 5 PASSED: /myorders returns customer's linked orders.")

    # -------------------------------------------------------------------------
    # SCENARIO 6: Customer sends /status <REF> and unauthorized user access check
    # -------------------------------------------------------------------------
    print("\n[Scenario 6] Customer sends /status <REF> & unauthorized access check...")
    # Authorized customer check
    auth_status_msg = handle_status_command(test_chat_id, int(test_chat_id), quote.quote_number)
    assert quote.quote_number in auth_status_msg, "Authorized user must view their order status"
    assert "Under Review" in auth_status_msg or "UNDER_REVIEW" in auth_status_msg, "Order status should be present"
    print("  Authorized customer status check: SUCCESS")
    
    # Unauthorized customer attempt
    unauth_status_msg = handle_status_command(unauthorized_chat_id, int(unauthorized_chat_id), quote.quote_number)
    print(f"  Unauthorized query response: {unauth_status_msg.strip()}")
    assert "No order found" in unauth_status_msg or "not linked" in unauth_status_msg or "permission" in unauth_status_msg, \
        "Unauthorized user MUST NOT see order details"
    assert quote.customer_name not in unauth_status_msg, "No customer details leaked to unauthorized user"
    print("  ✓ Scenario 6 PASSED: Order status displayed for owner; strictly blocked for unauthorized user.")

    # -------------------------------------------------------------------------
    # SCENARIO 7: Customer sends /help
    # -------------------------------------------------------------------------
    print("\n[Scenario 7] Customer sends /help...")
    help_msg = handle_help_command(test_chat_id, int(test_chat_id))
    assert "/status" in help_msg, "Help must explain /status command"
    assert "/myorders" in help_msg, "Help must explain /myorders command"
    assert "Manager_Samuel_A" in help_msg or "Samuel" in help_msg, "Help must provide contact details"
    print("  ✓ Scenario 7 PASSED: /help command provides clear instructions.")

    # -------------------------------------------------------------------------
    # SCENARIO 8: Expired / invalid linking token handling
    # -------------------------------------------------------------------------
    print("\n[Scenario 8] Expired / invalid token rejection...")
    # Test 8a: Completely invalid token
    inv_msg = handle_start_command(test_chat_id, int(test_chat_id), user_info, "INVALID_RANDOM_TOKEN_12345")
    assert "invalid" in inv_msg.lower() or "not recognized" in inv_msg.lower(), f"Unexpected invalid msg: {inv_msg}"
    print(f"  Invalid token handled correctly: {inv_msg.strip()[:60]}...")
    
    # Test 8b: Already used token
    used_msg = handle_start_command(test_chat_id, int(test_chat_id), user_info, token)
    assert "already been used" in used_msg.lower(), f"Unexpected used msg: {used_msg}"
    print(f"  Used token rejection handled correctly: {used_msg.strip()[:60]}...")
    
    # Test 8c: Expired token
    expired_quote = Quote.objects.create(
        customer_name="Tadesse",
        customer_phone="+251911999999",
        project_title="Steel Canopy",
        service_type="Metal Works",
        description="Steel canopy frame"
    )
    exp_token = secrets.token_urlsafe(32)
    TelegramOrderLink.objects.create(
        quote=expired_quote,
        token=exp_token,
        expires_at=timezone.now() - timedelta(hours=1), # already expired
        is_used=False
    )
    exp_msg = handle_start_command(test_chat_id, int(test_chat_id), user_info, exp_token)
    assert "expired" in exp_msg.lower(), f"Unexpected expired msg: {exp_msg}"
    print(f"  Expired token rejection handled correctly: {exp_msg.strip()[:60]}...")
    print("  ✓ Scenario 8 PASSED: Invalid and expired tokens rejected securely.")

    # -------------------------------------------------------------------------
    # SCENARIO 9: Website submission without Telegram
    # -------------------------------------------------------------------------
    print("\n[Scenario 9] Website submission without connecting Telegram...")
    offline_quote = Quote.objects.create(
        customer_name="Marta Hailu",
        customer_phone="+251922334455",
        customer_email="marta@example.com",
        project_title="Garden Pergola",
        service_type="Hybrid Metal + Wood",
        description="Garden Pergola design",
        quantity=1,
        status=QuoteStatus.SUBMITTED
    )
    assert offline_quote.quote_number.startswith("QT-"), "Order must have valid reference"
    assert not offline_quote.telegram_chat_id, "Chat ID must remain empty"
    # Admin status change does not crash when telegram_chat_id is empty
    status_change_res = notify_customer_status_change(offline_quote, QuoteStatus.PRICE_PROPOSED, reason="Reviewed by team")
    assert status_change_res.get('status') == 'skipped', "Should gracefully skip without exceptions"
    print("  ✓ Scenario 9 PASSED: Non-Telegram order functions normally and without error.")

    # -------------------------------------------------------------------------
    # TEST FULL UPDATE PROCESSING PIPELINE
    # -------------------------------------------------------------------------
    print("\n[Integration Check] Testing process_telegram_update dispatcher...")
    upd = {
        "update_id": 12345678,
        "message": {
            "message_id": 999,
            "from": {"id": int(test_chat_id), "username": "Manager_Samuel_A", "first_name": "Samuel"},
            "chat": {"id": int(test_chat_id), "type": "private"},
            "text": "/myorders"
        }
    }
    proc_res = process_telegram_update(upd)
    print(f"  process_telegram_update result: {proc_res.get('status')}")
    assert proc_res.get('status') in ['replied', 'processed'], f"Update processing failed: {proc_res}"
    print("  ✓ Integration Check PASSED: Incoming Telegram update routed and processed cleanly.")

    print("\n" + "=" * 70)
    print("ALL 9 SCENARIOS VERIFIED AND PASSED SUCCESSFULLY!")
    print("=" * 70)

if __name__ == '__main__':
    run_tests()
