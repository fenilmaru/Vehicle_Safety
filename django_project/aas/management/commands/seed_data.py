from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from aas.models import Vehicle, Trip, Detection, DriverStatus, Accident, AccidentTimeline, EmergencyContact, Dispatch, Notification, Report, Settings, UserProfile
import random, datetime

User = get_user_model()

class Command(BaseCommand):
    help = "Seed autonomous activation database with demo fleet"

    def handle(self, *args, **options):
        if User.objects.filter(email="commander@aas.ai").exists():
            self.stdout.write(self.style.SUCCESS("DB already seeded"))
            return

        # Users
        admin = User.objects.create_user("commander", "commander@aas.ai", "Autonomy#2026", is_staff=True)
        diya = User.objects.create_user("diya.sharma", "diya@aas.ai", "Autonomy#2026")
        rohan = User.objects.create_user("rohan.iyer", "rohan@aas.ai", "Autonomy#2026")
        meera = User.objects.create_user("meera.nair", "meera@aas.ai", "Autonomy#2026")

        UserProfile.objects.create(user=admin, full_name="Aarav Mehta", username="commander", email="commander@aas.ai",
            mobile="+91 98450 11223", role="fleet_admin", vehicle_number="AAS-01-KA-9081",
            face_enrolled=True, fingerprint_enrolled=True, safety_score=96, status="active")
        UserProfile.objects.create(user=diya, full_name="Diya Sharma", username="diya.sharma", email="diya@aas.ai",
            mobile="+91 98860 77321", role="driver", vehicle_number="AAS-02-MH-4412",
            face_enrolled=True, fingerprint_enrolled=True, safety_score=91, status="active")
        UserProfile.objects.create(user=rohan, full_name="Rohan Iyer", username="rohan.iyer", email="rohan@aas.ai",
            mobile="+91 90080 55110", role="driver", vehicle_number="AAS-03-TN-7765",
            face_enrolled=True, fingerprint_enrolled=False, safety_score=84, status="active")
        UserProfile.objects.create(user=meera, full_name="Meera Nair", username="meera.nair", email="meera@aas.ai",
            mobile="+91 99456 22110", role="safety_officer", vehicle_number="AAS-04-DL-3390",
            face_enrolled=False, fingerprint_enrolled=True, safety_score=93, status="active")

        # Settings
        for u in [admin, diya, rohan, meera]:
            Settings.objects.create(user=u, theme="midnight", accent="cyan", font_size="medium")

        # Vehicles
        v1 = Vehicle.objects.create(vehicle_number="AAS-01-KA-9081", model="Aether X1 Autonomous", manufacturer="Aether Motors",
            year=2026, vehicle_type="sedan", status="online", autonomy_level=4, driver=admin,
            current_speed=62.4, battery_level=84, odometer_km=24812.6, safety_score=96, lat=12.9716, lng=77.5946, heading=74,
            ai_modules=["object","lane","sign","driver","accident","pose"])
        v2 = Vehicle.objects.create(vehicle_number="AAS-02-MH-4412", model="Nimbus E-SUV", manufacturer="Nimbus Dynamics",
            year=2025, vehicle_type="suv", status="online", autonomy_level=3, driver=diya,
            current_speed=48.1, battery_level=61, odometer_km=41290.2, safety_score=91, lat=12.9611, lng=77.6387, heading=132,
            ai_modules=["object","lane","driver","accident"])
        v3 = Vehicle.objects.create(vehicle_number="AAS-03-TN-7765", model="Volt Cargo L3", manufacturer="Volt Freight",
            year=2024, vehicle_type="truck", status="idle", autonomy_level=2, driver=rohan,
            current_speed=0, battery_level=39, odometer_km=118322.9, safety_score=82, lat=12.9986, lng=77.5502, heading=210,
            ai_modules=["object","lane","sign"])
        v4 = Vehicle.objects.create(vehicle_number="AAS-04-DL-3390", model="Aether X1 Autonomous", manufacturer="Aether Motors",
            year=2026, vehicle_type="sedan", status="maintenance", autonomy_level=4, driver=meera,
            current_speed=0, battery_level=97, odometer_km=8123.4, safety_score=94, lat=13.0208, lng=77.6101, heading=15,
            ai_modules=["object","lane","sign","driver","accident","face"])
        v5 = Vehicle.objects.create(vehicle_number="AAS-05-KA-1177", model="Nimbus Shuttle 12", manufacturer="Nimbus Dynamics",
            year=2025, vehicle_type="shuttle", status="online", autonomy_level=3,
            current_speed=33.7, battery_level=72, odometer_km=65211.1, safety_score=88, lat=12.9345, lng=77.6101, heading=289,
            ai_modules=["object","lane","driver"])
        v6 = Vehicle.objects.create(vehicle_number="AAS-06-KL-8842", model="Volt Cargo L3", manufacturer="Volt Freight",
            year=2023, vehicle_type="truck", status="offline", autonomy_level=2,
            current_speed=0, battery_level=12, odometer_km=201933.8, safety_score=76, lat=12.9082, lng=77.5623, heading=188,
            ai_modules=["object","lane"])

        # Driver statuses
        DriverStatus.objects.create(driver=admin, vehicle=v1, attention=94, drowsiness=6, fatigue=11, phone_usage=0, seatbelt=True, eye_status="open", heart_rate=74)
        DriverStatus.objects.create(driver=diya, vehicle=v2, attention=81, drowsiness=19, fatigue=26, phone_usage=4, seatbelt=True, eye_status="open", heart_rate=82)
        DriverStatus.objects.create(driver=rohan, vehicle=v3, attention=63, drowsiness=34, fatigue=47, phone_usage=12, seatbelt=False, eye_status="half", heart_rate=91)
        DriverStatus.objects.create(driver=meera, vehicle=v4, attention=96, drowsiness=4, fatigue=8, phone_usage=0, seatbelt=True, eye_status="open", heart_rate=68)

        # Accidents
        a1 = Accident.objects.create(code="ACC-2026-0418", vehicle=v2, driver=diya, severity="critical", confidence=0.96,
            impact_g=7.8, airbag_deployed=True, lat=12.9611, lng=77.6387, address="Outer Ring Road, Marathahalli Bridge, Bengaluru",
            status="responding", description="Frontal collision detected by CrashNet. Airbags deployed.", response_time_sec=42)
        a2 = Accident.objects.create(code="ACC-2026-0417", vehicle=v3, driver=rohan, severity="accident", confidence=0.88,
            impact_g=4.2, airbag_deployed=False, lat=12.9986, lng=77.5502, address="Tumkur Road, Peenya, Bengaluru",
            status="resolved", description="Side-swipe with cargo barrier.", response_time_sec=68)
        a3 = Accident.objects.create(code="ACC-2026-0416", vehicle=v1, driver=admin, severity="warning", confidence=0.72,
            impact_g=1.6, airbag_deployed=False, lat=12.9716, lng=77.5946, address="100 Ft Road, Indiranagar, Bengaluru",
            status="closed", description="Emergency braking triggered by pedestrian intrusion.", response_time_sec=0)

        # Timeline
        AccidentTimeline.objects.create(accident=a1, step=1, label="AI Impact Detection", description="CrashNet flagged 7.8G deceleration", status="done")
        AccidentTimeline.objects.create(accident=a1, step=2, label="Vehicle Auto-Stop", description="Autonomous hazard stop engaged", status="done")
        AccidentTimeline.objects.create(accident=a1, step=3, label="Emergency Signal Sent", description="SOS to regional gateway", status="done")
        AccidentTimeline.objects.create(accident=a1, step=4, label="Ambulance En Route", description="Trauma unit dispatched — ETA 6 min", status="active")

        # Emergency contacts
        EmergencyContact.objects.create(user=admin, name="Manipal Trauma Centre", contact_type="hospital", phone="+91 80 2502 4444",
            address="Old Airport Road, Bengaluru", lat=12.9581, lng=77.6494, distance_km=3.2, eta_min=6, available=True)
        EmergencyContact.objects.create(user=admin, name="Indiranagar Police", contact_type="police", phone="100",
            address="CMH Road, Indiranagar", lat=12.9784, lng=77.6408, distance_km=2.1, eta_min=5, available=True)
        EmergencyContact.objects.create(user=admin, name="Aster Ambulance", contact_type="ambulance", phone="108",
            address="Regional Grid", lat=12.9502, lng=77.6205, distance_km=4.4, eta_min=8, available=True)
        EmergencyContact.objects.create(user=admin, name="Kavya Mehta", contact_type="family", relation="Spouse",
            phone="+91 98450 66112", address="Indiranagar, Bengaluru", eta_min=0, available=True)

        # Dispatches
        Dispatch.objects.create(accident=a1, vehicle=v2, service="ambulance", status="en_route", eta_min=6, notes="ALS unit A-114")
        Dispatch.objects.create(accident=a1, vehicle=v2, service="police", status="acknowledged", eta_min=9, notes="Traffic unit")

        # Notifications
        Notification.objects.create(user=admin, vehicle=v2, title="Critical accident detected",
            message="AAS-02-MH-4412 reported a 7.8G frontal impact on Outer Ring Road.", level="critical", category="accident")
        Notification.objects.create(user=admin, vehicle=v1, title="AI model updated",
            message="YOLOv8 detection weights upgraded to build 2026.02.11.", level="info", category="system", is_read=True)
        Notification.objects.create(user=admin, vehicle=v3, title="Seat belt violation",
            message="Driver Rohan Iyer operating AAS-03-TN-7765 without seat belt.", level="warning", category="driver")

        # Reports
        Report.objects.create(name="Fleet Safety Summary — February", format="pdf", scope="analytics",
            row_count=412, size_kb=1840, generated_by="Aarav Mehta")

        # Trips
        Trip.objects.create(vehicle=v1, driver=admin, origin="Indiranagar Hub", destination="Electronic City",
            distance_km=24.8, avg_speed=46.2, max_speed=88, safety_score=96, duration_min=38, status="completed")

        # Detections
        Detection.objects.create(vehicle=v1, module="object", label="Pedestrian crossing ahead", confidence=0.94,
            severity="warning", engine="YOLOv8", frame_ref="frame_100234")
        Detection.objects.create(vehicle=v1, module="lane", label="Lane departure — left", confidence=0.88,
            severity="warning", engine="LaneNet", frame_ref="frame_100235")

        self.stdout.write(self.style.SUCCESS(f"Seeded fleet: 6 vehicles, 4 drivers, 3 accidents, {Vehicle.objects.count()} total vehicles"))
