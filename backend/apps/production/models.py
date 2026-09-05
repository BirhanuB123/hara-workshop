from django.db import models
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
