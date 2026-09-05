import os

def w(path, content):
    full_path = os.path.normpath(path)
    os.makedirs(os.path.dirname(os.path.abspath(full_path)), exist_ok=True)
    with open(full_path, 'w', encoding='utf-8') as f:
        f.write(content.strip() + '\n')

apps = [
    ('accounts', 'Accounts'),
    ('products', 'Products'),
    ('services', 'Services'),
    ('projects', 'Projects'),
    ('quotations', 'Quotations'),
    ('orders', 'Orders'),
    ('production', 'Production'),
    ('inventory', 'Inventory'),
    ('suppliers', 'Suppliers'),
    ('payments', 'Payments'),
    ('invoices', 'Invoices'),
    ('expenses', 'Expenses'),
    ('messaging', 'Messaging'),
    ('notifications', 'Notifications'),
    ('reports', 'Reports'),
]

for app_name, app_title in apps:
    base = f'backend/apps/{app_name}'
    w(f'{base}/__init__.py', '')
    w(f'{base}/apps.py', f'''from django.apps import AppConfig

class {app_title}Config(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.{app_name}'
''')
    w(f'{base}/models.py', '''from django.db import models
from apps.core.models import TimeStampedModel
''')
    w(f'{base}/serializers.py', '''from rest_framework import serializers
''')
    w(f'{base}/views.py', '''from rest_framework import viewsets, permissions
''')
    w(f'{base}/urls.py', '''from django.urls import path, include
from rest_framework.routers import DefaultRouter

router = DefaultRouter()
urlpatterns = [
    path('', include(router.urls)),
]
''')
    w(f'{base}/admin.py', '''from django.contrib import admin
''')

print('All 15 apps scaffolded.')
