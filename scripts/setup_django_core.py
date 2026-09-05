import os

def w(path, content):
    full_path = os.path.normpath(path)
    os.makedirs(os.path.dirname(os.path.abspath(full_path)), exist_ok=True)
    with open(full_path, 'w', encoding='utf-8') as f:
        f.write(content.strip() + '\n')
    print(f'Created: {full_path}')

# 1. manage.py
w('backend/manage.py', '''#!/usr/bin/env python
import os
import sys

def main():
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
             Couldnt import Django. Are you sure its installed and 
             available on your PYTHONPATH environment variable? Did you 
             forget to activate a virtual environment?
        ) from exc
    execute_from_command_line(sys.argv)

if __name__ == '__main__':
    main()
''')

# 2. config/__init__.py
w('backend/config/__init__.py', '''from .celery import app as celery_app

__all__ = ('celery_app',)
''')

# 3. config/celery.py
w('backend/config/celery.py', '''import os
from celery import Celery

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

app = Celery('hara_workshop')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()

@app.task(bind=True, ignore_result=True)
def debug_task(self):
    print(f'Request: {self.request!r}')
''')

# 4. config/wsgi.py
w('backend/config/wsgi.py', '''import os
from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
application = get_wsgi_application()
''')

# 5. config/settings.py
w('backend/config/settings.py', '''import os
from pathlib import Path
from datetime import timedelta
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / '.env')

SECRET_KEY = os.environ.get('SECRET_KEY', 'hara-workshop-dev-secret-key-2026-secure')
DEBUG = os.environ.get('DEBUG', 'True').lower() in ('true', '1', 'yes')

ALLOWED_HOSTS = [h.strip() for h in os.environ.get('ALLOWED_HOSTS', 'localhost,127.0.0.1,0.0.0.0,testserver').split(',') if h.strip()]

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    'rest_framework',
    'rest_framework_simplejwt',
    'rest_framework_simplejwt.token_blacklist',
    'corsheaders',
    'django_filters',

    'apps.core',
    'apps.accounts',
    'apps.products',
    'apps.services',
    'apps.projects',
    'apps.quotations',
    'apps.orders',
    'apps.production',
    'apps.inventory',
    'apps.suppliers',
    'apps.payments',
    'apps.invoices',
    'apps.expenses',
    'apps.messaging',
    'apps.notifications',
    'apps.reports',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'apps.core.middleware.AuditLogMiddleware',
]

ROOT_URLCONF = 'config.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

database_url = os.environ.get('DATABASE_URL', '')
if database_url and database_url.startswith('postgresql'):
    import dj_database_url
    DATABASES['default'] = dj_database_url.config(
        default=database_url,
        conn_max_age=600,
        ssl_require=False
    )

AUTH_USER_MODEL = 'accounts.User'

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator', 'OPTIONS': {'min_length': 8}},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'Africa/Addis_Ababa'
USE_I18N = True
USE_TZ = True

STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_DIRS = [d for d in [BASE_DIR / 'static'] if d.exists()]

MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticatedOrReadOnly',
    ),
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
    'DEFAULT_FILTER_BACKENDS': (
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ),
}

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=int(os.environ.get('JWT_ACCESS_TOKEN_LIFETIME_MINUTES', 60))),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=int(os.environ.get('JWT_REFRESH_TOKEN_LIFETIME_DAYS', 7))),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'UPDATE_LAST_LOGIN': True,
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': os.environ.get('JWT_SECRET', SECRET_KEY),
    'AUTH_HEADER_TYPES': ('Bearer',),
    'USER_ID_FIELD': 'id',
    'USER_ID_CLAIM': 'user_id',
}

CORS_ALLOWED_ORIGINS = [
    origin.strip() for origin in os.environ.get(
        'CORS_ALLOWED_ORIGINS',
        'http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173'
    ).split(',') if origin.strip()
]
CORS_ALLOW_CREDENTIALS = True

CELERY_BROKER_URL = os.environ.get('CELERY_BROKER_URL', 'redis://localhost:6379/0')
CELERY_RESULT_BACKEND = os.environ.get('CELERY_RESULT_BACKEND', 'redis://localhost:6379/0')
CELERY_ACCEPT_CONTENT = ['json']
CELERY_TASK_SERIALIZER = 'json'
CELERY_RESULT_SERIALIZER = 'json'
CELERY_TIMEZONE = TIME_ZONE
CELERY_TASK_ALWAYS_EAGER = os.environ.get('CELERY_TASK_ALWAYS_EAGER', 'True').lower() in ('true', '1')

WORKSHOP_NAME = os.environ.get('WORKSHOP_NAME', 'Hara Workshop')
WORKSHOP_PHONE = os.environ.get('WORKSHOP_PHONE', '+251926629999')
WORKSHOP_EMAIL = os.environ.get('WORKSHOP_EMAIL', 'info@haraworkshop.com')
WORKSHOP_LOCATION = os.environ.get('WORKSHOP_LOCATION', 'Addis Ababa, Bole Arabsa, Water Tanker')
DEFAULT_CURRENCY = 'ETB'
''')

# 6. config/urls.py
w('backend/config/urls.py', '''from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('apps.accounts.urls')),
    path('api/core/', include('apps.core.urls')),
    path('api/products/', include('apps.products.urls')),
    path('api/services/', include('apps.services.urls')),
    path('api/projects/', include('apps.projects.urls')),
    path('api/quotes/', include('apps.quotations.urls')),
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
''')

# 7. Core app
w('backend/apps/core/__init__.py', '')
w('backend/apps/core/apps.py', '''from django.apps import AppConfig

class CoreConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.core'
''')

w('backend/apps/core/models.py', '''import uuid
from django.db import models
from django.conf import settings

class TimeStampedModel(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True

class WorkshopSettings(TimeStampedModel):
    name = models.CharField(max_length=255, default='Hara Workshop')
    tagline = models.CharField(max_length=255, default='Metal and Wood Solution')
    phone = models.CharField(max_length=50, default='+251926629999')
    email = models.EmailField(default='info@haraworkshop.com')
    telegram = models.CharField(max_length=100, default='@haraworkshop')
    address = models.CharField(max_length=255, default='Addis Ababa, Bole Arabsa, Water Tanker')
    address_amharic = models.CharField(max_length=255, default='አዲስ አበባ ቦሌ አራብሳ ውሃ ታንከር')
    working_hours = models.CharField(max_length=255, default='Mon - Sat: 8:00 AM - 6:00 PM')
    currency = models.CharField(max_length=10, default='ETB')
    vat_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=15.00)
    quote_validity_days = models.PositiveIntegerField(default=15)
    logo = models.ImageField(upload_to='branding/', blank=True, null=True)

    class Meta:
        verbose_name_plural = 'Workshop Settings'

    def __str__(self):
        return f'{self.name} Settings'

class AuditLog(TimeStampedModel):
    ACTION_CHOICES = (
        ('LOGIN', 'User Login'),
        ('LOGOUT', 'User Logout'),
        ('CREATE', 'Created Resource'),
        ('UPDATE', 'Updated Resource'),
        ('DELETE', 'Deleted Resource'),
        ('STATUS_CHANGE', 'Status Changed'),
        ('PRICE_PROPOSAL', 'Price Proposed'),
        ('QUOTE_ACCEPT', 'Quote Accepted'),
        ('ORDER_CONVERT', 'Order Converted'),
        ('PAYMENT_RECORD', 'Payment Recorded'),
        ('STAGE_ADVANCE', 'Production Stage Advanced'),
        ('STOCK_TRANSACTION', 'Inventory Transaction'),
    )

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='audit_logs')
    action = models.CharField(max_length=50, choices=ACTION_CHOICES)
    resource = models.CharField(max_length=100)
    resource_id = models.CharField(max_length=100, blank=True, null=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    metadata = models.JSONField(default=dict, blank=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.action} on {self.resource} by {self.user}'
''')

w('backend/apps/core/middleware.py', '''from django.utils.deprecation import MiddlewareMixin
from .models import AuditLog

class AuditLogMiddleware(MiddlewareMixin):
    def process_response(self, request, response):
        return response
''')

w('backend/apps/core/serializers.py', '''from rest_framework import serializers
from .models import WorkshopSettings, AuditLog

class WorkshopSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = WorkshopSettings
        fields = '__all__'

class AuditLogSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)

    class Meta:
        model = AuditLog
        fields = '__all__'
''')

w('backend/apps/core/views.py', '''from rest_framework import viewsets, permissions, views, status
from rest_framework.response import Response
from .models import WorkshopSettings, AuditLog
from .serializers import WorkshopSettingsSerializer, AuditLogSerializer

class PublicSettingsView(views.APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        settings_obj = WorkshopSettings.objects.first()
        if not settings_obj:
            settings_obj = WorkshopSettings.objects.create()
        return Response(WorkshopSettingsSerializer(settings_obj).data)

class AdminSettingsViewSet(viewsets.ModelViewSet):
    queryset = WorkshopSettings.objects.all()
    serializer_class = WorkshopSettingsSerializer
    permission_classes = [permissions.IsAdminUser]

class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = AuditLog.objects.all()
    serializer_class = AuditLogSerializer
    permission_classes = [permissions.IsAdminUser]
    filterset_fields = ['action', 'resource', 'user']
    search_fields = ['resource', 'resource_id', 'metadata']
''')

w('backend/apps/core/urls.py', '''from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PublicSettingsView, AdminSettingsViewSet, AuditLogViewSet

router = DefaultRouter()
router.register(r'settings', AdminSettingsViewSet, basename='admin-settings')
router.register(r'audit-logs', AuditLogViewSet, basename='audit-logs')

urlpatterns = [
    path('public-settings/', PublicSettingsView.as_view(), name='public-settings'),
    path('', include(router.urls)),
]
''')

print('Django core created successfully.')
