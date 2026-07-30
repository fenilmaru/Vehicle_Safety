"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  FaCarBurst,
  FaCube,
  FaFaceSmile,
  FaMicrochip,
  FaPersonWalking,
  FaRoad,
  FaSignsPost,
  FaUserShield,
} from "react-icons/fa6";
import { aiApi } from "@/api/endpoints";
import { Badge, Card, DataTable, Loader, MeterBar, SectionTitle } from "@/components/ui/Primitives";
import { useApi } from "@/hooks/useApi";
import { useAppSelector } from "@/redux/store";
import { confidencePct, fromNow, severityTone, titleCase } from "@/utils/helpers";
import type { DetectionRow } from "@/utils/types";

const MODULE_ICONS: Record<string, React.ReactNode> = {
  object: <FaCube />,
  lane: <FaRoad />,
  sign: <FaSignsPost />,
  face: <FaFaceSmile />,
  pose: <FaPersonWalking />,
  driver: <FaUserShield />,
  accident: <FaCarBurst />,
};

export default function AiDetectionPage() {
  const [vehicleId, setVehicleId] = useState<number | undefined>(undefined);
  const { data, loading } = useApi(() => aiApi.snapshot(vehicleId), { pollMs: 8000, deps: [vehicleId] });
  const liveFrame = useAppSelector((state) => state.dashboard.frame);
  const frame = liveFrame ?? data?.frame ?? null;

  if (loading && !data) return <Loader label="Warming inference engines" />;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="m-0 text-xl font-semibold tracking-tight">AI detection</h1>
          <p className="m-0 mt-1 text-sm text-muted">Model-level status across the perception stack.</p>
        </div>
        <select
          className="field !w-auto"
          aria-label="Select vehicle"
          value={vehicleId ?? data?.vehicle?.id ?? ""}
          onChange={(event) => setVehicleId(Number(event.target.value))}
        >
          {data?.fleet.map((vehicle) => (
            <option key={vehicle.id} value={vehicle.id}>
              {vehicle.vehicleNumber}
            </option>
          ))}
        </select>
      </div>

      <Card>
        <SectionTitle
          title="Inference pipeline"
          subtitle={data?.pipeline.inferenceEngine}
          icon={<FaMicrochip />}
          action={<Badge tone="primary">{data?.pipeline.fps ?? 0} FPS · {data?.pipeline.latencyMs ?? 0} ms</Badge>}
        />
        <div className="flex flex-wrap gap-2">
          {(data?.pipeline.models ?? []).map((model) => (
            <span key={model} className="chip chip-primary">{model}</span>
          ))}
        </div>
      </Card>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {(data?.modules ?? []).map((module, index) => (
          <motion.article
            key={module.key}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="glass glass-hover relative overflow-hidden p-4"
          >
            <div className="flex items-start justify-between gap-2">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white/5 text-lg text-[var(--aas-accent)]">
                {MODULE_ICONS[module.key] ?? <FaMicrochip />}
              </span>
              <Badge tone={module.status === "alert" ? "danger" : module.status === "active" ? "success" : "amber"}>
                {module.status}
              </Badge>
            </div>
            <h3 className="mt-3 text-sm font-semibold">{module.name}</h3>
            <p className="mono m-0 text-[0.65rem] text-muted">{module.engine}</p>
            <div className="mt-3">
              <MeterBar label="Confidence" value={module.confidence * 100} tone={module.confidence > 0.9 ? "success" : "primary"} />
            </div>
            <div className="mt-3 flex items-center justify-between text-[0.65rem] text-muted">
              <span>{module.detections} detections</span>
              <span suppressHydrationWarning>{new Date(module.timestamp).toLocaleTimeString()}</span>
            </div>
          </motion.article>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <SectionTitle title="Detection log" subtitle="Persisted inference events" icon={<FaCube />} />
          <DataTable<DetectionRow>
            columns={[
              { key: "label", header: "Event", render: (row) => <span className="font-medium">{row.label}</span> },
              { key: "module", header: "Module", render: (row) => titleCase(row.module), hideOnMobile: true },
              { key: "engine", header: "Engine", render: (row) => <span className="mono text-xs">{row.engine}</span>, hideOnMobile: true },
              { key: "confidence", header: "Confidence", render: (row) => confidencePct(row.confidence) },
              { key: "severity", header: "Severity", render: (row) => <Badge tone={severityTone(row.severity)}>{row.severity}</Badge> },
              { key: "time", header: "When", render: (row) => <span className="text-xs text-muted">{fromNow(row.createdAt)}</span>, hideOnMobile: true },
            ]}
            rows={data?.logs ?? []}
            empty="No inference events recorded for this vehicle yet."
          />
        </Card>

        <Card delay={0.05}>
          <SectionTitle title="Current frame classes" subtitle="Streaming channel" icon={<FaPersonWalking />} />
          <ul className="m-0 space-y-2 p-0">
            {(frame?.boxes ?? []).map((box) => (
              <li key={box.id} className="glass-soft list-none px-3 py-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm">{box.label}</span>
                  <span className="mono text-xs text-[var(--aas-accent)]">{confidencePct(box.confidence)}</span>
                </div>
                <MeterBar value={box.confidence * 100} tone={box.tone === "danger" ? "danger" : "primary"} />
              </li>
            ))}
          </ul>
        </Card>
      </section>
    </div>
  );
}
