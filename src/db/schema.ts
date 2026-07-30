import {
  boolean,
  doublePrecision,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

/* ------------------------------------------------------------------ */
/* Identity & Access                                                    */
/* ------------------------------------------------------------------ */

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  fullName: varchar("full_name", { length: 160 }).notNull(),
  username: varchar("username", { length: 80 }).notNull().unique(),
  email: varchar("email", { length: 180 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  mobile: varchar("mobile", { length: 40 }).notNull().default(""),
  role: varchar("role", { length: 40 }).notNull().default("driver"),
  vehicleNumber: varchar("vehicle_number", { length: 40 }).notNull().default(""),
  avatarUrl: text("avatar_url").notNull().default(""),
  faceEnrolled: boolean("face_enrolled").notNull().default(false),
  fingerprintEnrolled: boolean("fingerprint_enrolled").notNull().default(false),
  faceSignature: varchar("face_signature", { length: 64 }).notNull().default(""),
  fingerprintSignature: varchar("fingerprint_signature", { length: 64 }).notNull().default(""),
  safetyScore: integer("safety_score").notNull().default(92),
  status: varchar("status", { length: 24 }).notNull().default("active"),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  theme: varchar("theme", { length: 24 }).notNull().default("midnight"),
  accent: varchar("accent", { length: 24 }).notNull().default("cyan"),
  units: varchar("units", { length: 12 }).notNull().default("metric"),
  autonomyLevel: integer("autonomy_level").notNull().default(3),
  aiSensitivity: integer("ai_sensitivity").notNull().default(78),
  emergencyAutoDispatch: boolean("emergency_auto_dispatch").notNull().default(true),
  notifyEmail: boolean("notify_email").notNull().default(true),
  notifySms: boolean("notify_sms").notNull().default(true),
  notifyPush: boolean("notify_push").notNull().default(true),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/* ------------------------------------------------------------------ */
/* Fleet                                                                */
/* ------------------------------------------------------------------ */

export const vehicles = pgTable("vehicles", {
  id: serial("id").primaryKey(),
  vehicleNumber: varchar("vehicle_number", { length: 40 }).notNull().unique(),
  model: varchar("model", { length: 120 }).notNull(),
  manufacturer: varchar("manufacturer", { length: 120 }).notNull().default(""),
  year: integer("year").notNull().default(2025),
  vehicleType: varchar("vehicle_type", { length: 40 }).notNull().default("sedan"),
  status: varchar("status", { length: 24 }).notNull().default("online"),
  autonomyLevel: integer("autonomy_level").notNull().default(3),
  driverId: integer("driver_id"),
  currentSpeed: doublePrecision("current_speed").notNull().default(0),
  batteryLevel: integer("battery_level").notNull().default(88),
  odometerKm: doublePrecision("odometer_km").notNull().default(0),
  safetyScore: integer("safety_score").notNull().default(90),
  lat: doublePrecision("lat").notNull().default(12.9716),
  lng: doublePrecision("lng").notNull().default(77.5946),
  heading: doublePrecision("heading").notNull().default(0),
  aiModules: jsonb("ai_modules").$type<string[]>().notNull().default([]),
  lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const trips = pgTable("trips", {
  id: serial("id").primaryKey(),
  vehicleId: integer("vehicle_id").notNull(),
  driverId: integer("driver_id"),
  origin: varchar("origin", { length: 160 }).notNull().default(""),
  destination: varchar("destination", { length: 160 }).notNull().default(""),
  distanceKm: doublePrecision("distance_km").notNull().default(0),
  avgSpeed: doublePrecision("avg_speed").notNull().default(0),
  maxSpeed: doublePrecision("max_speed").notNull().default(0),
  safetyScore: integer("safety_score").notNull().default(90),
  durationMin: integer("duration_min").notNull().default(0),
  status: varchar("status", { length: 24 }).notNull().default("completed"),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
  endedAt: timestamp("ended_at", { withTimezone: true }),
});

export const telemetry = pgTable("telemetry", {
  id: serial("id").primaryKey(),
  vehicleId: integer("vehicle_id").notNull(),
  speed: doublePrecision("speed").notNull().default(0),
  lat: doublePrecision("lat").notNull().default(0),
  lng: doublePrecision("lng").notNull().default(0),
  heading: doublePrecision("heading").notNull().default(0),
  throttle: doublePrecision("throttle").notNull().default(0),
  brake: doublePrecision("brake").notNull().default(0),
  recordedAt: timestamp("recorded_at", { withTimezone: true }).notNull().defaultNow(),
});

/* ------------------------------------------------------------------ */
/* AI layer                                                             */
/* ------------------------------------------------------------------ */

export const detections = pgTable("detections", {
  id: serial("id").primaryKey(),
  vehicleId: integer("vehicle_id").notNull(),
  module: varchar("module", { length: 48 }).notNull(),
  label: varchar("label", { length: 96 }).notNull(),
  confidence: doublePrecision("confidence").notNull().default(0),
  severity: varchar("severity", { length: 24 }).notNull().default("normal"),
  engine: varchar("engine", { length: 40 }).notNull().default("YOLOv8"),
  frameRef: varchar("frame_ref", { length: 80 }).notNull().default(""),
  meta: jsonb("meta").$type<Record<string, unknown>>().notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const driverStatus = pgTable("driver_status", {
  id: serial("id").primaryKey(),
  driverId: integer("driver_id").notNull(),
  vehicleId: integer("vehicle_id").notNull(),
  attention: integer("attention").notNull().default(90),
  drowsiness: integer("drowsiness").notNull().default(8),
  fatigue: integer("fatigue").notNull().default(12),
  phoneUsage: integer("phone_usage").notNull().default(0),
  seatbelt: boolean("seatbelt").notNull().default(true),
  eyeStatus: varchar("eye_status", { length: 24 }).notNull().default("open"),
  heartRate: integer("heart_rate").notNull().default(76),
  recordedAt: timestamp("recorded_at", { withTimezone: true }).notNull().defaultNow(),
});

/* ------------------------------------------------------------------ */
/* Safety events                                                        */
/* ------------------------------------------------------------------ */

export const accidents = pgTable("accidents", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 32 }).notNull().unique(),
  vehicleId: integer("vehicle_id").notNull(),
  driverId: integer("driver_id"),
  severity: varchar("severity", { length: 24 }).notNull().default("warning"),
  confidence: doublePrecision("confidence").notNull().default(0),
  impactG: doublePrecision("impact_g").notNull().default(0),
  airbagDeployed: boolean("airbag_deployed").notNull().default(false),
  lat: doublePrecision("lat").notNull().default(0),
  lng: doublePrecision("lng").notNull().default(0),
  address: varchar("address", { length: 220 }).notNull().default(""),
  status: varchar("status", { length: 32 }).notNull().default("open"),
  description: text("description").notNull().default(""),
  responseTimeSec: integer("response_time_sec").notNull().default(0),
  detectedAt: timestamp("detected_at", { withTimezone: true }).notNull().defaultNow(),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
});

export const accidentTimeline = pgTable("accident_timeline", {
  id: serial("id").primaryKey(),
  accidentId: integer("accident_id").notNull(),
  step: integer("step").notNull().default(0),
  label: varchar("label", { length: 120 }).notNull(),
  description: text("description").notNull().default(""),
  status: varchar("status", { length: 24 }).notNull().default("done"),
  occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull().defaultNow(),
});

export const emergencyContacts = pgTable("emergency_contacts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),
  name: varchar("name", { length: 140 }).notNull(),
  contactType: varchar("contact_type", { length: 32 }).notNull().default("family"),
  relation: varchar("relation", { length: 60 }).notNull().default(""),
  phone: varchar("phone", { length: 40 }).notNull().default(""),
  address: varchar("address", { length: 220 }).notNull().default(""),
  lat: doublePrecision("lat").notNull().default(0),
  lng: doublePrecision("lng").notNull().default(0),
  distanceKm: doublePrecision("distance_km").notNull().default(0),
  etaMin: integer("eta_min").notNull().default(0),
  available: boolean("available").notNull().default(true),
});

export const dispatches = pgTable("dispatches", {
  id: serial("id").primaryKey(),
  accidentId: integer("accident_id"),
  vehicleId: integer("vehicle_id"),
  service: varchar("service", { length: 40 }).notNull(),
  status: varchar("status", { length: 32 }).notNull().default("dispatched"),
  etaMin: integer("eta_min").notNull().default(6),
  notes: text("notes").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),
  vehicleId: integer("vehicle_id"),
  title: varchar("title", { length: 160 }).notNull(),
  message: text("message").notNull().default(""),
  level: varchar("level", { length: 24 }).notNull().default("info"),
  category: varchar("category", { length: 40 }).notNull().default("system"),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const reports = pgTable("reports", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 180 }).notNull(),
  format: varchar("format", { length: 12 }).notNull().default("pdf"),
  scope: varchar("scope", { length: 40 }).notNull().default("accidents"),
  filters: jsonb("filters").$type<Record<string, unknown>>().notNull().default({}),
  rowCount: integer("row_count").notNull().default(0),
  sizeKb: integer("size_kb").notNull().default(0),
  status: varchar("status", { length: 24 }).notNull().default("ready"),
  generatedBy: varchar("generated_by", { length: 120 }).notNull().default("system"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type User = typeof users.$inferSelect;
export type Vehicle = typeof vehicles.$inferSelect;
export type Accident = typeof accidents.$inferSelect;
export type Detection = typeof detections.$inferSelect;
export type NotificationRow = typeof notifications.$inferSelect;
