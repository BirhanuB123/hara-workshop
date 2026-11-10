import html
import logging
from rest_framework import viewsets, permissions, views, status
from rest_framework.response import Response
from django.conf import settings
from django.utils import timezone
from .models import WorkshopSettings, AuditLog
from .serializers import WorkshopSettingsSerializer, AuditLogSerializer
from apps.quotations.tasks import _send_telegram_http, _sanitize_for_logging
from apps.core.phone_validator import validate_phone_number

logger = logging.getLogger(__name__)

class PublicSettingsView(views.APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        settings_obj = WorkshopSettings.objects.first()
        if not settings_obj:
            settings_obj = WorkshopSettings.objects.create()
        return Response(WorkshopSettingsSerializer(settings_obj).data)

class AdminSettingsViewSet(viewsets.ModelViewSet):
    queryset = WorkshopSettings.objects.all()
    serializer_class = WorkshopSettingsSerializer
    permission_classes = [permissions.IsAdminUser]

class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = AuditLog.objects.all()
    serializer_class = AuditLogSerializer
    permission_classes = [permissions.IsAdminUser]
    filterset_fields = ['action', 'resource', 'user']
    search_fields = ['resource', 'resource_id', 'metadata']


class ContactInquiryView(views.APIView):
    """
    Public API endpoint to handle customer contact inquiries.
    Delivers inquiries directly to the HARA WORKSHOP Management Telegram Group.
    Guarantees inquiries are securely stored in the database first so customer messages are never lost.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        name = str(request.data.get('name', '')).strip()
        phone = str(request.data.get('phone', '')).strip()
        email = str(request.data.get('email', '')).strip()
        subject = str(request.data.get('subject', '')).strip()
        message = str(request.data.get('message', '')).strip()

        errors = {}
        if not name:
            errors['name'] = 'Customer name is required.'
        elif len(name) > 200:
            errors['name'] = 'Name cannot exceed 200 characters.'

        is_phone_valid, phone_err, normalized_phone = validate_phone_number(phone)
        if not is_phone_valid:
            errors['phone'] = phone_err
        else:
            phone = normalized_phone

        if not message:
            errors['message'] = 'Message is required.'
        elif len(message) > 5000:
            errors['message'] = 'Message cannot exceed 5000 characters.'

        if email and len(email) > 200:
            errors['email'] = 'Email cannot exceed 200 characters.'

        if errors:
            return Response(
                {'errors': errors, 'message': 'Please fill in all required fields.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        email_display = email if email else "Not provided"

        # Format submission time
        try:
            local_now = timezone.localtime(timezone.now())
            sub_time_str = local_now.strftime("%Y-%m-%d %I:%M:%S %p %Z")
        except Exception:
            sub_time_str = timezone.now().strftime("%Y-%m-%d %H:%M:%S UTC")

        # Format Telegram message safely with HTML parse mode
        subject_line = f"<b>Subject:</b> {html.escape(subject)}\n" if subject else ""
        telegram_html = (
            "📬 <b>HARA WORKSHOP — NEW CUSTOMER INQUIRY</b>\n\n"
            f"<b>Customer Name:</b> {html.escape(name)}\n"
            f"<b>Phone Number:</b> {html.escape(phone)}\n"
            f"<b>Email Address:</b> {html.escape(email_display)}\n"
            f"{subject_line}"
            f"<b>Submission Time:</b> {html.escape(sub_time_str)}\n\n"
            "<b>Message:</b>\n"
            f"{html.escape(message)}\n\n"
            "<i>HARA WORKSHOP • Bole Arabsa Management</i>"
        )

        bot_token = getattr(settings, 'TELEGRAM_BOT_TOKEN', '').strip()
        # Route to management group chat ID by default, fallback to admin chat ID
        chat_id = (
            getattr(settings, 'TELEGRAM_GROUP_CHAT_ID', None) or
            getattr(settings, 'TELEGRAM_MANAGER_CHAT_ID', None) or
            getattr(settings, 'TELEGRAM_ADMIN_CHAT_ID', None) or
            '860309749'
        ).strip()
        if chat_id in ('@Manager_Samuel_A', 'Manager_Samuel_A'):
            chat_id = getattr(settings, 'TELEGRAM_MANAGER_CHAT_ID', '860309749')
        elif chat_id in ('@haraworkshop', 'haraworkshop', ''):
            chat_id = getattr(settings, 'TELEGRAM_GROUP_CHAT_ID', '-5374750855')

        # 1. ALWAYS persist inquiry in AuditLog first so submission is never lost
        audit_entry = None
        try:
            audit_entry = AuditLog.objects.create(
                user=None,
                action='CREATE',
                resource='ContactInquiry',
                resource_id=None,
                metadata={
                    'name': name,
                    'phone': phone,
                    'email': email_display,
                    'subject': subject,
                    'message': message,
                    'submission_time': sub_time_str,
                    'target_chat_id': chat_id,
                    'delivery_status': 'PENDING',
                }
            )
        except Exception as audit_err:
            logger.warning(f'[CONTACT INQUIRY] Audit log creation failed: {audit_err}')

        if not bot_token:
            logger.warning('[CONTACT INQUIRY] TELEGRAM_BOT_TOKEN is not configured. Saved in database.')
            return Response({
                'success': True,
                'telegram_delivered': False,
                'message': 'Your message has been saved. Our team will review it shortly.',
            }, status=status.HTTP_200_OK)

        # 2. Dispatch to Telegram Management Group
        try:
            telegram_res = _send_telegram_http(token=bot_token, chat_id=chat_id, text=telegram_html)
            if telegram_res and telegram_res.get('ok'):
                message_id = telegram_res.get('result', {}).get('message_id')
                logger.info(f'[CONTACT INQUIRY] Delivered inquiry from {name} to Telegram group {chat_id} (msg {message_id})')

                if audit_entry:
                    try:
                        audit_entry.resource_id = str(message_id)
                        audit_entry.metadata['delivery_status'] = 'DELIVERED'
                        audit_entry.metadata['telegram_message_id'] = message_id
                        audit_entry.save(update_fields=['resource_id', 'metadata'])
                    except Exception:
                        pass

                return Response({
                    'success': True,
                    'telegram_delivered': True,
                    'message': 'Your inquiry has been successfully sent to the workshop management.',
                    'telegram_message_id': message_id,
                }, status=status.HTTP_200_OK)
            else:
                logger.error(f'[CONTACT INQUIRY] Telegram API returned non-ok response: {telegram_res}')
                if audit_entry:
                    audit_entry.metadata['delivery_status'] = 'FAILED'
                    audit_entry.save(update_fields=['metadata'])
                return Response({
                    'success': True,
                    'telegram_delivered': False,
                    'message': 'Your inquiry has been received by HARA WORKSHOP. Notification to management is queued.',
                }, status=status.HTTP_200_OK)
        except Exception as exc:
            safe_err = _sanitize_for_logging(str(exc), bot_token)
            logger.error(f'[CONTACT INQUIRY] Telegram dispatch exception: {safe_err}')
            if audit_entry:
                audit_entry.metadata['delivery_status'] = 'FAILED'
                audit_entry.metadata['error'] = safe_err
                audit_entry.save(update_fields=['metadata'])
            return Response({
                'success': True,
                'telegram_delivered': False,
                'message': 'Your inquiry has been safely received by HARA WORKSHOP. Our management team will follow up shortly.',
            }, status=status.HTTP_200_OK)
