"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { FaClock, FaGaugeHigh, FaLocationCrosshairs, FaMapLocationDot, FaRoad } from "react-icons/fa6";
import { gpsApi } from "@/api/endpoints";
import { Badge, Card, Loader, SectionTitle, StatTile } from "@/components/ui/Primitives";
import type { MapPoint } from "@/components/gps/MapView";
import { useApi } from "@/hooks/useApi";
import { useAppSelector } from "@/redux/store";
import { formatTime, titleCase } from "@/utils/helpers";

const MapView = dynamic(() => import("@/components/gps/MapView"), {
  ssr: false,
  loading: () => <div className="skeleton h-[420px] w-full" />,
});

export default function GpsPage() {
  const [vehicleId, setVehicleId] = useState<number | undefined>(undefined);
  const { data, loading } = useApi(() => gpsApi.track(vehicleId), { pollMs: 9000, deps: [vehicleId] });
  const frame = useAppSelector((state) => state.dashboard.frame);

  if (loading && !data) return <Loader label="Acquiring satellite lock" />;
  if (!data) return null;

  const position = frame ? { lat: frame.lat, lng: frame.lng, heading: frame.heading, speed: frame.speed } : data.position;

  const points: MapPoint[] = [
    { lat: position.lat, lng: position.lng, label: data.vehicle?.vehicleNumber ?? "Vehicle", type: "vehicle", meta: `${Math.round(position.speed)} km/h` },
    { lat: data.destination.lat, lng: data.destination.lng, label: data.destination.name, type: "destination" },
    ...data.poi.map((p) => ({ lat: p.lat, lng: p.lng, label: p.name, type: p.type, meta: `ETA ${p.etaMin} min` })),
    ...data.incidents.map((i) => ({ lat: i.lat, lng: i.lng, label: i.code, type: "incident", meta: i.address })),
    ...data.fleet
      .filter((v) => v.id !== (data.vehicle?.id ?? 0))
      .map((v) => ({ lat: v.lat, lng: v.lng, label: v.vehicleNumber, type: "fleet", meta: titleCase(v.status) })),
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="m-0 text-xl font-semibold tracking-tight">GPS navigation</h1>
          <p className="m-0 mt-1 text-sm text-muted">Live route, responders and incident overlays.</p>
        </div>
        <select
          className="field !w-auto"
          aria-label="Select vehicle"
          value={vehicleId ?? data.vehicle?.id ?? ""}
          onChange={(event) => setVehicleId(Number(event.target.value))}
        >
          {data.fleet.map((vehicle) => (
            <option key={vehicle.id} value={vehicle.id}>{vehicle.vehicleNumber}</option>
          ))}
        </select>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile label="Speed" value={Math.round(position.speed)} unit="km/h" icon={<FaGaugeHigh />} />
        <StatTile label="Distance remaining" value={data.metrics.distanceKm} unit="km" icon={<FaRoad />} tone="success" delay={0.05} />
        <StatTile label="ETA" value={data.metrics.etaMin} unit="min" icon={<FaClock />} tone="warning" delay={0.1} />
        <StatTile label="Arrival" value={formatTime(data.metrics.arrivalAt)} icon={<FaLocationCrosshairs />} delay={0.15} />
      </section>

      <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <Card className="!p-3">
          <MapView center={{ lat: position.lat, lng: position.lng }} points={points} route={data.route} height={460} />
        </Card>

        <div className="space-y-4">
          <Card delay={0.05}>
            <SectionTitle title="Active route" subtitle={`Destination · ${data.destination.name}`} icon={<FaMapLocationDot />} />
            <ul className="m-0 space-y-2 p-0 text-sm">
              <li className="glass-soft flex list-none items-center justify-between px-3 py-2">
                <span className="text-muted">Current position</span>
                <span className="mono text-xs">{position.lat.toFixed(4)}, {position.lng.toFixed(4)}</span>
              </li>
              <li className="glass-soft flex list-none items-center justify-between px-3 py-2">
                <span className="text-muted">Heading</span>
                <span className="mono text-xs">{Math.round(position.heading)}°</span>
              </li>
              <li className="glass-soft flex list-none items-center justify-between px-3 py-2">
                <span className="text-muted">Route nodes</span>
                <span className="mono text-xs">{data.route.length}</span>
              </li>
            </ul>
          </Card>

          <Card delay={0.1}>
            <SectionTitle title="Nearest responders" subtitle="Auto-selected by travel time" icon={<FaLocationCrosshairs />} />
            <ul className="m-0 space-y-2 p-0">
              {data.poi.map((poi) => (
                <li key={poi.id} className="glass-soft flex list-none items-center justify-between gap-2 px-3 py-2">
                  <span className="min-w-0">
                    <span className="block truncate text-sm">{poi.name}</span>
                    <span className="block text-[0.65rem] uppercase tracking-widest text-muted">{poi.type}</span>
                  </span>
                  <Badge tone="primary">{poi.etaMin} min</Badge>
                </li>
              ))}
            </ul>
          </Card>

          <Card delay={0.15}>
            <SectionTitle title="Incident pins" subtitle="Historic and active events" icon={<FaMapLocationDot />} />
            <ul className="m-0 space-y-2 p-0">
              {data.incidents.map((incident) => (
                <li key={incident.id} className="glass-soft list-none px-3 py-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="mono text-xs text-[var(--aas-accent)]">{incident.code}</span>
                    <Badge tone={incident.severity === "critical" ? "danger" : incident.severity === "accident" ? "amber" : "success"}>
                      {incident.severity}
                    </Badge>
                  </div>
                  <p className="m-0 mt-1 truncate text-xs text-muted">{incident.address}</p>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
