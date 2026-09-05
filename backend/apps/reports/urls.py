from django.urls import path
from .views import DashboardStatsView

urlpatterns = [
    path('dashboard-stats/', DashboardStatsView.as_view(), name='dashboard-stats'),
    path('dashboard_stats/', DashboardStatsView.as_view(), name='dashboard_stats'),
]
