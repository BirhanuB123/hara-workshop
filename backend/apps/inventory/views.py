from rest_framework import viewsets, permissions, filters
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
