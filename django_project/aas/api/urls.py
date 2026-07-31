from django.urls import path
from . import views

urlpatterns = [
    path('health', views.health, name='health'),
    path('auth/login', views.login, name='login'),
    path('auth/register', views.register, name='register'),
    path('auth/me', views.me, name='me'),
    path('auth/logout', views.logout_view, name='logout'),
    path('auth/forgot-password', views.forgot_password, name='forgot-password'),
    path('auth/biometric', views.biometric, name='biometric'),
    path('dashboard', views.dashboard, name='dashboard'),
    path('vehicles', views.vehicles, name='vehicles'),
    path('vehicles/<int:vehicle_id>', views.vehicle_detail, name='vehicle-detail'),
    path('ai', views.ai_snapshot, name='ai'),
    path('camera', views.camera, name='camera'),
    path('driver', views.driver_monitoring, name='driver'),
    path('traffic', views.traffic, name='traffic'),
    path('gps', views.gps, name='gps'),
    path('accidents', views.accidents, name='accidents'),
    path('accidents/<int:accident_id>', views.accident_detail, name='accident-detail'),
    path('emergency', views.emergency, name='emergency'),
    path('reports', views.reports, name='reports'),
    path('reports/export', views.reports_export, name='reports-export'),
    path('analytics', views.analytics, name='analytics'),
    path('notifications', views.notifications, name='notifications'),
    path('settings', views.settings, name='settings'),
    path('stream/<int:vehicle_id>', views.stream, name='stream'),
]
