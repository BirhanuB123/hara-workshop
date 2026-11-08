from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse

from apps.accounts.urls import customer_router
from apps.core.views import ContactInquiryView
from apps.quotations.views import TelegramWebhookView

def health_check(request):
    return JsonResponse({
        'status': 'healthy',
        'service': 'hara-workshop-backend',
        'version': '1.0.0'
    })

urlpatterns = [
    path('', health_check, name='health-check-root'),
    path('health/', health_check, name='health-check'),
    path('api/health/', health_check, name='health-check-api'),

    path('admin/', admin.site.urls),

    path('api/auth/', include('apps.accounts.urls')),
    path('api/core/', include('apps.core.urls')),
    path('api/contact/', ContactInquiryView.as_view(), name='contact-inquiry-direct'),
    path('api/telegram/webhook/', TelegramWebhookView.as_view(), name='telegram-webhook-direct'),
    path('api/settings/', include('apps.core.urls')),
    path('api/audit-logs/', include('apps.core.urls')),
    path('api/users/', include('apps.accounts.urls')),
    path('api/customers/', include(customer_router.urls)),
    path('api/products/', include('apps.products.urls')),
    path('api/services/', include('apps.services.urls')),
    path('api/projects/', include('apps.projects.urls')),
    path('api/quotations/', include('apps.quotations.urls')),
    path('api/orders/', include('apps.orders.urls')),
    path('api/production/', include('apps.production.urls')),
    path('api/inventory/', include('apps.inventory.urls')),
    path('api/suppliers/', include('apps.suppliers.urls')),
    path('api/messaging/', include('apps.messaging.urls')),
    path('api/notifications/', include('apps.notifications.urls')),
    path('api/reports/', include('apps.reports.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
