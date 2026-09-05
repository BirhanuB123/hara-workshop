from rest_framework import serializers
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
