import type { VehicleFrame } from "@/lib/simulation";

export type ChannelEvent =
  | "connected"
  | "frame"
  | "vehicle_speed"
  | "gps_location"
  | "object_detected"
  | "pedestrian_detected"
  | "lane_detected"
  | "traffic_signal"
  | "driver_status"
  | "seatbelt_status"
  | "accident_detected"
  | "emergency_alert";

export type ChannelMessage<T = Record<string, unknown>> = { event: ChannelEvent; data: T; at: number };

type Listener = (message: ChannelMessage) => void;

/**
 * Vehicle realtime channel.
 *
 * Mirrors the Django Channels endpoint `ws://host/ws/vehicle/<id>/`.
 * When `NEXT_PUBLIC_WS_URL` is configured the native WebSocket transport is
 * used; otherwise the platform falls back to the SSE bridge exposed at
 * `/api/stream/<id>` so behaviour is identical for consumers.
 */
export class VehicleChannel {
  private source: EventSource | null = null;
  private socket: WebSocket | null = null;
  private listeners = new Set<Listener>();
  private retry = 0;
  private disposed = false;

  constructor(private vehicleId: number) {}

  connect() {
    const wsBase = process.env.NEXT_PUBLIC_WS_URL;
    if (wsBase) {
      this.socket = new WebSocket(`${wsBase.replace(/\/$/, "")}/ws/vehicle/${this.vehicleId}/`);
      this.socket.onmessage = (raw) => {
        try {
          const parsed = JSON.parse(raw.data) as { event: ChannelEvent; data: Record<string, unknown> };
          this.emit(parsed.event, parsed.data);
        } catch {
          /* ignore malformed frame */
        }
      };
      this.socket.onclose = () => this.scheduleReconnect();
      return;
    }

    const source = new EventSource(`/api/stream/${this.vehicleId}`);
    this.source = source;
    const events: ChannelEvent[] = [
      "connected",
      "frame",
      "vehicle_speed",
      "gps_location",
      "object_detected",
      "lane_detected",
      "traffic_signal",
      "driver_status",
      "seatbelt_status",
      "accident_detected",
      "emergency_alert",
    ];
    events.forEach((event) => {
      source.addEventListener(event, (raw) => {
        try {
          this.retry = 0;
          this.emit(event, JSON.parse((raw as MessageEvent).data));
        } catch {
          /* ignore */
        }
      });
    });
    source.onerror = () => {
      source.close();
      this.source = null;
      this.scheduleReconnect();
    };
  }

  private scheduleReconnect() {
    if (this.disposed) return;
    this.retry += 1;
    const delay = Math.min(15000, 1000 * 2 ** this.retry);
    setTimeout(() => !this.disposed && this.connect(), delay);
  }

  private emit(event: ChannelEvent, data: Record<string, unknown>) {
    const message: ChannelMessage = { event, data, at: Date.now() };
    this.listeners.forEach((listener) => listener(message));
  }

  subscribe(listener: Listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  close() {
    this.disposed = true;
    this.source?.close();
    this.socket?.close();
    this.listeners.clear();
  }
}

export type { VehicleFrame };
