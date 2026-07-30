import { http } from "@/api/httpClient";
import type {
  AiPayload,
  AnalyticsPayload,
  AccidentDetailPayload,
  AccidentListPayload,
  AuthPayload,
  CameraPayload,
  DashboardPayload,
  DriverPayload,
  EmergencyPayload,
  GpsPayload,
  NotificationsPayload,
  ReportsPayload,
  SettingsRow,
  SessionPayload,
  TrafficPayload,
  VehicleDetailPayload,
  VehicleWithDriver,
} from "@/utils/types";

/* ---------------------------------- auth --------------------------------- */
export const authApi = {
  login: (identifier: string, password: string) =>
    http.post<AuthPayload>("/auth/login", { identifier, password }),
  register: (payload: Record<string, unknown>) => http.post<AuthPayload>("/auth/register", payload),
  logout: () => http.post<{ loggedOut: boolean }>("/auth/logout"),
  me: () => http.get<SessionPayload>("/auth/me"),
  updateProfile: (payload: Record<string, unknown>) => http.patch<SessionPayload>("/auth/me", payload),
  forgotPassword: (email: string) => http.post<{ dispatched: boolean; hint: string }>("/auth/forgot-password", { email }),
  biometric: (mode: "face" | "fingerprint", sample: string, enroll = false) =>
    http.post<{ verified?: boolean; enrolled?: boolean; confidence: number; engine?: string }>("/auth/biometric", {
      mode,
      sample,
      enroll,
    }),
};

/* -------------------------------- dashboard ------------------------------- */
export const dashboardApi = {
  overview: () => http.get<DashboardPayload>("/dashboard"),
};

/* --------------------------------- vehicles ------------------------------- */
export const vehicleApi = {
  list: (params?: { q?: string; status?: string }) => http.get<VehicleWithDriver[]>("/vehicles", params),
  detail: (id: number) => http.get<VehicleDetailPayload>(`/vehicles/${id}`),
  create: (payload: Record<string, unknown>) => http.post<VehicleWithDriver>("/vehicles", payload),
  update: (id: number, payload: Record<string, unknown>) => http.patch<VehicleWithDriver>(`/vehicles/${id}`, payload),
  remove: (id: number) => http.delete<{ deleted: number }>(`/vehicles/${id}`),
};

/* ------------------------------ ai + monitoring --------------------------- */
export const aiApi = {
  snapshot: (vehicleId?: number) => http.get<AiPayload>("/ai", { vehicleId }),
  log: (payload: Record<string, unknown>) => http.post<unknown>("/ai", payload),
};
export const cameraApi = { feed: (vehicleId?: number) => http.get<CameraPayload>("/camera", { vehicleId }) };
export const driverApi = { monitoring: (driverId?: number) => http.get<DriverPayload>("/driver", { driverId }) };
export const trafficApi = { snapshot: (vehicleId?: number) => http.get<TrafficPayload>("/traffic", { vehicleId }) };
export const gpsApi = { track: (vehicleId?: number) => http.get<GpsPayload>("/gps", { vehicleId }) };

/* --------------------------------- safety --------------------------------- */
export const accidentApi = {
  list: (params?: { severity?: string; vehicleId?: number }) => http.get<AccidentListPayload>("/accidents", params),
  detail: (id: number) => http.get<AccidentDetailPayload>(`/accidents/${id}`),
  create: (payload: Record<string, unknown>) => http.post<{ id: number; code: string }>("/accidents", payload),
  update: (id: number, payload: Record<string, unknown>) => http.patch<unknown>(`/accidents/${id}`, payload),
};

export const emergencyApi = {
  center: () => http.get<EmergencyPayload>("/emergency"),
  trigger: (payload: Record<string, unknown>) => http.post<{ acknowledgedAt: string }>("/emergency", payload),
};

/* ------------------------------ reporting layer --------------------------- */
export const reportApi = {
  list: () => http.get<ReportsPayload>("/reports"),
  create: (payload: Record<string, unknown>) => http.post<unknown>("/reports", payload),
  exportUrl: (params: Record<string, string>) => `/api/reports/export?${new URLSearchParams(params).toString()}`,
};

export const analyticsApi = { overview: (range = 12) => http.get<AnalyticsPayload>("/analytics", { range }) };

export const notificationApi = {
  list: () => http.get<NotificationsPayload>("/notifications"),
  markRead: (id?: number) => http.patch<unknown>("/notifications", id ? { id } : { all: true }),
};

export const settingsApi = {
  get: () => http.get<SettingsRow>("/settings"),
  update: (payload: Record<string, unknown>) => http.put<SettingsRow>("/settings", payload),
};
