from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import MaterialViewSet, InventoryTransactionViewSet

router = DefaultRouter()
router.register(r'transactions', InventoryTransactionViewSet, basename='inventory-transactions')
router.register(r'', MaterialViewSet, basename='materials')

urlpatterns = [
    path('', include(router.urls)),
]
