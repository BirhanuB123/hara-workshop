import os
import django
from collections import Counter

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.accounts.models import User

users = list(User.objects.all().values('id', 'email', 'phone_number', 'first_name', 'last_name', 'role'))
print(f"Total users in DB: {len(users)}")
for u in users:
    print(f"  {u['id']} | {u['email']} | {u['phone_number']} | {u['first_name']} {u['last_name']} | {u['role']}")

emails = [u['email'].strip().lower() for u in users if u['email']]
email_counts = Counter(emails)
dup_emails = {k: v for k, v in email_counts.items() if v > 1}
print(f"\nDuplicate emails (case-insensitive): {dup_emails}")

phones = [u['phone_number'].strip() for u in users if u['phone_number']]
phone_counts = Counter(phones)
dup_phones = {k: v for k, v in phone_counts.items() if v > 1}
print(f"Duplicate raw phones: {dup_phones}")
