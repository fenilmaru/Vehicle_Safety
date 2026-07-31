"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { use } from "react";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import {
  FaCarBurst,
  FaCircleCheck,
  FaFileLines,
  FaHospital,
  FaPlay,
  FaTowerBroadcast,
  FaUserShield,
} from "react-icons/fa6";
import { accidentApi, emergencyApi, reportApi } from "@/api/endpoints";
import { Badge, Button, Card, Loader, MeterBar, SectionTitle } from "@/components/ui/Primitives";
import { useApi } from "@/hooks/useApi";
import { confidencePct, formatDate, formatTime, severityTone, titleCase } from "@/utils/helpers";

const MapView = dynamic(() => import("@/components/gps/MapView"), {
  ssr: false,
  loading: () => <div className="skeleton h-[300px] w-full" />,
});

export default function AccidentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const accidentId = Number(id);
  const { data, loading, refetch } = useApi(() => accidentApi.detail(accidentId), { pollMs: 20000, deps: [accidentId] });

  if (loading && !data) return <Loader label="Reconstructing incident" />;
  if (!data) return <p className="text-muted">Incident not found.</p>;

  const { accident, vehicle, driver, timeline, dispatches, detections, evidence, contacts } = data;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <Link href="/accidents" className="text-xs text-muted no-underline hover:text-[var(--aas-accent)]">
            ← Incident register
          </Link>
          <h1 className="mono m-0 mt-1 text-xl font-semibold tracking-tight">{accident.code}</h1>
          <p className="m-0 text-sm text-muted">{accident.address}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge tone={severityTone(accident.severity)}>{accident.severity.toUpperCase()}</Badge>
          <Badge tone={accident.status === "responding" ? "warning" : "success"}>{titleCase(accident.status)}</Badge>
          <Badge tone="primary">{confidencePct(accident.confidence)} confidence</Badge>
        </div>
      </div>

      <section className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <SectionTitle title="Incident summary" subtitle={formatDate(accident.detectedAt, "DD MMM YYYY · HH:mm:ss")} icon={<FaCarBurst />} />
          <p className="m-0 text-sm text-muted">{accident.description}</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-4">
            {[
              { label: "Impact force", value: `${accident.impactG.toFixed(1)} G` },
              { label: "Airbags", value: accident.airbagDeployed ? "Deployed" : "Not deployed" },
              { label: "Response time", value: `${accident.responseTimeSec}s` },
              { label: "Resolved", value: accident.resolvedAt ? formatDate(accident.resolvedAt, "DD MMM HH:mm") : "In progress" },
            ].map((item) => (
              <div key={item.label} className="glass-soft p-3">
                <p className="m-0 text-[0.6rem] uppercase tracking-widest text-muted">{item.label}</p>
                <p className="m-0 mt-1 text-sm font-semibold">{item.value}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              variant="danger"
              onClick={async () => {
                await emergencyApi.trigger({ action: "sos", accidentId, vehicleId: accident.vehicleId });
                toast.success("Emergency broadcast re-sent");
              }}
            >
              <FaTowerBroadcast /> Send emergency
            </Button>
            <Button
              variant="ghost"
              onClick={async () => {
                await reportApi.create({ name: `Incident report ${accident.code}`, scope: "accidents", format: "pdf", rowCount: 1 });
                toast.success("Incident report generated");
              }}
            >
              <FaFileLines /> Generate report
            </Button>
            {accident.status !== "resolved" ? (
              <Button
                variant="ghost"
                onClick={async () => {
                  await accidentApi.update(accidentId, { status: "resolved" });
                  toast.success("Incident marked resolved");
                  void refetch();
                }}
              >
                <FaCircleCheck /> Mark resolved
              </Button>
            ) : null}
          </div>
        </Card>

        <Card delay={0.05}>
          <SectionTitle title="Vehicle & driver" subtitle="Registered node details" icon={<FaUserShield />} />
          <div className="space-y-3 text-sm">
            <div className="glass-soft p-3">
              <p className="m-0 text-[0.6rem] uppercase tracking-widest text-muted">Vehicle</p>
              <p className="m-0 font-semibold">{vehicle?.vehicleNumber ?? "—"}</p>
              <p className="m-0 text-xs text-muted">{vehicle?.manufacturer} {vehicle?.model} · L{vehicle?.autonomyLevel}</p>
            </div>
            <div className="glass-soft p-3">
              <p className="m-0 text-[0.6rem] uppercase tracking-widest text-muted">Driver</p>
              <p className="m-0 font-semibold">{driver?.fullName ?? "Unassigned"}</p>
              <p className="m-0 text-xs text-muted">{driver?.mobile} · {titleCase(driver?.role ?? "—")}</p>
            </div>
            <MeterBar label="Vehicle safety score" value={vehicle?.safetyScore ?? 0} tone="success" />
            <MeterBar label="Driver safety score" value={driver?.safetyScore ?? 0} tone="primary" />
          </div>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.2fr_1fr]">
        <Card>
          <SectionTitle title="Response timeline" subtitle="Autonomous protocol execution" icon={<FaTowerBroadcast />} />
          <ol className="relative m-0 list-none space-y-4 p-0 pl-6">
            <span aria-hidden className="absolute left-2 top-1 h-[calc(100%-8px)] w-px bg-gradient-to-b from-[var(--aas-accent)] to-transparent" />
            {timeline.map((step, index) => (
              <motion.li
                key={step.id}
                initial={{ opacity: 0, x: 18 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="relative"
              >
                <span
                  className="absolute -left-[18px] top-1 h-3 w-3 rounded-full border-2"
                  style={{
                    background: step.status === "active" ? "var(--aas-warning)" : "var(--aas-accent)",
                    borderColor: "var(--aas-bg)",
                    boxShadow: "0 0 12px currentColor",
                  }}
                />
                <p className="m-0 text-sm font-semibold">{step.label}</p>
                <p className="m-0 text-xs text-muted">{step.description}</p>
                <p className="mono m-0 text-[0.65rem] text-muted">{formatTime(step.occurredAt)}</p>
              </motion.li>
            ))}
          </ol>
        </Card>

        <Card delay={0.05} className="!p-3">
          <MapView
            center={{ lat: accident.lat, lng: accident.lng }}
            points={[
              { lat: accident.lat, lng: accident.lng, label: accident.code, type: "incident", meta: accident.address },
              ...contacts
                .filter((c) => ["hospital", "police", "ambulance"].includes(c.contactType))
                .map((c) => ({ lat: c.lat, lng: c.lng, label: c.name, type: c.contactType, meta: `ETA ${c.etaMin} min` })),
            ]}
            height={320}
            zoom={13}
            follow={false}
          />
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <Card>
          <SectionTitle title="Emergency response" subtitle="Dispatched units" icon={<FaHospital />} />
          <ul className="m-0 space-y-2 p-0">
            {dispatches.map((dispatch) => (
              <li key={dispatch.id} className="glass-soft list-none px-3 py-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium">{titleCase(dispatch.service)}</span>
                  <Badge tone={dispatch.status === "en_route" ? "warning" : "success"}>{titleCase(dispatch.status)}</Badge>
                </div>
                <p className="m-0 mt-1 text-xs text-muted">{dispatch.notes}</p>
                <p className="m-0 text-[0.65rem] text-muted">ETA {dispatch.etaMin} min</p>
              </li>
            ))}
            {!dispatches.length ? <p className="text-sm text-muted">No units dispatched for this incident.</p> : null}
          </ul>
        </Card>

        <Card delay={0.05}>
          <SectionTitle title="AI detection result" subtitle="Correlated inference events" icon={<FaCarBurst />} />
          <ul className="m-0 space-y-2 p-0">
            {detections.map((detection) => (
              <li key={detection.id} className="flex list-none items-center justify-between gap-2 border-b border-white/5 py-2 last:border-0">
                <span className="min-w-0">
                  <span className="block truncate text-sm">{detection.label}</span>
                  <span className="mono block text-[0.62rem] text-muted">{detection.engine}</span>
                </span>
                <Badge tone={severityTone(detection.severity)}>{confidencePct(detection.confidence)}</Badge>
              </li>
            ))}
          </ul>
        </Card>

        <Card delay={0.1}>
          <SectionTitle title="Evidence locker" subtitle="Frames, clips and CAN snapshots" icon={<FaPlay />} />
          <div className="grid grid-cols-2 gap-3">
            {evidence.map((item) => (
              <div key={item.id} className="glass-soft overflow-hidden">
                <div className="relative grid h-20 place-items-center bg-[#060b16]">
                  <div aria-hidden className="grid-overlay absolute inset-0 opacity-40" />
                  <span className="relative text-xl text-[var(--aas-accent)]">
                    {item.type === "video" ? <FaPlay /> : item.type === "telemetry" ? <FaFileLines /> : <FaCarBurst />}
                  </span>
                </div>
                <div className="p-2">
                  <p className="m-0 truncate text-[0.7rem] font-medium">{item.label}</p>
                  <p className="mono m-0 text-[0.6rem] text-muted">{item.ref}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </section>
    </div>
  );
}
