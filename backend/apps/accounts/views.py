from rest_framework import generics, status, views, permissions, viewsets
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from .models import User, UserRole
from .serializers import (
    UserSerializer, RegisterSerializer, CustomTokenObtainPairSerializer,
    ChangePasswordSerializer, UserAdminCreateUpdateSerializer
)
from .permissions import IsManagerOrAdmin, IsStaffUser
from apps.core.throttles import AuthLoginThrottle, AuthRegisterThrottle

from django.db import IntegrityError
from .utils import normalize_phone_number, normalize_email_address

class CustomTokenObtainPairView(TokenObtainPairView):
    permission_classes = [permissions.AllowAny]
    throttle_classes = [AuthLoginThrottle]
    serializer_class = CustomTokenObtainPairSerializer

class RegisterView(generics.CreateAPIView):
    permission_classes = [permissions.AllowAny]
    throttle_classes = [AuthRegisterThrottle]
    serializer_class = RegisterSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            user = serializer.save()
        except IntegrityError as e:
            err_str = str(e).lower()
            if 'phone_number' in err_str:
                return Response(
                    {'phone_number': ['This phone number is already registered. Please use another number.']},
                    status=status.HTTP_400_BAD_REQUEST
                )
            elif 'email' in err_str:
                return Response(
                    {'email': ['This email address is already registered. Please use another email or sign in to your existing account.']},
                    status=status.HTTP_400_BAD_REQUEST
                )
            return Response(
                {'detail': 'A customer with this information already exists.'},
                status=status.HTTP_400_BAD_REQUEST
            )

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

        if 'email' in data:
            new_email = normalize_email_address(data['email'])
            if not new_email:
                return Response({'email': ['Email cannot be blank.']}, status=status.HTTP_400_BAD_REQUEST)
            if User.objects.filter(email__iexact=new_email).exclude(id=user.id).exists():
                return Response(
                    {'email': ['This email address is already registered. Please use another email or sign in to your existing account.']},
                    status=status.HTTP_400_BAD_REQUEST
                )
            user.email = new_email

        if 'phone_number' in data:
            raw_phone = data['phone_number']
            if raw_phone:
                from rest_framework.exceptions import ValidationError as DRFValidationError
                try:
                    normalized_phone = normalize_phone_number(raw_phone)
                except DRFValidationError as e:
                    msg = str(e.detail[0]) if isinstance(e.detail, list) else str(e.detail)
                    return Response({'phone_number': [msg]}, status=status.HTTP_400_BAD_REQUEST)
                if User.objects.filter(phone_number=normalized_phone).exclude(id=user.id).exists():
                    return Response(
                        {'phone_number': ['This phone number is already registered. Please use another number.']},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                user.phone_number = normalized_phone
            else:
                user.phone_number = None

        if 'first_name' in data:
            user.first_name = data['first_name']
        if 'last_name' in data:
            user.last_name = data['last_name']
        user.save()

        if user.is_customer and hasattr(user, 'customer_profile') and user.customer_profile:
            profile = user.customer_profile
            profile_data = data.get('customer_profile')
            if not isinstance(profile_data, dict):
                profile_data = {}

            if 'address' in profile_data:
                profile.address = profile_data['address']
            elif 'address' in data:
                profile.address = data['address']

            if 'city' in profile_data:
                profile.city = profile_data['city']
            elif 'city' in data:
                profile.city = data['city']

            if 'company_name' in profile_data:
                profile.company_name = profile_data['company_name']
            elif 'company_name' in data:
                profile.company_name = data['company_name']

            if 'tin_number' in profile_data:
                profile.tin_number = profile_data['tin_number']
            elif 'tin_number' in data:
                profile.tin_number = data['tin_number']

            if 'notes' in profile_data:
                profile.notes = profile_data['notes']
            elif 'notes' in data:
                profile.notes = data['notes']

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

from rest_framework.decorators import action

class CustomersViewSet(viewsets.ModelViewSet):
    queryset = User.objects.filter(role=UserRole.CUSTOMER).select_related('customer_profile')
    serializer_class = UserSerializer
    permission_classes = [IsStaffUser]
    filterset_fields = ['is_active']
    search_fields = ['email', 'first_name', 'last_name', 'phone_number']

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        data = self.get_serializer(instance).data
        data['quotation_count'] = getattr(instance, 'quotes', User.objects.none()).count()
        data['order_count'] = getattr(instance, 'orders', User.objects.none()).count()
        data['potential_duplicate_name'] = User.objects.filter(
            role=UserRole.CUSTOMER,
            first_name__iexact=instance.first_name,
            last_name__iexact=instance.last_name
        ).exclude(id=instance.id).exists()
        return Response(data)

    @action(detail=True, methods=['post'])
    def toggle_active(self, request, pk=None):
        customer = self.get_object()
        customer.is_active = not customer.is_active
        customer.save()
        return Response({
            'id': str(customer.id),
            'is_active': customer.is_active,
            'message': f"Customer account {'activated' if customer.is_active else 'deactivated'} successfully."
        })

CustomersListViewSet = CustomersViewSet
