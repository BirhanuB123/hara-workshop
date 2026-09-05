from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters
from decimal import Decimal
from .models import Quote, QuoteStatus, QuoteItem, QuoteAttachment
from .serializers import QuoteSerializer, QuoteCreateSerializer, QuotePriceProposalSerializer
from apps.accounts.permissions import IsStaffUser, IsOwnerOrStaff
from apps.core.models import AuditLog

class QuoteViewSet(viewsets.ModelViewSet):
    queryset = Quote.objects.select_related('customer').prefetch_related('items', 'attachments').all()
    serializer_class = QuoteSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'service_type']
    search_fields = ['quote_number', 'project_title', 'customer__email', 'customer__first_name', 'customer__last_name']
    ordering_fields = ['created_at', 'total_amount', 'status']

    def get_permissions(self):
        if self.action in ['create']:
            return [permissions.IsAuthenticated()]
        return [permissions.IsAuthenticated(), IsOwnerOrStaff()]

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Quote.objects.none()
        if user.role == 'CUSTOMER':
            return Quote.objects.filter(customer=user).prefetch_related('items', 'attachments')
        return Quote.objects.all().select_related('customer').prefetch_related('items', 'attachments')

    def create(self, request, *args, **kwargs):
        serializer = QuoteCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        quote = serializer.save(customer=request.user, status=QuoteStatus.SUBMITTED)

        files = request.FILES.getlist('attachments')
        for f in files:
            QuoteAttachment.objects.create(quote=quote, file=f)

        AuditLog.objects.create(
            user=request.user,
            action='CREATE',
            resource='Quote',
            resource_id=quote.quote_number,
            metadata={'title': quote.project_title}
        )
        return Response(QuoteSerializer(quote).data, status=status.HTTP_201_CREATED)

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
        return Response(QuoteSerializer(quote).data)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def accept(self, request, pk=None):
        quote = self.get_object()
        if quote.customer != request.user and request.user.role == 'CUSTOMER':
            return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)

        quote.status = QuoteStatus.CUSTOMER_ACCEPTED
        quote.save()

        # Automatically convert to Order and Invoice
        from apps.orders.models import Order, OrderStatus, OrderItem
        from apps.invoices.models import Invoice, InvoiceStatus
        from apps.production.models import ProductionJob, ProductionStage

        order = Order.objects.create(
            quote=quote,
            customer=quote.customer,
            status=OrderStatus.CONFIRMED,
            total_amount=quote.total_amount,
            delivery_address=quote.delivery_address or (quote.customer.customer_profile.address if hasattr(quote.customer, 'customer_profile') else 'Addis Ababa'),
            notes=f'Auto-created from quote {quote.quote_number}'
        )

        OrderItem.objects.create(
            order=order,
            item_title=quote.project_title,
            description=f'{quote.service_type} - {quote.description[:100]}',
            quantity=quote.quantity,
            unit_price=quote.total_amount / max(quote.quantity, 1),
            total_price=quote.total_amount
        )

        # Create Production Job
        ProductionJob.objects.create(
            order=order,
            stage=ProductionStage.ORDER_CONFIRMED,
            priority='MEDIUM',
            progress_percentage=5,
            notes=f'Production initiated for Order {order.order_number}'
        )

        # Create Invoice
        Invoice.objects.create(
            order=order,
            customer=quote.customer,
            subtotal=quote.subtotal,
            discount=quote.discount,
            tax_amount=quote.total_amount * Decimal('0.15'),
            total_amount=quote.total_amount * Decimal('1.15'),
            amount_paid=Decimal('0.00'),
            amount_remaining=quote.total_amount * Decimal('1.15'),
            status=InvoiceStatus.ISSUED,
            notes=f'Initial invoice for Order {order.order_number}'
        )

        quote.status = QuoteStatus.CONVERTED_TO_ORDER
        quote.save()

        AuditLog.objects.create(
            user=request.user,
            action='QUOTE_ACCEPT',
            resource='Quote',
            resource_id=quote.quote_number,
            metadata={'order_number': order.order_number}
        )

        return Response({
            'message': 'Quotation accepted and order created successfully',
            'order_id': str(order.id),
            'order_number': order.order_number,
            'quote': QuoteSerializer(quote).data
        })

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def reject(self, request, pk=None):
        quote = self.get_object()
        if quote.customer != request.user and request.user.role == 'CUSTOMER':
            return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)
        quote.status = QuoteStatus.CUSTOMER_REJECTED
        quote.save()
        return Response({'message': 'Quotation rejected', 'quote': QuoteSerializer(quote).data})
