import os

apps = ['core', 'accounts', 'products', 'services', 'projects', 'quotations', 'orders', 'production', 'inventory', 'suppliers', 'payments', 'invoices', 'expenses', 'messaging', 'notifications', 'reports']
for app in apps:
    mig_dir = f'backend/apps/{app}/migrations'
    os.makedirs(mig_dir, exist_ok=True)
    with open(f'{mig_dir}/__init__.py', 'w') as f:
        pass
print('Migration directories created.')
