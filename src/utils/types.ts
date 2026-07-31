import type { VehicleFrame } from "@/lib/simulation";

export type Role = "fleet_admin" | "driver" | "safety_officer" | "viewer";

export type UserProfile = {
  id: number;
  fullName: string;
  username: string;
  email: string;
  mobile: string;
  role: string;
  vehicleNumber: string;
  avatarUrl: string;
  faceEnrolled: boolean;
  fingerprintEnrolled: boolean;
  safetyScore: number;
  status: string;
  lastLoginAt?: string | null;
  createdAt?: string;
};

export type VehicleRow = {
  id: number;
  vehicleNumber: string;
  model: string;
  manufacturer: string;
  year: number;
  vehicleType: string;
  status: string;
  autonomyLevel: number;
  driverId: number | null;
  currentSpeed: number;
  batteryLevel: number;
  odometerKm: number;
  safetyScore: number;
  lat: number;
  lng: number;
  heading: number;
  aiModules: string[];
  lastSeenAt: string;
};

export type VehicleWithDriver = VehicleRow & {
  driver?: { id: number; fullName: string; role: string } | null;
};

export type TripRow = {
  id: number;
  vehicleId: number;
  driverId: number | null;
  origin: string;
  destination: string;
  distanceKm: number;
  avgSpeed: number;
  maxSpeed: number;
  safetyScore: number;
  durationMin: number;
  status: string;
  startedAt: string;
  endedAt: string | null;
};

export type DetectionRow = {
  id: number;
  vehicleId: number;
  module: string;
  label: string;
  confidence: number;
  severity: string;
  engine: string;
  frameRef: string;
  createdAt: string;
};

export type NotificationRow = {
  id: number;
  userId: number | null;
  vehicleId: number | null;
  title: string;
  message: string;
  level: string;
  category: string;
  isRead: boolean;
  createdAt: string;
};

export type AccidentRow = {
  id: number;
  code: string;
  vehicleId: number;
  driverId: number | null;
  severity: string;
  confidence: number;
  impactG: number;
  airbagDeployed: boolean;
  lat: number;
  lng: number;
  address: string;
  status: string;
  description: string;
  responseTimeSec: number;
  detectedAt: string;
  resolvedAt: string | null;
};

export type DriverStatusRow = {
  id: number;
  driverId: number;
  vehicleId: number;
  attention: number;
  drowsiness: number;
  fatigue: number;
  phoneUsage: number;
  seatbelt: boolean;
  eyeStatus: string;
  heartRate: number;
  recordedAt: string;
  driver?: { id: number; fullName: string; role: string; safetyScore: number } | null;
  vehicle?: VehicleRow | null;
};

export type SettingsRow = {
  id: number;
  userId: number;
  theme: string;
  accent: string;
  units: string;
  autonomyLevel: number;
  aiSensitivity: number;
  emergencyAutoDispatch: boolean;
  notifyEmail: boolean;
  notifySms: boolean;
  notifyPush: boolean;
};

export type AuthPayload = { token: string; user: UserProfile; nextStep?: string };
export type SessionPayload = { user: UserProfile; settings: SettingsRow | null; vehicles: VehicleRow[] };

export type DashboardPayload = {
  operator: { name: string; role: string; safetyScore: number; avatarUrl: string };
  primaryVehicle: VehicleRow | null;
  frame: VehicleFrame | null;
  kpis: {
    fleetSize: number;
    online: number;
    avgSafety: number;
    openIncidents: number;
    aiUptime: number;
    detections24h: number;
  };
  recentTrips: TripRow[];
  recentAlerts: NotificationRow[];
  detectionLogs: DetectionRow[];
  driverStatuses: DriverStatusRow[];
  accidents: AccidentRow[];
  charts: {
    safetySeries: { label: string; value: number }[];
    detectionSeries: { label: string; objects: number; pedestrians: number; lanes: number }[];
    speedSeries: { label: string; value: number }[];
  };
  systemHealth: { cpu: number; gpu: number; memory: number; latencyMs: number; fps: number };
};

export type CameraPayload = {
  vehicle: VehicleRow | null;
  fleet: VehicleRow[];
  feeds: { id: string; name: string; resolution: string; fps: number; model: string; online: boolean }[];
  frame: VehicleFrame;
  detectionPanel: { key: string; label: string; value: number | string; unit?: string; tone: string }[];
};

export type AiPayload = {
  vehicle: VehicleRow | null;
  fleet: VehicleRow[];
  modules: {
    key: string;
    name: string;
    engine: string;
    icon: string;
    confidence: number;
    status: string;
    detections: number;
    timestamp: string;
  }[];
  frame: VehicleFrame;
  logs: DetectionRow[];
  pipeline: { inferenceEngine: string; models: string[]; fps: number; latencyMs: number; queueDepth: number };
};

export type DriverPayload = {
  active: (DriverStatusRow & { vehicle: VehicleRow | null }) | null;
  live: VehicleFrame["driver"];
  roster: DriverStatusRow[];
  behaviourSeries: { label: string; attention: number; drowsiness: number; fatigue: number }[];
};

export type TrafficPayload = {
  vehicle: VehicleRow | null;
  fleet: VehicleRow[];
  traffic: VehicleFrame["traffic"];
  speed: number;
  signs: { key: string; label: string; action: string; limit: number; detected: boolean; confidence: number }[];
  corridor: { junction: string; congestion: number; signal: string; avgSpeed: number }[];
};

export type GpsPayload = {
  vehicle: VehicleRow | null;
  fleet: { id: number; vehicleNumber: string; lat: number; lng: number; status: string; currentSpeed: number; heading: number }[];
  position: { lat: number; lng: number; heading: number; speed: number };
  destination: { lat: number; lng: number; name: string };
  route: { lat: number; lng: number }[];
  metrics: { speed: number; distanceKm: number; etaMin: number; arrivalAt: string };
  poi: { id: number; name: string; type: string; lat: number; lng: number; etaMin: number }[];
  incidents: { id: number; code: string; lat: number; lng: number; severity: string; address: string }[];
};

export type AccidentListPayload = {
  accidents: (AccidentRow & { vehicle: VehicleRow | null; driver: { id: number; fullName: string; mobile: string } | null })[];
  fleet: VehicleRow[];
  live: VehicleFrame | null;
  stats: { total: number; critical: number; responding: number; avgResponseSec: number };
};

export type AccidentDetailPayload = {
  accident: AccidentRow;
  vehicle: VehicleRow | null;
  driver: UserProfile | null;
  timeline: { id: number; step: number; label: string; description: string; status: string; occurredAt: string }[];
  dispatches: { id: number; service: string; status: string; etaMin: number; notes: string }[];
  detections: DetectionRow[];
  contacts: EmergencyContactRow[];
  evidence: { id: string; type: string; label: string; ref: string; capturedAt: string }[];
};

export type EmergencyContactRow = {
  id: number;
  name: string;
  contactType: string;
  relation: string;
  phone: string;
  address: string;
  lat: number;
  lng: number;
  distanceKm: number;
  etaMin: number;
  available: boolean;
};

export type EmergencyPayload = {
  contacts: EmergencyContactRow[];
  dispatches: { id: number; service: string; status: string; etaMin: number; notes: string; createdAt: string }[];
  activeIncident: (AccidentRow & { vehicle: VehicleRow | null }) | null;
  responseGrid: Record<string, EmergencyContactRow[]>;
  stats: { activeIncidents: number; unitsEnRoute: number; avgEtaMin: number; contactsReachable: number };
};

export type ReportsPayload = {
  reports: {
    id: number;
    name: string;
    format: string;
    scope: string;
    rowCount: number;
    sizeKb: number;
    status: string;
    generatedBy: string;
    createdAt: string;
  }[];
  fleet: VehicleRow[];
  dataset: {
    code: string;
    vehicle: string;
    severity: string;
    confidence: number;
    status: string;
    detectedAt: string;
    address: string;
  }[];
  tripCount: number;
};

export type AnalyticsPayload = {
  kpis: {
    totalIncidents: number;
    avgSafety: number;
    totalDistance: number;
    detections: number;
    preventedCollisions: number;
    responseImprovement: number;
  };
  monthlyAccidents: { label: string; critical: number; accident: number; warning: number }[];
  speedDistribution: { label: string; value: number }[];
  driverSafety: { label: string; value: number }[];
  emergencyEvents: { label: string; dispatched: number; resolved: number }[];
  detectionMix: { label: string; value: number }[];
  vehicleUtilization: { label: string; utilization: number; uptime: number }[];
};

export type NotificationsPayload = { notifications: NotificationRow[]; unread: number };

export type VehicleDetailPayload = {
  vehicle: VehicleRow;
  driver: UserProfile | null;
  trips: TripRow[];
  accidents: AccidentRow[];
  detections: DetectionRow[];
  telemetry: { id: number; speed: number; lat: number; lng: number; recordedAt: string }[];
  driverStatus: DriverStatusRow | null;
  frame: VehicleFrame;
};
