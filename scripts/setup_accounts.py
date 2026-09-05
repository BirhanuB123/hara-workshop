import os

def w(path, content):
    full_path = os.path.normpath(path)
    os.makedirs(os.path.dirname(os.path.abspath(full_path)), exist_ok=True)
    with open(full_path, 'w', encoding='utf-8') as f:
        f.write(content.strip() + '\n')
    print(f'Created: {full_path}')

# 1. models.py
w('backend/apps/accounts/models.py', '''from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager
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
''')

# 2. permissions.py
w('backend/apps/accounts/permissions.py', '''from rest_framework import permissions
from .models import UserRole

class IsSuperAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == UserRole.SUPER_ADMIN)

class IsManagerOrAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role in [UserRole.SUPER_ADMIN, UserRole.MANAGER])

class IsSalesOrManager(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role in [UserRole.SUPER_ADMIN, UserRole.MANAGER, UserRole.SALES])

class IsProductionStaff(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role in [UserRole.SUPER_ADMIN, UserRole.MANAGER, UserRole.PRODUCTION])

class IsAccountant(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role in [UserRole.SUPER_ADMIN, UserRole.MANAGER, UserRole.ACCOUNTANT])

class IsStaffUser(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role != UserRole.CUSTOMER)

class IsOwnerOrStaff(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.role != UserRole.CUSTOMER:
            return True
        # Check customer ownership
        if hasattr(obj, 'customer'):
            return obj.customer == request.user
        if hasattr(obj, 'user'):
            return obj.user == request.user
        return False
''')

# 3. serializers.py
w('backend/apps/accounts/serializers.py', '''from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import User, CustomerProfile, EmployeeProfile, UserRole

class CustomerProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomerProfile
        fields = ['id', 'address', 'city', 'company_name', 'tin_number', 'notes']

class EmployeeProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmployeeProfile
        fields = ['id', 'department', 'job_title', 'hire_date', 'emergency_contact', 'skills']

class UserSerializer(serializers.ModelSerializer):
    customer_profile = CustomerProfileSerializer(read_only=True)
    employee_profile = EmployeeProfileSerializer(read_only=True)
    full_name = serializers.CharField(source='get_full_name', read_only=True)

    class Meta:
        model = User
        fields = [
            'id', 'email', 'first_name', 'last_name', 'full_name',
            'phone_number', 'role', 'avatar', 'is_active', 'is_staff',
            'customer_profile', 'employee_profile', 'created_at'
        ]
        read_only_fields = ['id', 'role', 'is_staff', 'created_at']

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    address = serializers.CharField(required=False, allow_blank=True)
    city = serializers.CharField(required=False, default='Addis Ababa')
    company_name = serializers.CharField(required=False, allow_blank=True)
    tin_number = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = User
        fields = [
            'email', 'password', 'first_name', 'last_name', 'phone_number',
            'address', 'city', 'company_name', 'tin_number'
        ]

    def create(self, validated_data):
        address = validated_data.pop('address', '')
        city = validated_data.pop('city', 'Addis Ababa')
        company_name = validated_data.pop('company_name', '')
        tin_number = validated_data.pop('tin_number', '')
        password = validated_data.pop('password')

        user = User.objects.create_user(
            role=UserRole.CUSTOMER,
            **validated_data
        )
        user.set_password(password)
        user.save()

        CustomerProfile.objects.create(
            user=user,
            address=address,
            city=city,
            company_name=company_name,
            tin_number=tin_number
        )
        return user

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        data['user'] = UserSerializer(self.user).data
        return data

class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, min_length=8)

class UserAdminCreateUpdateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False, min_length=8)
    address = serializers.CharField(required=False, allow_blank=True)
    city = serializers.CharField(required=False, default='Addis Ababa')
    company_name = serializers.CharField(required=False, allow_blank=True)
    tin_number = serializers.CharField(required=False, allow_blank=True)
    department = serializers.CharField(required=False, allow_blank=True)
    job_title = serializers.CharField(required=False, allow_blank=True)
    skills = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = User
        fields = [
            'id', 'email', 'first_name', 'last_name', 'phone_number', 'role',
            'password', 'is_active', 'address', 'city', 'company_name', 'tin_number',
            'department', 'job_title', 'skills'
        ]

    def create(self, validated_data):
        address = validated_data.pop('address', '')
        city = validated_data.pop('city', 'Addis Ababa')
        company_name = validated_data.pop('company_name', '')
        tin_number = validated_data.pop('tin_number', '')
        department = validated_data.pop('department', '')
        job_title = validated_data.pop('job_title', '')
        skills = validated_data.pop('skills', '')
        password = validated_data.pop('password', 'Hara@123456')

        role = validated_data.get('role', UserRole.CUSTOMER)
        is_staff = (role != UserRole.CUSTOMER)
        validated_data['is_staff'] = is_staff

        user = User.objects.create_user(**validated_data)
        user.set_password(password)
        user.save()

        if role == UserRole.CUSTOMER:
            CustomerProfile.objects.create(
                user=user,
                address=address,
                city=city,
                company_name=company_name,
                tin_number=tin_number
            )
        else:
            EmployeeProfile.objects.create(
                user=user,
                department=department,
                job_title=job_title,
                skills=skills
            )
        return user
''')

# 4. views.py
w('backend/apps/accounts/views.py', '''from rest_framework import generics, status, views, permissions, viewsets
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from .models import User, CustomerProfile, EmployeeProfile, UserRole
from .serializers import (
    UserSerializer, RegisterSerializer, CustomTokenObtainPairSerializer,
    ChangePasswordSerializer, UserAdminCreateUpdateSerializer,
    CustomerProfileSerializer, EmployeeProfileSerializer
)
from .permissions import IsSuperAdmin, IsManagerOrAdmin, IsStaffUser

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

class RegisterView(generics.CreateAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = RegisterSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        return Response({
            'user': UserSerializer(user).data,
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            },
            'message': 'Account created successfully'
        }, status=status.HTTP_201_CREATED)

class MeView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)

    def patch(self, request):
        user = request.user
        data = request.data
        if 'first_name' in data:
            user.first_name = data['first_name']
        if 'last_name' in data:
            user.last_name = data['last_name']
        if 'phone_number' in data:
            user.phone_number = data['phone_number']
        user.save()

        if user.is_customer and hasattr(user, 'customer_profile'):
            profile = user.customer_profile
            if 'address' in data:
                profile.address = data['address']
            if 'city' in data:
                profile.city = data['city']
            if 'company_name' in data:
                profile.company_name = data['company_name']
            if 'tin_number' in data:
                profile.tin_number = data['tin_number']
            profile.save()

        return Response(UserSerializer(user).data)

class ChangePasswordView(generics.UpdateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ChangePasswordSerializer

    def update(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = request.user
        if not user.check_password(serializer.validated_data['old_password']):
            return Response({'old_password': ['Wrong password.']}, status=status.HTTP_400_BAD_REQUEST)
        user.set_password(serializer.validated_data['new_password'])
        user.save()
        return Response({'message': 'Password updated successfully'}, status=status.HTTP_200_OK)

class LogoutView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data.get('refresh')
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
            return Response({'message': 'Logged out successfully'}, status=status.HTTP_200_OK)
        except Exception:
            return Response({'message': 'Logged out successfully'}, status=status.HTTP_200_OK)

class UserAdminViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all().select_related('customer_profile', 'employee_profile')
    serializer_class = UserAdminCreateUpdateSerializer
    permission_classes = [IsManagerOrAdmin]
    filterset_fields = ['role', 'is_active']
    search_fields = ['email', 'first_name', 'last_name', 'phone_number']
    ordering_fields = ['created_at', 'email', 'role']

    def get_serializer_class(self):
        if self.action in ['list', 'retrieve']:
            return UserSerializer
        return UserAdminCreateUpdateSerializer

class CustomersListViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = User.objects.filter(role=UserRole.CUSTOMER).select_related('customer_profile')
    serializer_class = UserSerializer
    permission_classes = [IsStaffUser]
    search_fields = ['email', 'first_name', 'last_name', 'phone_number']

class EmployeesListViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = User.objects.exclude(role=UserRole.CUSTOMER).select_related('employee_profile')
    serializer_class = UserSerializer
    permission_classes = [IsManagerOrAdmin]
    search_fields = ['email', 'first_name', 'last_name', 'phone_number', 'role']
''')

# 5. urls.py
w('backend/apps/accounts/urls.py', '''from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    RegisterView, CustomTokenObtainPairView, MeView, ChangePasswordView,
    LogoutView, UserAdminViewSet, CustomersListViewSet, EmployeesListViewSet
)

router = DefaultRouter()
router.register(r'users', UserAdminViewSet, basename='admin-users')
router.register(r'customers', CustomersListViewSet, basename='admin-customers')
router.register(r'employees', EmployeesListViewSet, basename='admin-employees')

urlpatterns = [
    path('register/', RegisterView.as_view(), name='auth-register'),
    path('login/', CustomTokenObtainPairView.as_view(), name='auth-login'),
    path('refresh/', TokenRefreshView.as_view(), name='auth-refresh'),
    path('logout/', LogoutView.as_view(), name='auth-logout'),
    path('me/', MeView.as_view(), name='auth-me'),
    path('change-password/', ChangePasswordView.as_view(), name='auth-change-password'),
    path('', include(router.urls)),
]
''')

# 6. admin.py
w('backend/apps/accounts/admin.py', '''from django.contrib import admin
from .models import User, CustomerProfile, EmployeeProfile

@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ('email', 'first_name', 'last_name', 'role', 'is_active', 'is_staff')
    list_filter = ('role', 'is_active', 'is_staff')
    search_fields = ('email', 'first_name', 'last_name', 'phone_number')

@admin.register(CustomerProfile)
class CustomerProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'city', 'company_name', 'tin_number')
    search_fields = ('user__email', 'user__first_name', 'company_name')

@admin.register(EmployeeProfile)
class EmployeeProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'department', 'job_title', 'hire_date')
    search_fields = ('user__email', 'department', 'job_title')
''')

print('Accounts app fully written.')
