from rest_framework import viewsets, permissions, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils.text import slugify
from django_filters.rest_framework import DjangoFilterBackend
from .models import Project, ProjectImage
from .serializers import ProjectSerializer, ProjectImageSerializer
from apps.accounts.permissions import IsStaffUser

class ProjectViewSet(viewsets.ModelViewSet):
    queryset = Project.objects.prefetch_related('images').all()
    serializer_class = ProjectSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category', 'client_type', 'is_featured', 'is_published']
    search_fields = ['title', 'description', 'materials_used']
    ordering_fields = ['completion_date', 'created_at', 'title']

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        return [IsStaffUser()]

    def get_queryset(self):
        qs = super().get_queryset()
        if not (self.request.user and self.request.user.is_authenticated and self.request.user.role != 'CUSTOMER'):
            qs = qs.filter(is_published=True)
        return qs

    def create(self, request, *args, **kwargs):
        data = request.data.copy()
        if 'slug' not in data or not data['slug']:
            base_slug = slugify(data.get('title', 'workshop-project')) or 'project'
            slug = base_slug
            counter = 1
            while Project.objects.filter(slug=slug).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1
            data['slug'] = slug

        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        project = serializer.save()

        # Handle multiple uploaded image files from camera or file picker
        uploaded_files = request.FILES.getlist('images')
        primary_index = 0
        try:
            primary_index = int(request.data.get('primary_image_index', 0))
        except (ValueError, TypeError):
            primary_index = 0

        # Create ProjectImage records, putting primary image first so primary_image_url returns it
        ordered_files = []
        if uploaded_files:
            if 0 <= primary_index < len(uploaded_files):
                primary_file = uploaded_files[primary_index]
                ordered_files.append(primary_file)
                for i, f in enumerate(uploaded_files):
                    if i != primary_index:
                        ordered_files.append(f)
            else:
                ordered_files = uploaded_files

            for idx, img_file in enumerate(ordered_files):
                ProjectImage.objects.create(
                    project=project,
                    image=img_file,
                    caption=f"{project.title} - Image {idx + 1}"
                )

        return Response(ProjectSerializer(project).data, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        project = serializer.save()

        uploaded_files = request.FILES.getlist('images')
        for idx, img_file in enumerate(uploaded_files):
            ProjectImage.objects.create(
                project=project,
                image=img_file,
                caption=f"{project.title} - New Image"
            )

        return Response(ProjectSerializer(project).data)

    @action(detail=True, methods=['post'], permission_classes=[IsStaffUser])
    def toggle_publish(self, request, pk=None):
        project = self.get_object()
        project.is_published = not project.is_published
        project.save()
        return Response({
            'id': str(project.id),
            'is_published': project.is_published,
            'message': f"Project is now {'published' if project.is_published else 'hidden from gallery'}."
        })

    @action(detail=True, methods=['post'], permission_classes=[IsStaffUser])
    def upload_images(self, request, pk=None):
        project = self.get_object()
        uploaded_files = request.FILES.getlist('images')
        created_images = []
        for f in uploaded_files:
            img = ProjectImage.objects.create(project=project, image=f)
            created_images.append(ProjectImageSerializer(img).data)
        return Response(created_images, status=status.HTTP_201_CREATED)

class ProjectImageViewSet(viewsets.ModelViewSet):
    queryset = ProjectImage.objects.all()
    serializer_class = ProjectImageSerializer
    permission_classes = [IsStaffUser]
