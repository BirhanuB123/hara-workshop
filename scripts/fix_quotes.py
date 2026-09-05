import os

def w(path, content):
    full_path = os.path.normpath(path)
    os.makedirs(os.path.dirname(os.path.abspath(full_path)), exist_ok=True)
    with open(full_path, 'w', encoding='utf-8') as f:
        f.write(content.strip() + '\n')
    print(f'Updated: {full_path}')

w('backend/apps/quotations/models.py', '''from django.db import models
from django.conf import settings
from apps.core.models import TimeStampedModel
from datetime import date, timedelta
from decimal import Decimal

class QuoteStatus(models.TextChoices):
    DRAFT = 'DRAFT', 'Draft'
    SUBMITTED = 'SUBMITTED', 'Submitted'
    UNDER_REVIEW = 'UNDER_REVIEW', 'Under Review'
    PRICE_PROPOSED = 'PRICE_PROPOSED', 'Price Proposed'
    CUSTOMER_ACCEPTED = 'CUSTOMER_ACCEPTED', 'Accepted by Customer'
    CUSTOMER_REJECTED = 'CUSTOMER_REJECTED', 'Rejected by Customer'
    EXPIRED = 'EXPIRED', 'Expired'
    CONVERTED_TO_ORDER = 'CONVERTED_TO_ORDER', 'Converted to Order'

class Quote(TimeStampedModel):
    quote_number = models.CharField(max_length=50, unique=True, db_index=True)
    customer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='quotes')
    project_title = models.CharField(max_length=200)
    service_type = models.CharField(max_length=100, help_text='e.g., Metal Door, Kitchen Cabinets, Custom Gate')
    description = models.TextField()
    material_preference = models.CharField(max_length=200, blank=True, null=True)

    width_cm = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    height_cm = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    length_cm = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    quantity = models.PositiveIntegerField(default=1)

    preferred_completion_date = models.DateField(null=True, blank=True)
    installation_required = models.BooleanField(default=False)
    delivery_required = models.BooleanField(default=True)
    delivery_address = models.CharField(max_length=255, blank=True, null=True)

    status = models.CharField(max_length=30, choices=QuoteStatus.choices, default=QuoteStatus.SUBMITTED, db_index=True)

    # Cost breakdown in ETB
    materials_cost = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    labor_cost = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    transportation_cost = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    installation_cost = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    additional_charges = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    discount = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    subtotal = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))

    expiration_date = models.DateField(null=True, blank=True)
    workshop_notes = models.TextField(blank=True, null=True)
    customer_notes = models.TextField(blank=True, null=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.quote_number} - {self.project_title} ({self.customer.get_full_name()})'

    def calculate_totals(self):
        self.subtotal = (
            Decimal(str(self.materials_cost or 0)) +
            Decimal(str(self.labor_cost or 0)) +
            Decimal(str(self.transportation_cost or 0)) +
            Decimal(str(self.installation_cost or 0)) +
            Decimal(str(self.additional_charges or 0)) -
            Decimal(str(self.discount or 0))
        )
        self.total_amount = max(self.subtotal, Decimal('0.00'))
        return self.total_amount

    def save(self, *args, **kwargs):
        if not self.quote_number:
            year = date.today().year
            last_quote = Quote.objects.filter(quote_number__startswith=f'QT-{year}').order_by('-created_at').first()
            if last_quote:
                try:
                    last_seq = int(last_quote.quote_number.split('-')[-1])
                    seq = last_seq + 1
                except Exception:
                    seq = Quote.objects.count() + 1
            else:
                seq = 1
            self.quote_number = f'QT-{year}-{seq:04d}'

        if not self.expiration_date:
            self.expiration_date = date.today() + timedelta(days=15)

        self.calculate_totals()
        super().save(*args, **kwargs)

class QuoteItem(TimeStampedModel):
    quote = models.ForeignKey(Quote, on_delete=models.CASCADE, related_name='items')
    description = models.CharField(max_length=255)
    quantity = models.PositiveIntegerField(default=1)
    unit_cost = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    total_cost = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))

    def save(self, *args, **kwargs):
        self.total_cost = Decimal(str(self.quantity)) * Decimal(str(self.unit_cost))
        super().save(*args, **kwargs)

class QuoteAttachment(TimeStampedModel):
    quote = models.ForeignKey(Quote, on_delete=models.CASCADE, related_name='attachments')
    file = models.FileField(upload_to='quotes/')
    file_name = models.CharField(max_length=255, blank=True)

    def save(self, *args, **kwargs):
        if not self.file_name and self.file:
            self.file_name = os.path.basename(self.file.name)
        super().save(*args, **kwargs)
''')

w('backend/apps/quotations/views.py', '''from rest_framework import viewsets, permissions, status
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
''')
print('Quotations model and views updated.')
