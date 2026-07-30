"use client";

import { useState } from "react";
import { FaCamera, FaMicrochip, FaVideo } from "react-icons/fa6";
import { cameraApi } from "@/api/endpoints";
import { CameraStage } from "@/components/camera/CameraStage";
import { Badge, Card, Loader, MeterBar, SectionTitle } from "@/components/ui/Primitives";
import { useApi } from "@/hooks/useApi";
import { useAppSelector } from "@/redux/store";
import { confidencePct, formatTime } from "@/utils/helpers";

export default function LiveCameraPage() {
  const [vehicleId, setVehicleId] = useState<number | undefined>(undefined);
  const [activeFeed, setActiveFeed] = useState("front");
  const { data, loading } = useApi(() => cameraApi.feed(vehicleId), { pollMs: 6000, deps: [vehicleId] });
  const liveFrame = useAppSelector((state) => state.dashboard.frame);
  const frame = liveFrame ?? data?.frame ?? null;

  if (loading && !data) return <Loader label="Opening camera tunnels" />;

  const feed = data?.feeds.find((f) => f.id === activeFeed) ?? data?.feeds[0];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="m-0 text-xl font-semibold tracking-tight">Live camera</h1>
          <p className="m-0 mt-1 text-sm text-muted">Multi-angle ADAS streams with real-time inference overlays.</p>
        </div>
        <select
          className="field !w-auto"
          aria-label="Select vehicle"
          value={vehicleId ?? data?.vehicle?.id ?? ""}
          onChange={(event) => setVehicleId(Number(event.target.value))}
        >
          {data?.fleet.map((vehicle) => (
            <option key={vehicle.id} value={vehicle.id}>
              {vehicle.vehicleNumber} · {vehicle.model}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
        <div className="min-w-0 space-y-4">
          <CameraStage frame={frame} feedName={feed?.name ?? "Front ADAS"} />

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {(data?.feeds ?? []).map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveFeed(item.id)}
                className={`glass-soft p-3 text-left transition ${activeFeed === item.id ? "border-[var(--aas-accent)]" : ""}`}
                aria-pressed={activeFeed === item.id}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[0.7rem] font-semibold">{item.name}</span>
                  <span className={`h-2 w-2 rounded-full ${item.online ? "bg-[var(--aas-success)]" : "bg-[var(--aas-danger)]"}`} />
                </div>
                <p className="mono m-0 mt-1 text-[0.6rem] text-muted">{item.resolution} · {item.fps}fps</p>
                <p className="m-0 text-[0.6rem] text-muted">{item.model}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <Card>
            <SectionTitle title="Detection panel" subtitle="Per-class inference summary" icon={<FaMicrochip />} />
            <ul className="m-0 space-y-2 p-0">
              {(data?.detectionPanel ?? []).map((item) => (
                <li key={item.key} className="flex list-none items-center justify-between gap-3 border-b border-white/5 py-2 last:border-0">
                  <span className="text-sm">{item.label}</span>
                  <Badge tone={item.tone}>
                    {item.value}
                    {item.unit ?? ""}
                  </Badge>
                </li>
              ))}
            </ul>
          </Card>

          <Card delay={0.05}>
            <SectionTitle title="Frame telemetry" subtitle={`Captured ${formatTime(frame?.timestamp)}`} icon={<FaCamera />} />
            <div className="space-y-3">
              <MeterBar label="Lane confidence" value={(frame?.laneConfidence ?? 0) * 100} tone="success" />
              <MeterBar label="Driver attention" value={frame?.driver.attention ?? 0} tone="primary" />
              <MeterBar label="Drowsiness risk" value={frame?.driver.drowsiness ?? 0} tone="danger" />
              <div className="grid grid-cols-2 gap-2 text-xs text-muted">
                <span>Throttle {frame?.throttle ?? 0}%</span>
                <span>Brake {frame?.brake ?? 0}%</span>
                <span>Heading {frame?.heading ?? 0}°</span>
                <span>Cabin {frame?.cabinTemp ?? 0}°C</span>
              </div>
            </div>
          </Card>

          <Card delay={0.1}>
            <SectionTitle title="Tracked objects" subtitle="Current frame" icon={<FaVideo />} />
            <ul className="m-0 space-y-2 p-0">
              {(frame?.boxes ?? []).map((box) => (
                <li key={box.id} className="glass-soft flex list-none items-center justify-between gap-2 px-3 py-2">
                  <span className="min-w-0">
                    <span className="block truncate text-sm">{box.label}</span>
                    <span className="mono block text-[0.62rem] text-muted">{box.engine}</span>
                  </span>
                  <Badge tone={box.tone === "danger" ? "danger" : box.tone === "warning" ? "amber" : "primary"}>
                    {confidencePct(box.confidence)}
                  </Badge>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
