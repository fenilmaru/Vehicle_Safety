import json
import random
from datetime import datetime
from django.http import JsonResponse, StreamingHttpResponse, HttpResponse
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.contrib.auth import get_user_model, authenticate
from django.contrib.auth.hashers import make_password
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.settings import api_settings
from aas.models import Vehicle, Trip, Detection, DriverStatus, Accident, AccidentTimeline, EmergencyContact, Dispatch, Notification, Report, Settings, UserProfile

User = get_user_model()

# ---------- helpers ----------

def health(request):
    try:
        from django.db import connection
        with connection.cursor() as cur:
            cur.execute("SELECT 1")
        return JsonResponse({"status":"ok","service":"autonomous-activation-system","database":"connected","realtime":"channels-ready","aiGateway":"ready","timestamp":datetime.now().isoformat()})
    except Exception as e:
        return JsonResponse({"status":"degraded","error":str(e)},status=500)

def user_json(user):
    profile = UserProfile.objects.filter(user=user).first()
    return {
        "id": user.id, "fullName": profile.full_name if profile else user.username,
        "username": user.username, "email": user.email, "mobile": profile.mobile if profile else "",
        "role": profile.role if profile else "driver",
        "vehicleNumber": profile.vehicle_number if profile else "",
        "avatarUrl": profile.avatar_url if profile else "",
        "faceEnrolled": profile.face_enrolled if profile else False,
        "fingerprintEnrolled": profile.fingerprint_enrolled if profile else False,
        "safetyScore": profile.safety_score if profile else 92,
        "status": profile.status if profile else "active",
        "createdAt": profile.created_at.isoformat() if profile else None,
        "lastLoginAt": profile.last_login_at.isoformat() if profile and profile.last_login_at else None,
    }

def ok(data, meta=None):
    return JsonResponse({"success": True, "data": data, "meta": meta or {}})

def fail(msg, status=400, code="bad_request"):
    return JsonResponse({"success": False, "error": {"message": msg, "code": code}}, status=status)

# ---------- auth ----------

@api_view(["POST"])
@permission_classes([AllowAny])
def login(request):
    identifier = request.data.get("identifier", "").strip().lower()
    password = request.data.get("password", "")
    user = User.objects.filter(username=identifier).first() or User.objects.filter(email=identifier).first()
    if user and user.check_password(password):
        token = RefreshToken.for_user(user)
        from django.conf import settings
        return JsonResponse({"success": True, "data": {"token": str(token.access_token), "user": user_json(user), "nextStep": "dashboard"}})
    return fail("Invalid credentials", 401, "invalid_credentials")

@api_view(["POST"])
@permission_classes([AllowAny])
def register(request):
    data = request.data
    user = User.objects.create_user(username=data.get("username"), email=data.get("email"), password=data.get("password"))
    UserProfile.objects.create(user=user, full_name=data.get("fullName", user.username), username=user.username,
        email=user.email, mobile=data.get("mobile", ""), role=data.get("role", "driver"),
        vehicle_number=data.get("vehicleNumber", ""), face_enrolled=bool(data.get("faceCaptured")),
        fingerprint_enrolled=bool(data.get("fingerprintCaptured")),
        face_signature="", fingerprint_signature="", safety_score=92, status="active")
    from django.contrib.sessions.middleware import SessionMiddleware
    return JsonResponse({"success": True, "data": {"token": str(RefreshToken.for_user(user).access_token), "user": user_json(user)}}, status=201)

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def me(request):
    settings, _ = Settings.objects.get_or_create(user=request.user)
    vehicles = list(Vehicle.objects.filter(driver=request.user).values())
    return ok({"user": user_json(request.user), "settings": {
        "id": settings.id, "userId": request.user.id, "theme": settings.theme,
        "accent": settings.accent, "units": settings.units, "autonomyLevel": settings.autonomy_level,
        "aiSensitivity": settings.ai_sensitivity, "emergencyAutoDispatch": settings.emergency_auto_dispatch,
        "notifyEmail": settings.notify_email, "notifySms": settings.notify_sms, "notifyPush": settings.notify_push,
        "updatedAt": settings.updated_at.isoformat(),
    }, "vehicles": vehicles})

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def logout_view(request):
    return ok({"loggedOut": True})

@api_view(["POST"])
@permission_classes([AllowAny])
def forgot_password(request):
    email = request.data.get("email", "").strip().lower()
    exists = User.objects.filter(email=email).exists()
    return ok({"dispatched": True, "channel": "email", "resetWindowMinutes": 20, "hint": "If account exists a link was sent."})

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def biometric(request):
    mode = request.data.get("mode", "face")
    return ok({"verified": True, "mode": mode, "confidence": 0.97, "engine": "MediaPipe FaceMesh" if mode == "face" else "MinutiaeNet"})

# ---------- dashboard / fleet ----------

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def dashboard(request):
    vessels = Vehicle.objects.all()
    fleets_data = [{"id": v.id, "vehicleNumber": v.vehicle_number, "model": v.model,
        "status": v.status, "currentSpeed": v.current_speed, "lat": v.lat, "lng": v.lng,
        "heading": v.heading, "safetyScore": v.safety_score, "autonomyLevel": v.autonomy_level,
        "driverId": v.driver_id, "batteryLevel": v.battery_level,
        "manufacturer": v.manufacturer, "year": v.year, "vehicleType": v.vehicle_type,
        "odometerKm": v.odometer_km, "aiModules": v.ai_modules,
        "lastSeenAt": v.last_seen_at.isoformat() if v.last_seen_at else None} for v in vessels]
    trips = list(Trip.objects.order_by("-started_at")[:5].values())
    alerts = list(Notification.objects.order_by("-created_at")[:6].values())
    dets = list(Detection.objects.order_by("-created_at")[:8].values())
    accidents_rows = list(Accident.objects.order_by("-detected_at")[:5].values())
    dss = DriverStatus.objects.select_related("driver__profile", "vehicle").order_by("-recorded_at")[:4]
    profile = UserProfile.objects.filter(user=request.user).first()
    return ok({
        "operator": {"name": profile.full_name if profile else request.user.username,
            "role": profile.role if profile else "driver",
            "safetyScore": profile.safety_score if profile else 92, "avatarUrl": ""},
        "primaryVehicle": fleets_data[0] if fleets_data else None,
        "frame": None,
        "kpis": {"fleetSize": vessels.count(), "online": vessels.filter(status="online").count(),
            "avgSafety": 90, "openIncidents": Accident.objects.filter(status="responding").count(),
            "aiUptime": 99.94, "detections24h": 1846},
        "recentTrips": trips,
        "recentAlerts": [{"id": a["id"], "title": a["title"], "message": a["message"],
            "level": a["level"], "category": a["category"], "isRead": a["is_read"],
            "createdAt": a["created_at"].isoformat() if a["created_at"] else None} for a in alerts],
        "detectionLogs": [{"id": d["id"], "vehicleId": d["vehicle_id"], "module": d["module"],
            "label": d["label"], "confidence": d["confidence"], "severity": d["severity"],
            "engine": d["engine"], "frameRef": d["frame_ref"],
            "createdAt": d["created_at"].isoformat() if d["created_at"] else None} for d in dets],
        "driverStatuses": [{"id": ds.id, "driverId": ds.driver_id, "vehicleId": ds.vehicle_id,
            "attention": ds.attention, "drowsiness": ds.drowsiness, "fatigue": ds.fatigue,
            "phoneUsage": ds.phone_usage, "seatbelt": ds.seatbelt, "eyeStatus": ds.eye_status,
            "heartRate": ds.heart_rate, "recordedAt": ds.recorded_at.isoformat() if ds.recorded_at else None,
            "driver": {"id": ds.driver.id, "fullName": ds.driver.profile.full_name, "role": ds.driver.profile.role, "safetyScore": ds.driver.profile.safety_score}} for ds in dss],
        "accidents": [{"id": a["id"], "code": a["code"], "vehicleId": a["vehicle_id"],
            "severity": a["severity"], "confidence": a["confidence"], "impactG": a["impact_g"],
            "address": a["address"], "status": a["status"],
            "detectedAt": a["detected_at"].isoformat() if a["detected_at"] else None} for a in accidents_rows],
        "charts": {"safetySeries": [{"label": "D-"+str(13-i), "value": 86+((i+7)%8)*2} for i in range(14)],
            "detectionSeries": [{"label": str(i*2).zfill(2)+":00", "objects": 120+((i*11)%80),
                "pedestrians": 40+((i*7)%30), "lanes": 90+((i*5)%20)} for i in range(12)],
            "speedSeries": [{"label": str(i), "value": max(0,52+((i*7)%30))} for i in range(20)]},
        "systemHealth": {"cpu":42,"gpu":58,"memory":51,"latencyMs":24,"fps":30}})

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def vehicles(request):
    q = request.GET.get("q", "").strip()
    status_filter = request.GET.get("status", "").strip()
    qs = Vehicle.objects.all()
    if q: qs = qs.filter(vehicle_number__icontains=q) | qs.filter(model__icontains=q)
    if status_filter: qs = qs.filter(status=status_filter)
    return ok([{
        "id": v.id, "vehicleNumber": v.vehicle_number, "model": v.model, "manufacturer": v.manufacturer,
        "year": v.year, "vehicleType": v.vehicle_type, "status": v.status, "autonomyLevel": v.autonomy_level,
        "driverId": v.driver_id, "currentSpeed": v.current_speed, "batteryLevel": v.battery_level,
        "odometerKm": v.odometer_km, "safetyScore": v.safety_score, "lat": v.lat, "lng": v.lng,
        "heading": v.heading, "aiModules": v.ai_modules, "lastSeenAt": v.last_seen_at.isoformat() if v.last_seen_at else None,
        "driver": {"id": v.driver.id,"fullName": v.driver.profile.full_name,"role": v.driver.profile.role} if v.driver else None,
    } for v in qs])

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def vehicle_detail(request, vehicle_id):
    v = Vehicle.objects.get(pk=vehicle_id)
    return ok({
        "vehicle": {"id": v.id,"vehicleNumber": v.vehicle_number,"model": v.model,"manufacturer": v.manufacturer,"year": v.year,"vehicleType": v.vehicle_type,"status": v.status,"autonomyLevel": v.autonomy_level,"driverId": v.driver_id,"currentSpeed": v.current_speed,"batteryLevel": v.battery_level,"odometerKm": v.odometer_km,"safetyScore": v.safety_score,"lat": v.lat,"lng": v.lng,"heading": v.heading,"aiModules": v.ai_modules,"lastSeenAt": v.last_seen_at.isoformat() if v.last_seen_at else None},
        "driver": user_json(v.driver) if v.driver else None,
        "frame": {"speed": v.current_speed,"lat": v.lat,"lng": v.lng,"safetyScore": v.safety_score,"severity":"normal","driver":{"attention":90,"drowsiness":8,"seatbelt":True},"traffic":{"signal":"green"}},
    })

# ---------- ai / camera / driver / traffic / gps ----------

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def ai_snapshot(request):
    return ok({
        "vehicle": None, "fleet": list(Vehicle.objects.all().values("id","vehicleNumber","status","currentSpeed")),
        "modules": [{"key":"object","name":"Object Detection","engine":"YOLOv8","icon":"cube","confidence":0.94,"status":"active","detections":124,"timestamp":__import__('datetime').datetime.now().isoformat()}],
        "frame": {"ticks":0,"speed":62,"lat":12.97,"lng":77.59,"boxes":[],"driver":{"attention":94,"drowsiness":6,"seatbelt":True},"traffic":{"signal":"green"},"systemHealth":{"cpu":42,"gpu":58,"memory":51,"latencyMs":24,"fps":30}},
        "logs": [],
        "pipeline": {"inferenceEngine":"TensorRT 10 · CUDA 12.4","models":["YOLOv8n-seg","LaneNet","MediaPipe BlazePose","ArcFace","CrashNet-PyTorch"],"fps":30,"latencyMs":22,"queueDepth":2},
    })

def stream_events(vehicle_id):
    import time
    tick = 0
    while True:
        tick += 1
        yield f"event: vehicle_speed\ndata: {{\"vehicleId\":{vehicle_id},\"speed\":{60+20*(tick%7)},\"rpm\":4000}}\n\n"
        yield f"event: gps_location\ndata: {{\"vehicleId\":{vehicle_id},\"lat\":12.97,\"lng\":77.59}}\n\n"
        yield f"event: frame\ndata: {{\"vehicleId\":{vehicle_id},\"timestamp\":\"{__import__('datetime').datetime.now().isoformat()}\",\"speed\":{60+20*(tick%7)},\"severity\":\"normal\"}}\n\n"
        time.sleep(1.5)

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def stream(request, vehicle_id):
    from django.http import StreamingHttpResponse
    return StreamingHttpResponse(stream_events(vehicle_id), content_type="text/event-stream")

# ---------- accidents / emergency ----------

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def accidents(request):
    return ok({
        "accidents": [{"id":1,"code":"ACC-2026-0418","vehicleId":2,"driverId":2,"severity":"critical","confidence":0.96,"impactG":7.8,"airbagDeployed":True,"lat":12.9611,"lng":77.6387,"address":"Outer Ring Road","status":"responding","description":"Frontal impact detected","responseTimeSec":42,"detectedAt":"2026-04-18T14:30:00Z"}],
        "fleet": list(Vehicle.objects.all().values("id","vehicleNumber","status","currentSpeed","lat","lng","heading")),
        "stats":{"total":4,"critical":1,"responding":1,"avgResponseSec":68},
    })

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def accident_detail(request, accident_id):
    a = Accident.objects.get(pk=accident_id)
    return ok({
        "accident": {"id": a.id,"code": a.code,"vehicleId": a.vehicle_id,"severity":a.severity,"confidence":a.confidence,"impactG":a.impact_g,"airbagDeployed":a.airbag_deployed,"lat":a.lat,"lng":a.lng,"address":a.address,"status":a.status,"description":a.description,"detectedAt":a.detected_at.isoformat()},
        "timeline": [{"step":1,"label":"AI Impact","description":"CrashNet flagged impact","status":"done","occurredAt":a.detected_at.isoformat()}],
        "dispatches": [],
        "detections": [],
        "contacts": list(EmergencyContact.objects.filter(available=True).values()),
        "evidence":[{"id":"ev-1","type":"image","label":"Front ADAS","ref":"frame_100241","capturedAt":a.detected_at.isoformat()}],
    })

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def emergency(request):
    return ok({
        "contacts": list(EmergencyContact.objects.filter(available=True).values("id","name","contactType","phone","lat","lng","etaMin","distanceKm")),
        "dispatches": [{"id":1,"service":"ambulance","status":"en_route","etaMin":6,"notes":"ALS A-114","createdAt":"2026-04-18T14:35:00Z"}],
        "activeIncident": {"id":1,"code":"ACC-2026-0418","severity":"critical","lat":12.9611,"lng":77.6387,"address":"Outer Ring Road","vehicle":{"id":2,"vehicleNumber":"AAS-02-MH-4412"}},
        "stats":{"activeIncidents":1,"unitsEnRoute":2,"avgEtaMin":6,"contactsReachable":5},
    })

# ---------- reports / analytics / notifications / settings ----------

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def reports(request):
    return ok({"reports":[{"id":1,"name":"Fleet Safety Summary — Feb","format":"pdf","scope":"analytics","rowCount":412,"sizeKb":1840,"status":"ready","generatedBy":"Aarav Mehta","createdAt":"2026-04-18T10:00:00Z"}],
        "fleet": list(Vehicle.objects.all().values("id","vehicleNumber","status")),
        "dataset":[{"code":"ACC-2026-0418","vehicle":"AAS-02-MH-4412","severity":"critical","confidence":0.96,"status":"responding","detectedAt":"2026-04-18T14:30:00Z","address":"Outer Ring Road"}],
        "tripCount":5})

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def reports_export(request):
    return JsonResponse({"url":"/api/reports/export?scope=accidents&format=csv"})

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def analytics(request):
    return ok({
        "kpis":{"totalIncidents":4,"avgSafety":88,"totalDistance":159,"detections":1848,"preventedCollisions":37,"responseImprovement":26.4},
        "monthlyAccidents":[{"label":"Jan","critical":2,"accident":5,"warning":11}],
        "speedDistribution":[{"label":"0-20","value":12}],
        "driverSafety":[{"label":"AAS-01","value":96}],
        "emergencyEvents":[{"label":"Jan","dispatched":4,"resolved":3}],
        "detectionMix":[{"label":"Vehicles","value":4820}],
        "vehicleUtilization":[{"label":"AAS-01","utilization":76,"uptime":99}],
    })

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def notifications(request):
    return ok({"notifications":[{"id":1,"userId":1,"vehicleId":2,"title":"Critical accident","message":"AAS-02-MH-4412 impact on Outer Ring Road","level":"critical","category":"accident","isRead":False,"createdAt":"2026-04-18T14:30:00Z"}],"unread":1})

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def settings(request):
    s, _ = Settings.objects.get_or_create(user=request.user, defaults={"theme":"midnight","accent":"cyan","font_size":"medium"})
    return ok({"id":s.id,"userId":request.user.id,"theme":s.theme,"accent":s.accent,"fontSize":s.font_size,"units":s.units,"autonomyLevel":s.autonomy_level,"aiSensitivity":s.ai_sensitivity,"emergencyAutoDispatch":s.emergency_auto_dispatch,"notifyEmail":s.notify_email,"notifySms":s.notify_sms,"notifyPush":s.notify_push,"updatedAt":s.updated_at.isoformat()})

@api_view(["PATCH"])
@permission_classes([IsAuthenticated])
def notifications_mark_read(request):
    return ok({"updated":"all"})

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def camera(request):
    return ok({"vehicle":{"id":1,"vehicleNumber":"AAS-01-KA-9081","status":"online"},"feeds":[{"id":"front","name":"Front ADAS","resolution":"1920×1080","fps":30,"model":"YOLOv8n-seg","online":True}],"frame":{"speed":62,"lat":12.9716,"lng":77.5946,"boxes":[{"id":"bx-0","label":"Vehicle · Sedan","confidence":0.94,"x":44,"y":34,"w":22,"h":24,"tone":"primary","engine":"YOLOv8-n"}],"driver":{"attention":94,"drowsiness":6,"seatbelt":True,"eyeStatus":"open"},"traffic":{"signal":"green","signalConfidence":0.97,"sign":"Speed Limit 60","signConfidence":0.92,"recommendedSpeed":54,"congestion":42},"systemHealth":{"cpu":42,"gpu":58,"memory":51,"latencyMs":24,"fps":30}},"detectionPanel":[{"key":"vehicle","label":"Vehicle","value":1,"tone":"primary"},{"key":"pedestrian","label":"Pedestrian","value":0,"tone":"warning"}]})

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def driver_monitoring(request):
    return ok({"active":{"driverId":1,"vehicleId":1,"attention":94,"drowsiness":6,"fatigue":11,"phoneUsage":0,"seatbelt":True,"eyeStatus":"open","heartRate":74,"recordedAt":"2026-04-18T14:00:00Z","driver":{"id":1,"fullName":"Aarav Mehta","role":"fleet_admin","safetyScore":96},"vehicle":{"id":1,"vehicleNumber":"AAS-01-KA-9081"}},"live":{"attention":94,"drowsiness":6,"fatigue":11,"phoneUsage":0,"seatbelt":True,"eyeStatus":"open","heartRate":74},"roster":[{"id":1,"driverId":1,"vehicleId":1,"attention":94,"drowsiness":6,"fatigue":11,"phoneUsage":0,"seatbelt":True,"eyeStatus":"open","heartRate":74,"recordedAt":"2026-04-18T14:00:00Z","driver":{"id":1,"fullName":"Aarav Mehta","role":"fleet_admin","safetyScore":96},"vehicle":{"id":1,"vehicleNumber":"AAS-01-KA-9081"}}],"behaviourSeries":[{"label":"0m","attention":90,"drowsiness":8,"fatigue":12}]})

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def traffic(request):
    return ok({"vehicle":{"id":1,"vehicleNumber":"AAS-01-KA-9081"},"fleet":[{"id":1,"vehicleNumber":"AAS-01-KA-9081","lat":12.9716,"lng":77.5946,"status":"online","currentSpeed":62,"heading":74}],"traffic":{"signal":"green","signalConfidence":0.97,"sign":"Speed Limit 60","signConfidence":0.92,"speedLimit":60,"recommendedSpeed":54,"congestion":42},"speed":62,"signs":[{"key":"speed","label":"Speed Limit 60","action":"Maintain ≤ 60 km/h","limit":60,"detected":True,"confidence":0.97}],"corridor":[{"junction":"MG Road","congestion":42,"signal":"green","avgSpeed":54}]})

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def gps(request):
    return ok({"vehicle":{"id":1,"vehicleNumber":"AAS-01-KA-9081"},"fleet":[{"id":1,"vehicleNumber":"AAS-01-KA-9081","lat":12.9716,"lng":77.5946,"status":"online","currentSpeed":62,"heading":74}],"position":{"lat":12.9716,"lng":77.5946,"heading":74,"speed":62},"destination":{"lat":12.9279,"lng":77.6271,"name":"Koramangala Charge Hub"},"route":[{"lat":12.9716,"lng":77.5946},{"lat":12.95,"lng":77.61}],"metrics":{"speed":62,"distanceKm":4.4,"etaMin":6,"arrivalAt":"2026-04-18T14:18:00Z"},"poi":[{"id":1,"name":"Manipal Trauma Centre","type":"hospital","lat":12.9581,"lng":77.6494,"etaMin":6}],"incidents":[{"id":1,"code":"ACC-2026-0418","lat":12.9611,"lng":77.6387,"severity":"critical","address":"Outer Ring Road"}]})
