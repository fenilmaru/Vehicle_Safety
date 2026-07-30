"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "react-toastify";
import { FaCarBurst, FaFileLines, FaTowerBroadcast, FaTriangleExclamation } from "react-icons/fa6";
import { accidentApi, emergencyApi, reportApi } from "@/api/endpoints";
import { CameraStage } from "@/components/camera/CameraStage";
import { Badge, Button, Card, DataTable, Loader, MeterBar, SectionTitle, StatTile } from "@/components/ui/Primitives";
import { useApi } from "@/hooks/useApi";
import { useAppSelector } from "@/redux/store";
import { formatDate, fromNow, severityTone, titleCase } from "@/utils/helpers";
import type { AccidentRow, VehicleRow } from "@/utils/types";

type Row = AccidentRow & { vehicle: VehicleRow | null; driver: { id: number; fullName: string; mobile: string } | null };

export default function AccidentDetectionPage() {
  const router = useRouter();
  const [severity, setSeverity] = useState("");
  const { data, loading, refetch } = useApi(() => accidentApi.list({ severity }), { pollMs: 15000, deps: [severity] });
  const frame = useAppSelector((state) => state.dashboard.frame);
  const live = frame ?? data?.live ?? null;

  if (loading && !data) return <Loader label="Analysing impact signatures" />;

  const sendEmergency = async (accidentId: number, vehicleId: number) => {
    try {
      await emergencyApi.trigger({ action: "sos", accidentId, vehicleId, service: "ambulance" });
      toast.success("SOS transmitted to regional emergency gateway");
      void refetch();
    } catch {
      toast.error("Dispatch failed — retry from Emergency Center");
    }
  };

  const generateReport = async (row: Row) => {
    try {
      await reportApi.create({ name: `Incident report ${row.code}`, scope: "accidents", format: "pdf", rowCount: 1 });
      toast.success(`Report queued for ${row.code}`);
    } catch {
      toast.error("Report service unavailable");
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="m-0 text-xl font-semibold tracking-tight">Accident detection</h1>
          <p className="m-0 mt-1 text-sm text-muted">CrashNet impact classification with autonomous response chain.</p>
        </div>
        <select className="field !w-auto" aria-label="Filter severity" value={severity} onChange={(e) => setSeverity(e.target.value)}>
          <option value="">All severities</option>
          {["normal", "warning", "accident", "critical"].map((option) => (
            <option key={option} value={option}>{titleCase(option)}</option>
          ))}
        </select>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile label="Total incidents" value={data?.stats.total ?? 0} icon={<FaCarBurst />} />
        <StatTile label="Critical" value={data?.stats.critical ?? 0} icon={<FaTriangleExclamation />} tone="danger" delay={0.05} />
        <StatTile label="Responding" value={data?.stats.responding ?? 0} icon={<FaTowerBroadcast />} tone="warning" delay={0.1} />
        <StatTile label="Avg response" value={data?.stats.avgResponseSec ?? 0} unit="s" icon={<FaFileLines />} tone="success" delay={0.15} />
      </section>

      <div className="grid gap-4 xl:grid-cols-[1.35fr_1fr]">
        <Card className="!p-3">
          <CameraStage frame={live} feedName="Impact monitor · Front ADAS" height="clamp(230px, 40vw, 380px)" />
        </Card>

        <Card delay={0.05}>
          <SectionTitle
            title="Live severity assessment"
            subtitle="Realtime CrashNet inference"
            icon={<FaTriangleExclamation />}
            action={<Badge tone={severityTone(live?.severity ?? "normal")}>{(live?.severity ?? "normal").toUpperCase()}</Badge>}
          />
          <div className="space-y-3">
            <MeterBar label="Detection confidence" value={94} tone="primary" />
            <MeterBar label="Driver risk index" value={live?.driver.drowsiness ?? 0} tone="danger" />
            <MeterBar label="Braking intensity" value={live?.brake ?? 0} tone="warning" />
            <div className="grid grid-cols-2 gap-3 text-xs text-muted">
              <div className="glass-soft p-3">
                <p className="m-0 text-[0.6rem] uppercase tracking-widest">Vehicle</p>
                <p className="m-0 text-sm text-[var(--aas-text)]">{data?.fleet[0]?.vehicleNumber ?? "—"}</p>
              </div>
              <div className="glass-soft p-3">
                <p className="m-0 text-[0.6rem] uppercase tracking-widest">GPS</p>
                <p className="mono m-0 text-sm text-[var(--aas-text)]">
                  {live ? `${live.lat.toFixed(3)}, ${live.lng.toFixed(3)}` : "—"}
                </p>
              </div>
              <div className="glass-soft p-3">
                <p className="m-0 text-[0.6rem] uppercase tracking-widest">Speed</p>
                <p className="m-0 text-sm text-[var(--aas-text)]">{Math.round(live?.speed ?? 0)} km/h</p>
              </div>
              <div className="glass-soft p-3">
                <p className="m-0 text-[0.6rem] uppercase tracking-widest">Timestamp</p>
                <p className="m-0 text-sm text-[var(--aas-text)]" suppressHydrationWarning>
                  {live ? new Date(live.timestamp).toLocaleTimeString() : "—"}
                </p>
              </div>
            </div>
            <Button
              variant="danger"
              className="w-full"
              onClick={async () => {
                try {
                  const created = await accidentApi.create({
                    vehicleId: data?.fleet[0]?.id ?? 1,
                    severity: "critical",
                    lat: live?.lat,
                    lng: live?.lng,
                    confidence: 0.96,
                  });
                  toast.error(`Critical event ${created.code} registered`);
                  router.push(`/accidents/${created.id}`);
                } catch {
                  toast.error("Unable to register incident");
                }
              }}
            >
              <FaTriangleExclamation /> Simulate critical impact
            </Button>
          </div>
        </Card>
      </div>

      <Card delay={0.1}>
        <SectionTitle title="Incident register" subtitle="All detected events" icon={<FaCarBurst />} />
        <DataTable<Row>
          columns={[
            {
              key: "code",
              header: "Code",
              render: (row) => (
                <Link href={`/accidents/${row.id}`} className="mono text-[var(--aas-accent)] no-underline">
                  {row.code}
                </Link>
              ),
            },
            { key: "vehicle", header: "Vehicle", render: (row) => row.vehicle?.vehicleNumber ?? "—", hideOnMobile: true },
            { key: "driver", header: "Driver", render: (row) => row.driver?.fullName ?? "—", hideOnMobile: true },
            { key: "severity", header: "Severity", render: (row) => <Badge tone={severityTone(row.severity)}>{row.severity}</Badge> },
            { key: "status", header: "Status", render: (row) => <Badge tone={row.status === "responding" ? "warning" : "success"}>{titleCase(row.status)}</Badge> },
            { key: "detected", header: "Detected", render: (row) => <span className="text-xs text-muted">{formatDate(row.detectedAt, "DD MMM · HH:mm")}<br />{fromNow(row.detectedAt)}</span>, hideOnMobile: true },
            {
              key: "actions",
              header: "Actions",
              render: (row) => (
                <div className="flex flex-wrap gap-1">
                  <Link href={`/accidents/${row.id}`} className="chip no-underline">Details</Link>
                  <button className="chip chip-primary" onClick={() => void generateReport(row)}>Report</button>
                  <button className="chip chip-danger" onClick={() => void sendEmergency(row.id, row.vehicleId)}>SOS</button>
                </div>
              ),
            },
          ]}
          rows={data?.accidents ?? []}
          empty="No incidents recorded for the selected filter."
        />
      </Card>
    </div>
  );
}
