import os

with open('backend/apps/__init__.py', 'w') as f:
    pass

with open('backend/manage.py', 'w', encoding='utf-8') as f:
    f.write('''#!/usr/bin/env python
import os
import sys

def main():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    if base_dir not in sys.path:
        sys.path.insert(0, base_dir)
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError('Could not import Django') from exc
    execute_from_command_line(sys.argv)

if __name__ == '__main__':
    main()
''')
print('manage.py updated with sys.path.')
