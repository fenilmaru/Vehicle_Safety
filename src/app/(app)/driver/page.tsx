"use client";

import { FaEye, FaHeartPulse, FaMobileScreen, FaUserShield } from "react-icons/fa6";
import { driverApi } from "@/api/endpoints";
import { AreaChart } from "@/components/ui/Charts";
import { Badge, Card, DataTable, Loader, MeterBar, ProgressRing, SectionTitle } from "@/components/ui/Primitives";
import { useApi } from "@/hooks/useApi";
import { useAppSelector } from "@/redux/store";
import { CHART_COLORS } from "@/utils/constants";
import { fromNow, titleCase } from "@/utils/helpers";
import type { DriverStatusRow } from "@/utils/types";

export default function DriverMonitoringPage() {
  const { data, loading } = useApi(() => driverApi.monitoring(), { pollMs: 12000 });
  const frame = useAppSelector((state) => state.dashboard.frame);
  const live = frame?.driver ?? data?.live ?? null;

  if (loading && !data) return <Loader label="Reading cabin sensors" />;

  const attention = live?.attention ?? 0;
  const drowsiness = live?.drowsiness ?? 0;
  const fatigue = live?.fatigue ?? 0;
  const phone = live?.phoneUsage ?? 0;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="m-0 text-xl font-semibold tracking-tight">Driver monitoring</h1>
        <p className="m-0 mt-1 text-sm text-muted">
          MediaPipe FaceMesh + BlazePose fused with PyTorch DMS-Net for cabin wellness scoring.
        </p>
      </div>

      <section className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <Card>
          <SectionTitle
            title={data?.active?.driver?.fullName ?? "Active driver"}
            subtitle={`${data?.active?.vehicle?.vehicleNumber ?? "—"} · updated ${fromNow(data?.active?.recordedAt)}`}
            icon={<FaUserShield />}
            action={
              <Badge tone={drowsiness > 25 ? "danger" : attention < 70 ? "amber" : "success"}>
                {drowsiness > 25 ? "Drowsiness alert" : attention < 70 ? "Attention low" : "Nominal"}
              </Badge>
            }
          />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <ProgressRing value={attention} label="Attention" sub="Gaze tracking" tone="success" />
            <ProgressRing value={drowsiness} label="Drowsiness" sub="PERCLOS" tone="danger" />
            <ProgressRing value={fatigue} label="Fatigue" sub="Micro-sleep risk" tone="warning" />
            <ProgressRing value={phone} label="Phone usage" sub="Pose classifier" tone="primary" />
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="glass-soft flex items-center gap-3 p-3">
              <FaEye className="text-[var(--aas-accent)]" />
              <div>
                <p className="m-0 text-[0.62rem] uppercase tracking-widest text-muted">Eye status</p>
                <p className="m-0 text-sm font-semibold">{titleCase(live?.eyeStatus ?? "open")}</p>
              </div>
            </div>
            <div className="glass-soft flex items-center gap-3 p-3">
              <FaHeartPulse className="text-[var(--aas-danger)]" />
              <div>
                <p className="m-0 text-[0.62rem] uppercase tracking-widest text-muted">Heart rate</p>
                <p className="m-0 text-sm font-semibold">{live?.heartRate ?? 0} bpm</p>
              </div>
            </div>
            <div className="glass-soft flex items-center gap-3 p-3">
              <FaMobileScreen className={live?.seatbelt ? "text-[var(--aas-success)]" : "text-[var(--aas-danger)]"} />
              <div>
                <p className="m-0 text-[0.62rem] uppercase tracking-widest text-muted">Seat belt</p>
                <p className="m-0 text-sm font-semibold">{live?.seatbelt ? "Fastened" : "Unfastened"}</p>
              </div>
            </div>
          </div>
        </Card>

        <Card delay={0.05}>
          <SectionTitle title="Behaviour trend" subtitle="Last 60 minutes" icon={<FaHeartPulse />} />
          <AreaChart
            labels={data?.behaviourSeries.map((p) => p.label) ?? []}
            series={[
              { label: "Attention", data: data?.behaviourSeries.map((p) => p.attention) ?? [], color: CHART_COLORS.emerald },
              { label: "Drowsiness", data: data?.behaviourSeries.map((p) => p.drowsiness) ?? [], color: CHART_COLORS.rose },
              { label: "Fatigue", data: data?.behaviourSeries.map((p) => p.fatigue) ?? [], color: CHART_COLORS.amber },
            ]}
            legend
            height={260}
          />
        </Card>
      </section>

      <Card delay={0.1}>
        <SectionTitle title="Driver roster" subtitle="Fleet-wide cabin status" icon={<FaUserShield />} />
        <DataTable<DriverStatusRow>
          columns={[
            { key: "driver", header: "Driver", render: (row) => <span className="font-medium">{row.driver?.fullName ?? `#${row.driverId}`}</span> },
            { key: "vehicle", header: "Vehicle", render: (row) => row.vehicle?.vehicleNumber ?? "—", hideOnMobile: true },
            { key: "attention", header: "Attention", render: (row) => <div className="w-24"><MeterBar value={row.attention} tone={row.attention > 80 ? "success" : "warning"} /></div> },
            { key: "drowsy", header: "Drowsiness", render: (row) => <Badge tone={row.drowsiness > 25 ? "danger" : "success"}>{row.drowsiness}%</Badge> },
            { key: "belt", header: "Belt", render: (row) => <Badge tone={row.seatbelt ? "success" : "danger"}>{row.seatbelt ? "On" : "Off"}</Badge>, hideOnMobile: true },
            { key: "hr", header: "Heart rate", render: (row) => `${row.heartRate} bpm`, hideOnMobile: true },
          ]}
          rows={data?.roster ?? []}
        />
      </Card>
    </div>
  );
}
