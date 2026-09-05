from django.contrib import admin
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
