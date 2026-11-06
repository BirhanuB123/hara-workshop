from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import QuoteViewSet, TelegramWebhookView

router = DefaultRouter()
router.register(r'', QuoteViewSet, basename='quotes')

urlpatterns = [
    path('telegram-webhook/', TelegramWebhookView.as_view(), name='quotations-telegram-webhook'),
    path('', include(router.urls)),
]

