import { sql } from "drizzle-orm";
import { db } from "@/db";
import {
  accidentTimeline,
  accidents,
  detections,
  dispatches,
  driverStatus,
  emergencyContacts,
  notifications,
  reports,
  settings,
  telemetry,
  trips,
  users,
  vehicles,
} from "@/db/schema";
import { hashPassword, biometricSignature } from "@/lib/auth";

let seedPromise: Promise<void> | null = null;

const hoursAgo = (h: number) => new Date(Date.now() - h * 3600_000);
const daysAgo = (d: number) => new Date(Date.now() - d * 86_400_000);

async function runSeed() {
  const [{ count }] = await db
    .select({ count: sql<number>`cast(count(*) as int)` })
    .from(users);
  if (count > 0) return;

  const password = hashPassword("Autonomy#2026");

  const insertedUsers = await db
    .insert(users)
    .values([
      {
        fullName: "Aarav Mehta",
        username: "commander",
        email: "commander@aas.ai",
        passwordHash: password,
        mobile: "+91 98450 11223",
        role: "fleet_admin",
        vehicleNumber: "AAS-01-KA-9081",
        avatarUrl: "",
        faceEnrolled: true,
        fingerprintEnrolled: true,
        faceSignature: biometricSignature("commander-face"),
        fingerprintSignature: biometricSignature("commander-print"),
        safetyScore: 96,
        lastLoginAt: hoursAgo(2),
      },
      {
        fullName: "Diya Sharma",
        username: "diya.sharma",
        email: "diya@aas.ai",
        passwordHash: password,
        mobile: "+91 98860 77321",
        role: "driver",
        vehicleNumber: "AAS-02-MH-4412",
        faceEnrolled: true,
        fingerprintEnrolled: true,
        faceSignature: biometricSignature("diya-face"),
        fingerprintSignature: biometricSignature("diya-print"),
        safetyScore: 91,
      },
      {
        fullName: "Rohan Iyer",
        username: "rohan.iyer",
        email: "rohan@aas.ai",
        passwordHash: password,
        mobile: "+91 90080 55110",
        role: "driver",
        vehicleNumber: "AAS-03-TN-7765",
        faceEnrolled: true,
        fingerprintEnrolled: false,
        faceSignature: biometricSignature("rohan-face"),
        safetyScore: 84,
      },
      {
        fullName: "Meera Nair",
        username: "meera.nair",
        email: "meera@aas.ai",
        passwordHash: password,
        mobile: "+91 99456 22110",
        role: "safety_officer",
        vehicleNumber: "AAS-04-DL-3390",
        faceEnrolled: false,
        fingerprintEnrolled: true,
        fingerprintSignature: biometricSignature("meera-print"),
        safetyScore: 93,
      },
    ])
    .returning({ id: users.id });

  const [admin, diya, rohan, meera] = insertedUsers.map((u) => u.id);

  await db.insert(settings).values(insertedUsers.map((u) => ({ userId: u.id })));

  const insertedVehicles = await db
    .insert(vehicles)
    .values([
      {
        vehicleNumber: "AAS-01-KA-9081",
        model: "Aether X1 Autonomous",
        manufacturer: "Aether Motors",
        year: 2026,
        vehicleType: "sedan",
        status: "online",
        autonomyLevel: 4,
        driverId: admin,
        currentSpeed: 62.4,
        batteryLevel: 84,
        odometerKm: 24812.6,
        safetyScore: 96,
        lat: 12.9716,
        lng: 77.5946,
        heading: 74,
        aiModules: ["object", "lane", "sign", "driver", "accident", "pose"],
      },
      {
        vehicleNumber: "AAS-02-MH-4412",
        model: "Nimbus E-SUV",
        manufacturer: "Nimbus Dynamics",
        year: 2025,
        vehicleType: "suv",
        status: "online",
        autonomyLevel: 3,
        driverId: diya,
        currentSpeed: 48.1,
        batteryLevel: 61,
        odometerKm: 41290.2,
        safetyScore: 91,
        lat: 12.9611,
        lng: 77.6387,
        heading: 132,
        aiModules: ["object", "lane", "driver", "accident"],
      },
      {
        vehicleNumber: "AAS-03-TN-7765",
        model: "Volt Cargo L3",
        manufacturer: "Volt Freight",
        year: 2024,
        vehicleType: "truck",
        status: "idle",
        autonomyLevel: 2,
        driverId: rohan,
        currentSpeed: 0,
        batteryLevel: 39,
        odometerKm: 118322.9,
        safetyScore: 82,
        lat: 12.9986,
        lng: 77.5502,
        heading: 210,
        aiModules: ["object", "lane", "sign"],
      },
      {
        vehicleNumber: "AAS-04-DL-3390",
        model: "Aether X1 Autonomous",
        manufacturer: "Aether Motors",
        year: 2026,
        vehicleType: "sedan",
        status: "maintenance",
        autonomyLevel: 4,
        driverId: meera,
        currentSpeed: 0,
        batteryLevel: 97,
        odometerKm: 8123.4,
        safetyScore: 94,
        lat: 13.0208,
        lng: 77.6101,
        heading: 15,
        aiModules: ["object", "lane", "sign", "driver", "accident", "face"],
      },
      {
        vehicleNumber: "AAS-05-KA-1177",
        model: "Nimbus Shuttle 12",
        manufacturer: "Nimbus Dynamics",
        year: 2025,
        vehicleType: "shuttle",
        status: "online",
        autonomyLevel: 3,
        driverId: diya,
        currentSpeed: 33.7,
        batteryLevel: 72,
        odometerKm: 65211.1,
        safetyScore: 88,
        lat: 12.9345,
        lng: 77.6101,
        heading: 289,
        aiModules: ["object", "lane", "driver"],
      },
      {
        vehicleNumber: "AAS-06-KL-8842",
        model: "Volt Cargo L3",
        manufacturer: "Volt Freight",
        year: 2023,
        vehicleType: "truck",
        status: "offline",
        autonomyLevel: 2,
        driverId: rohan,
        currentSpeed: 0,
        batteryLevel: 12,
        odometerKm: 201933.8,
        safetyScore: 76,
        lat: 12.9082,
        lng: 77.5623,
        heading: 188,
        aiModules: ["object", "lane"],
      },
    ])
    .returning({ id: vehicles.id });

  const vid = insertedVehicles.map((v) => v.id);

  await db.insert(trips).values([
    { vehicleId: vid[0], driverId: admin, origin: "Indiranagar Hub", destination: "Electronic City", distanceKm: 24.8, avgSpeed: 46.2, maxSpeed: 88, safetyScore: 96, durationMin: 38, status: "completed", startedAt: hoursAgo(5), endedAt: hoursAgo(4) },
    { vehicleId: vid[1], driverId: diya, origin: "Whitefield Depot", destination: "MG Road", distanceKm: 18.3, avgSpeed: 38.7, maxSpeed: 72, safetyScore: 89, durationMin: 31, status: "completed", startedAt: hoursAgo(9), endedAt: hoursAgo(8) },
    { vehicleId: vid[2], driverId: rohan, origin: "Peenya Logistics", destination: "Hosur Warehouse", distanceKm: 62.1, avgSpeed: 52.4, maxSpeed: 94, safetyScore: 78, durationMin: 84, status: "completed", startedAt: daysAgo(1), endedAt: hoursAgo(22) },
    { vehicleId: vid[4], driverId: diya, origin: "Airport Terminal 2", destination: "Koramangala", distanceKm: 41.7, avgSpeed: 55.1, maxSpeed: 96, safetyScore: 92, durationMin: 52, status: "active", startedAt: hoursAgo(1) },
    { vehicleId: vid[3], driverId: meera, origin: "Yelahanka Bay", destination: "Hebbal Control", distanceKm: 12.4, avgSpeed: 33.2, maxSpeed: 58, safetyScore: 95, durationMin: 26, status: "completed", startedAt: daysAgo(2), endedAt: daysAgo(2) },
  ]);

  await db.insert(driverStatus).values([
    { driverId: admin, vehicleId: vid[0], attention: 94, drowsiness: 6, fatigue: 11, phoneUsage: 0, seatbelt: true, eyeStatus: "open", heartRate: 74 },
    { driverId: diya, vehicleId: vid[1], attention: 81, drowsiness: 19, fatigue: 26, phoneUsage: 4, seatbelt: true, eyeStatus: "open", heartRate: 82 },
    { driverId: rohan, vehicleId: vid[2], attention: 63, drowsiness: 34, fatigue: 47, phoneUsage: 12, seatbelt: false, eyeStatus: "half", heartRate: 91 },
    { driverId: meera, vehicleId: vid[3], attention: 96, drowsiness: 4, fatigue: 8, phoneUsage: 0, seatbelt: true, eyeStatus: "open", heartRate: 68 },
  ]);

  const detectionSeeds: Array<[number, string, string, number, string, string]> = [
    [vid[0], "object", "Pedestrian crossing ahead", 0.94, "warning", "YOLOv8"],
    [vid[0], "lane", "Lane departure — left", 0.88, "warning", "LaneNet"],
    [vid[1], "sign", "Speed limit 60 detected", 0.97, "normal", "TensorFlow CNN"],
    [vid[1], "driver", "Drowsiness threshold crossed", 0.91, "critical", "PyTorch DMS-Net"],
    [vid[2], "object", "Truck in blind spot", 0.86, "warning", "YOLOv8"],
    [vid[2], "seatbelt", "Seat belt not fastened", 0.99, "critical", "MediaPipe Pose"],
    [vid[4], "face", "Driver identity verified", 0.98, "normal", "MediaPipe FaceMesh"],
    [vid[4], "object", "Cyclist detected — right lane", 0.83, "warning", "YOLOv8"],
    [vid[0], "accident", "Hard braking event", 0.79, "warning", "CrashNet"],
    [vid[3], "pose", "Phone usage detected", 0.87, "warning", "BlazePose"],
    [vid[1], "lane", "Lane keeping nominal", 0.96, "normal", "LaneNet"],
    [vid[0], "sign", "School zone ahead", 0.92, "normal", "SignNet-v3"],
  ];

  await db.insert(detections).values(
    detectionSeeds.map(([vehicleId, module, label, confidence, severity, engine], index) => ({
      vehicleId,
      module,
      label,
      confidence,
      severity,
      engine,
      frameRef: `frame_${100234 + index}`,
      meta: { fps: 30, model: engine, latencyMs: 22 + index },
      createdAt: hoursAgo(index * 1.6 + 0.4),
    })),
  );

  const insertedAccidents = await db
    .insert(accidents)
    .values([
      {
        code: "ACC-2026-0418",
        vehicleId: vid[1],
        driverId: diya,
        severity: "critical",
        confidence: 0.96,
        impactG: 7.8,
        airbagDeployed: true,
        lat: 12.9611,
        lng: 77.6387,
        address: "Outer Ring Road, Marathahalli Bridge, Bengaluru",
        status: "responding",
        description:
          "Frontal collision detected by CrashNet. Airbags deployed, vehicle immobilised. Automatic SOS dispatched to nearest trauma centre.",
        responseTimeSec: 42,
        detectedAt: hoursAgo(3),
      },
      {
        code: "ACC-2026-0417",
        vehicleId: vid[2],
        driverId: rohan,
        severity: "accident",
        confidence: 0.88,
        impactG: 4.2,
        airbagDeployed: false,
        lat: 12.9986,
        lng: 77.5502,
        address: "Tumkur Road, Peenya Industrial Area, Bengaluru",
        status: "resolved",
        description: "Side-swipe contact with cargo barrier. No injuries reported, vehicle towed for inspection.",
        responseTimeSec: 68,
        detectedAt: daysAgo(2),
        resolvedAt: daysAgo(2),
      },
      {
        code: "ACC-2026-0416",
        vehicleId: vid[0],
        driverId: admin,
        severity: "warning",
        confidence: 0.72,
        impactG: 1.6,
        airbagDeployed: false,
        lat: 12.9716,
        lng: 77.5946,
        address: "100 Ft Road, Indiranagar, Bengaluru",
        status: "closed",
        description: "Emergency braking triggered by pedestrian intrusion. Collision avoided by autonomous intervention.",
        responseTimeSec: 0,
        detectedAt: daysAgo(5),
        resolvedAt: daysAgo(5),
      },
      {
        code: "ACC-2026-0415",
        vehicleId: vid[4],
        driverId: diya,
        severity: "warning",
        confidence: 0.68,
        impactG: 1.1,
        airbagDeployed: false,
        lat: 12.9345,
        lng: 77.6101,
        address: "Sarjapur Road, Bengaluru",
        status: "closed",
        description: "Lane departure with driver drowsiness correlation. Autonomous lane centering engaged.",
        responseTimeSec: 0,
        detectedAt: daysAgo(9),
        resolvedAt: daysAgo(9),
      },
    ])
    .returning({ id: accidents.id });

  const criticalId = insertedAccidents[0].id;

  await db.insert(accidentTimeline).values([
    { accidentId: criticalId, step: 1, label: "AI Impact Detection", description: "CrashNet flagged 7.8G deceleration with 96% confidence.", occurredAt: hoursAgo(3) },
    { accidentId: criticalId, step: 2, label: "Vehicle Auto-Stop", description: "Autonomous controller engaged hazard stop and unlocked doors.", occurredAt: hoursAgo(2.99) },
    { accidentId: criticalId, step: 3, label: "Emergency Signal Sent", description: "SOS packet transmitted to regional emergency gateway.", occurredAt: hoursAgo(2.98) },
    { accidentId: criticalId, step: 4, label: "GPS Location Shared", description: "Live coordinates streamed to ambulance and police dispatch.", occurredAt: hoursAgo(2.97) },
    { accidentId: criticalId, step: 5, label: "Emergency Contacts Notified", description: "2 family contacts notified via SMS + voice call.", occurredAt: hoursAgo(2.95) },
    { accidentId: criticalId, step: 6, label: "Ambulance En Route", description: "Manipal Trauma Unit dispatched — ETA 6 minutes.", status: "active", occurredAt: hoursAgo(2.9) },
  ]);

  await db.insert(dispatches).values([
    { accidentId: criticalId, vehicleId: vid[1], service: "ambulance", status: "en_route", etaMin: 6, notes: "Advanced life support unit A-114" },
    { accidentId: criticalId, vehicleId: vid[1], service: "police", status: "acknowledged", etaMin: 9, notes: "Traffic control unit dispatched" },
    { accidentId: criticalId, vehicleId: vid[1], service: "hospital", status: "standby", etaMin: 0, notes: "Trauma bay 3 reserved" },
  ]);

  await db.insert(emergencyContacts).values([
    { userId: admin, name: "Manipal Trauma Centre", contactType: "hospital", phone: "+91 80 2502 4444", address: "Old Airport Road, Bengaluru", lat: 12.9581, lng: 77.6494, distanceKm: 3.2, etaMin: 6 },
    { userId: admin, name: "Indiranagar Police Station", contactType: "police", phone: "100", address: "CMH Road, Indiranagar", lat: 12.9784, lng: 77.6408, distanceKm: 2.1, etaMin: 5 },
    { userId: admin, name: "Aster Ambulance Network", contactType: "ambulance", phone: "108", address: "Regional Dispatch Grid", lat: 12.9502, lng: 77.6205, distanceKm: 4.4, etaMin: 8 },
    { userId: admin, name: "Kavya Mehta", contactType: "family", relation: "Spouse", phone: "+91 98450 66112", address: "Indiranagar, Bengaluru", distanceKm: 0, etaMin: 0 },
    { userId: admin, name: "Rahul Mehta", contactType: "family", relation: "Brother", phone: "+91 98867 22118", address: "Koramangala, Bengaluru", distanceKm: 0, etaMin: 0 },
    { userId: admin, name: "Fleet Safety Desk", contactType: "operations", relation: "24x7 Control Room", phone: "+91 80 4000 1188", address: "AAS Command Centre", distanceKm: 0, etaMin: 0 },
  ]);

  await db.insert(notifications).values([
    { userId: admin, vehicleId: vid[1], title: "Critical accident detected", message: "AAS-02-MH-4412 reported a 7.8G frontal impact on Outer Ring Road.", level: "critical", category: "accident", createdAt: hoursAgo(3) },
    { userId: admin, vehicleId: vid[1], title: "Ambulance dispatched", message: "Manipal Trauma Centre ALS unit A-114 en route, ETA 6 minutes.", level: "warning", category: "emergency", createdAt: hoursAgo(2.9) },
    { userId: admin, vehicleId: vid[2], title: "Seat belt violation", message: "Driver Rohan Iyer operating AAS-03-TN-7765 without seat belt.", level: "warning", category: "driver", createdAt: hoursAgo(6) },
    { userId: admin, vehicleId: vid[0], title: "AI model updated", message: "YOLOv8 detection weights upgraded to build 2026.02.11.", level: "info", category: "system", isRead: true, createdAt: daysAgo(1) },
    { userId: admin, vehicleId: vid[5], title: "Vehicle offline", message: "AAS-06-KL-8842 lost telemetry uplink — battery at 12%.", level: "warning", category: "vehicle", createdAt: hoursAgo(11) },
    { userId: admin, vehicleId: vid[3], title: "Maintenance scheduled", message: "AAS-04-DL-3390 sensor calibration booked for tomorrow 09:00.", level: "info", category: "vehicle", isRead: true, createdAt: daysAgo(2) },
  ]);

  await db.insert(reports).values([
    { name: "Fleet Safety Summary — February", format: "pdf", scope: "analytics", rowCount: 412, sizeKb: 1840, generatedBy: "Aarav Mehta", createdAt: daysAgo(1) },
    { name: "Accident Register Q1", format: "excel", scope: "accidents", rowCount: 38, sizeKb: 640, generatedBy: "Meera Nair", createdAt: daysAgo(4) },
    { name: "Driver Behaviour Export", format: "csv", scope: "drivers", rowCount: 1204, sizeKb: 320, generatedBy: "System Scheduler", createdAt: daysAgo(7) },
  ]);

  const telemetryRows = [] as Array<typeof telemetry.$inferInsert>;
  for (let v = 0; v < vid.length; v += 1) {
    for (let i = 0; i < 24; i += 1) {
      telemetryRows.push({
        vehicleId: vid[v],
        speed: Math.max(0, 45 + Math.sin(i / 3 + v) * 28),
        lat: 12.9716 + Math.sin(i / 5 + v) * 0.02,
        lng: 77.5946 + Math.cos(i / 5 + v) * 0.02,
        heading: (i * 15 + v * 30) % 360,
        throttle: Math.abs(Math.sin(i / 4)) * 80,
        brake: Math.abs(Math.cos(i / 6)) * 30,
        recordedAt: hoursAgo(24 - i),
      });
    }
  }
  await db.insert(telemetry).values(telemetryRows);
}

export async function ensureSeeded(): Promise<void> {
  if (!seedPromise) {
    seedPromise = runSeed().catch((error) => {
      seedPromise = null;
      throw error;
    });
  }
  return seedPromise;
}
