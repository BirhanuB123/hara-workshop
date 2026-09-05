from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ProductionJobViewSet

router = DefaultRouter()
router.register(r'', ProductionJobViewSet, basename='production')

urlpatterns = [
    path('', include(router.urls)),
]
