from rest_framework import viewsets, permissions, status, filters
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
    search_fields = [
        'order_number', 'customer_name', 'customer_phone', 'customer_email',
        'customer__email', 'customer__first_name', 'customer__last_name'
    ]
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
        reason = request.data.get('reason', '')
        if new_status in OrderStatus.values:
            old_status = order.status
            order.status = new_status
            order.save()

            AuditLog.objects.create(
                user=request.user,
                action='STATUS_CHANGE',
                resource='Order',
                resource_id=order.order_number,
                metadata={'old_status': old_status, 'new_status': new_status, 'reason': reason}
            )

            # Notify customer via Telegram if status changed
            if old_status != new_status:
                try:
                    from apps.quotations.telegram_bot import notify_customer_status_change
                    notify_customer_status_change(order, new_status, reason=reason)
                except Exception:
                    pass

            return Response(OrderSerializer(order).data)
        return Response({'error': 'Invalid order status'}, status=status.HTTP_400_BAD_REQUEST)

    def perform_update(self, serializer):
        old_status = serializer.instance.status
        instance = serializer.save()
        if instance.status != old_status:
            try:
                from apps.quotations.telegram_bot import notify_customer_status_change
                notify_customer_status_change(instance, instance.status)
            except Exception:
                pass

