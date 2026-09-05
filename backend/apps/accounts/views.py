from rest_framework import generics, status, views, permissions, viewsets
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
