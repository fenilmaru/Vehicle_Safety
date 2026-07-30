"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  FaBolt,
  FaCarSide,
  FaGauge,
  FaHeartPulse,
  FaLocationCrosshairs,
  FaMicrochip,
  FaRoad,
  FaShieldHalved,
  FaTowerBroadcast,
  FaTriangleExclamation,
  FaVideo,
} from "react-icons/fa6";
import { dashboardApi } from "@/api/endpoints";
import { AreaChart, BarChart } from "@/components/ui/Charts";
import { Badge, Card, DataTable, Loader, MeterBar, SectionTitle, StatTile } from "@/components/ui/Primitives";
import { useApi } from "@/hooks/useApi";
import { useAuth } from "@/hooks/useAuth";
import { useAppSelector } from "@/redux/store";
import { CHART_COLORS } from "@/utils/constants";
import { fromNow, kmh, severityTone, statusTone, titleCase } from "@/utils/helpers";
import type { DetectionRow, TripRow } from "@/utils/types";

export default function DashboardPage() {
  const { user } = useAuth();
  const { data, loading } = useApi(() => dashboardApi.overview(), { pollMs: 20000 });
  const frame = useAppSelector((state) => state.dashboard.frame);
  const connection = useAppSelector((state) => state.dashboard.connection);
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const greeting = useMemo(() => {
    const hour = now?.getHours() ?? 9;
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  }, [now]);

  const live = frame ?? data?.frame ?? null;
  const vehicle = data?.primaryVehicle ?? null;

  if (loading && !data) return <Loader label="Booting command grid" />;

  return (
    <div className="space-y-5">
      {/* header */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass neon-ring relative overflow-hidden p-5 sm:p-6"
      >
        <div aria-hidden className="grid-overlay absolute inset-0 opacity-25" />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="m-0 text-xs uppercase tracking-[0.18em] text-muted">{greeting}, operator</p>
            <h1 className="m-0 mt-1 text-[clamp(1.5rem,3.2vw,2.2rem)] font-semibold tracking-tight">
              {user?.fullName ?? data?.operator.name}
            </h1>
            <p className="mono m-0 mt-1 text-xs text-muted" suppressHydrationWarning>
              {now?.toLocaleDateString(undefined, { weekday: "long", day: "2-digit", month: "long", year: "numeric" })} ·{" "}
              <span className="text-[var(--aas-accent)]">{now?.toLocaleTimeString()}</span>
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={connection === "live" ? "success" : "warning"}>
              <FaBolt /> AI {connection === "live" ? "streaming" : connection}
            </Badge>
            <Badge tone={severityTone(live?.severity ?? "normal")}>
              <FaTriangleExclamation /> {(live?.severity ?? "normal").toUpperCase()}
            </Badge>
            <Badge tone="primary">
              <FaCarSide /> {vehicle?.vehicleNumber ?? "—"}
            </Badge>
          </div>
        </div>

        <div className="relative mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="glass-soft p-4">
            <p className="m-0 text-[0.65rem] uppercase tracking-widest text-muted">Current speed</p>
            <p className="m-0 text-3xl font-semibold">
              {Math.round(live?.speed ?? 0)}
              <span className="ml-1 text-sm text-muted">km/h</span>
            </p>
            <MeterBar value={((live?.speed ?? 0) / 120) * 100} tone="primary" />
          </div>
          <div className="glass-soft p-4">
            <p className="m-0 text-[0.65rem] uppercase tracking-widest text-muted">GPS coordinates</p>
            <p className="mono m-0 mt-1 text-sm">
              {live ? `${live.lat.toFixed(5)}°N` : "—"}
              <br />
              {live ? `${live.lng.toFixed(5)}°E` : "—"}
            </p>
            <Link href="/gps" className="mt-2 inline-flex items-center gap-1 text-xs text-[var(--aas-accent)] no-underline">
              <FaLocationCrosshairs /> Open navigation
            </Link>
          </div>
          <div className="glass-soft p-4">
            <p className="m-0 text-[0.65rem] uppercase tracking-widest text-muted">Safety score</p>
            <p className="m-0 text-3xl font-semibold text-[var(--aas-success)]">{live?.safetyScore ?? data?.kpis.avgSafety ?? 0}</p>
            <MeterBar value={live?.safetyScore ?? 90} tone="success" />
          </div>
          <div className="glass-soft p-4">
            <p className="m-0 text-[0.65rem] uppercase tracking-widest text-muted">Emergency status</p>
            <p className="m-0 mt-1 text-lg font-semibold">
              {data?.kpis.openIncidents ? `${data.kpis.openIncidents} active` : "All clear"}
            </p>
            <Link href="/emergency" className="mt-2 inline-flex items-center gap-1 text-xs text-[var(--aas-danger)] no-underline">
              <FaTowerBroadcast /> Emergency center
            </Link>
          </div>
        </div>
      </motion.section>

      {/* kpis */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile label="Fleet nodes" value={data?.kpis.fleetSize ?? 0} delta={`${data?.kpis.online ?? 0} online now`} icon={<FaCarSide />} />
        <StatTile label="Avg safety" value={data?.kpis.avgSafety ?? 0} unit="/100" delta="Fleet weighted" icon={<FaShieldHalved />} tone="success" delay={0.05} />
        <StatTile label="AI uptime" value={data?.kpis.aiUptime ?? 0} unit="%" delta="Inference gateway" icon={<FaMicrochip />} delay={0.1} />
        <StatTile label="Detections 24h" value={data?.kpis.detections24h ?? 0} delta="Across all modules" icon={<FaVideo />} tone="warning" delay={0.15} />
      </section>

      {/* charts */}
      <section className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <SectionTitle title="Safety score trend" subtitle="Rolling 14-day fleet safety index" icon={<FaShieldHalved />} />
          <AreaChart
            labels={data?.charts.safetySeries.map((p) => p.label) ?? []}
            series={[{ label: "Safety", data: data?.charts.safetySeries.map((p) => p.value) ?? [], color: CHART_COLORS.emerald }]}
            height={230}
          />
        </Card>
        <Card delay={0.05}>
          <SectionTitle title="Live vehicle speed" subtitle="Realtime channel feed" icon={<FaGauge />} />
          <AreaChart
            labels={data?.charts.speedSeries.map((p) => p.label) ?? []}
            series={[{ label: "Speed", data: data?.charts.speedSeries.map((p) => p.value) ?? [], color: CHART_COLORS.cyan }]}
            height={230}
          />
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <SectionTitle title="AI detection volume" subtitle="Objects · pedestrians · lanes per 2h window" icon={<FaMicrochip />} />
          <BarChart
            labels={data?.charts.detectionSeries.map((p) => p.label) ?? []}
            series={[
              { label: "Objects", data: data?.charts.detectionSeries.map((p) => p.objects) ?? [], color: CHART_COLORS.cyan },
              { label: "Pedestrians", data: data?.charts.detectionSeries.map((p) => p.pedestrians) ?? [], color: CHART_COLORS.amber },
              { label: "Lanes", data: data?.charts.detectionSeries.map((p) => p.lanes) ?? [], color: CHART_COLORS.violet },
            ]}
            legend
            stacked
            height={250}
          />
        </Card>

        <Card delay={0.05}>
          <SectionTitle title="System health" subtitle="Edge inference node" icon={<FaHeartPulse />} />
          <div className="space-y-4">
            <MeterBar label="CPU" value={live?.systemHealth.cpu ?? data?.systemHealth.cpu ?? 0} tone="primary" />
            <MeterBar label="GPU" value={live?.systemHealth.gpu ?? data?.systemHealth.gpu ?? 0} tone="warning" />
            <MeterBar label="Memory" value={live?.systemHealth.memory ?? data?.systemHealth.memory ?? 0} tone="success" />
            <div className="grid grid-cols-2 gap-3">
              <div className="glass-soft p-3 text-center">
                <p className="m-0 text-[0.62rem] uppercase tracking-widest text-muted">Latency</p>
                <p className="m-0 text-lg font-semibold">{live?.systemHealth.latencyMs ?? 0} ms</p>
              </div>
              <div className="glass-soft p-3 text-center">
                <p className="m-0 text-[0.62rem] uppercase tracking-widest text-muted">Pipeline</p>
                <p className="m-0 text-lg font-semibold">{live?.systemHealth.fps ?? 0} fps</p>
              </div>
            </div>
          </div>
        </Card>
      </section>

      {/* widgets */}
      <section className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <SectionTitle
            title="Recent trips"
            subtitle="Latest journeys across the fleet"
            icon={<FaRoad />}
            action={
              <Link href="/vehicles" className="chip no-underline">
                View fleet
              </Link>
            }
          />
          <DataTable<TripRow>
            columns={[
              { key: "route", header: "Route", render: (row) => <span className="font-medium">{row.origin} → {row.destination}</span> },
              { key: "distance", header: "Distance", render: (row) => `${row.distanceKm.toFixed(1)} km`, hideOnMobile: true },
              { key: "speed", header: "Avg speed", render: (row) => kmh(row.avgSpeed), hideOnMobile: true },
              { key: "safety", header: "Safety", render: (row) => <Badge tone={row.safetyScore > 90 ? "success" : "amber"}>{row.safetyScore}</Badge> },
              { key: "status", header: "Status", render: (row) => <Badge tone={statusTone(row.status)}>{titleCase(row.status)}</Badge> },
            ]}
            rows={data?.recentTrips ?? []}
          />
        </Card>

        <Card delay={0.05}>
          <SectionTitle title="Driver status" subtitle="Live cabin monitoring" icon={<FaHeartPulse />} />
          <ul className="m-0 space-y-3 p-0">
            {(data?.driverStatuses ?? []).slice(0, 4).map((row) => (
              <li key={row.id} className="glass-soft list-none p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-medium">{row.driver?.fullName ?? `Driver #${row.driverId}`}</span>
                  <Badge tone={row.drowsiness > 25 ? "danger" : row.attention < 75 ? "amber" : "success"}>
                    {row.drowsiness > 25 ? "Drowsy" : row.attention < 75 ? "Distracted" : "Alert"}
                  </Badge>
                </div>
                <div className="mt-2 grid grid-cols-3 gap-2 text-[0.68rem] text-muted">
                  <span>Attention {row.attention}%</span>
                  <span>Fatigue {row.fatigue}%</span>
                  <span>{row.seatbelt ? "Belt on" : "Belt off"}</span>
                </div>
                <MeterBar value={row.attention} tone={row.attention > 80 ? "success" : "warning"} />
              </li>
            ))}
          </ul>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <Card>
          <SectionTitle title="Recent alerts" subtitle="Notification stream" icon={<FaTriangleExclamation />} />
          <ul className="m-0 space-y-2 p-0">
            {(data?.recentAlerts ?? []).slice(0, 5).map((alert) => (
              <li key={alert.id} className="glass-soft list-none p-3">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-sm font-medium">{alert.title}</span>
                  <Badge tone={alert.level === "critical" ? "danger" : alert.level === "warning" ? "amber" : "primary"}>
                    {alert.level}
                  </Badge>
                </div>
                <p className="m-0 mt-1 text-xs text-muted">{alert.message}</p>
                <p className="m-0 mt-1 text-[0.65rem] text-muted">{fromNow(alert.createdAt)}</p>
              </li>
            ))}
          </ul>
        </Card>

        <Card delay={0.05}>
          <SectionTitle title="AI detection log" subtitle="Latest inference events" icon={<FaMicrochip />} />
          <ul className="m-0 space-y-2 p-0">
            {(data?.detectionLogs ?? []).slice(0, 6).map((log: DetectionRow) => (
              <li key={log.id} className="flex list-none items-center gap-3 border-b border-white/5 py-2 last:border-0">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-white/5 text-xs text-[var(--aas-accent)]">
                  {log.module.slice(0, 2).toUpperCase()}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm">{log.label}</span>
                  <span className="mono block text-[0.65rem] text-muted">
                    {log.engine} · {(log.confidence * 100).toFixed(1)}% · {fromNow(log.createdAt)}
                  </span>
                </span>
                <Badge tone={severityTone(log.severity)}>{log.severity}</Badge>
              </li>
            ))}
          </ul>
        </Card>

        <Card delay={0.1}>
          <SectionTitle title="Quick actions" subtitle="One-tap command shortcuts" icon={<FaBolt />} />
          <div className="grid grid-cols-2 gap-3">
            {[
              { href: "/camera", label: "Live camera", icon: <FaVideo /> },
              { href: "/ai-detection", label: "AI modules", icon: <FaMicrochip /> },
              { href: "/accidents", label: "Incidents", icon: <FaTriangleExclamation /> },
              { href: "/emergency", label: "Send SOS", icon: <FaTowerBroadcast /> },
              { href: "/gps", label: "Track fleet", icon: <FaLocationCrosshairs /> },
              { href: "/reports", label: "Reports", icon: <FaRoad /> },
            ].map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className="glass-soft flex flex-col items-center gap-2 p-3 text-center text-xs no-underline transition hover:border-[var(--aas-accent)]"
              >
                <span className="text-lg text-[var(--aas-accent)]">{action.icon}</span>
                <span className="text-[var(--aas-text)]">{action.label}</span>
              </Link>
            ))}
          </div>
        </Card>
      </section>
    </div>
  );
}
