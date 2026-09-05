from rest_framework import viewsets, permissions, filters
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
