"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { FaGaugeHigh, FaSignsPost, FaTrafficLight } from "react-icons/fa6";
import { trafficApi } from "@/api/endpoints";
import { Badge, Card, DataTable, Loader, MeterBar, SectionTitle } from "@/components/ui/Primitives";
import { useApi } from "@/hooks/useApi";
import { useAppSelector } from "@/redux/store";
import { confidencePct, titleCase } from "@/utils/helpers";

type Corridor = { junction: string; congestion: number; signal: string; avgSpeed: number; id?: string };

export default function TrafficMonitoringPage() {
  const [vehicleId, setVehicleId] = useState<number | undefined>(undefined);
  const { data, loading } = useApi(() => trafficApi.snapshot(vehicleId), { pollMs: 7000, deps: [vehicleId] });
  const frame = useAppSelector((state) => state.dashboard.frame);
  const traffic = frame?.traffic ?? data?.traffic ?? null;

  if (loading && !data) return <Loader label="Scanning traffic corridor" />;

  const signal = traffic?.signal ?? "green";

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="m-0 text-xl font-semibold tracking-tight">Traffic monitoring</h1>
          <p className="m-0 mt-1 text-sm text-muted">Signal state, sign recognition and corridor congestion.</p>
        </div>
        <select
          className="field !w-auto"
          aria-label="Select vehicle"
          value={vehicleId ?? data?.vehicle?.id ?? ""}
          onChange={(event) => setVehicleId(Number(event.target.value))}
        >
          {data?.fleet.map((vehicle) => (
            <option key={vehicle.id} value={vehicle.id}>{vehicle.vehicleNumber}</option>
          ))}
        </select>
      </div>

      <section className="grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
        <Card>
          <SectionTitle title="Traffic signal" subtitle={`Confidence ${confidencePct(traffic?.signalConfidence ?? 0)}`} icon={<FaTrafficLight />} />
          <div className="flex items-center gap-6">
            <div className="flex flex-col gap-3 rounded-3xl border border-white/10 bg-[#060b16] p-4">
              {(["red", "yellow", "green"] as const).map((color) => {
                const active = signal === color;
                const hex = color === "red" ? "#fb7185" : color === "yellow" ? "#fbbf24" : "#34d399";
                return (
                  <motion.span
                    key={color}
                    animate={{ opacity: active ? 1 : 0.18, scale: active ? 1.05 : 1 }}
                    transition={{ duration: 0.3 }}
                    className="h-12 w-12 rounded-full"
                    style={{ background: hex, boxShadow: active ? `0 0 26px ${hex}` : "none" }}
                    aria-label={`${color} light ${active ? "active" : "inactive"}`}
                  />
                );
              })}
            </div>
            <div className="min-w-0 flex-1 space-y-3">
              <div>
                <p className="m-0 text-[0.62rem] uppercase tracking-widest text-muted">Current state</p>
                <p className="m-0 text-2xl font-semibold" style={{ color: signal === "red" ? "#fb7185" : signal === "yellow" ? "#fbbf24" : "#34d399" }}>
                  {signal.toUpperCase()}
                </p>
              </div>
              <MeterBar label="Signal confidence" value={(traffic?.signalConfidence ?? 0) * 100} tone="primary" />
              <MeterBar label="Corridor congestion" value={traffic?.congestion ?? 0} tone="warning" />
            </div>
          </div>
        </Card>

        <Card delay={0.05}>
          <SectionTitle title="Detected sign" subtitle="TensorFlow CNN classifier" icon={<FaSignsPost />} />
          <div className="grid gap-4 sm:grid-cols-[auto_1fr] sm:items-center">
            <div className="grid h-28 w-28 place-items-center rounded-2xl border-2 border-[var(--aas-accent)] bg-[rgba(34,211,238,0.08)] text-center">
              <span className="px-2 text-sm font-bold text-[var(--aas-accent)]">{traffic?.sign ?? "—"}</span>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="glass-soft p-3">
                  <p className="m-0 text-[0.62rem] uppercase tracking-widest text-muted">Speed limit</p>
                  <p className="m-0 text-xl font-semibold">{traffic?.speedLimit ?? 0} km/h</p>
                </div>
                <div className="glass-soft p-3">
                  <p className="m-0 text-[0.62rem] uppercase tracking-widest text-muted">Recommended</p>
                  <p className="m-0 text-xl font-semibold text-[var(--aas-success)]">{traffic?.recommendedSpeed ?? 0} km/h</p>
                </div>
              </div>
              <MeterBar label="Sign confidence" value={(traffic?.signConfidence ?? 0) * 100} tone="success" />
              <div className="flex items-center gap-2 text-xs text-muted">
                <FaGaugeHigh className="text-[var(--aas-accent)]" /> Vehicle speed {Math.round(frame?.speed ?? data?.speed ?? 0)} km/h
              </div>
            </div>
          </div>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <Card>
          <SectionTitle title="Sign library" subtitle="Recognition status" icon={<FaSignsPost />} />
          <div className="grid gap-3 sm:grid-cols-2">
            {(data?.signs ?? []).map((sign) => (
              <div key={sign.key} className={`glass-soft p-3 ${sign.detected ? "border-[var(--aas-accent)]" : ""}`}>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium">{sign.label}</span>
                  <Badge tone={sign.detected ? "success" : "muted"}>{sign.detected ? "Detected" : "Idle"}</Badge>
                </div>
                <p className="m-0 mt-1 text-xs text-muted">{sign.action}</p>
                <MeterBar value={sign.confidence * 100} tone={sign.detected ? "success" : "primary"} />
              </div>
            ))}
          </div>
        </Card>

        <Card delay={0.05}>
          <SectionTitle title="Corridor telemetry" subtitle="Junction-level congestion" icon={<FaTrafficLight />} />
          <DataTable<Corridor>
            columns={[
              { key: "junction", header: "Junction", render: (row) => row.junction },
              { key: "signal", header: "Signal", render: (row) => <Badge tone={row.signal === "red" ? "danger" : row.signal === "yellow" ? "amber" : "success"}>{titleCase(row.signal)}</Badge> },
              { key: "congestion", header: "Congestion", render: (row) => <div className="w-24"><MeterBar value={row.congestion} tone={row.congestion > 70 ? "danger" : "warning"} /></div> },
              { key: "speed", header: "Avg speed", render: (row) => `${row.avgSpeed} km/h`, hideOnMobile: true },
            ]}
            rows={(data?.corridor ?? []).map((c, index) => ({ ...c, id: `${c.junction}-${index}` }))}
          />
        </Card>
      </section>
    </div>
  );
}
