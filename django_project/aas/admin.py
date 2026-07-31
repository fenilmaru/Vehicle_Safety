from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth import get_user_model
from .models import Vehicle, Trip, Detection, DriverStatus, Accident, AccidentTimeline, EmergencyContact, Dispatch, Notification, Report, Settings, UserProfile

User = get_user_model()

@admin.register(UserProfile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'full_name', 'role', 'safety_score', 'face_enrolled', 'fingerprint_enrolled')
    list_filter = ('role', 'status')

@admin.register(Vehicle)
class VehicleAdmin(admin.ModelAdmin):
    list_display = ('vehicle_number', 'model', 'status', 'autonomy_level', 'current_speed', 'safety_score', 'driver')
    list_filter = ('status', 'autonomy_level', 'vehicle_type')

@admin.register(Accident)
class AccidentAdmin(admin.ModelAdmin):
    list_display = ('code', 'vehicle', 'severity', 'confidence', 'status', 'detected_at')
    list_filter = ('severity', 'status')

admin.site.register(Trip)
admin.site.register(Detection)
admin.site.register(DriverStatus)
admin.site.register(AccidentTimeline)
admin.site.register(EmergencyContact)
admin.site.register(Dispatch)
admin.site.register(Notification)
admin.site.register(Report)
admin.site.register(Settings)
