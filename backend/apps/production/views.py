from rest_framework import viewsets, permissions, status, filters
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
