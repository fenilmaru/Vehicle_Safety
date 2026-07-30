/**
 * Deterministic AI edge-simulation engine.
 *
 * In production this module is replaced by the inference gateway that reads
 * YOLO / MediaPipe / TensorFlow results published by the vehicle edge nodes.
 * The contract (frame payload shape) stays identical, so the UI layer never
 * changes when real models are attached.
 */

export type BoundingBox = {
  id: string;
  label: string;
  confidence: number;
  x: number;
  y: number;
  w: number;
  h: number;
  tone: "primary" | "warning" | "danger" | "success";
  engine: string;
};

export type DriverVitals = {
  attention: number;
  drowsiness: number;
  fatigue: number;
  phoneUsage: number;
  seatbelt: boolean;
  eyeStatus: "open" | "half" | "closed";
  heartRate: number;
  blinkRate: number;
};

export type TrafficFrame = {
  signal: "green" | "yellow" | "red";
  signalConfidence: number;
  sign: string;
  signConfidence: number;
  speedLimit: number;
  recommendedSpeed: number;
  congestion: number;
};

export type VehicleFrame = {
  vehicleId: number;
  tick: number;
  timestamp: string;
  speed: number;
  rpm: number;
  throttle: number;
  brake: number;
  lat: number;
  lng: number;
  heading: number;
  lateralOffset: number;
  laneConfidence: number;
  batteryLevel: number;
  cabinTemp: number;
  boxes: BoundingBox[];
  driver: DriverVitals;
  traffic: TrafficFrame;
  severity: "normal" | "warning" | "accident" | "critical";
  safetyScore: number;
  systemHealth: { cpu: number; gpu: number; memory: number; latencyMs: number; fps: number };
};

const TAU = Math.PI * 2;

function wave(tick: number, period: number, phase = 0) {
  return Math.sin((tick / period) * TAU + phase);
}

const OBJECT_POOL: Array<Omit<BoundingBox, "id" | "confidence" | "x" | "y">> = [
  { label: "Vehicle · Sedan", w: 22, h: 24, tone: "primary", engine: "YOLOv8-n" },
  { label: "Vehicle · Truck", w: 28, h: 30, tone: "primary", engine: "YOLOv8-n" },
  { label: "Pedestrian", w: 9, h: 26, tone: "warning", engine: "YOLOv8-pose" },
  { label: "Cyclist", w: 12, h: 22, tone: "warning", engine: "YOLOv8-n" },
  { label: "Traffic Signal", w: 7, h: 14, tone: "success", engine: "TrafficNet" },
  { label: "Stop Sign", w: 8, h: 9, tone: "danger", engine: "SignNet-v3" },
  { label: "Lane Marking", w: 34, h: 8, tone: "success", engine: "LaneNet" },
];

export function buildFrame(vehicleId: number, tick: number, baseLat = 12.9716, baseLng = 77.5946): VehicleFrame {
  const seed = vehicleId * 13.77;
  const speed = Math.max(0, 54 + wave(tick, 37, seed) * 24 + wave(tick, 11, seed * 2) * 6);
  const brake = Math.max(0, -wave(tick, 37, seed) * 40);
  const throttle = Math.max(0, wave(tick, 29, seed) * 62 + 30);

  const boxCount = 2 + Math.floor((wave(tick, 17, seed) + 1) * 1.8);
  const boxes: BoundingBox[] = Array.from({ length: boxCount }, (_, index) => {
    const spec = OBJECT_POOL[(tick + index * 3 + vehicleId) % OBJECT_POOL.length];
    const drift = wave(tick + index * 9, 23, seed + index);
    return {
      ...spec,
      id: `bx-${index}-${spec.label}`,
      confidence: Math.min(0.99, 0.72 + Math.abs(wave(tick + index * 5, 13, seed)) * 0.26),
      x: Math.min(86, Math.max(3, 10 + index * 21 + drift * 6)),
      y: Math.min(70, Math.max(12, 34 + wave(tick + index * 7, 19, seed) * 16)),
    };
  });

  const drowsiness = Math.max(2, Math.round(14 + wave(tick, 53, seed) * 12));
  const attention = Math.min(99, Math.max(46, Math.round(88 - wave(tick, 43, seed) * 14)));
  const phoneUsage = Math.max(0, Math.round(wave(tick, 71, seed) * 18));
  const signalCycle = Math.floor(tick / 12) % 3;
  const signal = (["green", "yellow", "red"] as const)[signalCycle];
  const signs = ["Speed Limit 60", "School Zone", "No Entry", "Stop", "Pedestrian Crossing"];
  const severityScore = drowsiness * 0.6 + (100 - attention) * 0.5 + brake * 0.4;

  const severity: VehicleFrame["severity"] =
    severityScore > 96 ? "critical" : severityScore > 74 ? "accident" : severityScore > 48 ? "warning" : "normal";

  return {
    vehicleId,
    tick,
    timestamp: new Date().toISOString(),
    speed: Number(speed.toFixed(1)),
    rpm: Math.round(900 + speed * 41),
    throttle: Math.round(throttle),
    brake: Math.round(brake),
    lat: Number((baseLat + wave(tick, 90, seed) * 0.012).toFixed(6)),
    lng: Number((baseLng + wave(tick, 110, seed + 1) * 0.014).toFixed(6)),
    heading: Math.round(((tick * 3 + vehicleId * 25) % 360 + 360) % 360),
    lateralOffset: Number((wave(tick, 21, seed) * 0.42).toFixed(2)),
    laneConfidence: Number((0.9 + Math.abs(wave(tick, 15, seed)) * 0.09).toFixed(3)),
    batteryLevel: Math.round(72 + wave(tick, 240, seed) * 18),
    cabinTemp: Number((21.5 + wave(tick, 160, seed) * 2.4).toFixed(1)),
    boxes,
    driver: {
      attention,
      drowsiness,
      fatigue: Math.max(4, Math.round(18 + wave(tick, 61, seed) * 14)),
      phoneUsage,
      seatbelt: Math.abs(wave(tick, 97, seed)) > 0.08,
      eyeStatus: drowsiness > 22 ? "half" : drowsiness > 30 ? "closed" : "open",
      heartRate: Math.round(74 + wave(tick, 33, seed) * 12),
      blinkRate: Math.round(14 + wave(tick, 27, seed) * 6),
    },
    traffic: {
      signal,
      signalConfidence: Number((0.93 + Math.abs(wave(tick, 9, seed)) * 0.06).toFixed(3)),
      sign: signs[Math.floor(tick / 8) % signs.length],
      signConfidence: Number((0.88 + Math.abs(wave(tick, 14, seed)) * 0.11).toFixed(3)),
      speedLimit: [60, 40, 80, 50][Math.floor(tick / 25) % 4],
      recommendedSpeed: Math.round(Math.max(20, speed - 6)),
      congestion: Math.round(38 + wave(tick, 77, seed) * 26),
    },
    severity,
    safetyScore: Math.min(99, Math.max(58, Math.round(94 - severityScore * 0.22))),
    systemHealth: {
      cpu: Math.round(38 + Math.abs(wave(tick, 19, seed)) * 26),
      gpu: Math.round(52 + Math.abs(wave(tick, 23, seed)) * 30),
      memory: Math.round(46 + Math.abs(wave(tick, 31, seed)) * 20),
      latencyMs: Math.round(18 + Math.abs(wave(tick, 12, seed)) * 22),
      fps: Math.round(28 + Math.abs(wave(tick, 8, seed)) * 6),
    },
  };
}

export const AI_MODULES = [
  { key: "object", name: "Object Detection", engine: "YOLOv8", icon: "cube" },
  { key: "lane", name: "Lane Detection", engine: "LaneNet / OpenCV", icon: "road" },
  { key: "sign", name: "Traffic Sign Recognition", engine: "TensorFlow CNN", icon: "sign" },
  { key: "face", name: "Face Recognition", engine: "MediaPipe FaceMesh", icon: "face" },
  { key: "pose", name: "Pose Detection", engine: "MediaPipe BlazePose", icon: "pose" },
  { key: "driver", name: "Driver Monitoring", engine: "PyTorch DMS-Net", icon: "driver" },
  { key: "accident", name: "Accident Detection", engine: "PyTorch CrashNet", icon: "impact" },
] as const;

export function moduleSnapshot(frame: VehicleFrame) {
  return AI_MODULES.map((module, index) => {
    const confidence = Math.min(
      0.99,
      0.74 + Math.abs(Math.sin((frame.tick + index * 6) / 11 + index)) * 0.25,
    );
    const status =
      module.key === "accident"
        ? frame.severity === "normal"
          ? "monitoring"
          : "alert"
        : confidence > 0.8
          ? "active"
          : "calibrating";
    return {
      ...module,
      confidence: Number(confidence.toFixed(3)),
      status,
      detections: 4 + ((frame.tick + index * 5) % 17),
      timestamp: frame.timestamp,
    };
  });
}
