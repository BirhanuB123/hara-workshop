from rest_framework import viewsets, permissions, filters
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
