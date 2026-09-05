from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .models import Payment, PaymentStatus
from .serializers import PaymentSerializer, PaymentCreateSerializer
from apps.accounts.permissions import IsOwnerOrStaff, IsStaffUser
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

    @action(detail=True, methods=['post'], permission_classes=[IsStaffUser])
    def verify(self, request, pk=None):
        payment = self.get_object()
        payment.status = PaymentStatus.SUCCESS
        payment.save()

        AuditLog.objects.create(
            user=request.user,
            action='PAYMENT_VERIFY',
            resource='Payment',
            resource_id=payment.payment_number,
            metadata={'amount': float(payment.amount), 'status': payment.status}
        )
        return Response(PaymentSerializer(payment).data)
