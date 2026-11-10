from django.utils import timezone
from django.db import transaction
import hmac
import os
import uuid
import logging
from rest_framework import viewsets, permissions, status, views
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters
from django.core.exceptions import ValidationError as DjangoValidationError
from django.core.validators import validate_email as django_validate_email
from django.utils.dateparse import parse_date
from decimal import Decimal, InvalidOperation
from django.conf import settings
from .models import Quote, QuoteStatus, QuoteAttachment
from .serializers import QuoteSerializer, QuotePriceProposalSerializer
from apps.accounts.permissions import IsStaffUser, IsOwnerOrStaff
from apps.core.models import AuditLog
from apps.core.throttles import QuoteCreateThrottle

logger = logging.getLogger(__name__)


def _clean_text(value) -> str:
    if value is None or isinstance(value, (dict, list, tuple, bool)):
        return ''
    return str(value).strip()


def _parse_dimension(raw_val, field_label: str):
    if raw_val in (None, ''):
        return None
    try:
        dec = Decimal(str(raw_val).strip())
    except (InvalidOperation, ValueError, TypeError):
        raise ValueError(f'{field_label} must be a valid number.')
    if not dec.is_finite():
        raise ValueError(f'{field_label} must be a finite number.')
    if dec <= 0 or dec > Decimal('999999.99'):
        raise ValueError(f'{field_label} must be between 0.01 and 999999.99 cm.')
    return dec.quantize(Decimal('0.01'))


class QuoteViewSet(viewsets.ModelViewSet):
    queryset = Quote.objects.select_related('customer').prefetch_related('items', 'attachments').all()
    serializer_class = QuoteSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'service_type']
    search_fields = [
        'quote_number', 'project_title',
        'customer_name', 'customer_phone', 'customer_email',
        'customer__email', 'customer__first_name', 'customer__last_name'
    ]
    ordering_fields = ['created_at', 'total_amount', 'status']

    def get_permissions(self):
        if self.action == 'create':
            return [permissions.AllowAny()]
        if self.action in ['list', 'retrieve', 'accept', 'reject', 'telegram_link']:
            return [permissions.IsAuthenticated(), IsOwnerOrStaff()]
        return [permissions.IsAuthenticated(), IsStaffUser()]

    def get_throttles(self):
        if self.action == 'create':
            return [QuoteCreateThrottle()]
        return super().get_throttles()

    def get_queryset(self):
        user = self.request.user
        if not user or not user.is_authenticated:
            return Quote.objects.none()
        qs = Quote.objects.all().select_related('customer', 'product').prefetch_related('items', 'attachments')
        if getattr(user, 'role', None) == 'ADMIN' or user.is_staff or user.is_superuser:
            return qs
        return qs.filter(customer=user)

    def create(self, request, *args, **kwargs):
        data = request.data

        customer_name = _clean_text(data.get('customer_name'))
        customer_phone = _clean_text(data.get('customer_phone') or data.get('phone_number') or data.get('phone'))
        customer_email = _clean_text(data.get('customer_email') or data.get('email'))
        project_title = _clean_text(data.get('project_title') or data.get('title'))
        service_type = _clean_text(data.get('service_type') or data.get('service_category'))
        description = _clean_text(data.get('description') or data.get('notes'))
        material_preference = _clean_text(data.get('material_preference'))
        customer_notes = _clean_text(data.get('customer_notes'))

        # Strict validation of required fields & database length caps
        if not customer_name:
            return Response({'error': 'Customer Name is required.'}, status=status.HTTP_400_BAD_REQUEST)
        if len(customer_name) > 200:
            return Response({'error': 'Customer Name cannot exceed 200 characters.'}, status=status.HTTP_400_BAD_REQUEST)

        from apps.core.phone_validator import validate_phone_number
        is_phone_valid, phone_err, normalized_phone = validate_phone_number(customer_phone)
        if not is_phone_valid:
            return Response({'error': phone_err}, status=status.HTTP_400_BAD_REQUEST)
        customer_phone = normalized_phone

        if not customer_email:
            return Response({'error': 'A valid Email address is required.'}, status=status.HTTP_400_BAD_REQUEST)
        if len(customer_email) > 254:
            return Response({'error': 'Email address cannot exceed 254 characters.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            django_validate_email(customer_email)
        except DjangoValidationError:
            return Response({'error': 'A valid Email address is required.'}, status=status.HTTP_400_BAD_REQUEST)

        if not project_title:
            return Response({'error': 'Project Title is required.'}, status=status.HTTP_400_BAD_REQUEST)
        if len(project_title) > 200:
            return Response({'error': 'Project Title cannot exceed 200 characters.'}, status=status.HTTP_400_BAD_REQUEST)

        if not service_type:
            return Response({'error': 'Service Category is required.'}, status=status.HTTP_400_BAD_REQUEST)
        if not description:
            return Response({'error': 'Project Description & Specific Requirements are required.'}, status=status.HTTP_400_BAD_REQUEST)
        if len(material_preference) > 200:
            return Response({'error': 'Material Preference cannot exceed 200 characters.'}, status=status.HTTP_400_BAD_REQUEST)

        # Map display labels & slugs to canonical values
        service_map = {
            'Metal Works (Fabrication & Welding)': 'Metal Works',
            'Wood Works (Carpentry & Custom Furniture)': 'Wood Works',
            'Hybrid Metal + Wood Construction': 'Hybrid Metal + Wood Construction',
            'Hybrid Metal + Wood': 'Hybrid Metal + Wood Construction',
            'METAL': 'Metal Works',
            'WOOD': 'Wood Works',
            'HYBRID': 'Hybrid Metal + Wood Construction',
            'metal-works': 'Metal Works',
            'metal-work': 'Metal Works',
            'wood-works': 'Wood Works',
            'wood-work': 'Wood Works',
            'hybrid-metal-wood': 'Hybrid Metal + Wood Construction',
            'hybrid-metal-wood-construction': 'Hybrid Metal + Wood Construction',
            'hybrid-metal-and-wood': 'Hybrid Metal + Wood Construction',
        }
        canonical_service = service_map.get(service_type, service_type)
        if len(canonical_service) > 100:
            return Response({'error': 'Service Category cannot exceed 100 characters.'}, status=status.HTTP_400_BAD_REQUEST)

        # Quantity (required, positive integer)
        try:
            raw_qty = data.get('quantity')
            quantity = int(raw_qty if raw_qty not in (None, '') else 1)
        except (ValueError, TypeError):
            return Response({'error': 'Quantity must be a valid integer.'}, status=status.HTTP_400_BAD_REQUEST)

        if quantity <= 0 or quantity > 1000000:
            return Response({'error': 'Quantity must be between 1 and 1,000,000.'}, status=status.HTTP_400_BAD_REQUEST)

        # Optional dimensions support with strict Decimal validation
        try:
            length_cm = _parse_dimension(data.get('length_cm'), 'Length (cm)')
            width_cm = _parse_dimension(data.get('width_cm'), 'Width (cm)')
            height_cm = _parse_dimension(data.get('height_cm'), 'Height (cm)')
        except ValueError as dim_err:
            return Response({'error': str(dim_err)}, status=status.HTTP_400_BAD_REQUEST)

        calculated_vol = None
        if length_cm is not None and width_cm is not None and height_cm is not None:
            vol = (length_cm / Decimal('100')) * (width_cm / Decimal('100')) * (height_cm / Decimal('100'))
            calculated_vol = vol.quantize(Decimal('0.0001'))
            if calculated_vol > Decimal('999999.9999'):
                return Response({'error': 'Calculated volume exceeds supported dimensions.'}, status=status.HTTP_400_BAD_REQUEST)

        # Parse Delivery & Installation
        delivery_required = str(data.get('delivery_required', '')).lower() in ('true', '1', 'yes')
        installation_required = str(data.get('installation_required', '')).lower() in ('true', '1', 'yes')
        site_location = _clean_text(data.get('site_location') or data.get('delivery_address'))
        if len(site_location) > 255:
            return Response({'error': 'Site Location cannot exceed 255 characters.'}, status=status.HTTP_400_BAD_REQUEST)

        raw_pref_date = _clean_text(data.get('preferred_completion_date'))
        preferred_date = None
        if raw_pref_date:
            try:
                preferred_date = parse_date(raw_pref_date)
            except ValueError:
                preferred_date = None
            if preferred_date is None:
                return Response(
                    {'error': 'Preferred Completion Date must be a valid YYYY-MM-DD date.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

        # Look up selected product if provided (parse UUID safely so 36-char SKUs do not crash)
        product_obj = None
        prod_identifier = _clean_text(data.get('product') or data.get('product_id') or data.get('product_code') or data.get('sku'))
        if prod_identifier:
            from apps.products.models import Product
            from django.db.models import Q
            prod_query = Q(sku__iexact=prod_identifier) | Q(slug__iexact=prod_identifier)
            try:
                prod_uuid = uuid.UUID(prod_identifier)
                prod_query = Q(id=prod_uuid) | prod_query
            except (ValueError, TypeError, AttributeError):
                pass
            product_obj = Product.objects.filter(prod_query).first()

        prod_code = _clean_text(data.get('product_code') or (product_obj.sku if product_obj else ''))
        prod_name = _clean_text(data.get('product_name') or (product_obj.name if product_obj else ''))
        prod_cat = _clean_text(data.get('product_category') or (product_obj.subcategory if product_obj and product_obj.subcategory else ''))
        prod_img = _clean_text(data.get('product_image_url') or (product_obj.primary_image_url if product_obj else ''))
        if len(prod_code) > 100 or len(prod_name) > 200 or len(prod_cat) > 100 or len(prod_img) > 500:
            return Response({'error': 'Product metadata exceeds maximum allowed length.'}, status=status.HTTP_400_BAD_REQUEST)

        # Strict Pricing Rules:
        # 1. Products already listed on the website: Calculate price based on listed starting_price & quantity (+ options).
        # 2. Custom orders: Do NOT automatically calculate, estimate, or generate a price. Leave without price for separate manager quotation.
        has_predefined_price = False
        baseline_amount = None

        if product_obj and product_obj.starting_price and product_obj.starting_price > 0:
            has_predefined_price = True
            unit_price = Decimal(str(product_obj.starting_price))
            calc_total = unit_price * quantity
            if delivery_required:
                calc_total += Decimal('1500.00')
            if installation_required:
                calc_total += Decimal('2500.00')
            baseline_amount = Decimal(str(round(calc_total, 2)))
        else:
            has_predefined_price = False
            baseline_amount = None

        # Collect and strictly validate ALL uploaded attachments BEFORE persisting Quote or writing to disk
        files = list(request.FILES.getlist('attachments'))
        if not files:
            for key in ['file', 'attachment', 'drawing_file', 'drawings', 'files']:
                matched = request.FILES.getlist(key)
                if matched:
                    files.extend(matched)

        allowed_extensions = {'.pdf', '.png', '.jpg', '.jpeg', '.dxf', '.dwg', '.webp'}
        image_extensions = {'.png', '.jpg', '.jpeg', '.webp'}
        max_size_bytes = 25 * 1024 * 1024  # 25 MB
        max_files = 10

        if len(files) > max_files:
            return Response(
                {'error': f'A maximum of {max_files} files can be attached per request.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        validated_files = []
        for f in files:
            raw_name = getattr(f, 'name', '') or ''
            safe_name = os.path.basename(raw_name.replace('\x00', '')).strip()
            ext = os.path.splitext(safe_name)[1].lower()

            if not ext or ext not in allowed_extensions:
                return Response(
                    {'error': f'Unsupported file format "{ext or "none"}". Allowed formats: PDF, PNG, JPG, JPEG, DXF, DWG, WEBP.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            file_size = getattr(f, 'size', None)
            if file_size is not None and file_size <= 0:
                return Response(
                    {'error': f'File "{safe_name}" is empty.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            if file_size is not None and file_size > max_size_bytes:
                return Response(
                    {'error': f'File "{safe_name}" exceeds maximum allowed size of 25MB.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            try:
                if hasattr(f, 'seek'):
                    f.seek(0)
                if ext == '.pdf':
                    if f.read(5) != b'%PDF-':
                        return Response(
                            {'error': f'File "{safe_name}" is not a valid PDF document.'},
                            status=status.HTTP_400_BAD_REQUEST
                        )
                elif ext in image_extensions:
                    from PIL import Image
                    with Image.open(f) as img:
                        img.verify()
            except Exception:
                return Response(
                    {'error': f'File "{safe_name}" could not be verified as a valid {ext.lstrip(".").upper()} file.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            finally:
                if hasattr(f, 'seek'):
                    f.seek(0)

            validated_files.append((f, (safe_name or f'attachment{ext}')[:255]))

        saved_attachments = []
        try:
            with transaction.atomic():
                quote = Quote.objects.create(
                    customer=request.user if request.user and request.user.is_authenticated else None,
                    customer_name=customer_name,
                    customer_phone=customer_phone,
                    customer_email=customer_email,
                    product=product_obj,
                    product_code=prod_code,
                    product_name=prod_name,
                    product_category=prod_cat,
                    product_image_url=prod_img,
                    project_title=project_title,
                    service_type=canonical_service,
                    description=description,
                    material_preference=material_preference,
                    length_cm=length_cm,
                    width_cm=width_cm,
                    height_cm=height_cm,
                    quantity=quantity,
                    calculated_volume_m3=calculated_vol,
                    estimated_baseline_amount=baseline_amount,
                    total_amount=baseline_amount if baseline_amount is not None else Decimal('0.00'),
                    delivery_required=delivery_required,
                    installation_required=installation_required,
                    delivery_address=site_location,
                    site_location=site_location,
                    preferred_completion_date=preferred_date,
                    customer_notes=customer_notes,
                    status=QuoteStatus.SUBMITTED
                )
                for f_obj, safe_name in validated_files:
                    att = QuoteAttachment.objects.create(
                        quote=quote,
                        file=f_obj,
                        file_name=safe_name
                    )
                    saved_attachments.append(att)
        except Exception as persist_err:
            for att in saved_attachments:
                try:
                    if att.file:
                        att.file.delete(save=False)
                except Exception:
                    pass
            logger.error(f"Error creating quote or saving attachments: {persist_err}", exc_info=True)
            return Response(
                {'error': 'Unable to save your quotation request and attachments. Please try again.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        # Dispatch Telegram notification
        telegram_status = "pending"
        telegram_details = {}
        try:
            from .tasks import send_telegram_quote_notification, _sanitize_for_logging
            token = getattr(settings, "TELEGRAM_BOT_TOKEN", "")
            tel_result = send_telegram_quote_notification(str(quote.id))
            telegram_status = tel_result.get('status', 'sent')
            telegram_details = tel_result.get('destinations', {})
            safe_result = _sanitize_for_logging(str(tel_result), token)
            logger.info(f"Telegram notification for quote {quote.quote_number}: {safe_result}")
        except Exception as tel_err:
            from .tasks import _sanitize_for_logging
            token = getattr(settings, "TELEGRAM_BOT_TOKEN", "")
            safe_err = _sanitize_for_logging(str(tel_err), token)
            telegram_status = "failed"
            telegram_details = {"error": "Telegram notification delivery failed."}
            logger.error(f"Failed to dispatch Telegram notification for {quote.quote_number}: {safe_err}")

        # Generate secure single-use linking token for customer Telegram order tracking
        from .telegram_bot import create_order_linking_token
        link_token, telegram_deep_link = create_order_linking_token(quote=quote)
        bot_username = getattr(settings, 'TELEGRAM_BOT_USERNAME', 'HaraWorkshopOrdersBot').lstrip('@')

        response_payload = {
            'status': 'success',
            'id': str(quote.id),
            'message': 'Your project request has been received.',
            'quote_number': quote.quote_number,
            'project_title': quote.project_title,
            'product_name': quote.product_name,
            'product_code': quote.product_code,
            'service_category': quote.service_type,
            'quantity': quote.quantity,
            'has_predefined_price': has_predefined_price,
            'estimated_baseline': float(quote.estimated_baseline_amount) if (has_predefined_price and quote.estimated_baseline_amount) else None,
            'price_message': None if has_predefined_price else 'Price will be provided after reviewing your request.',
            'telegram_status': telegram_status,
            'telegram_details': telegram_details,
            'telegram_link_token': link_token,
            'telegram_bot_username': bot_username,
            'telegram_deep_link': telegram_deep_link,
            'quote': QuoteSerializer(quote).data
        }
        if quote.calculated_volume_m3:
            response_payload['calculated_volume_m3'] = float(quote.calculated_volume_m3)
        return Response(response_payload, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated, IsStaffUser])
    def send_telegram_alert(self, request, pk=None):
        """
        Trigger or re-send a Telegram notification for this quotation.
        """
        quote = self.get_object()
        from .tasks import send_telegram_quote_notification
        chat_id = request.data.get('chat_id', None)
        force = request.data.get('force', False)
        async_task = request.query_params.get('async', 'false').lower() in ('true', '1')
        if async_task:
            task = send_telegram_quote_notification.delay(str(quote.id), target_chat_id=chat_id, force_resend=force)
            return Response({
                'message': 'Telegram alert dispatched to Celery worker',
                'task_id': task.id,
                'quote_number': quote.quote_number
            })
        else:
            result = send_telegram_quote_notification(str(quote.id), target_chat_id=chat_id, force_resend=force)
            return Response(result)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated, IsStaffUser])
    def propose_price(self, request, pk=None):
        quote = self.get_object()
        serializer = QuotePriceProposalSerializer(quote, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        quote = serializer.save()
        quote.status = QuoteStatus.PRICE_PROPOSED
        quote.calculate_totals()
        quote.save()

        AuditLog.objects.create(
            user=request.user,
            action='PRICE_PROPOSAL',
            resource='Quote',
            resource_id=quote.quote_number,
            metadata={'total_amount': float(quote.total_amount)}
        )

        # HW-QA-006: Create in-app notification for registered customers
        if quote.customer:
            try:
                from apps.notifications.models import Notification, NotificationType
                Notification.objects.create(
                    user=quote.customer,
                    title=f"Price Proposal: {quote.quote_number}",
                    message=f"Official price proposal of {quote.total_amount:,.2f} ETB issued for '{quote.project_title}'.",
                    notification_type=NotificationType.QUOTE,
                    link_url=f"/customer/quotes/{quote.id}",
                )
            except Exception as notif_err:
                logger.warning(f"Failed to create customer proposal notification: {notif_err}")

        # Customer Telegram Status Update
        try:
            from .telegram_bot import notify_customer_status_change
            notify_customer_status_change(
                quote,
                QuoteStatus.PRICE_PROPOSED,
                reason=f"An itemized proposal of {quote.total_amount:,.2f} ETB has been issued for your project."
            )
        except Exception as tel_notif_err:
            logger.warning(f"Failed to dispatch Telegram status update: {tel_notif_err}")

        return Response(QuoteSerializer(quote).data)

    def _execute_order_conversion(self, quote, initiated_by_user, is_admin=False):
        """
        Shared atomic conversion logic used by both Customer accept and Admin convert_to_order.
        Prevents duplicate conversion, initializes Order, OrderItem, and 10-stage ProductionJob.
        """
        from apps.orders.models import Order, OrderStatus, OrderItem
        from apps.production.models import ProductionJob, ProductionStage
        from apps.notifications.models import Notification, NotificationType
        from apps.accounts.models import User, UserRole

        # 1. Duplicate conversion guard
        if hasattr(quote, 'order') and quote.order:
            return None, {
                'error': f'This quotation has already been converted to Order {quote.order.order_number}.',
                'order_id': str(quote.order.id),
                'order_number': quote.order.order_number,
            }, status.HTTP_400_BAD_REQUEST

        existing_order = Order.objects.filter(quote=quote).first()
        if existing_order:
            return None, {
                'error': f'This quotation has already been converted to Order {existing_order.order_number}.',
                'order_id': str(existing_order.id),
                'order_number': existing_order.order_number,
            }, status.HTTP_400_BAD_REQUEST

        if quote.status == QuoteStatus.CONVERTED_TO_ORDER:
            return None, {
                'error': 'This quotation has already been converted to an active order.'
            }, status.HTTP_400_BAD_REQUEST

        if quote.status == QuoteStatus.CUSTOMER_REJECTED:
            return None, {
                'error': 'Cannot convert a rejected quotation to an order.'
            }, status.HTTP_400_BAD_REQUEST

        if quote.status == QuoteStatus.EXPIRED:
            return None, {
                'error': 'Cannot convert an expired quotation to an order.'
            }, status.HTTP_400_BAD_REQUEST

        # 2. Determine delivery address safely for both guest and registered quotes
        customer_profile = getattr(quote.customer, 'customer_profile', None) if quote.customer else None
        delivery_loc = (
            quote.delivery_address or
            quote.site_location or
            (customer_profile.address if customer_profile else '') or
            'Addis Ababa'
        )

        # 3. Create the confirmed Order (copy guest contact info when quote.customer is None)
        order = Order.objects.create(
            quote=quote,
            customer=quote.customer,
            customer_name=quote.get_customer_name(),
            customer_phone=quote.get_customer_phone(),
            customer_email=quote.get_customer_email(),
            status=OrderStatus.ORDER_CONFIRMED,
            total_amount=quote.total_amount,
            delivery_address=delivery_loc,
            notes=f"Auto-created from quote {quote.quote_number} (by {'Admin' if is_admin else 'Customer'})"
        )

        # 4. Create line item
        OrderItem.objects.create(
            order=order,
            item_title=quote.project_title,
            description=f"{quote.service_type} - {quote.description[:100] if quote.description else ''}",
            quantity=max(quote.quantity, 1),
            unit_price=quote.total_amount / max(quote.quantity, 1),
            total_price=quote.total_amount
        )

        # 5. Initialize 10-stage Production Job
        ProductionJob.objects.create(
            order=order,
            stage=ProductionStage.ORDER_CONFIRMED,
            priority='MEDIUM',
            progress_percentage=5,
            notes=f'Production initiated for Order {order.order_number}'
        )

        # 6. Update quote status
        quote.status = QuoteStatus.CONVERTED_TO_ORDER
        quote.save()

        # 7. Audit Log
        AuditLog.objects.create(
            user=initiated_by_user,
            action='ORDER_CONVERT' if is_admin else 'QUOTE_ACCEPT',
            resource='Quote',
            resource_id=quote.quote_number,
            metadata={
                'order_number': order.order_number,
                'initiated_by': getattr(initiated_by_user, 'email', '') or str(initiated_by_user),
            }
        )

        # 8. Lifecycle Notifications (HW-QA-006)
        try:
            if not is_admin:
                # Customer accepted proposal -> Notify workshop admins
                admin_users = User.objects.filter(role=UserRole.ADMIN)
                for admin in admin_users:
                    Notification.objects.create(
                        user=admin,
                        title=f"Quote Accepted: {quote.quote_number}",
                        message=f"{quote.get_customer_name()} accepted quote {quote.quote_number}. Order {order.order_number} created ({quote.total_amount:,.2f} ETB).",
                        notification_type=NotificationType.ORDER,
                        link_url="/admin/orders",
                    )
            elif quote.customer:
                # Admin converted quote directly -> Notify registered customer
                Notification.objects.create(
                    user=quote.customer,
                    title=f"Order Confirmed: {order.order_number}",
                    message=f"Your quote {quote.quote_number} for '{quote.project_title}' has been converted to confirmed Order {order.order_number}.",
                    notification_type=NotificationType.ORDER,
                    link_url=f"/customer/orders/{order.id}",
                )
        except Exception as notif_err:
            logger.warning(f"Failed to dispatch lifecycle notification: {notif_err}")

        # 9. Customer Telegram Link Transfer & Notification
        if quote.telegram_chat_id:
            order.telegram_chat_id = quote.telegram_chat_id
            order.telegram_linked_at = quote.telegram_linked_at
            order.save(update_fields=['telegram_chat_id', 'telegram_linked_at'])

        try:
            from .telegram_bot import notify_customer_status_change
            notify_customer_status_change(
                order,
                'CONFIRMED',
                reason=f"Quote {quote.quote_number} converted into active workshop Order {order.order_number}."
            )
        except Exception as tel_notif_err:
            logger.warning(f"Failed to dispatch Telegram order conversion alert: {tel_notif_err}")

        return order, {
            'message': 'Quotation converted to order successfully' if is_admin else 'Quotation accepted and order created successfully',
            'order_id': str(order.id),
            'order_number': order.order_number,
            'quote': QuoteSerializer(quote).data
        }, status.HTTP_200_OK

    def perform_update(self, serializer):
        old_status = serializer.instance.status
        instance = serializer.save()
        if instance.status != old_status:
            try:
                from .telegram_bot import notify_customer_status_change
                notify_customer_status_change(instance, instance.status)
            except Exception as e:
                logger.warning(f"Failed to notify status update for {instance.quote_number}: {e}")

    @action(detail=True, methods=['get', 'post'], permission_classes=[permissions.IsAuthenticated, IsOwnerOrStaff])
    def telegram_link(self, request, pk=None):
        """
        Retrieves or generates a secure single-use Telegram linking token and deep link for this quote.
        """
        quote = self.get_object()
        from .telegram_bot import create_order_linking_token
        token, deep_link = create_order_linking_token(quote=quote)
        return Response({
            'quote_number': quote.quote_number,
            'telegram_link_token': token,
            'telegram_deep_link': deep_link,
            'telegram_chat_id': quote.telegram_chat_id,
            'is_linked': bool(quote.telegram_chat_id),
        })

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated, IsStaffUser])
    def convert_to_order(self, request, pk=None):
        """
        HW-QA-002: Admin direct conversion of quotation to active workshop order.
        """
        quote = self.get_object()
        order, response_data, status_code = self._execute_order_conversion(
            quote=quote,
            initiated_by_user=request.user,
            is_admin=True
        )
        return Response(response_data, status=status_code)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated, IsOwnerOrStaff])
    def accept(self, request, pk=None):
        quote = self.get_object()
        is_admin = (
            getattr(request.user, 'role', '') == 'ADMIN' or
            request.user.is_staff or
            request.user.is_superuser
        )
        if not is_admin and quote.customer != request.user:
            return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)

        order, response_data, status_code = self._execute_order_conversion(
            quote=quote,
            initiated_by_user=request.user,
            is_admin=is_admin
        )
        return Response(response_data, status=status_code)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated, IsOwnerOrStaff])
    def reject(self, request, pk=None):
        quote = self.get_object()
        is_admin = (
            getattr(request.user, 'role', '') == 'ADMIN' or
            request.user.is_staff or
            request.user.is_superuser
        )
        if not is_admin and quote.customer != request.user:
            return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)
        quote.status = QuoteStatus.CUSTOMER_REJECTED
        quote.save()

        try:
            from .telegram_bot import notify_customer_status_change
            notify_customer_status_change(quote, QuoteStatus.CUSTOMER_REJECTED, reason="Quotation was cancelled.")
        except Exception:
            pass

        return Response({'message': 'Quotation rejected', 'quote': QuoteSerializer(quote).data})


class TelegramWebhookView(views.APIView):
    """
    Receives incoming webhook updates from Telegram.
    Handles commands, text buttons ('My Orders'), and inline callback queries.
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        """Diagnostic endpoint to verify webhook route health."""
        token = getattr(settings, 'TELEGRAM_BOT_TOKEN', '').strip()
        webhook_secret = getattr(settings, 'TELEGRAM_WEBHOOK_SECRET', '').strip()
        return Response({
            'status': 'active',
            'service': 'hara-workshop-telegram-webhook',
            'bot_configured': bool(token),
            'webhook_secret_configured': bool(webhook_secret),
            'timestamp': timezone.now().isoformat()
        }, status=status.HTTP_200_OK)

    def post(self, request):
        expected_secret = getattr(settings, 'TELEGRAM_WEBHOOK_SECRET', '').strip()
        if not expected_secret:
            logger.error("[TELEGRAM WEBHOOK] TELEGRAM_WEBHOOK_SECRET is not configured; rejecting webhook request (fail closed).")
            return Response({'detail': 'Forbidden.'}, status=status.HTTP_403_FORBIDDEN)

        provided_secret = (request.headers.get('X-Telegram-Bot-Api-Secret-Token') or '').strip()
        if not provided_secret or not hmac.compare_digest(
            provided_secret.encode('utf-8'),
            expected_secret.encode('utf-8')
        ):
            logger.warning("[TELEGRAM WEBHOOK] Rejected webhook POST with missing or invalid secret token.")
            return Response({'detail': 'Forbidden.'}, status=status.HTTP_403_FORBIDDEN)

        from .telegram_bot import process_telegram_update
        from .tasks import _sanitize_for_logging
        token = getattr(settings, 'TELEGRAM_BOT_TOKEN', '').strip()
        try:
            update_keys = list(request.data.keys()) if isinstance(request.data, dict) else type(request.data)
            logger.info(f"[TELEGRAM WEBHOOK] Incoming update with keys: {update_keys}")
            res = process_telegram_update(request.data)
            logger.info(f"[TELEGRAM WEBHOOK] Processed result: {res.get('status')}")
            return Response(res, status=status.HTTP_200_OK)
        except Exception as e:
            safe_err = _sanitize_for_logging(str(e), token)
            logger.error(f"[TELEGRAM WEBHOOK EXCEPTION] {safe_err}", exc_info=True)
            # Return 200 without internal exception details to prevent Telegram retry storms
            return Response({'ok': True}, status=status.HTTP_200_OK)

