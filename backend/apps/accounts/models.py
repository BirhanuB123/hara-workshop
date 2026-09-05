from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager
from django.db import models
from apps.core.models import TimeStampedModel

class UserRole(models.TextChoices):
    SUPER_ADMIN = 'SUPER_ADMIN', 'Super Admin'
    MANAGER = 'MANAGER', 'Manager'
    SALES = 'SALES', 'Sales'
    PRODUCTION = 'PRODUCTION', 'Production Staff'
    ACCOUNTANT = 'ACCOUNTANT', 'Accountant'
    CUSTOMER = 'CUSTOMER', 'Customer'

class CustomUserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('The Email field must be set')
        email = self.normalize_email(email).lower()
        extra_fields.setdefault('role', UserRole.CUSTOMER)
        user = self.model(email=email, **extra_fields)
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', UserRole.SUPER_ADMIN)

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')

        return self.create_user(email, password, **extra_fields)

class User(AbstractBaseUser, PermissionsMixin, TimeStampedModel):
    email = models.EmailField(unique=True, db_index=True)
    first_name = models.CharField(max_length=150)
    last_name = models.CharField(max_length=150)
    phone_number = models.CharField(max_length=30, blank=True, null=True)
    role = models.CharField(max_length=30, choices=UserRole.choices, default=UserRole.CUSTOMER, db_index=True)
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)

    objects = CustomUserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name']

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.get_full_name()} ({self.email}) - {self.role}'

    def get_full_name(self):
        full = f'{self.first_name} {self.last_name}'.strip()
        return full if full else self.email

    def get_short_name(self):
        return self.first_name if self.first_name else self.email

    @property
    def is_super_admin(self):
        return self.role == UserRole.SUPER_ADMIN

    @property
    def is_manager(self):
        return self.role in [UserRole.SUPER_ADMIN, UserRole.MANAGER]

    @property
    def is_sales(self):
        return self.role in [UserRole.SUPER_ADMIN, UserRole.MANAGER, UserRole.SALES]

    @property
    def is_production(self):
        return self.role in [UserRole.SUPER_ADMIN, UserRole.MANAGER, UserRole.PRODUCTION]

    @property
    def is_accountant(self):
        return self.role in [UserRole.SUPER_ADMIN, UserRole.MANAGER, UserRole.ACCOUNTANT]

    @property
    def is_customer(self):
        return self.role == UserRole.CUSTOMER

class CustomerProfile(TimeStampedModel):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='customer_profile')
    address = models.CharField(max_length=255, blank=True, null=True)
    city = models.CharField(max_length=100, default='Addis Ababa')
    company_name = models.CharField(max_length=200, blank=True, null=True)
    tin_number = models.CharField(max_length=50, blank=True, null=True)
    notes = models.TextField(blank=True, null=True)

    def __str__(self):
        return f'Customer: {self.user.get_full_name()}'

class EmployeeProfile(TimeStampedModel):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='employee_profile')
    department = models.CharField(max_length=100, blank=True, null=True)
    job_title = models.CharField(max_length=100, blank=True, null=True)
    hire_date = models.DateField(blank=True, null=True)
    emergency_contact = models.CharField(max_length=100, blank=True, null=True)
    skills = models.TextField(blank=True, null=True)

    def __str__(self):
        return f'Employee: {self.user.get_full_name()} ({self.job_title})'
