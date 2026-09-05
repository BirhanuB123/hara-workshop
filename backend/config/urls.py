from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('apps.accounts.urls')),
    path('api/core/', include('apps.core.urls')),
    path('api/settings/', include('apps.core.urls')),
    path('api/audit-logs/', include('apps.core.urls')),
    path('api/users/', include('apps.accounts.urls')),
    path('api/products/', include('apps.products.urls')),
    path('api/services/', include('apps.services.urls')),
    path('api/projects/', include('apps.projects.urls')),
    path('api/quotes/', include('apps.quotations.urls')),
    path('api/quotations/', include('apps.quotations.urls')),
    path('api/orders/', include('apps.orders.urls')),
    path('api/production/', include('apps.production.urls')),
    path('api/inventory/', include('apps.inventory.urls')),
    path('api/suppliers/', include('apps.suppliers.urls')),
    path('api/payments/', include('apps.payments.urls')),
    path('api/invoices/', include('apps.invoices.urls')),
    path('api/expenses/', include('apps.expenses.urls')),
    path('api/messaging/', include('apps.messaging.urls')),
    path('api/notifications/', include('apps.notifications.urls')),
    path('api/reports/', include('apps.reports.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
