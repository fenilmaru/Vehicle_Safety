import { buildFrame } from "@/lib/simulation";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Realtime channel — mirrors the Django Channels contract
 * `ws://host/ws/vehicle/<vehicle_id>/` using Server-Sent Events so the same
 * event names can be consumed by the browser client without a socket server.
 */
export async function GET(request: Request, { params }: { params: Promise<{ vehicleId: string }> }) {
  const vehicleId = Number((await params).vehicleId) || 1;
  const encoder = new TextEncoder();
  let tick = Math.floor(Date.now() / 1000) % 600;

  const stream = new ReadableStream({
    start(controller) {
      let closed = false;
      const send = (event: string, payload: unknown) => {
        if (closed) return;
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`));
      };

      const push = () => {
        tick += 1;
        const frame = buildFrame(vehicleId, tick);
        send("vehicle_speed", { vehicleId, speed: frame.speed, rpm: frame.rpm, throttle: frame.throttle, brake: frame.brake });
        send("gps_location", { vehicleId, lat: frame.lat, lng: frame.lng, heading: frame.heading });
        send("object_detected", { vehicleId, boxes: frame.boxes, timestamp: frame.timestamp });
        send("lane_detected", { vehicleId, confidence: frame.laneConfidence, offset: frame.lateralOffset });
        send("driver_status", { vehicleId, ...frame.driver });
        send("seatbelt_status", { vehicleId, fastened: frame.driver.seatbelt });
        send("traffic_signal", { vehicleId, ...frame.traffic });
        send("frame", frame);

        if (frame.severity === "accident" || frame.severity === "critical") {
          send("accident_detected", {
            vehicleId,
            severity: frame.severity,
            confidence: 0.94,
            lat: frame.lat,
            lng: frame.lng,
            timestamp: frame.timestamp,
          });
          if (frame.severity === "critical") {
            send("emergency_alert", {
              vehicleId,
              message: "Critical impact signature — autonomous SOS protocol engaged",
              timestamp: frame.timestamp,
            });
          }
        }
      };

      send("connected", { vehicleId, channel: `vehicle/${vehicleId}`, protocol: "sse-1.0" });
      push();
      const interval = setInterval(push, 1500);

      const close = () => {
        if (closed) return;
        closed = true;
        clearInterval(interval);
        try {
          controller.close();
        } catch {
          /* stream already closed */
        }
      };

      request.signal.addEventListener("abort", close);
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "text/event-stream; charset=utf-8",
      "cache-control": "no-cache, no-transform",
      connection: "keep-alive",
      "x-accel-buffering": "no",
    },
  });
}
