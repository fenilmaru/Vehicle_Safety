"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import {
  FaArrowRight,
  FaBolt,
  FaCarBurst,
  FaFingerprint,
  FaGauge,
  FaHeartPulse,
  FaMapLocationDot,
  FaMicrochip,
  FaRoad,
  FaSatelliteDish,
  FaShieldHalved,
  FaTowerBroadcast,
  FaTrafficLight,
  FaTriangleExclamation,
  FaUserShield,
  FaVideo,
} from "react-icons/fa6";
import { CameraStage } from "@/components/camera/CameraStage";
import { buildFrame, type VehicleFrame } from "@/lib/simulation";
import { APP_NAME } from "@/utils/constants";

const CAPABILITIES = [
  { icon: <FaVideo />, title: "Live Camera Grid", text: "Multi-camera ADAS + cabin streams with frame-accurate AI overlays." },
  { icon: <FaMicrochip />, title: "AI Detection Core", text: "YOLO, LaneNet, MediaPipe and PyTorch models fused in one pipeline." },
  { icon: <FaUserShield />, title: "Driver Monitoring", text: "Attention, drowsiness, seat belt, phone usage and fatigue scoring." },
  { icon: <FaTrafficLight />, title: "Traffic Intelligence", text: "Signal state, sign recognition and recommended speed guidance." },
  { icon: <FaCarBurst />, title: "Accident Detection", text: "Impact signatures classified in under 400 ms with severity grading." },
  { icon: <FaTowerBroadcast />, title: "Emergency Response", text: "Automatic SOS to hospital, police, ambulance and family contacts." },
  { icon: <FaMapLocationDot />, title: "GPS Command Map", text: "Live routes, ETA, incident pins and nearest responder overlays." },
  { icon: <FaGauge />, title: "Fleet Analytics", text: "Safety scoring, utilisation, detection mix and response benchmarks." },
];

const PIPELINE = [
  { label: "Edge Capture", detail: "OpenCV frame grabber @ 30 FPS" },
  { label: "Inference", detail: "YOLOv8 · MediaPipe · TensorFlow · PyTorch" },
  { label: "Event Bus", detail: "Channels / SSE realtime fan-out" },
  { label: "Command UI", detail: "React 19 dashboards, zero refresh" },
];

export default function LandingPage() {
  const [frame, setFrame] = useState<VehicleFrame | null>(null);

  useEffect(() => {
    let tick = 0;
    setFrame(buildFrame(1, tick));
    const id = setInterval(() => {
      tick += 1;
      setFrame(buildFrame(1, tick));
    }, 1600);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="min-w-0 overflow-x-hidden">
      {/* particles */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
        {Array.from({ length: 26 }).map((_, i) => (
          <motion.span
            key={i}
            className="absolute h-1 w-1 rounded-full bg-[var(--aas-accent)]"
            style={{ left: `${(i * 37) % 100}%`, top: `${(i * 53) % 100}%`, opacity: 0.35 }}
            animate={{ y: [0, -28, 0], opacity: [0.15, 0.6, 0.15] }}
            transition={{ duration: 5 + (i % 5), repeat: Infinity, delay: i * 0.18 }}
          />
        ))}
      </div>

      <header className="sticky top-0 z-50 border-b border-white/8 surface-chrome backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:px-6">
          <Link href="/" className="flex items-center gap-2 no-underline">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-[var(--aas-accent)] to-[var(--aas-accent-2)] text-sm font-black text-[var(--aas-on-accent)]">
              AA
            </span>
            <span className="hidden leading-tight sm:block">
              <span className="block text-sm font-semibold">Autonomous Activation</span>
              <span className="block text-[0.62rem] uppercase tracking-[0.18em] text-muted">Safety Intelligence</span>
            </span>
          </Link>
          <nav aria-label="Marketing" className="ml-auto hidden items-center gap-6 text-sm text-muted lg:flex">
            <a className="no-underline text-muted hover:text-[var(--aas-accent)]" href="#capabilities">Capabilities</a>
            <a className="no-underline text-muted hover:text-[var(--aas-accent)]" href="#live">Live AI</a>
            <a className="no-underline text-muted hover:text-[var(--aas-accent)]" href="#architecture">Architecture</a>
            <a className="no-underline text-muted hover:text-[var(--aas-accent)]" href="#response">Response</a>
          </nav>
          <div className="ml-auto flex items-center gap-2 lg:ml-4">
            <Link href="/login" className="btn btn-ghost no-underline">Sign in</Link>
            <Link href="/register" className="btn btn-primary no-underline">
              Get started <FaArrowRight />
            </Link>
          </div>
        </div>
      </header>

      {/* hero */}
      <section className="relative mx-auto grid max-w-7xl gap-10 px-4 pb-16 pt-12 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:pt-20">
        <motion.div initial={{ opacity: 0, y: 26 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="min-w-0">
          <span className="chip chip-primary">
            <FaBolt /> Autonomy Level 4 ready
          </span>
          <h1 className="mt-5 text-[clamp(2.1rem,5.6vw,3.9rem)] font-bold leading-[1.05] tracking-tight">
            Intelligent Safety for the{" "}
            <span className="bg-gradient-to-r from-[var(--aas-accent)] to-[var(--aas-accent-2)] bg-clip-text text-transparent">
              Future of Mobility
            </span>
          </h1>
          <p className="mt-5 max-w-xl text-base text-muted sm:text-lg">
            AI-powered autonomous monitoring platform designed to make every journey safer — real-time perception,
            driver wellness, accident detection and emergency dispatch in a single command grid.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/dashboard" className="btn btn-primary no-underline">
              Launch Dashboard <FaArrowRight />
            </Link>
            <a href="#live" className="btn btn-ghost no-underline">
              Explore AI Safety <FaShieldHalved />
            </a>
          </div>
          <dl className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { k: "380ms", v: "Crash detection" },
              { k: "99.94%", v: "AI uptime" },
              { k: "12+", v: "Perception models" },
              { k: "24/7", v: "Emergency grid" },
            ].map((stat, index) => (
              <motion.div
                key={stat.k}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 + index * 0.08 }}
                className="glass-soft px-3 py-3"
              >
                <dt className="m-0 text-lg font-semibold text-[var(--aas-accent)]">{stat.k}</dt>
                <dd className="m-0 text-[0.7rem] uppercase tracking-[0.12em] text-muted">{stat.v}</dd>
              </motion.div>
            ))}
          </dl>
        </motion.div>

        {/* hero illustration */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.12 }}
          className="relative min-w-0"
        >
          <div className="glass neon-ring relative overflow-hidden p-4">
            <div className="relative grid place-items-center">
              <Image
                src="/images/hero-vehicle.jpg"
                alt="Autonomous vehicle under AI scan"
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 45vw"
                className="hero-media pointer-events-none object-cover"
              />
              {/* radar */}
              <svg viewBox="0 0 240 240" className="h-[clamp(220px,44vw,340px)] w-full max-w-[380px]" aria-hidden>
                <defs>
                  <linearGradient id="sweep" x1="0" x2="1">
                    <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.55" />
                    <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
                  </linearGradient>
                </defs>
                {[40, 70, 100].map((r) => (
                  <circle key={r} cx="120" cy="120" r={r} fill="none" stroke="rgba(148,197,255,0.16)" strokeWidth="1" />
                ))}
                <line x1="120" y1="20" x2="120" y2="220" stroke="rgba(148,197,255,0.12)" />
                <line x1="20" y1="120" x2="220" y2="120" stroke="rgba(148,197,255,0.12)" />
                <g className="animate-radar">
                  <path d="M120 120 L120 20 A100 100 0 0 1 200 70 Z" fill="url(#sweep)" />
                </g>
                {/* vehicle silhouette */}
                <g transform="translate(120 122)">
                  <rect x="-18" y="-34" width="36" height="68" rx="14" fill="#0e1c30" stroke="#22d3ee" strokeWidth="1.5" />
                  <rect x="-12" y="-24" width="24" height="20" rx="6" fill="rgba(34,211,238,0.28)" />
                  <rect x="-12" y="6" width="24" height="18" rx="6" fill="rgba(168,85,247,0.28)" />
                  <circle cx="0" cy="0" r="46" fill="none" stroke="rgba(34,211,238,0.4)" strokeDasharray="4 8" className="animate-dash" />
                </g>
                {[
                  { cx: 66, cy: 78 },
                  { cx: 178, cy: 92 },
                  { cx: 88, cy: 176 },
                ].map((p, i) => (
                  <circle key={i} cx={p.cx} cy={p.cy} r="4" fill="#fbbf24" className="animate-pulse-glow" />
                ))}
              </svg>

              {/* floating AI cards */}
              <motion.div className="glass-soft absolute -left-1 top-2 px-3 py-2 sm:left-2" animate={{ y: [0, -10, 0] }} transition={{ duration: 5, repeat: Infinity }}>
                <p className="m-0 text-[0.6rem] uppercase tracking-widest text-muted">Object Detection</p>
                <p className="m-0 text-sm font-semibold text-[var(--aas-accent)]">6 tracked · 97%</p>
              </motion.div>
              <motion.div className="glass-soft absolute right-0 top-16 px-3 py-2" animate={{ y: [0, 12, 0] }} transition={{ duration: 6, repeat: Infinity, delay: 0.6 }}>
                <p className="m-0 text-[0.6rem] uppercase tracking-widest text-muted">Driver State</p>
                <p className="m-0 text-sm font-semibold text-[var(--aas-success)]">Alert · 94%</p>
              </motion.div>
              <motion.div className="glass-soft absolute bottom-2 left-4 px-3 py-2" animate={{ y: [0, -8, 0] }} transition={{ duration: 4.4, repeat: Infinity, delay: 0.3 }}>
                <p className="m-0 text-[0.6rem] uppercase tracking-widest text-muted">GPS Route</p>
                <p className="m-0 text-sm font-semibold">12.97°N · 77.59°E</p>
              </motion.div>
              <motion.div className="glass-soft absolute bottom-6 right-2 px-3 py-2" animate={{ y: [0, 10, 0] }} transition={{ duration: 5.4, repeat: Infinity, delay: 0.9 }}>
                <p className="m-0 text-[0.6rem] uppercase tracking-widest text-muted">Crash Risk</p>
                <p className="m-0 text-sm font-semibold text-[var(--aas-warning)]">Low · 3.2%</p>
              </motion.div>
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2">
              {[
                { icon: <FaSatelliteDish />, label: "Uplink" },
                { icon: <FaHeartPulse />, label: "Vitals" },
                { icon: <FaRoad />, label: "Lane Lock" },
              ].map((item) => (
                <div key={item.label} className="glass-soft flex items-center gap-2 px-3 py-2 text-xs text-muted">
                  <span className="text-[var(--aas-accent)]">{item.icon}</span>
                  {item.label}
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </section>

      {/* capabilities */}
      <section id="capabilities" className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-80px" }}>
          <span className="chip">Platform capabilities</span>
          <h2 className="mt-4 text-[clamp(1.6rem,3.4vw,2.5rem)] font-semibold tracking-tight">
            One command grid for every safety signal
          </h2>
          <p className="mt-2 max-w-2xl text-muted">
            Every module streams through the same event bus, so perception, driver wellness and emergency response stay
            perfectly in sync.
          </p>
        </motion.div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {CAPABILITIES.map((cap, index) => (
            <motion.article
              key={cap.title}
              initial={{ opacity: 0, y: 22 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ delay: index * 0.06 }}
              className="glass glass-hover p-5"
            >
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white/5 text-lg text-[var(--aas-accent)]">
                {cap.icon}
              </span>
              <h3 className="mt-4 text-base font-semibold">{cap.title}</h3>
              <p className="mt-1 text-sm text-muted">{cap.text}</p>
            </motion.article>
          ))}
        </div>
      </section>

      {/* live preview */}
      <section id="live" className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
          <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="min-w-0">
            <CameraStage frame={frame} feedName="Demo · Front ADAS" height="clamp(240px, 44vw, 460px)" />
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}>
            <span className="chip chip-primary">Live inference preview</span>
            <h2 className="mt-4 text-[clamp(1.5rem,3vw,2.1rem)] font-semibold tracking-tight">
              Detection overlays rendered in real time
            </h2>
            <p className="mt-2 text-muted">
              Bounding boxes, confidence, engine attribution and timestamps stream straight from the inference gateway.
              The same payload powers driver monitoring, traffic recognition and crash classification.
            </p>
            <ul className="mt-5 space-y-3 p-0">
              {[
                { icon: <FaMicrochip />, text: `Objects tracked: ${frame?.boxes.length ?? 0}` },
                { icon: <FaUserShield />, text: `Driver attention: ${frame?.driver.attention ?? 0}%` },
                { icon: <FaTrafficLight />, text: `Signal state: ${(frame?.traffic.signal ?? "green").toUpperCase()}` },
                { icon: <FaTriangleExclamation />, text: `Risk severity: ${(frame?.severity ?? "normal").toUpperCase()}` },
              ].map((row) => (
                <li key={row.text} className="glass-soft flex list-none items-center gap-3 px-4 py-3 text-sm">
                  <span className="text-[var(--aas-accent)]">{row.icon}</span>
                  {row.text}
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </section>

      {/* architecture */}
      <section id="architecture" className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="glass p-6 sm:p-9">
          <span className="chip">Reference architecture</span>
          <h2 className="mt-4 text-[clamp(1.5rem,3vw,2.2rem)] font-semibold tracking-tight">
            Perception at the edge, intelligence in the cloud
          </h2>
          <div className="mt-8 grid gap-4 md:grid-cols-4">
            {PIPELINE.map((stage, index) => (
              <motion.div
                key={stage.label}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08 }}
                className="glass-soft relative p-4"
              >
                <span className="mono text-xs text-[var(--aas-accent)]">0{index + 1}</span>
                <h3 className="mt-2 text-sm font-semibold">{stage.label}</h3>
                <p className="mt-1 text-xs text-muted">{stage.detail}</p>
                {index < PIPELINE.length - 1 ? (
                  <span aria-hidden className="absolute -right-3 top-1/2 hidden text-[var(--aas-accent)] md:block">
                    <FaArrowRight />
                  </span>
                ) : null}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* emergency response */}
      <section id="response" className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="grid gap-6 lg:grid-cols-2">
          <div>
            <span className="chip chip-danger">Emergency protocol</span>
            <h2 className="mt-4 text-[clamp(1.5rem,3vw,2.2rem)] font-semibold tracking-tight">
              From impact to ambulance in under a minute
            </h2>
            <p className="mt-2 text-muted">
              When CrashNet confirms an impact signature, the platform executes the autonomous response chain without
              human intervention.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <Link href="/register" className="btn btn-primary no-underline">
                Create operator account
              </Link>
              <Link href="/login" className="btn btn-ghost no-underline">
                <FaFingerprint /> Biometric sign in
              </Link>
            </div>
          </div>
          <ol className="m-0 list-none space-y-3 p-0">
            {[
              "Impact detected · CrashNet 96% confidence",
              "Vehicle auto-stop & doors unlocked",
              "SOS packet transmitted to regional gateway",
              "Live GPS shared with ambulance + police",
              "Family contacts notified via SMS and call",
            ].map((step, index) => (
              <motion.li
                key={step}
                initial={{ opacity: 0, x: 24 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08 }}
                className="glass-soft flex items-center gap-3 px-4 py-3"
              >
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-[rgba(251,113,133,0.14)] text-xs font-bold text-[var(--aas-danger)]">
                  {index + 1}
                </span>
                <span className="text-sm">{step}</span>
              </motion.li>
            ))}
          </ol>
        </div>
      </section>

      <footer className="border-t border-white/8 px-4 py-8 sm:px-6">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 text-xs text-muted">
          <span>© {new Date().getFullYear()} {APP_NAME}</span>
          <span className="mono">React 19 · Next.js · REST + Realtime Channels · PostgreSQL · AI Perception Stack</span>
        </div>
      </footer>
    </div>
  );
}
