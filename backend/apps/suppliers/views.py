from rest_framework import viewsets, permissions, filters
from .models import Supplier
from .serializers import SupplierSerializer
from apps.accounts.permissions import IsStaffUser

class SupplierViewSet(viewsets.ModelViewSet):
    queryset = Supplier.objects.prefetch_related('materials').all()
    serializer_class = SupplierSerializer
    permission_classes = [permissions.IsAuthenticated, IsStaffUser]
    filter_backends = [filters.SearchFilter]
    search_fields = ['name', 'contact_person', 'phone', 'materials_supplied']
