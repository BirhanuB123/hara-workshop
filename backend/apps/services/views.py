import os
import json
import uuid
from django.http import Http404
from django.utils.text import slugify
from rest_framework import viewsets, permissions, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .models import ServiceCategory, Service, ServiceImage
from .serializers import ServiceCategorySerializer, ServiceSerializer, ServiceImageSerializer
from apps.accounts.permissions import IsStaffUser

class ServiceCategoryViewSet(viewsets.ModelViewSet):
    authentication_classes = []
    permission_classes = [permissions.AllowAny]
    queryset = ServiceCategory.objects.prefetch_related('services').all()
    serializer_class = ServiceCategorySerializer

class ServiceViewSet(viewsets.ModelViewSet):
    authentication_classes = []
    permission_classes = [permissions.AllowAny]
    queryset = Service.objects.select_related('category').prefetch_related('gallery_images').all()
    serializer_class = ServiceSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['category', 'is_active']
    search_fields = ['title', 'short_description', 'full_description', 'tagline']

    def get_queryset(self):
        qs = super().get_queryset()
        if not (self.request.user and self.request.user.is_authenticated and self.request.user.role != 'CUSTOMER'):
            qs = qs.filter(is_active=True)
        return qs

    def get_object(self):
        lookup = self.kwargs.get('pk')
        try:
            uuid.UUID(str(lookup))
            return super().get_object()
        except (ValueError, TypeError):
            pass

        # Search by slug
        slug_candidates = [lookup]
        if lookup in ['hybrid-metal-wood', 'hybrid-metal-wood-construction', 'hybrid-metal-and-wood']:
            slug_candidates.extend(['hybrid-metal-wood', 'hybrid-metal-wood-construction', 'hybrid-metal-and-wood'])
        elif lookup in ['metal-works', 'metal-work']:
            slug_candidates.extend(['metal-works', 'metal-work'])
        elif lookup in ['wood-works', 'wood-work']:
            slug_candidates.extend(['wood-works', 'wood-work'])

        obj = self.get_queryset().filter(slug__in=slug_candidates).first()
        if not obj:
            # Fallback search by title
            clean_lookup = lookup.replace('-', ' ')
            obj = self.get_queryset().filter(title__icontains=clean_lookup).first()

        if not obj:
            raise Http404(f"Service '{lookup}' not found.")
        return obj

    def _parse_json_fields(self, data):
        parsed = data.copy()
        json_fields = ['offerings', 'applications', 'materials', 'benefits', 'process_steps']
        for f in json_fields:
            val = parsed.get(f)
            if isinstance(val, str):
                try:
                    parsed[f] = json.loads(val)
                except Exception:
                    pass
        return parsed

    def create(self, request, *args, **kwargs):
        data = self._parse_json_fields(request.data)
        if 'slug' not in data or not data.get('slug'):
            base_slug = slugify(data.get('title', 'workshop-service')) or 'service'
            slug = base_slug
            counter = 1
            while Service.objects.filter(slug=slug).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1
            data['slug'] = slug

        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        service = serializer.save()

        # Handle gallery images uploaded
        uploaded_gallery = request.FILES.getlist('images') or request.FILES.getlist('gallery')
        for idx, img_file in enumerate(uploaded_gallery):
            ServiceImage.objects.create(
                service=service,
                image=img_file,
                is_primary=(idx == 0 and not service.image),
                order=idx,
                caption=f"{service.title} Gallery {idx + 1}"
            )

        return Response(ServiceSerializer(service).data, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        data = self._parse_json_fields(request.data)

        serializer = self.get_serializer(instance, data=data, partial=partial)
        serializer.is_valid(raise_exception=True)
        service = serializer.save()

        uploaded_gallery = request.FILES.getlist('images') or request.FILES.getlist('gallery')
        start_order = service.gallery_images.count()
        for idx, img_file in enumerate(uploaded_gallery):
            ServiceImage.objects.create(
                service=service,
                image=img_file,
                is_primary=False,
                order=start_order + idx,
                caption=f"{service.title} Photo {start_order + idx + 1}"
            )

        return Response(ServiceSerializer(service).data)

    @action(detail=True, methods=['post'], permission_classes=[IsStaffUser])
    def upload_image(self, request, pk=None):
        """Upload a single image from device to this service's gallery."""
        service = self.get_object()
        img_file = request.FILES.get('image')
        if not img_file:
            return Response({'detail': 'No image file provided.'}, status=status.HTTP_400_BAD_REQUEST)

        caption = request.data.get('caption', '').strip() or f"{service.title} Image {service.gallery_images.count() + 1}"
        description = request.data.get('description', '').strip()
        is_primary = request.data.get('is_primary') in [True, 'true', 'True', '1', 1]

        # Calculate next order
        order_val = request.data.get('order')
        if order_val is not None and str(order_val).isdigit():
            order = int(order_val)
        else:
            order = service.gallery_images.count()

        if is_primary:
            service.gallery_images.update(is_primary=False)

        # If this is the very first image for the service, make it primary by default
        if service.gallery_images.count() == 0:
            is_primary = True

        service_image = ServiceImage.objects.create(
            service=service,
            image=img_file,
            caption=caption,
            description=description,
            order=order,
            is_primary=is_primary
        )

        # Normalize order sequence
        self._normalize_gallery_order(service)

        return Response(ServiceImageSerializer(service_image).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'], permission_classes=[IsStaffUser])
    def replace_image(self, request, pk=None):
        """Replace an existing image file in-place, preserving slot position and metadata."""
        service = self.get_object()
        image_id = request.data.get('image_id')
        new_file = request.FILES.get('image')

        if not image_id:
            return Response({'detail': 'image_id is required.'}, status=status.HTTP_400_BAD_REQUEST)
        if not new_file:
            return Response({'detail': 'No new image file provided.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            target_image = service.gallery_images.get(id=image_id)
        except ServiceImage.DoesNotExist:
            raise Http404("Service image not found.")

        # Clean up old file on disk if exists
        try:
            if target_image.image and os.path.isfile(target_image.image.path):
                os.remove(target_image.image.path)
        except Exception as e:
            pass

        target_image.image = new_file
        if 'caption' in request.data:
            target_image.caption = request.data.get('caption')
        if 'description' in request.data:
            target_image.description = request.data.get('description')
        target_image.save()

        return Response(ServiceImageSerializer(target_image).data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post', 'delete'], permission_classes=[IsStaffUser])
    def delete_image(self, request, pk=None, image_id=None):
        """Delete an image, remove from disk, and re-sequence remaining images contiguously."""
        service = self.get_object()
        target_id = image_id or request.data.get('image_id')
        if not target_id:
            return Response({'detail': 'image_id is required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            img = service.gallery_images.get(id=target_id)
        except ServiceImage.DoesNotExist:
            raise Http404("Service image not found.")

        was_primary = img.is_primary

        # Clean up file on disk
        try:
            if img.image and os.path.isfile(img.image.path):
                os.remove(img.image.path)
        except Exception:
            pass

        img.delete()

        # Re-sequence remaining images contiguously
        self._normalize_gallery_order(service)

        # If primary was deleted, promote the first remaining image
        if was_primary:
            first_remaining = service.gallery_images.first()
            if first_remaining:
                first_remaining.is_primary = True
                first_remaining.save(update_fields=['is_primary'])

        return Response({
            'message': 'Image deleted successfully.',
            'remaining_count': service.gallery_images.count(),
            'images': ServiceImageSerializer(service.gallery_images.all(), many=True).data
        }, status=status.HTTP_200_OK)

    @action(detail=True, methods=['patch', 'post'], permission_classes=[IsStaffUser])
    def update_image(self, request, pk=None):
        """Update caption, description, or primary status of an image."""
        service = self.get_object()
        image_id = request.data.get('image_id')
        if not image_id:
            return Response({'detail': 'image_id is required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            img = service.gallery_images.get(id=image_id)
        except ServiceImage.DoesNotExist:
            raise Http404("Service image not found.")

        if 'caption' in request.data:
            img.caption = request.data.get('caption', '')
        if 'description' in request.data:
            img.description = request.data.get('description', '')
        if 'order' in request.data and str(request.data.get('order')).isdigit():
            img.order = int(request.data.get('order'))
        if 'is_primary' in request.data:
            is_prim = request.data.get('is_primary') in [True, 'true', 'True', '1', 1]
            if is_prim:
                service.gallery_images.update(is_primary=False)
                img.is_primary = True
            else:
                img.is_primary = False

        img.save()
        return Response(ServiceImageSerializer(img).data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], permission_classes=[IsStaffUser])
    def reorder_images(self, request, pk=None):
        """Reorder gallery images based on an array of image IDs."""
        service = self.get_object()
        image_ids = request.data.get('image_ids', [])
        for idx, img_id in enumerate(image_ids):
            service.gallery_images.filter(id=img_id).update(order=idx)
        return Response({
            'message': 'Images reordered successfully.',
            'images': ServiceImageSerializer(service.gallery_images.all(), many=True).data
        })

    def _normalize_gallery_order(self, service):
        """Helper to ensure order sequence is 0, 1, 2, ... without gaps."""
        remaining = list(service.gallery_images.order_by('order', 'created_at'))
        for idx, item in enumerate(remaining):
            if item.order != idx:
                item.order = idx
                item.save(update_fields=['order'])

    @action(detail=True, methods=['post'], permission_classes=[IsStaffUser])
    def upload_images(self, request, pk=None):
        """Legacy batch upload support."""
        service = self.get_object()
        uploaded_files = request.FILES.getlist('images') or request.FILES.getlist('gallery')
        created = []
        start_order = service.gallery_images.count()
        for idx, img_file in enumerate(uploaded_files):
            si = ServiceImage.objects.create(
                service=service,
                image=img_file,
                order=start_order + idx,
                caption=request.data.get('caption', f"{service.title} Showcase {start_order + idx + 1}")
            )
            created.append(ServiceImageSerializer(si).data)
        return Response({'images': created, 'total': service.gallery_images.count()})

    @action(detail=True, methods=['delete'], url_path='images/(?P<image_id>[^/.]+)', permission_classes=[IsStaffUser])
    def legacy_delete_image(self, request, pk=None, image_id=None):
        """URL-path based delete."""
        return self.delete_image(request, pk=pk, image_id=image_id)
