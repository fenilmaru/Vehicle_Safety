"use client";

import Link from "next/link";
import { use } from "react";
import {
  FaBatteryFull,
  FaCarBurst,
  FaCarSide,
  FaGauge,
  FaMicrochip,
  FaRoad,
  FaUserShield,
} from "react-icons/fa6";
import { vehicleApi } from "@/api/endpoints";
import { AreaChart } from "@/components/ui/Charts";
import { Badge, Card, DataTable, Loader, MeterBar, ProgressRing, SectionTitle, StatTile } from "@/components/ui/Primitives";
import { useApi } from "@/hooks/useApi";
import { CHART_COLORS } from "@/utils/constants";
import { confidencePct, formatDate, fromNow, kmh, severityTone, statusTone, titleCase } from "@/utils/helpers";
import type { AccidentRow, DetectionRow, TripRow } from "@/utils/types";

export default function VehicleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const vehicleId = Number(id);
  const { data, loading } = useApi(() => vehicleApi.detail(vehicleId), { pollMs: 15000, deps: [vehicleId] });

  if (loading && !data) return <Loader label="Fetching vehicle node" />;
  if (!data) return <p className="text-muted">Vehicle not found.</p>;

  const { vehicle, driver, frame, driverStatus } = data;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <Link href="/vehicles" className="text-xs text-muted no-underline hover:text-[var(--aas-accent)]">
            ← Back to fleet
          </Link>
          <h1 className="m-0 mt-1 text-xl font-semibold tracking-tight">{vehicle.vehicleNumber}</h1>
          <p className="m-0 text-sm text-muted">
            {vehicle.manufacturer} {vehicle.model} · {vehicle.year} · Autonomy L{vehicle.autonomyLevel}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge tone={statusTone(vehicle.status)}>{titleCase(vehicle.status)}</Badge>
          <Badge tone="primary">{titleCase(vehicle.vehicleType)}</Badge>
          <Badge tone={severityTone(frame.severity)}>{frame.severity.toUpperCase()}</Badge>
        </div>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile label="Live speed" value={Math.round(frame.speed)} unit="km/h" icon={<FaGauge />} />
        <StatTile label="Battery" value={vehicle.batteryLevel} unit="%" icon={<FaBatteryFull />} tone="success" delay={0.05} />
        <StatTile label="Odometer" value={Math.round(vehicle.odometerKm).toLocaleString()} unit="km" icon={<FaRoad />} delay={0.1} />
        <StatTile label="Safety score" value={vehicle.safetyScore} unit="/100" icon={<FaCarSide />} tone="warning" delay={0.15} />
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <SectionTitle title="Speed history" subtitle="Last 24 telemetry samples" icon={<FaGauge />} />
          <AreaChart
            labels={data.telemetry.map((t) => new Date(t.recordedAt).getHours() + "h")}
            series={[{ label: "Speed", data: data.telemetry.map((t) => Math.round(t.speed)), color: CHART_COLORS.cyan }]}
            height={240}
          />
        </Card>

        <Card delay={0.05}>
          <SectionTitle title="Assigned driver" subtitle="Cabin monitoring snapshot" icon={<FaUserShield />} />
          {driver ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-[var(--aas-accent)] to-[var(--aas-accent-2)] text-sm font-bold text-[var(--aas-on-accent)]">
                  {driver.fullName.split(" ").map((n) => n[0]).join("")}
                </span>
                <div className="min-w-0">
                  <p className="m-0 truncate text-sm font-semibold">{driver.fullName}</p>
                  <p className="m-0 truncate text-xs text-muted">{titleCase(driver.role)} · {driver.mobile}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <ProgressRing value={driverStatus?.attention ?? frame.driver.attention} label="Attention" size={98} tone="success" />
                <ProgressRing value={driverStatus?.drowsiness ?? frame.driver.drowsiness} label="Drowsiness" size={98} tone="danger" />
              </div>
              <MeterBar label="Driver safety score" value={driver.safetyScore} tone="primary" />
            </div>
          ) : (
            <p className="text-sm text-muted">No driver assigned to this node.</p>
          )}
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <Card>
          <SectionTitle title="Trip history" subtitle="Recent journeys" icon={<FaRoad />} />
          <DataTable<TripRow>
            columns={[
              { key: "route", header: "Route", render: (row) => `${row.origin} → ${row.destination}` },
              { key: "distance", header: "Distance", render: (row) => `${row.distanceKm.toFixed(1)} km`, hideOnMobile: true },
              { key: "avg", header: "Avg", render: (row) => kmh(row.avgSpeed), hideOnMobile: true },
              { key: "score", header: "Score", render: (row) => <Badge tone={row.safetyScore > 90 ? "success" : "amber"}>{row.safetyScore}</Badge> },
            ]}
            rows={data.trips}
            empty="No trips logged for this vehicle."
          />
        </Card>

        <Card delay={0.05}>
          <SectionTitle title="Accident history" subtitle="Impact and near-miss records" icon={<FaCarBurst />} />
          <DataTable<AccidentRow>
            columns={[
              { key: "code", header: "Code", render: (row) => <Link href={`/accidents/${row.id}`} className="text-[var(--aas-accent)] no-underline">{row.code}</Link> },
              { key: "severity", header: "Severity", render: (row) => <Badge tone={severityTone(row.severity)}>{row.severity}</Badge> },
              { key: "impact", header: "Impact", render: (row) => `${row.impactG.toFixed(1)}G`, hideOnMobile: true },
              { key: "when", header: "Detected", render: (row) => <span className="text-xs text-muted">{formatDate(row.detectedAt, "DD MMM · HH:mm")}</span> },
            ]}
            rows={data.accidents}
            empty="Zero recorded incidents — excellent record."
          />
        </Card>
      </section>

      <Card delay={0.1}>
        <SectionTitle title="AI detection history" subtitle="Inference events attributed to this node" icon={<FaMicrochip />} />
        <DataTable<DetectionRow>
          columns={[
            { key: "label", header: "Event", render: (row) => row.label },
            { key: "module", header: "Module", render: (row) => titleCase(row.module), hideOnMobile: true },
            { key: "engine", header: "Engine", render: (row) => <span className="mono text-xs">{row.engine}</span>, hideOnMobile: true },
            { key: "confidence", header: "Confidence", render: (row) => confidencePct(row.confidence) },
            { key: "severity", header: "Severity", render: (row) => <Badge tone={severityTone(row.severity)}>{row.severity}</Badge> },
            { key: "when", header: "When", render: (row) => <span className="text-xs text-muted">{fromNow(row.createdAt)}</span>, hideOnMobile: true },
          ]}
          rows={data.detections}
          empty="No AI events captured yet."
        />
      </Card>
    </div>
  );
}
