"use client";

import { useState } from "react";
import { FaChartLine, FaCarBurst, FaMicrochip, FaRoad, FaShieldHalved, FaTowerBroadcast } from "react-icons/fa6";
import { analyticsApi } from "@/api/endpoints";
import { AreaChart, BarChart, DonutChart, RadarChart } from "@/components/ui/Charts";
import { Card, Loader, SectionTitle, StatTile } from "@/components/ui/Primitives";
import { useApi } from "@/hooks/useApi";
import { CHART_COLORS } from "@/utils/constants";

export default function AnalyticsPage() {
  const [range, setRange] = useState(12);
  const { data, loading } = useApi(() => analyticsApi.overview(range), { deps: [range] });

  if (loading && !data) return <Loader label="Aggregating fleet intelligence" />;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="m-0 text-xl font-semibold tracking-tight">Analytics</h1>
          <p className="m-0 mt-1 text-sm text-muted">Safety, utilisation and AI performance intelligence.</p>
        </div>
        <select className="field !w-auto" aria-label="Range" value={range} onChange={(e) => setRange(Number(e.target.value))}>
          <option value={6}>Last 6 months</option>
          <option value={12}>Last 12 months</option>
        </select>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatTile label="Total incidents" value={data?.kpis.totalIncidents ?? 0} icon={<FaCarBurst />} tone="danger" />
        <StatTile label="Average safety" value={data?.kpis.avgSafety ?? 0} unit="/100" icon={<FaShieldHalved />} tone="success" delay={0.05} />
        <StatTile label="Distance covered" value={(data?.kpis.totalDistance ?? 0).toLocaleString()} unit="km" icon={<FaRoad />} delay={0.1} />
        <StatTile label="AI detections" value={(data?.kpis.detections ?? 0).toLocaleString()} icon={<FaMicrochip />} delay={0.15} />
        <StatTile label="Collisions prevented" value={data?.kpis.preventedCollisions ?? 0} icon={<FaShieldHalved />} tone="success" delay={0.2} />
        <StatTile label="Response improvement" value={data?.kpis.responseImprovement ?? 0} unit="%" icon={<FaTowerBroadcast />} tone="warning" delay={0.25} />
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <SectionTitle title="Monthly accidents" subtitle="Severity distribution over time" icon={<FaCarBurst />} />
          <BarChart
            labels={data?.monthlyAccidents.map((m) => m.label) ?? []}
            series={[
              { label: "Warning", data: data?.monthlyAccidents.map((m) => m.warning) ?? [], color: CHART_COLORS.amber },
              { label: "Accident", data: data?.monthlyAccidents.map((m) => m.accident) ?? [], color: CHART_COLORS.violet },
              { label: "Critical", data: data?.monthlyAccidents.map((m) => m.critical) ?? [], color: CHART_COLORS.rose },
            ]}
            stacked
            legend
            height={280}
          />
        </Card>

        <Card delay={0.05}>
          <SectionTitle title="AI detection mix" subtitle="Class distribution" icon={<FaMicrochip />} />
          <DonutChart
            labels={data?.detectionMix.map((d) => d.label) ?? []}
            values={data?.detectionMix.map((d) => d.value) ?? []}
            colors={[CHART_COLORS.cyan, CHART_COLORS.amber, CHART_COLORS.emerald, CHART_COLORS.violet, CHART_COLORS.rose]}
            height={280}
          />
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <Card>
          <SectionTitle title="Vehicle speed distribution" subtitle="Percentage of fleet kilometres" icon={<FaChartLine />} />
          <BarChart
            labels={data?.speedDistribution.map((s) => s.label) ?? []}
            series={[{ label: "Share", data: data?.speedDistribution.map((s) => s.value) ?? [], color: CHART_COLORS.cyan }]}
            height={250}
          />
        </Card>

        <Card delay={0.05}>
          <SectionTitle title="Driver safety index" subtitle="Per vehicle node" icon={<FaShieldHalved />} />
          <RadarChart
            labels={data?.driverSafety.map((d) => d.label) ?? []}
            values={data?.driverSafety.map((d) => d.value) ?? []}
            color={CHART_COLORS.emerald}
            height={250}
          />
        </Card>

        <Card delay={0.1}>
          <SectionTitle title="Emergency events" subtitle="Dispatched vs resolved" icon={<FaTowerBroadcast />} />
          <AreaChart
            labels={data?.emergencyEvents.map((e) => e.label) ?? []}
            series={[
              { label: "Dispatched", data: data?.emergencyEvents.map((e) => e.dispatched) ?? [], color: CHART_COLORS.rose },
              { label: "Resolved", data: data?.emergencyEvents.map((e) => e.resolved) ?? [], color: CHART_COLORS.emerald },
            ]}
            legend
            height={250}
          />
        </Card>
      </section>

      <Card delay={0.15}>
        <SectionTitle title="Vehicle utilisation" subtitle="Duty cycle and uptime" icon={<FaRoad />} />
        <BarChart
          labels={data?.vehicleUtilization.map((v) => v.label) ?? []}
          series={[
            { label: "Utilisation", data: data?.vehicleUtilization.map((v) => v.utilization) ?? [], color: CHART_COLORS.violet },
            { label: "Uptime", data: data?.vehicleUtilization.map((v) => v.uptime) ?? [], color: CHART_COLORS.cyan },
          ]}
          legend
          height={280}
        />
      </Card>
    </div>
  );
}
