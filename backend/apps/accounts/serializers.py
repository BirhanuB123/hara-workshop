from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import User, CustomerProfile, EmployeeProfile, UserRole
from .utils import normalize_phone_number, normalize_email_address

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
        extra_kwargs = {
            'email': {'validators': []},
            'phone_number': {'validators': []},
        }

    def validate_email(self, value):
        normalized = normalize_email_address(value)
        if not normalized:
            raise serializers.ValidationError("Email is required.")
        if User.objects.filter(email__iexact=normalized).exists():
            raise serializers.ValidationError("This email address is already registered. Please use another email or sign in to your existing account.")
        return normalized

    def validate_phone_number(self, value):
        if not value:
            return None
        normalized = normalize_phone_number(value)
        if User.objects.filter(phone_number=normalized).exists():
            raise serializers.ValidationError("This phone number is already registered. Please use another number.")
        return normalized

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
        # Normalize email to canonical lowercase to guarantee case-insensitive login (HW-QA-003)
        if 'email' in attrs and attrs['email']:
            attrs['email'] = normalize_email_address(attrs['email'])
        elif self.username_field in attrs and attrs[self.username_field]:
            attrs[self.username_field] = str(attrs[self.username_field]).strip().lower()

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
        extra_kwargs = {
            'email': {'validators': []},
            'phone_number': {'validators': []},
        }

    def validate_email(self, value):
        normalized = normalize_email_address(value)
        if not normalized:
            raise serializers.ValidationError("Email is required.")
        qs = User.objects.filter(email__iexact=normalized)
        if self.instance:
            qs = qs.exclude(id=self.instance.id)
        if qs.exists():
            raise serializers.ValidationError("This email address is already registered. Please use another email or sign in to your existing account.")
        return normalized

    def validate_phone_number(self, value):
        if not value:
            return None
        normalized = normalize_phone_number(value)
        qs = User.objects.filter(phone_number=normalized)
        if self.instance:
            qs = qs.exclude(id=self.instance.id)
        if qs.exists():
            raise serializers.ValidationError("This phone number is already registered. Please use another number.")
        return normalized

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

    def update(self, instance, validated_data):
        address = validated_data.pop('address', None)
        city = validated_data.pop('city', None)
        company_name = validated_data.pop('company_name', None)
        tin_number = validated_data.pop('tin_number', None)
        department = validated_data.pop('department', None)
        job_title = validated_data.pop('job_title', None)
        skills = validated_data.pop('skills', None)
        password = validated_data.pop('password', None)

        for attr, val in validated_data.items():
            setattr(instance, attr, val)
        if password:
            instance.set_password(password)
        instance.save()

        if instance.role == UserRole.CUSTOMER:
            profile, _ = CustomerProfile.objects.get_or_create(user=instance)
            if address is not None: profile.address = address
            if city is not None: profile.city = city
            if company_name is not None: profile.company_name = company_name
            if tin_number is not None: profile.tin_number = tin_number
            profile.save()
        else:
            profile, _ = EmployeeProfile.objects.get_or_create(user=instance)
            if department is not None: profile.department = department
            if job_title is not None: profile.job_title = job_title
            if skills is not None: profile.skills = skills
            profile.save()

        return instance
