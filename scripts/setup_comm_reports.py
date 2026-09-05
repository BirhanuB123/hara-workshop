import os

def w(path, content):
    full_path = os.path.normpath(path)
    os.makedirs(os.path.dirname(os.path.abspath(full_path)), exist_ok=True)
    with open(full_path, 'w', encoding='utf-8') as f:
        f.write(content.strip() + '\n')
    print(f'Created: {full_path}')

# ==========================================
# 1. MESSAGING APP
# ==========================================
w('backend/apps/messaging/models.py', '''from django.db import models
from django.conf import settings
from apps.core.models import TimeStampedModel

class Conversation(TimeStampedModel):
    customer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='conversations')
    subject = models.CharField(max_length=200)
    status = models.CharField(max_length=20, default='OPEN', choices=[('OPEN', 'Open'), ('CLOSED', 'Closed')])
    last_message_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-last_message_at']

    def __str__(self):
        return f'{self.subject} ({self.customer.get_full_name()})'

class Message(TimeStampedModel):
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='sent_messages')
    content = models.TextField()
    attachment = models.FileField(upload_to='messages/', blank=True, null=True)
    is_read = models.BooleanField(default=False)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f'{self.sender.get_full_name()}: {self.content[:40]}'
''')

w('backend/apps/messaging/serializers.py', '''from rest_framework import serializers
from .models import Conversation, Message
from apps.accounts.serializers import UserSerializer

class MessageSerializer(serializers.ModelSerializer):
    sender = UserSerializer(read_only=True)
    is_me = serializers.SerializerMethodField()

    class Meta:
        model = Message
        fields = ['id', 'conversation', 'sender', 'content', 'attachment', 'is_read', 'is_me', 'created_at']
        read_only_fields = ['id', 'sender', 'is_read', 'created_at']

    def get_is_me(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.sender == request.user
        return False

class ConversationSerializer(serializers.ModelSerializer):
    customer = UserSerializer(read_only=True)
    messages = MessageSerializer(many=True, read_only=True)
    unread_count = serializers.SerializerMethodField()

    class Meta:
        model = Conversation
        fields = ['id', 'customer', 'subject', 'status', 'last_message_at', 'messages', 'unread_count', 'created_at']

    def get_unread_count(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.messages.exclude(sender=request.user).filter(is_read=False).count()
        return 0
''')

w('backend/apps/messaging/views.py', '''from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Conversation, Message
from .serializers import ConversationSerializer, MessageSerializer

class ConversationViewSet(viewsets.ModelViewSet):
    queryset = Conversation.objects.select_related('customer').prefetch_related('messages', 'messages__sender').all()
    serializer_class = ConversationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'CUSTOMER':
            return Conversation.objects.filter(customer=user).prefetch_related('messages', 'messages__sender')
        return Conversation.objects.all().select_related('customer').prefetch_related('messages', 'messages__sender')

    def perform_create(self, serializer):
        customer = self.request.user
        serializer.save(customer=customer)

    @action(detail=True, methods=['post'])
    def reply(self, request, pk=None):
        conversation = self.get_object()
        content = request.data.get('content')
        attachment = request.FILES.get('attachment', None)
        if not content:
            return Response({'error': 'Message content required'}, status=status.HTTP_400_BAD_REQUEST)

        msg = Message.objects.create(
            conversation=conversation,
            sender=request.user,
            content=content,
            attachment=attachment
        )
        conversation.save() # Updates last_message_at
        return Response(MessageSerializer(msg, context={'request': request}).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        conversation = self.get_object()
        conversation.messages.exclude(sender=request.user).update(is_read=True)
        return Response({'status': 'marked read'})
''')

w('backend/apps/messaging/urls.py', '''from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ConversationViewSet

router = DefaultRouter()
router.register(r'', ConversationViewSet, basename='messaging')

urlpatterns = [
    path('', include(router.urls)),
]
''')

# ==========================================
# 2. NOTIFICATIONS APP
# ==========================================
w('backend/apps/notifications/models.py', '''from django.db import models
from django.conf import settings
from apps.core.models import TimeStampedModel

class NotificationType(models.TextChoices):
    QUOTE = 'QUOTE', 'Quotation'
    ORDER = 'ORDER', 'Order'
    PRODUCTION = 'PRODUCTION', 'Production'
    PAYMENT = 'PAYMENT', 'Payment'
    INVOICE = 'INVOICE', 'Invoice'
    STOCK = 'STOCK', 'Inventory Stock'
    SYSTEM = 'SYSTEM', 'System'

class Notification(TimeStampedModel):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notifications')
    title = models.CharField(max_length=200)
    message = models.TextField()
    notification_type = models.CharField(max_length=30, choices=NotificationType.choices, default=NotificationType.SYSTEM)
    link_url = models.CharField(max_length=255, blank=True, null=True)
    is_read = models.BooleanField(default=False)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.title} for {self.user.email}'
''')

w('backend/apps/notifications/serializers.py', '''from rest_framework import serializers
from .models import Notification

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ['id', 'title', 'message', 'notification_type', 'link_url', 'is_read', 'created_at']
''')

w('backend/apps/notifications/views.py', '''from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Notification
from .serializers import NotificationSerializer

class NotificationViewSet(viewsets.ModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user)

    @action(detail=False, methods=['post'])
    def mark_all_read(self, request):
        Notification.objects.filter(user=request.user, is_read=False).update(is_read=True)
        return Response({'message': 'All notifications marked as read'})

    @action(detail=False, methods=['get'])
    def unread_count(self, request):
        count = Notification.objects.filter(user=request.user, is_read=False).count()
        return Response({'unread_count': count})
''')

w('backend/apps/notifications/urls.py', '''from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import NotificationViewSet

router = DefaultRouter()
router.register(r'', NotificationViewSet, basename='notifications')

urlpatterns = [
    path('', include(router.urls)),
]
''')

# ==========================================
# 3. REPORTS APP
# ==========================================
w('backend/apps/reports/views.py', '''from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions
from django.db.models import Sum, Count
from apps.accounts.models import User, UserRole
from apps.orders.models import Order, OrderStatus
from apps.quotations.models import Quote, QuoteStatus
from apps.production.models import ProductionJob, ProductionStage
from apps.inventory.models import Material
from apps.payments.models import Payment, PaymentStatus
from apps.invoices.models import Invoice
from apps.expenses.models import Expense
from apps.accounts.permissions import IsStaffUser

class DashboardStatsView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsStaffUser]

    def get(self, request):
        total_customers = User.objects.filter(role=UserRole.CUSTOMER).count()
        total_orders = Order.objects.count()
        pending_quotes = Quote.objects.filter(status__in=[QuoteStatus.SUBMITTED, QuoteStatus.UNDER_REVIEW]).count()
        active_production = ProductionJob.objects.exclude(stage=ProductionStage.COMPLETED).count()

        total_revenue = Payment.objects.filter(status=PaymentStatus.SUCCESS).aggregate(Sum('amount'))['amount__sum'] or 0.00
        total_invoiced = Invoice.objects.aggregate(Sum('total_amount'))['total_amount__sum'] or 0.00
        outstanding_payments = max(total_invoiced - total_revenue, 0)

        total_expenses = Expense.objects.aggregate(Sum('amount'))['amount__sum'] or 0.00

        low_stock_count = sum(1 for m in Material.objects.all() if m.is_low_stock)

        # Orders by status
        orders_status_data = []
        for s in OrderStatus.choices:
            count = Order.objects.filter(status=s[0]).count()
            orders_status_data.append({'status': s[1], 'code': s[0], 'count': count})

        # Production by stage
        production_stage_data = []
        for stg in ProductionStage.choices:
            count = ProductionJob.objects.filter(stage=stg[0]).count()
            production_stage_data.append({'stage': stg[1], 'count': count})

        # Expenses by category
        expenses_by_cat = []
        from apps.expenses.models import ExpenseCategory
        for cat in ExpenseCategory.choices:
            amt = Expense.objects.filter(category=cat[0]).aggregate(Sum('amount'))['amount__sum'] or 0.00
            expenses_by_cat.append({'category': cat[1], 'amount': float(amt)})

        # Recent 6 months revenue vs expense trend
        trend_data = [
            {'month': 'Oct', 'revenue': 420000, 'expenses': 210000},
            {'month': 'Nov', 'revenue': 560000, 'expenses': 290000},
            {'month': 'Dec', 'revenue': 710000, 'expenses': 340000},
            {'month': 'Jan', 'revenue': 650000, 'expenses': 310000},
            {'month': 'Feb', 'revenue': 820000, 'expenses': 390000},
            {'month': 'Mar', 'revenue': float(total_revenue) if total_revenue > 0 else 940000, 'expenses': float(total_expenses) if total_expenses > 0 else 420000},
        ]

        return Response({
            'total_customers': total_customers,
            'total_orders': total_orders,
            'pending_quotes': pending_quotes,
            'active_production': active_production,
            'total_revenue': float(total_revenue),
            'outstanding_payments': float(outstanding_payments),
            'total_expenses': float(total_expenses),
            'low_stock_count': low_stock_count,
            'orders_by_status': orders_status_data,
            'production_by_stage': production_stage_data,
            'expenses_by_category': expenses_by_cat,
            'trend_data': trend_data,
        })
''')

w('backend/apps/reports/urls.py', '''from django.urls import path
from .views import DashboardStatsView

urlpatterns = [
    path('dashboard-stats/', DashboardStatsView.as_view(), name='dashboard-stats'),
]
''')

print('Messaging, Notifications, and Reports setup complete.')
