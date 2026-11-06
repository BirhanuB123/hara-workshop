import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.accounts.models import User
from apps.accounts.utils import normalize_phone_number

print("Starting phone normalization and duplicate resolution...")

# 1. Resolve test@integracnc.com
test_cnc = User.objects.filter(email='test@integracnc.com').first()
if test_cnc and test_cnc.phone_number == '+251922334455':
    test_cnc.phone_number = '+251922334456'
    test_cnc.save(update_fields=['phone_number'])
    print("Resolved test@integracnc.com phone -> +251922334456")

# 2. Resolve customer_a@test.com
cust_a = User.objects.filter(email='customer_a@test.com').first()
if cust_a and cust_a.phone_number == '+251911000001':
    cust_a.phone_number = '+251911000003'
    cust_a.save(update_fields=['phone_number'])
    print("Resolved customer_a@test.com phone -> +251911000003")

# 3. Clean empty strings and normalize all phones
users = User.objects.all()
for u in users:
    if u.phone_number:
        p = u.phone_number.strip()
        if not p:
            u.phone_number = None
            u.save(update_fields=['phone_number'])
        else:
            try:
                norm = normalize_phone_number(p)
                if norm != u.phone_number:
                    u.phone_number = norm
                    u.save(update_fields=['phone_number'])
                    print(f"Normalized {u.email}: {p} -> {norm}")
            except Exception as e:
                print(f"Could not normalize {u.email} ({p}): {e}")

print("Verification of users:")
for u in User.objects.all().order_by('email'):
    print(f"  {u.email} | {u.phone_number} | {u.role}")

print("Done!")
