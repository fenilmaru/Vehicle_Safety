"use client";

import { useEffect } from "react";
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useAppearance } from "@/hooks/useAppearance";

export type MapPoint = { lat: number; lng: number; label: string; type: string; meta?: string };

const COLORS: Record<string, string> = {
  vehicle: "#22d3ee",
  destination: "#a855f7",
  hospital: "#34d399",
  police: "#60a5fa",
  ambulance: "#fbbf24",
  incident: "#fb7185",
  fleet: "#94a3b8",
};

function pin(type: string, label: string, isLight: boolean) {
  const color = COLORS[type] ?? COLORS.fleet;
  const ring = isLight ? "rgba(255,255,255,0.95)" : "rgba(4,6,13,0.9)";
  const halo = isLight ? "0 1px 3px rgba(255,255,255,0.9)" : "0 1px 4px #000";
  return L.divIcon({
    className: "",
    html: `<div style="position:relative;display:grid;place-items:center;">
      <span style="position:absolute;width:34px;height:34px;border-radius:50%;background:${color}22;animation:ping 2.4s cubic-bezier(0,0,0.2,1) infinite;"></span>
      <span style="width:16px;height:16px;border-radius:50%;background:${color};box-shadow:0 0 14px ${color};border:2px solid ${ring};"></span>
      <span class="aas-pin-label" style="position:absolute;top:20px;white-space:nowrap;color:${color};text-shadow:${halo};">${label}</span>
    </div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
}

/** CARTO basemaps matched to the active theme. */
const TILES = {
  dark: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
  light: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
};

function Recenter({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], map.getZoom(), { animate: true });
  }, [lat, lng, map]);
  return null;
}

export default function MapView({
  center,
  points,
  route = [],
  height = 420,
  zoom = 13,
  follow = true,
}: {
  center: { lat: number; lng: number };
  points: MapPoint[];
  route?: { lat: number; lng: number }[];
  height?: number | string;
  zoom?: number;
  follow?: boolean;
}) {
  const tokens = useAppearance();
  return (
    <div style={{ height }} className="overflow-hidden rounded-[var(--aas-radius)] border border-white/10">
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={zoom}
        scrollWheelZoom
        style={{ height: "100%", width: "100%" }}
        attributionControl
      >
        <TileLayer
          key={tokens.isLight ? "light" : "dark"}
          url={tokens.isLight ? TILES.light : TILES.dark}
          attribution="&copy; OpenStreetMap &copy; CARTO"
        />
        {route.length > 1 ? (
          <>
            <Polyline
              positions={route.map((p) => [p.lat, p.lng] as [number, number])}
              pathOptions={{ color: "#22d3ee", weight: 5, opacity: 0.25 }}
            />
            <Polyline
              positions={route.map((p) => [p.lat, p.lng] as [number, number])}
              pathOptions={{ color: "#22d3ee", weight: 2, dashArray: "8 12", className: "animate-dash" }}
            />
          </>
        ) : null}
        {points.map((point, index) => (
          <Marker
            key={`${point.label}-${index}`}
            position={[point.lat, point.lng]}
            icon={pin(point.type, point.label, tokens.isLight)}
          >
            <Popup>
              <div style={{ color: "#0b1220", minWidth: "9rem", fontSize: "var(--aas-text-xs)" }}>
                <strong>{point.label}</strong>
                <div style={{ opacity: 0.8 }}>{point.type.toUpperCase()}</div>
                {point.meta ? <div>{point.meta}</div> : null}
              </div>
            </Popup>
          </Marker>
        ))}
        {follow ? <Recenter lat={center.lat} lng={center.lng} /> : null}
      </MapContainer>
    </div>
  );
}
