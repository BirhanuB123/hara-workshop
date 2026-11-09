import os
import logging
from rest_framework import viewsets, permissions, status, views
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters
from decimal import Decimal
from django.conf import settings
from .models import Quote, QuoteStatus, QuoteItem, QuoteAttachment
from .serializers import QuoteSerializer, QuoteCreateSerializer, QuotePriceProposalSerializer
from apps.accounts.permissions import IsStaffUser, IsOwnerOrStaff
from apps.core.models import AuditLog

logger = logging.getLogger(__name__)

class QuoteViewSet(viewsets.ModelViewSet):
    queryset = Quote.objects.select_related('customer').prefetch_related('items', 'attachments').all()
    serializer_class = QuoteSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'service_type']
    search_fields = ['quote_number', 'project_title', 'customer__email', 'customer__first_name', 'customer__last_name']
    ordering_fields = ['created_at', 'total_amount', 'status']

    def get_permissions(self):
        return [permissions.AllowAny()]

    def get_queryset(self):
        return Quote.objects.all().select_related('customer', 'product').prefetch_related('items', 'attachments')

    def create(self, request, *args, **kwargs):
        data = request.data.copy() if hasattr(request.data, 'copy') else dict(request.data)

        customer_name = (data.get('customer_name') or '').strip()
        customer_phone = (data.get('customer_phone') or data.get('phone_number') or data.get('phone') or '').strip()
        customer_email = (data.get('customer_email') or data.get('email') or '').strip()
        project_title = (data.get('project_title') or data.get('title') or '').strip()
        service_type = (data.get('service_type') or data.get('service_category') or '').strip()
        description = (data.get('description') or data.get('notes') or '').strip()

        # Strict validation of required fields per prompt section 11 & 12
        if not customer_name:
            return Response({'error': 'Customer Name is required.'}, status=status.HTTP_400_BAD_REQUEST)
        from apps.core.phone_validator import validate_phone_number
        is_phone_valid, phone_err, normalized_phone = validate_phone_number(customer_phone)
        if not is_phone_valid:
            return Response({'error': phone_err}, status=status.HTTP_400_BAD_REQUEST)
        customer_phone = normalized_phone
        if not customer_email or '@' not in customer_email:
            return Response({'error': 'A valid Email address is required.'}, status=status.HTTP_400_BAD_REQUEST)
        if not project_title:
            return Response({'error': 'Project Title is required.'}, status=status.HTTP_400_BAD_REQUEST)
        if not service_type:
            return Response({'error': 'Service Category is required.'}, status=status.HTTP_400_BAD_REQUEST)
        if not description:
            return Response({'error': 'Project Description & Specific Requirements are required.'}, status=status.HTTP_400_BAD_REQUEST)

        # Map display labels to canonical values if needed
        service_map = {
            'Metal Works (Fabrication & Welding)': 'Metal Works',
            'Wood Works (Carpentry & Custom Furniture)': 'Wood Works',
            'Hybrid Metal + Wood Construction': 'Hybrid Metal + Wood Construction',
            'METAL': 'Metal Works',
            'WOOD': 'Wood Works',
            'HYBRID': 'Hybrid Metal + Wood Construction',
        }
        canonical_service = service_map.get(service_type, service_type)

        # Quantity (required, positive integer)
        try:
            quantity = int(data.get('quantity') or 1)
        except (ValueError, TypeError):
            return Response({'error': 'Quantity must be a valid integer.'}, status=status.HTTP_400_BAD_REQUEST)

        if quantity <= 0:
            return Response({'error': 'Quantity must be a positive number.'}, status=status.HTTP_400_BAD_REQUEST)

        # Optional legacy dimensions support (if provided by legacy integrations)
        length_cm = None
        width_cm = None
        height_cm = None
        if data.get('length_cm'):
            try:
                length_cm = float(data.get('length_cm'))
            except (ValueError, TypeError):
                pass
        if data.get('width_cm'):
            try:
                width_cm = float(data.get('width_cm'))
            except (ValueError, TypeError):
                pass
        if data.get('height_cm'):
            try:
                height_cm = float(data.get('height_cm'))
            except (ValueError, TypeError):
                pass

        calculated_vol = None
        if length_cm and width_cm and height_cm:
            calculated_vol = Decimal(str(round((length_cm / 100.0) * (width_cm / 100.0) * (height_cm / 100.0), 4)))

        # Parse Delivery & Installation
        delivery_required = str(data.get('delivery_required', '')).lower() in ('true', '1', 'yes')
        installation_required = str(data.get('installation_required', '')).lower() in ('true', '1', 'yes')
        site_location = (data.get('site_location') or data.get('delivery_address') or '').strip()
        preferred_date = data.get('preferred_completion_date') or None

        # Look up selected product if provided
        product_obj = None
        prod_identifier = data.get('product') or data.get('product_id') or data.get('product_code') or data.get('sku')
        if prod_identifier:
            from apps.products.models import Product
            from django.db.models import Q
            product_obj = Product.objects.filter(
                Q(id=prod_identifier if len(str(prod_identifier)) == 36 else None) |
                Q(sku__iexact=str(prod_identifier)) |
                Q(slug__iexact=str(prod_identifier))
            ).first()

        prod_code = str(data.get('product_code') or (product_obj.sku if product_obj else '') or '').strip()
        prod_name = str(data.get('product_name') or (product_obj.name if product_obj else '') or '').strip()
        prod_cat = str(data.get('product_category') or (product_obj.subcategory if product_obj and product_obj.subcategory else '') or '').strip()
        prod_img = str(data.get('product_image_url') or (product_obj.primary_image_url if product_obj else '') or '').strip()

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
            material_preference=(data.get('material_preference') or '').strip(),
            length_cm=Decimal(str(length_cm)) if length_cm is not None else None,
            width_cm=Decimal(str(width_cm)) if width_cm is not None else None,
            height_cm=Decimal(str(height_cm)) if height_cm is not None else None,
            quantity=quantity,
            calculated_volume_m3=calculated_vol,
            estimated_baseline_amount=baseline_amount,
            total_amount=baseline_amount if baseline_amount is not None else Decimal('0.00'),
            delivery_required=delivery_required,
            installation_required=installation_required,
            delivery_address=site_location,
            site_location=site_location,
            preferred_completion_date=preferred_date,
            customer_notes=(data.get('customer_notes') or '').strip(),
            status=QuoteStatus.SUBMITTED
        )

        # Collect uploaded attachments
        files = request.FILES.getlist('attachments')
        if not files:
            for key in ['file', 'attachment', 'drawing_file', 'drawings', 'files']:
                matched = request.FILES.getlist(key)
                if matched:
                    files.extend(matched)

        allowed_extensions = {'.pdf', '.png', '.jpg', '.jpeg', '.dxf', '.dwg', '.webp', '.svg'}
        max_size_bytes = 25 * 1024 * 1024  # 25 MB

        for f in files:
            fname = getattr(f, 'name', '') or 'attachment'
            ext = os.path.splitext(fname)[1].lower()
            if ext and ext not in allowed_extensions:
                quote.delete()
                return Response(
                    {'error': f'Unsupported file format "{ext}". Allowed formats: PDF, PNG, JPG, JPEG, DXF, DWG, WEBP.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            if hasattr(f, 'size') and f.size > max_size_bytes:
                quote.delete()
                return Response(
                    {'error': f'File "{fname}" exceeds maximum allowed size of 25MB.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            try:
                QuoteAttachment.objects.create(
                    quote=quote,
                    file=f,
                    file_name=os.path.basename(fname)
                )
            except Exception as att_err:
                logger.error(f"Error attaching file {fname} to quote {quote.quote_number}: {att_err}")

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
            telegram_details = {"error": safe_err}
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

    @action(detail=True, methods=['post'], permission_classes=[IsStaffUser])
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

    @action(detail=True, methods=['post'], permission_classes=[IsStaffUser])
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

        # HW-QA-006: Create in-app notification for the customer
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

        # 2. Determine delivery address
        delivery_loc = (
            quote.delivery_address or 
            (quote.customer.customer_profile.address if hasattr(quote.customer, 'customer_profile') and quote.customer.customer_profile else '') or 
            'Addis Ababa'
        )

        # 3. Create the confirmed Order
        order = Order.objects.create(
            quote=quote,
            customer=quote.customer,
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
            metadata={'order_number': order.order_number, 'initiated_by': initiated_by_user.email}
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
                        message=f"{quote.customer.get_full_name()} accepted quote {quote.quote_number}. Order {order.order_number} created ({quote.total_amount:,.2f} ETB).",
                        notification_type=NotificationType.ORDER,
                        link_url="/admin/orders",
                    )
            else:
                # Admin converted quote directly -> Notify customer
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

    @action(detail=True, methods=['get', 'post'], permission_classes=[permissions.AllowAny])
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

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def accept(self, request, pk=None):
        quote = self.get_object()
        if quote.customer != request.user and request.user.role == 'CUSTOMER':
            return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)

        order, response_data, status_code = self._execute_order_conversion(
            quote=quote,
            initiated_by_user=request.user,
            is_admin=False
        )
        return Response(response_data, status=status_code)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def reject(self, request, pk=None):
        quote = self.get_object()
        if quote.customer != request.user and request.user.role == 'CUSTOMER':
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
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        from .telegram_bot import process_telegram_update
        try:
            res = process_telegram_update(request.data)
            return Response(res, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f"Error in telegram webhook: {e}")
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

