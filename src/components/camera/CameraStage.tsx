"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { FaExpand, FaVideo } from "react-icons/fa6";
import type { VehicleFrame } from "@/lib/simulation";
import { confidencePct } from "@/utils/helpers";

const TONE_COLORS: Record<string, string> = {
  primary: "#22d3ee",
  warning: "#fbbf24",
  danger: "#fb7185",
  success: "#34d399",
};

export function CameraStage({
  frame,
  feedName = "Front ADAS",
  height = "clamp(240px, 46vw, 520px)",
  showHud = true,
}: {
  frame: VehicleFrame | null;
  feedName?: string;
  height?: string;
  showHud?: boolean;
}) {
  return (
    <div
      className="relative w-full overflow-hidden rounded-[var(--aas-radius)] border border-white/10 bg-[#050a14]"
      style={{ height }}
      role="img"
      aria-label={`${feedName} live AI camera feed with detection overlays`}
    >
      {/* scene backdrop — replaced by the decoded H.265 frame in production */}
      <Image
        src="/images/road-scene.jpg"
        alt=""
        aria-hidden
        fill
        priority={false}
        sizes="(max-width: 768px) 100vw, 70vw"
        className="object-cover opacity-80"
      />
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(6,12,24,0.55) 0%, rgba(6,12,24,0.18) 45%, rgba(4,6,12,0.85) 100%)",
        }}
      />
      {/* lane markings */}
      <svg aria-hidden className="absolute inset-0 h-full w-full" viewBox="0 0 100 60" preserveAspectRatio="none">
        <path d="M50 22 L14 60" stroke="rgba(148,197,255,0.55)" strokeWidth="0.5" fill="none" />
        <path d="M50 22 L86 60" stroke="rgba(148,197,255,0.55)" strokeWidth="0.5" fill="none" />
        <path d="M50 22 L50 60" stroke="rgba(34,211,238,0.8)" strokeWidth="0.35" strokeDasharray="2 3" className="animate-dash" fill="none" />
        <path
          d="M50 24 L20 60 L80 60 Z"
          fill="rgba(34,211,238,0.09)"
          stroke="rgba(34,211,238,0.35)"
          strokeWidth="0.2"
        />
      </svg>
      <div aria-hidden className="grid-overlay absolute inset-0 opacity-30" />
      <div className="scanline" style={{ top: 0 }} />

      {/* bounding boxes */}
      <AnimatePresence>
        {(frame?.boxes ?? []).map((box) => (
          <motion.div
            key={box.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.92 }}
            transition={{ duration: 0.25 }}
            className="absolute rounded-md"
            style={{
              left: `${box.x}%`,
              top: `${box.y}%`,
              width: `${box.w}%`,
              height: `${box.h}%`,
              border: `1.5px solid ${TONE_COLORS[box.tone]}`,
              boxShadow: `0 0 18px ${TONE_COLORS[box.tone]}55, inset 0 0 22px ${TONE_COLORS[box.tone]}18`,
            }}
          >
            <span
              className="mono absolute -top-6 left-0 whitespace-nowrap rounded-md px-1.5 py-0.5 text-[0.6rem] font-semibold"
              style={{ background: `${TONE_COLORS[box.tone]}e0`, color: "#04060d" }}
            >
              {box.label} · {confidencePct(box.confidence)}
            </span>
            <span
              className="absolute -bottom-5 right-0 mono text-[0.55rem]"
              style={{ color: TONE_COLORS[box.tone] }}
            >
              {box.engine}
            </span>
          </motion.div>
        ))}
      </AnimatePresence>

      {showHud ? (
        <>
          <div className="absolute left-3 top-3 flex flex-wrap items-center gap-2">
            <span className="chip chip-danger !text-[0.6rem]">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current" /> REC
            </span>
            <span className="chip !text-[0.6rem]">
              <FaVideo /> {feedName}
            </span>
            <span className="chip chip-primary !text-[0.6rem]">{frame?.systemHealth.fps ?? 30} FPS</span>
          </div>

          <div className="absolute right-3 top-3 text-right">
            <p className="mono m-0 text-[0.65rem] text-muted" suppressHydrationWarning>
              {frame ? new Date(frame.timestamp).toLocaleTimeString() : "--:--:--"}
            </p>
            <p className="mono m-0 text-[0.65rem] text-muted">
              {frame ? `${frame.lat.toFixed(4)}, ${frame.lng.toFixed(4)}` : "-- , --"}
            </p>
          </div>

          <div className="absolute bottom-3 left-3 flex flex-wrap items-end gap-3">
            <div className="glass-soft px-3 py-2">
              <p className="m-0 text-[0.6rem] uppercase tracking-widest text-muted">Speed</p>
              <p className="m-0 text-xl font-semibold leading-tight">
                {Math.round(frame?.speed ?? 0)}
                <span className="ml-1 text-xs text-muted">km/h</span>
              </p>
            </div>
            <div className="glass-soft px-3 py-2">
              <p className="m-0 text-[0.6rem] uppercase tracking-widest text-muted">Lane conf.</p>
              <p className="m-0 text-xl font-semibold leading-tight">
                {Math.round((frame?.laneConfidence ?? 0) * 100)}
                <span className="ml-1 text-xs text-muted">%</span>
              </p>
            </div>
            <div className="glass-soft hidden px-3 py-2 sm:block">
              <p className="m-0 text-[0.6rem] uppercase tracking-widest text-muted">Objects</p>
              <p className="m-0 text-xl font-semibold leading-tight">{frame?.boxes.length ?? 0}</p>
            </div>
          </div>

          <div className="absolute bottom-3 right-3">
            <span className="chip !text-[0.6rem]">
              <FaExpand /> 1920×1080 · H.265
            </span>
          </div>
        </>
      ) : null}
    </div>
  );
}
