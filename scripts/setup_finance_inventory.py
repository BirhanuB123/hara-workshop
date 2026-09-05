import os

def w(path, content):
    full_path = os.path.normpath(path)
    os.makedirs(os.path.dirname(os.path.abspath(full_path)), exist_ok=True)
    with open(full_path, 'w', encoding='utf-8') as f:
        f.write(content.strip() + '\n')
    print(f'Created: {full_path}')

# ==========================================
# 1. SUPPLIERS APP
# ==========================================
w('backend/apps/suppliers/models.py', '''from django.db import models
from apps.core.models import TimeStampedModel

class Supplier(TimeStampedModel):
    name = models.CharField(max_length=200)
    contact_person = models.CharField(max_length=150, blank=True, null=True)
    phone = models.CharField(max_length=50)
    email = models.EmailField(blank=True, null=True)
    address = models.CharField(max_length=255, default='Addis Ababa')
    materials_supplied = models.CharField(max_length=255, help_text='e.g., Structural steel, hardwood timber, welding rods')
    notes = models.TextField(blank=True, null=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return f'{self.name} ({self.phone})'
''')

w('backend/apps/suppliers/serializers.py', '''from rest_framework import serializers
from .models import Supplier

class SupplierSerializer(serializers.ModelSerializer):
    material_count = serializers.IntegerField(source='materials.count', read_only=True)

    class Meta:
        model = Supplier
        fields = ['id', 'name', 'contact_person', 'phone', 'email', 'address', 'materials_supplied', 'notes', 'is_active', 'material_count', 'created_at']
''')

w('backend/apps/suppliers/views.py', '''from rest_framework import viewsets, permissions, filters
from .models import Supplier
from .serializers import SupplierSerializer
from apps.accounts.permissions import IsStaffUser

class SupplierViewSet(viewsets.ModelViewSet):
    queryset = Supplier.objects.prefetch_related('materials').all()
    serializer_class = SupplierSerializer
    permission_classes = [permissions.IsAuthenticated, IsStaffUser]
    filter_backends = [filters.SearchFilter]
    search_fields = ['name', 'contact_person', 'phone', 'materials_supplied']
''')

w('backend/apps/suppliers/urls.py', '''from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SupplierViewSet

router = DefaultRouter()
router.register(r'', SupplierViewSet, basename='suppliers')

urlpatterns = [
    path('', include(router.urls)),
]
''')

# ==========================================
# 2. INVENTORY APP
# ==========================================
w('backend/apps/inventory/models.py', '''from django.db import models
from django.conf import settings
from apps.core.models import TimeStampedModel

class MaterialCategory(models.TextChoices):
    STEEL = 'STEEL', 'Structural & Sheet Steel'
    WOOD = 'WOOD', 'Timber & Wood Boards'
    GLASS = 'GLASS', 'Glass & Mirrors'
    PAINT = 'PAINT', 'Paint & Powder Coatings'
    HARDWARE = 'HARDWARE', 'Handles, Hinges & Fasteners'
    ALUMINUM = 'ALUMINUM', 'Aluminum Profiles'
    CONSUMABLE = 'CONSUMABLE', 'Welding Rods & Abrasives'
    OTHER = 'OTHER', 'Other Workshop Materials'

class MaterialUnit(models.TextChoices):
    KG = 'KG', 'Kilograms (kg)'
    METER = 'METER', 'Meters (m)'
    PIECE = 'PIECE', 'Pieces (pcs)'
    SHEET = 'SHEET', 'Sheets'
    LITER = 'LITER', 'Liters'

class Material(TimeStampedModel):
    sku = models.CharField(max_length=50, unique=True, db_index=True)
    name = models.CharField(max_length=200)
    category = models.CharField(max_length=50, choices=MaterialCategory.choices, default=MaterialCategory.STEEL)
    unit = models.CharField(max_length=20, choices=MaterialUnit.choices, default=MaterialUnit.PIECE)
    current_stock = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    minimum_stock = models.DecimalField(max_digits=12, decimal_places=2, default=5.00)
    unit_cost = models.DecimalField(max_digits=12, decimal_places=2, default=0.00, help_text='Cost in ETB')
    supplier = models.ForeignKey('suppliers.Supplier', on_delete=models.SET_NULL, null=True, blank=True, related_name='materials')
    location = models.CharField(max_length=100, default='Main Rack A', help_text='Rack/Bay in workshop')
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['category', 'name']

    def __str__(self):
        return f'{self.name} ({self.current_stock} {self.unit})'

    @property
    def is_low_stock(self):
        return self.current_stock <= self.minimum_stock

class InventoryTransaction(TimeStampedModel):
    class TransactionType(models.TextChoices):
        PURCHASE = 'PURCHASE', 'Stock Purchase / Inward'
        CONSUMPTION = 'CONSUMPTION', 'Workshop Production Consumption'
        ADJUSTMENT = 'ADJUSTMENT', 'Stock Take Adjustment'
        RETURN = 'RETURN', 'Return to Supplier'
        WASTE = 'WASTE', 'Scrap / Waste'

    material = models.ForeignKey(Material, on_delete=models.CASCADE, related_name='transactions')
    transaction_type = models.CharField(max_length=30, choices=TransactionType.choices)
    quantity = models.DecimalField(max_digits=12, decimal_places=2)
    unit_cost = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    total_cost = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    performed_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    notes = models.CharField(max_length=255, blank=True, null=True)

    class Meta:
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        self.total_cost = self.quantity * self.unit_cost
        super().save(*args, **kwargs)

        # Update current stock
        m = self.material
        if self.transaction_type in [self.TransactionType.PURCHASE, self.TransactionType.RETURN]:
            m.current_stock += self.quantity
        elif self.transaction_type in [self.TransactionType.CONSUMPTION, self.TransactionType.WASTE]:
            m.current_stock = max(m.current_stock - self.quantity, 0)
        elif self.transaction_type == self.TransactionType.ADJUSTMENT:
            m.current_stock = self.quantity
        m.save()
''')

w('backend/apps/inventory/serializers.py', '''from rest_framework import serializers
from .models import Material, InventoryTransaction

class InventoryTransactionSerializer(serializers.ModelSerializer):
    performed_by_name = serializers.CharField(source='performed_by.get_full_name', read_only=True)
    material_name = serializers.CharField(source='material.name', read_only=True)

    class Meta:
        model = InventoryTransaction
        fields = ['id', 'material', 'material_name', 'transaction_type', 'quantity', 'unit_cost', 'total_cost', 'performed_by_name', 'notes', 'created_at']

class MaterialSerializer(serializers.ModelSerializer):
    supplier_name = serializers.CharField(source='supplier.name', read_only=True)
    is_low_stock = serializers.BooleanField(read_only=True)

    class Meta:
        model = Material
        fields = [
            'id', 'sku', 'name', 'category', 'unit', 'current_stock',
            'minimum_stock', 'unit_cost', 'supplier', 'supplier_name',
            'location', 'is_active', 'is_low_stock', 'created_at', 'updated_at'
        ]
''')

w('backend/apps/inventory/views.py', '''from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .models import Material, InventoryTransaction
from .serializers import MaterialSerializer, InventoryTransactionSerializer
from apps.accounts.permissions import IsStaffUser
from apps.core.models import AuditLog

class MaterialViewSet(viewsets.ModelViewSet):
    queryset = Material.objects.select_related('supplier').all()
    serializer_class = MaterialSerializer
    permission_classes = [permissions.IsAuthenticated, IsStaffUser]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category', 'is_active']
    search_fields = ['name', 'sku', 'location']
    ordering_fields = ['name', 'current_stock', 'unit_cost']

    @action(detail=False, methods=['get'])
    def low_stock(self, request):
        low_materials = [m for m in self.get_queryset() if m.is_low_stock]
        serializer = self.get_serializer(low_materials, many=True)
        return Response(serializer.data)

class InventoryTransactionViewSet(viewsets.ModelViewSet):
    queryset = InventoryTransaction.objects.select_related('material', 'performed_by').all()
    serializer_class = InventoryTransactionSerializer
    permission_classes = [permissions.IsAuthenticated, IsStaffUser]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['material', 'transaction_type']
    search_fields = ['material__name', 'notes']

    def perform_create(self, serializer):
        transaction = serializer.save(performed_by=self.request.user)
        AuditLog.objects.create(
            user=self.request.user,
            action='STOCK_TRANSACTION',
            resource='Material',
            resource_id=transaction.material.sku,
            metadata={'type': transaction.transaction_type, 'qty': float(transaction.quantity)}
        )
''')

w('backend/apps/inventory/urls.py', '''from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import MaterialViewSet, InventoryTransactionViewSet

router = DefaultRouter()
router.register(r'transactions', InventoryTransactionViewSet, basename='inventory-transactions')
router.register(r'', MaterialViewSet, basename='materials')

urlpatterns = [
    path('', include(router.urls)),
]
''')

# ==========================================
# 3. PAYMENTS APP
# ==========================================
w('backend/apps/payments/models.py', '''from django.db import models
from django.conf import settings
from apps.core.models import TimeStampedModel
from datetime import date

class PaymentMethod(models.TextChoices):
    TELEBIRR = 'TELEBIRR', 'Telebirr'
    CBE_BIRR = 'CBE_BIRR', 'CBE Birr / Commercial Bank of Ethiopia'
    BANK_TRANSFER = 'BANK_TRANSFER', 'Bank Wire Transfer'
    CASH = 'CASH', 'Cash Payment'
    CHEQUE = 'CHEQUE', 'Cheque'

class PaymentStatus(models.TextChoices):
    PENDING = 'PENDING', 'Pending Verification'
    PROCESSING = 'PROCESSING', 'Processing'
    SUCCESS = 'SUCCESS', 'Payment Received'
    FAILED = 'FAILED', 'Failed'
    REFUNDED = 'REFUNDED', 'Refunded'

class Payment(TimeStampedModel):
    payment_number = models.CharField(max_length=50, unique=True, db_index=True)
    order = models.ForeignKey('orders.Order', on_delete=models.CASCADE, related_name='payments')
    customer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='payments')
    amount = models.DecimalField(max_digits=12, decimal_places=2, help_text='Amount in ETB')
    currency = models.CharField(max_length=10, default='ETB')
    payment_method = models.CharField(max_length=30, choices=PaymentMethod.choices, default=PaymentMethod.TELEBIRR)
    transaction_reference = models.CharField(max_length=100, blank=True, null=True, help_text='Telebirr or CBE Transaction ID')
    status = models.CharField(max_length=30, choices=PaymentStatus.choices, default=PaymentStatus.SUCCESS)
    payment_date = models.DateField(default=date.today)
    receipt_attachment = models.ImageField(upload_to='receipts/', blank=True, null=True)
    recorded_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='recorded_payments')
    notes = models.TextField(blank=True, null=True)

    class Meta:
        ordering = ['-payment_date', '-created_at']

    def __str__(self):
        return f'{self.payment_number} - {self.amount} {self.currency} ({self.status})'

    def save(self, *args, **kwargs):
        if not self.payment_number:
            year = date.today().year
            last_pay = Payment.objects.filter(payment_number__startswith=f'PAY-{year}').order_by('-created_at').first()
            if last_pay:
                try:
                    last_seq = int(last_pay.payment_number.split('-')[-1])
                    seq = last_seq + 1
                except Exception:
                    seq = Payment.objects.count() + 1
            else:
                seq = 1
            self.payment_number = f'PAY-{year}-{seq:04d}'
        super().save(*args, **kwargs)

        # Update order paid amount
        if self.status == PaymentStatus.SUCCESS:
            order = self.order
            total_paid = Payment.objects.filter(order=order, status=PaymentStatus.SUCCESS).aggregate(models.Sum('amount'))['amount__sum'] or 0
            order.paid_amount = total_paid
            if order.paid_amount >= order.total_amount:
                order.status = 'PAID'
            elif order.paid_amount > 0:
                order.status = 'PAYMENT_PENDING'
            order.save()

            # Update invoice
            invoice = order.invoices.first()
            if invoice:
                invoice.amount_paid = total_paid
                invoice.amount_remaining = max(invoice.total_amount - total_paid, 0)
                if invoice.amount_remaining <= 0:
                    invoice.status = 'PAID'
                elif invoice.amount_paid > 0:
                    invoice.status = 'PARTIALLY_PAID'
                invoice.save()
''')

w('backend/apps/payments/serializers.py', '''from rest_framework import serializers
from .models import Payment
from apps.accounts.serializers import UserSerializer

class PaymentSerializer(serializers.ModelSerializer):
    customer = UserSerializer(read_only=True)
    order_number = serializers.CharField(source='order.order_number', read_only=True)
    recorded_by_name = serializers.CharField(source='recorded_by.get_full_name', read_only=True)

    class Meta:
        model = Payment
        fields = [
            'id', 'payment_number', 'order', 'order_number', 'customer',
            'amount', 'currency', 'payment_method', 'transaction_reference',
            'status', 'payment_date', 'receipt_attachment', 'recorded_by_name',
            'notes', 'created_at'
        ]
        read_only_fields = ['id', 'payment_number', 'customer', 'created_at']

class PaymentCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = ['order', 'amount', 'currency', 'payment_method', 'transaction_reference', 'payment_date', 'receipt_attachment', 'notes']
''')

w('backend/apps/payments/views.py', '''from rest_framework import viewsets, permissions, status, filters
from django_filters.rest_framework import DjangoFilterBackend
from .models import Payment, PaymentStatus
from .serializers import PaymentSerializer, PaymentCreateSerializer
from apps.accounts.permissions import IsOwnerOrStaff
from apps.core.models import AuditLog

class PaymentViewSet(viewsets.ModelViewSet):
    queryset = Payment.objects.select_related('order', 'customer', 'recorded_by').all()
    serializer_class = PaymentSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrStaff]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['order', 'status', 'payment_method']
    search_fields = ['payment_number', 'transaction_reference', 'customer__first_name', 'customer__email']
    ordering_fields = ['payment_date', 'amount']

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Payment.objects.none()
        if user.role == 'CUSTOMER':
            return Payment.objects.filter(customer=user)
        return Payment.objects.all().select_related('order', 'customer', 'recorded_by')

    def create(self, request, *args, **kwargs):
        serializer = PaymentCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        order = serializer.validated_data['order']

        if request.user.role == 'CUSTOMER' and order.customer != request.user:
            return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)

        is_staff = request.user.role != 'CUSTOMER'
        status_val = PaymentStatus.SUCCESS if is_staff else PaymentStatus.PENDING

        payment = serializer.save(
            customer=order.customer,
            status=status_val,
            recorded_by=request.user
        )

        AuditLog.objects.create(
            user=request.user,
            action='PAYMENT_RECORD',
            resource='Payment',
            resource_id=payment.payment_number,
            metadata={'amount': float(payment.amount), 'method': payment.payment_method}
        )

        return Response(PaymentSerializer(payment).data, status=status.HTTP_201_CREATED)
''')

w('backend/apps/payments/urls.py', '''from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PaymentViewSet

router = DefaultRouter()
router.register(r'', PaymentViewSet, basename='payments')

urlpatterns = [
    path('', include(router.urls)),
]
''')

# ==========================================
# 4. INVOICES APP
# ==========================================
w('backend/apps/invoices/models.py', '''from django.db import models
from django.conf import settings
from apps.core.models import TimeStampedModel
from datetime import date, timedelta

class InvoiceStatus(models.TextChoices):
    DRAFT = 'DRAFT', 'Draft'
    ISSUED = 'ISSUED', 'Issued'
    PARTIALLY_PAID = 'PARTIALLY_PAID', 'Partially Paid'
    PAID = 'PAID', 'Paid'
    OVERDUE = 'OVERDUE', 'Overdue'
    CANCELLED = 'CANCELLED', 'Cancelled'

class Invoice(TimeStampedModel):
    invoice_number = models.CharField(max_length=50, unique=True, db_index=True)
    order = models.ForeignKey('orders.Order', on_delete=models.CASCADE, related_name='invoices')
    customer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='invoices')

    subtotal = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    discount = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    tax_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0.00, help_text='15% VAT')
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)

    amount_paid = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    amount_remaining = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)

    status = models.CharField(max_length=30, choices=InvoiceStatus.choices, default=InvoiceStatus.ISSUED, db_index=True)
    issue_date = models.DateField(default=date.today)
    due_date = models.DateField(null=True, blank=True)
    notes = models.TextField(blank=True, null=True)

    class Meta:
        ordering = ['-issue_date', '-created_at']

    def __str__(self):
        return f'{self.invoice_number} ({self.status}) - {self.total_amount} ETB'

    def save(self, *args, **kwargs):
        if not self.invoice_number:
            year = date.today().year
            last_inv = Invoice.objects.filter(invoice_number__startswith=f'INV-{year}').order_by('-created_at').first()
            if last_inv:
                try:
                    last_seq = int(last_inv.invoice_number.split('-')[-1])
                    seq = last_seq + 1
                except Exception:
                    seq = Invoice.objects.count() + 1
            else:
                seq = 1
            self.invoice_number = f'INV-{year}-{seq:04d}'

        if not self.due_date:
            self.due_date = date.today() + timedelta(days=30)

        self.amount_remaining = max(self.total_amount - self.amount_paid, 0)
        super().save(*args, **kwargs)
''')

w('backend/apps/invoices/serializers.py', '''from rest_framework import serializers
from .models import Invoice
from apps.accounts.serializers import UserSerializer

class InvoiceSerializer(serializers.ModelSerializer):
    customer = UserSerializer(read_only=True)
    order_number = serializers.CharField(source='order.order_number', read_only=True)

    class Meta:
        model = Invoice
        fields = [
            'id', 'invoice_number', 'order', 'order_number', 'customer',
            'subtotal', 'discount', 'tax_amount', 'total_amount',
            'amount_paid', 'amount_remaining', 'status', 'issue_date',
            'due_date', 'notes', 'created_at'
        ]
''')

w('backend/apps/invoices/views.py', '''from rest_framework import viewsets, permissions, filters
from django_filters.rest_framework import DjangoFilterBackend
from .models import Invoice
from .serializers import InvoiceSerializer
from apps.accounts.permissions import IsOwnerOrStaff

class InvoiceViewSet(viewsets.ModelViewSet):
    queryset = Invoice.objects.select_related('order', 'customer').all()
    serializer_class = InvoiceSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrStaff]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status']
    search_fields = ['invoice_number', 'order__order_number', 'customer__first_name', 'customer__email']
    ordering_fields = ['issue_date', 'total_amount', 'due_date']

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Invoice.objects.none()
        if user.role == 'CUSTOMER':
            return Invoice.objects.filter(customer=user)
        return Invoice.objects.all().select_related('order', 'customer')
''')

w('backend/apps/invoices/urls.py', '''from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import InvoiceViewSet

router = DefaultRouter()
router.register(r'', InvoiceViewSet, basename='invoices')

urlpatterns = [
    path('', include(router.urls)),
]
''')

# ==========================================
# 5. EXPENSES APP
# ==========================================
w('backend/apps/expenses/models.py', '''from django.db import models
from django.conf import settings
from apps.core.models import TimeStampedModel
from datetime import date

class ExpenseCategory(models.TextChoices):
    MATERIALS = 'MATERIALS', 'Raw Materials Purchase'
    SALARIES = 'SALARIES', 'Staff Wages & Salaries'
    TRANSPORTATION = 'TRANSPORTATION', 'Fuel & Logistics'
    UTILITIES = 'UTILITIES', 'Electricity & Water'
    EQUIPMENT = 'EQUIPMENT', 'Machinery & Tools'
    MAINTENANCE = 'MAINTENANCE', 'Machine Service & Repairs'
    OTHER = 'OTHER', 'Miscellaneous Expenses'

class Expense(TimeStampedModel):
    expense_number = models.CharField(max_length=50, unique=True, db_index=True)
    category = models.CharField(max_length=30, choices=ExpenseCategory.choices, default=ExpenseCategory.MATERIALS)
    amount = models.DecimalField(max_digits=12, decimal_places=2, help_text='Amount in ETB')
    date = models.DateField(default=date.today)
    payment_method = models.CharField(max_length=50, default='CASH')
    description = models.TextField()
    receipt_attachment = models.ImageField(upload_to='expenses/', blank=True, null=True)
    recorded_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)

    class Meta:
        ordering = ['-date', '-created_at']

    def __str__(self):
        return f'{self.expense_number} - {self.category} ({self.amount} ETB)'

    def save(self, *args, **kwargs):
        if not self.expense_number:
            year = date.today().year
            last_exp = Expense.objects.filter(expense_number__startswith=f'EXP-{year}').order_by('-created_at').first()
            if last_exp:
                try:
                    last_seq = int(last_exp.expense_number.split('-')[-1])
                    seq = last_seq + 1
                except Exception:
                    seq = Expense.objects.count() + 1
            else:
                seq = 1
            self.expense_number = f'EXP-{year}-{seq:04d}'
        super().save(*args, **kwargs)
''')

w('backend/apps/expenses/serializers.py', '''from rest_framework import serializers
from .models import Expense

class ExpenseSerializer(serializers.ModelSerializer):
    recorded_by_name = serializers.CharField(source='recorded_by.get_full_name', read_only=True)

    class Meta:
        model = Expense
        fields = ['id', 'expense_number', 'category', 'amount', 'date', 'payment_method', 'description', 'receipt_attachment', 'recorded_by_name', 'created_at']
''')

w('backend/apps/expenses/views.py', '''from rest_framework import viewsets, permissions, filters
from django_filters.rest_framework import DjangoFilterBackend
from .models import Expense
from .serializers import ExpenseSerializer
from apps.accounts.permissions import IsStaffUser

class ExpenseViewSet(viewsets.ModelViewSet):
    queryset = Expense.objects.select_related('recorded_by').all()
    serializer_class = ExpenseSerializer
    permission_classes = [permissions.IsAuthenticated, IsStaffUser]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category']
    search_fields = ['expense_number', 'description']
    ordering_fields = ['date', 'amount']

    def perform_create(self, serializer):
        serializer.save(recorded_by=self.request.user)
''')

w('backend/apps/expenses/urls.py', '''from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ExpenseViewSet

router = DefaultRouter()
router.register(r'', ExpenseViewSet, basename='expenses')

urlpatterns = [
    path('', include(router.urls)),
]
''')

print('Finance and inventory apps written successfully.')
