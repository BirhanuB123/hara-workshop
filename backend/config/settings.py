import os
from pathlib import Path
from datetime import timedelta
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / '.env')
if (BASE_DIR.parent / '.env').exists():
    load_dotenv(BASE_DIR.parent / '.env')

SECRET_KEY = os.environ.get('SECRET_KEY', 'hara-workshop-dev-secret-key-2026-secure')
DEBUG = os.environ.get('DEBUG', 'True').lower() in ('true', '1', 'yes')

ALLOWED_HOSTS = [h.strip() for h in os.environ.get('ALLOWED_HOSTS', 'localhost,127.0.0.1,0.0.0.0').split(',') if h.strip()]
if 'testserver' not in ALLOWED_HOSTS:
    ALLOWED_HOSTS.append('testserver')
render_host = os.environ.get('RENDER_EXTERNAL_HOSTNAME')
if render_host and render_host not in ALLOWED_HOSTS:
    ALLOWED_HOSTS.append(render_host)

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
    'apps.messaging',
    'apps.notifications',
    'apps.reports',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
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

STORAGES = {
    "default": {
        "BACKEND": "django.core.files.storage.FileSystemStorage",
    },
    "staticfiles": {
        "BACKEND": "whitenoise.storage.CompressedStaticFilesStorage",
    },
}

MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

USE_X_FORWARDED_HOST = True
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
if not DEBUG:
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.AllowAny',
    ),
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 100,
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

# CSRF Trusted Origins (needed for Django 4.0+ in production with HTTPS)
csrf_origins_env = os.environ.get('CSRF_TRUSTED_ORIGINS', '')
if csrf_origins_env:
    CSRF_TRUSTED_ORIGINS = [o.strip() for o in csrf_origins_env.split(',') if o.strip()]
elif render_host:
    CSRF_TRUSTED_ORIGINS = [f'https://{render_host}']
else:
    CSRF_TRUSTED_ORIGINS = []

CELERY_BROKER_URL = os.environ.get('CELERY_BROKER_URL', 'redis://localhost:6379/0')
CELERY_RESULT_BACKEND = os.environ.get('CELERY_RESULT_BACKEND', 'redis://localhost:6379/0')
CELERY_ACCEPT_CONTENT = ['json']
CELERY_TASK_SERIALIZER = 'json'
CELERY_RESULT_SERIALIZER = 'json'
CELERY_TIMEZONE = TIME_ZONE
CELERY_TASK_ALWAYS_EAGER = os.environ.get('CELERY_TASK_ALWAYS_EAGER', 'False').lower() in ('true', '1')

# Telegram Bot Alerts Configuration
TELEGRAM_BOT_TOKEN = os.environ.get('TELEGRAM_BOT_TOKEN', '').strip()
TELEGRAM_GROUP_CHAT_ID = os.environ.get('TELEGRAM_GROUP_CHAT_ID', '-5374750855').strip()
TELEGRAM_ADMIN_CHAT_ID = os.environ.get('TELEGRAM_ADMIN_CHAT_ID', '1774429006').strip()
TELEGRAM_CHAT_ID = os.environ.get('TELEGRAM_CHAT_ID', '1774429006').strip()
TELEGRAM_BOT_USERNAME = os.environ.get('TELEGRAM_BOT_USERNAME', 'HaraWorkshopOrdersBot').strip().lstrip('@')
FRONTEND_URL = os.environ.get('FRONTEND_URL', 'http://localhost:5173')

WORKSHOP_NAME = os.environ.get('WORKSHOP_NAME', 'Hara Workshop')
WORKSHOP_PHONE = os.environ.get('WORKSHOP_PHONE', '+251926629999')
WORKSHOP_EMAIL = os.environ.get('WORKSHOP_EMAIL', 'info@haraworkshop.com')
WORKSHOP_LOCATION = os.environ.get('WORKSHOP_LOCATION', 'Addis Ababa, Bole Arabsa, Water Tanker')
DEFAULT_CURRENCY = 'ETB'
