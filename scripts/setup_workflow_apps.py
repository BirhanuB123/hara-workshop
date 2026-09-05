import os

def w(path, content):
    full_path = os.path.normpath(path)
    os.makedirs(os.path.dirname(os.path.abspath(full_path)), exist_ok=True)
    with open(full_path, 'w', encoding='utf-8') as f:
        f.write(content.strip() + '\n')
    print(f'Created: {full_path}')

# ==========================================
# 1. QUOTATIONS APP
# ==========================================
w('backend/apps/quotations/models.py', '''from django.db import models
from django.conf import settings
from apps.core.models import TimeStampedModel
from datetime import date, timedelta

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
    materials_cost = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    labor_cost = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    transportation_cost = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    installation_cost = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    additional_charges = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    discount = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    subtotal = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)

    expiration_date = models.DateField(null=True, blank=True)
    workshop_notes = models.TextField(blank=True, null=True)
    customer_notes = models.TextField(blank=True, null=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.quote_number} - {self.project_title} ({self.customer.get_full_name()})'

    def calculate_totals(self):
        self.subtotal = (
            self.materials_cost +
            self.labor_cost +
            self.transportation_cost +
            self.installation_cost +
            self.additional_charges -
            self.discount
        )
        self.total_amount = max(self.subtotal, 0)
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
    unit_cost = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    total_cost = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)

    def save(self, *args, **kwargs):
        self.total_cost = self.quantity * self.unit_cost
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

w('backend/apps/quotations/serializers.py', '''from rest_framework import serializers
from .models import Quote, QuoteItem, QuoteAttachment
from apps.accounts.serializers import UserSerializer

class QuoteAttachmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuoteAttachment
        fields = ['id', 'file', 'file_name', 'created_at']

class QuoteItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuoteItem
        fields = ['id', 'description', 'quantity', 'unit_cost', 'total_cost']

class QuoteSerializer(serializers.ModelSerializer):
    customer = UserSerializer(read_only=True)
    items = QuoteItemSerializer(many=True, read_only=True)
    attachments = QuoteAttachmentSerializer(many=True, read_only=True)

    class Meta:
        model = Quote
        fields = [
            'id', 'quote_number', 'customer', 'project_title', 'service_type',
            'description', 'material_preference', 'width_cm', 'height_cm',
            'length_cm', 'quantity', 'preferred_completion_date',
            'installation_required', 'delivery_required', 'delivery_address',
            'status', 'materials_cost', 'labor_cost', 'transportation_cost',
            'installation_cost', 'additional_charges', 'discount', 'subtotal',
            'total_amount', 'expiration_date', 'workshop_notes', 'customer_notes',
            'items', 'attachments', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'quote_number', 'customer', 'created_at', 'updated_at']

class QuoteCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Quote
        fields = [
            'project_title', 'service_type', 'description', 'material_preference',
            'width_cm', 'height_cm', 'length_cm', 'quantity', 'preferred_completion_date',
            'installation_required', 'delivery_required', 'delivery_address', 'customer_notes'
        ]

class QuotePriceProposalSerializer(serializers.ModelSerializer):
    class Meta:
        model = Quote
        fields = [
            'materials_cost', 'labor_cost', 'transportation_cost',
            'installation_cost', 'additional_charges', 'discount',
            'expiration_date', 'workshop_notes'
        ]
''')

w('backend/apps/quotations/views.py', '''from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters
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
            delivery_address=quote.delivery_address or quote.customer.customer_profile.address if hasattr(quote.customer, 'customer_profile') else 'Addis Ababa',
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
            tax_amount=quote.total_amount * 0.15,
            total_amount=quote.total_amount * 1.15,
            amount_paid=0.00,
            amount_remaining=quote.total_amount * 1.15,
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
            'order_id': order.id,
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

w('backend/apps/quotations/urls.py', '''from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import QuoteViewSet

router = DefaultRouter()
router.register(r'', QuoteViewSet, basename='quotes')

urlpatterns = [
    path('', include(router.urls)),
]
''')

# ==========================================
# 2. ORDERS APP
# ==========================================
w('backend/apps/orders/models.py', '''from django.db import models
from django.conf import settings
from apps.core.models import TimeStampedModel
from datetime import date

class OrderStatus(models.TextChoices):
    PENDING = 'PENDING', 'Pending'
    CONFIRMED = 'CONFIRMED', 'Confirmed'
    PAYMENT_PENDING = 'PAYMENT_PENDING', 'Payment Pending'
    PAID = 'PAID', 'Paid'
    IN_PRODUCTION = 'IN_PRODUCTION', 'In Production'
    QUALITY_CHECK = 'QUALITY_CHECK', 'Quality Check'
    READY = 'READY', 'Ready for Delivery'
    DELIVERY = 'DELIVERY', 'Out for Delivery'
    INSTALLATION = 'INSTALLATION', 'Installation'
    COMPLETED = 'COMPLETED', 'Completed'
    CANCELLED = 'CANCELLED', 'Cancelled'

class Order(TimeStampedModel):
    order_number = models.CharField(max_length=50, unique=True, db_index=True)
    quote = models.OneToOneField('quotations.Quote', on_delete=models.SET_NULL, null=True, blank=True, related_name='order')
    customer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='orders')
    status = models.CharField(max_length=30, choices=OrderStatus.choices, default=OrderStatus.PENDING, db_index=True)

    total_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    paid_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)

    delivery_address = models.CharField(max_length=255, blank=True, null=True)
    delivery_city = models.CharField(max_length=100, default='Addis Ababa')
    expected_delivery_date = models.DateField(null=True, blank=True)
    notes = models.TextField(blank=True, null=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.order_number} ({self.customer.get_full_name()})'

    def save(self, *args, **kwargs):
        if not self.order_number:
            year = date.today().year
            last_order = Order.objects.filter(order_number__startswith=f'HW-{year}').order_by('-created_at').first()
            if last_order:
                try:
                    last_seq = int(last_order.order_number.split('-')[-1])
                    seq = last_seq + 1
                except Exception:
                    seq = Order.objects.count() + 1
            else:
                seq = 1
            self.order_number = f'HW-{year}-{seq:04d}'
        super().save(*args, **kwargs)

class OrderItem(TimeStampedModel):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey('products.Product', on_delete=models.SET_NULL, null=True, blank=True)
    item_title = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    quantity = models.PositiveIntegerField(default=1)
    unit_price = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    total_price = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)

    def save(self, *args, **kwargs):
        self.total_price = self.quantity * self.unit_price
        super().save(*args, **kwargs)
''')

w('backend/apps/orders/serializers.py', '''from rest_framework import serializers
from .models import Order, OrderItem
from apps.accounts.serializers import UserSerializer

class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = ['id', 'product', 'item_title', 'description', 'quantity', 'unit_price', 'total_price']

class OrderSerializer(serializers.ModelSerializer):
    customer = UserSerializer(read_only=True)
    items = OrderItemSerializer(many=True, read_only=True)
    production_job = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = [
            'id', 'order_number', 'quote', 'customer', 'status', 'total_amount',
            'paid_amount', 'delivery_address', 'delivery_city', 'expected_delivery_date',
            'notes', 'items', 'production_job', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'order_number', 'customer', 'created_at', 'updated_at']

    def get_production_job(self, obj):
        if hasattr(obj, 'production_job'):
            job = obj.production_job
            return {
                'id': job.id,
                'job_code': job.job_code,
                'stage': job.stage,
                'progress_percentage': job.progress_percentage,
                'priority': job.priority,
            }
        return None
''')

w('backend/apps/orders/views.py', '''from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .models import Order, OrderStatus
from .serializers import OrderSerializer
from apps.accounts.permissions import IsStaffUser, IsOwnerOrStaff
from apps.core.models import AuditLog

class OrderViewSet(viewsets.ModelViewSet):
    queryset = Order.objects.select_related('customer', 'quote').prefetch_related('items').all()
    serializer_class = OrderSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status']
    search_fields = ['order_number', 'customer__email', 'customer__first_name', 'customer__last_name']
    ordering_fields = ['created_at', 'total_amount', 'status']

    def get_permissions(self):
        return [permissions.IsAuthenticated(), IsOwnerOrStaff()]

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Order.objects.none()
        if user.role == 'CUSTOMER':
            return Order.objects.filter(customer=user).prefetch_related('items')
        return Order.objects.all().select_related('customer', 'quote').prefetch_related('items')

    @action(detail=True, methods=['post'], permission_classes=[IsStaffUser])
    def update_status(self, request, pk=None):
        order = self.get_object()
        new_status = request.data.get('status')
        if new_status in OrderStatus.values:
            order.status = new_status
            order.save()

            AuditLog.objects.create(
                user=request.user,
                action='STATUS_CHANGE',
                resource='Order',
                resource_id=order.order_number,
                metadata={'new_status': new_status}
            )
            return Response(OrderSerializer(order).data)
        return Response({'error': 'Invalid order status'}, status=status.HTTP_400_BAD_REQUEST)
''')

w('backend/apps/orders/urls.py', '''from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import OrderViewSet

router = DefaultRouter()
router.register(r'', OrderViewSet, basename='orders')

urlpatterns = [
    path('', include(router.urls)),
]
''')

# ==========================================
# 3. PRODUCTION APP
# ==========================================
w('backend/apps/production/models.py', '''from django.db import models
from django.conf import settings
from apps.core.models import TimeStampedModel
from datetime import date

class ProductionStage(models.TextChoices):
    ORDER_CONFIRMED = 'ORDER_CONFIRMED', '1. Order Confirmed'
    MATERIAL_PREP = 'MATERIAL_PREP', '2. Material Preparation'
    CUTTING = 'CUTTING', '3. Cutting & Sizing'
    FABRICATION = 'FABRICATION', '4. Metal/Wood Fabrication'
    ASSEMBLY = 'ASSEMBLY', '5. Assembly'
    FINISHING = 'FINISHING', '6. Polishing & Finishing'
    QUALITY_INSPECTION = 'QUALITY_INSPECTION', '7. Quality Inspection'
    READY_FOR_DELIVERY = 'READY_FOR_DELIVERY', '8. Ready for Delivery'
    INSTALLATION = 'INSTALLATION', '9. Site Installation'
    COMPLETED = 'COMPLETED', '10. Completed & Handover'

class ProductionJob(TimeStampedModel):
    order = models.OneToOneField('orders.Order', on_delete=models.CASCADE, related_name='production_job')
    job_code = models.CharField(max_length=50, unique=True, db_index=True)
    stage = models.CharField(max_length=50, choices=ProductionStage.choices, default=ProductionStage.ORDER_CONFIRMED, db_index=True)
    priority = models.CharField(max_length=20, default='MEDIUM', choices=[('LOW','Low'),('MEDIUM','Medium'),('HIGH','High'),('URGENT','Urgent')])
    progress_percentage = models.PositiveIntegerField(default=0)

    supervisor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='supervised_jobs')
    start_date = models.DateField(null=True, blank=True)
    expected_completion = models.DateField(null=True, blank=True)
    actual_completion = models.DateField(null=True, blank=True)
    notes = models.TextField(blank=True, null=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.job_code} ({self.stage})'

    def save(self, *args, **kwargs):
        if not self.job_code:
            year = date.today().year
            last_job = ProductionJob.objects.filter(job_code__startswith=f'JOB-{year}').order_by('-created_at').first()
            if last_job:
                try:
                    last_seq = int(last_job.job_code.split('-')[-1])
                    seq = last_seq + 1
                except Exception:
                    seq = ProductionJob.objects.count() + 1
            else:
                seq = 1
            self.job_code = f'JOB-{year}-{seq:04d}'
        super().save(*args, **kwargs)

class ProductionTask(TimeStampedModel):
    job = models.ForeignKey(ProductionJob, on_delete=models.CASCADE, related_name='tasks')
    title = models.CharField(max_length=200)
    stage = models.CharField(max_length=50, choices=ProductionStage.choices)
    assigned_to = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_tasks')
    is_completed = models.BooleanField(default=False)
    notes = models.TextField(blank=True, null=True)

class ProductionLog(TimeStampedModel):
    job = models.ForeignKey(ProductionJob, on_delete=models.CASCADE, related_name='logs')
    previous_stage = models.CharField(max_length=50)
    new_stage = models.CharField(max_length=50)
    progress_percentage = models.PositiveIntegerField()
    updated_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    notes = models.TextField(blank=True, null=True)
    image = models.ImageField(upload_to='production_logs/', blank=True, null=True)

    class Meta:
        ordering = ['-created_at']
''')

w('backend/apps/production/serializers.py', '''from rest_framework import serializers
from .models import ProductionJob, ProductionTask, ProductionLog
from apps.accounts.serializers import UserSerializer

class ProductionTaskSerializer(serializers.ModelSerializer):
    assigned_to_name = serializers.CharField(source='assigned_to.get_full_name', read_only=True)

    class Meta:
        model = ProductionTask
        fields = ['id', 'title', 'stage', 'assigned_to', 'assigned_to_name', 'is_completed', 'notes']

class ProductionLogSerializer(serializers.ModelSerializer):
    updated_by_name = serializers.CharField(source='updated_by.get_full_name', read_only=True)

    class Meta:
        model = ProductionLog
        fields = ['id', 'previous_stage', 'new_stage', 'progress_percentage', 'updated_by_name', 'notes', 'image', 'created_at']

class ProductionJobSerializer(serializers.ModelSerializer):
    order_number = serializers.CharField(source='order.order_number', read_only=True)
    customer_name = serializers.CharField(source='order.customer.get_full_name', read_only=True)
    supervisor = UserSerializer(read_only=True)
    tasks = ProductionTaskSerializer(many=True, read_only=True)
    logs = ProductionLogSerializer(many=True, read_only=True)

    class Meta:
        model = ProductionJob
        fields = [
            'id', 'job_code', 'order', 'order_number', 'customer_name',
            'stage', 'priority', 'progress_percentage', 'supervisor',
            'start_date', 'expected_completion', 'actual_completion', 'notes',
            'tasks', 'logs', 'created_at', 'updated_at'
        ]
''')

w('backend/apps/production/views.py', '''from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .models import ProductionJob, ProductionStage, ProductionTask, ProductionLog
from .serializers import ProductionJobSerializer, ProductionTaskSerializer, ProductionLogSerializer
from apps.accounts.permissions import IsProductionStaff, IsStaffUser
from apps.core.models import AuditLog

class ProductionJobViewSet(viewsets.ModelViewSet):
    queryset = ProductionJob.objects.select_related('order', 'order__customer', 'supervisor').prefetch_related('tasks', 'logs').all()
    serializer_class = ProductionJobSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['stage', 'priority']
    search_fields = ['job_code', 'order__order_number', 'order__customer__first_name']
    ordering_fields = ['created_at', 'priority', 'progress_percentage']

    def get_permissions(self):
        return [permissions.IsAuthenticated(), IsStaffUser()]

    @action(detail=True, methods=['post'], permission_classes=[IsProductionStaff])
    def update_stage(self, request, pk=None):
        job = self.get_object()
        new_stage = request.data.get('stage')
        new_progress = request.data.get('progress_percentage', job.progress_percentage)
        notes = request.data.get('notes', '')
        image = request.FILES.get('image', None)

        if new_stage in ProductionStage.values:
            prev_stage = job.stage
            job.stage = new_stage
            job.progress_percentage = int(new_progress)
            job.save()

            ProductionLog.objects.create(
                job=job,
                previous_stage=prev_stage,
                new_stage=new_stage,
                progress_percentage=job.progress_percentage,
                updated_by=request.user,
                notes=notes,
                image=image
            )

            # Update Order status if completed
            if new_stage == ProductionStage.COMPLETED:
                job.order.status = 'COMPLETED'
                job.order.save()
            elif new_stage in [ProductionStage.READY_FOR_DELIVERY]:
                job.order.status = 'READY'
                job.order.save()

            AuditLog.objects.create(
                user=request.user,
                action='STAGE_ADVANCE',
                resource='ProductionJob',
                resource_id=job.job_code,
                metadata={'stage': new_stage, 'progress': job.progress_percentage}
            )

            return Response(ProductionJobSerializer(job).data)
        return Response({'error': 'Invalid production stage'}, status=status.HTTP_400_BAD_REQUEST)
''')

w('backend/apps/production/urls.py', '''from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ProductionJobViewSet

router = DefaultRouter()
router.register(r'', ProductionJobViewSet, basename='production')

urlpatterns = [
    path('', include(router.urls)),
]
''')

print('Quotations, Orders, and Production apps written.')
