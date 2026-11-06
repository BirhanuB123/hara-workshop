from django.db import migrations, models

def consolidate_user_roles(apps, schema_editor):
    User = apps.get_model('accounts', 'User')
    User.objects.exclude(role='CUSTOMER').update(role='ADMIN', is_staff=True)

def reverse_roles(apps, schema_editor):
    pass

class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(consolidate_user_roles, reverse_roles),
        migrations.AlterField(
            model_name='user',
            name='role',
            field=models.CharField(
                choices=[('ADMIN', 'Admin'), ('CUSTOMER', 'Customer')],
                db_index=True,
                default='CUSTOMER',
                max_length=30
            ),
        ),
    ]

