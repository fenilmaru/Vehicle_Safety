"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  FaBars,
  FaBell,
  FaCarSide,
  FaChartLine,
  FaFileLines,
  FaFont,
  FaGauge,
  FaGear,
  FaMoon,
  FaSun,
  FaIdBadge,
  FaMapLocationDot,
  FaMicrochip,
  FaRightFromBracket,
  FaSatelliteDish,
  FaTowerBroadcast,
  FaTrafficLight,
  FaTriangleExclamation,
  FaUser,
  FaVideo,
  FaXmark,
} from "react-icons/fa6";
import { NAV_SECTIONS, APP_NAME, APP_SHORT } from "@/utils/constants";
import { fromNow, initials } from "@/utils/helpers";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { FONT_SIZE_NAMES } from "@/contexts/ThemeContext";
import { useAppDispatch, useAppSelector } from "@/redux/store";
import { dismissEmergency, fetchNotifications } from "@/redux/slices/notificationSlice";
import { fetchVehicles } from "@/redux/slices/vehicleSlice";
import { useVehicleStream } from "@/hooks/useVehicleStream";
import { Badge, Button, LiveDot } from "@/components/ui/Primitives";

const ICONS: Record<string, ReactNode> = {
  gauge: <FaGauge />,
  car: <FaCarSide />,
  map: <FaMapLocationDot />,
  camera: <FaVideo />,
  cpu: <FaMicrochip />,
  user: <FaUser />,
  traffic: <FaTrafficLight />,
  alert: <FaTriangleExclamation />,
  sos: <FaTowerBroadcast />,
  bell: <FaBell />,
  chart: <FaChartLine />,
  report: <FaFileLines />,
  settings: <FaGear />,
  profile: <FaIdBadge />,
};

function Clock() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  if (!now) return <span className="mono text-sm text-muted">--:--:--</span>;
  return (
    <span className="mono text-sm text-muted" suppressHydrationWarning>
      {now.toLocaleDateString(undefined, { weekday: "short", day: "2-digit", month: "short" })} ·{" "}
      <span className="text-[var(--aas-accent)]">{now.toLocaleTimeString()}</span>
    </span>
  );
}

export function DashboardShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user, logout } = useAuth();
  const { theme, fontSize, setTheme, setFontSize } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);

  const cycleFontSize = useCallback(() => {
    const order = FONT_SIZE_NAMES;
    setFontSize(order[(order.indexOf(fontSize) + 1) % order.length]);
  }, [fontSize, setFontSize]);
  const { items: vehicles, selectedId } = useAppSelector((state) => state.vehicles);
  const { unread, emergency } = useAppSelector((state) => state.notifications);
  const connection = useAppSelector((state) => state.dashboard.connection);

  const activeVehicleId = selectedId ?? vehicles[0]?.id ?? 1;
  useVehicleStream(activeVehicleId);

  useEffect(() => {
    void dispatch(fetchVehicles(undefined));
    void dispatch(fetchNotifications());
  }, [dispatch]);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const crumbs = useMemo(() => {
    const parts = pathname.split("/").filter(Boolean);
    return parts.map((part, index) => ({
      label: part.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      href: `/${parts.slice(0, index + 1).join("/")}`,
    }));
  }, [pathname]);

  const nav = (
    <nav aria-label="Primary" className="flex h-full flex-col gap-6">
      <Link href="/dashboard" className="flex items-center gap-3 px-1 no-underline">
        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-[var(--aas-accent)] to-[var(--aas-accent-2)] text-lg font-black text-[var(--aas-on-accent)]">
          {APP_SHORT.slice(0, 2)}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold text-[var(--aas-text)]">{APP_SHORT}</span>
          <span className="block truncate text-[0.65rem] uppercase tracking-[0.16em] text-muted">Command Grid</span>
        </span>
      </Link>

      <div className="aas-scroll flex-1 space-y-5 overflow-y-auto pr-1">
        {NAV_SECTIONS.map((section) => (
          <div key={section.label}>
            <p className="mb-2 px-2 text-[0.62rem] uppercase tracking-[0.18em] text-muted">{section.label}</p>
            <ul className="m-0 list-none space-y-1 p-0">
              {section.items.map((item) => {
                const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <li key={item.href}>
                    <Link href={item.href} className="nav-link no-underline" data-active={active}>
                      <span className="text-base">{ICONS[item.icon]}</span>
                      <span className="truncate">{item.label}</span>
                      {item.href === "/notifications" && unread > 0 ? (
                        <span className="ml-auto rounded-full bg-[var(--aas-danger)] px-2 py-0.5 text-[0.65rem] font-bold text-black">
                          {unread}
                        </span>
                      ) : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      <div className="glass-soft p-3">
        <div className="flex items-center gap-2 text-xs text-muted">
          <FaSatelliteDish className="text-[var(--aas-accent)]" />
          <span>Edge uplink</span>
          <span className="ml-auto">
            <LiveDot tone={connection === "live" ? "success" : connection === "connecting" ? "warning" : "danger"} label={connection} />
          </span>
        </div>
        <p className="mono mt-2 mb-0 text-[0.68rem] text-muted">
          channel: vehicle/{activeVehicleId} · {vehicles.length} nodes
        </p>
      </div>
    </nav>
  );

  return (
    <div className="app-shell">
      <aside className="sticky top-0 hidden h-screen flex-col gap-4 border-r border-white/8 surface-chrome p-4 backdrop-blur-xl xl:flex">
        {nav}
      </aside>

      <AnimatePresence>
        {mobileOpen ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] bg-[var(--aas-backdrop)] backdrop-blur-sm xl:hidden"
            onClick={() => setMobileOpen(false)}
          >
            <motion.aside
              initial={{ x: -320 }}
              animate={{ x: 0 }}
              exit={{ x: -320 }}
              transition={{ type: "spring", stiffness: 320, damping: 34 }}
              className="h-full w-[286px] max-w-[86vw] border-r border-white/10 surface-chrome-strong p-4"
              onClick={(event) => event.stopPropagation()}
            >
              {nav}
            </motion.aside>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-50 border-b border-white/8 surface-chrome-strong px-4 py-3 backdrop-blur-xl sm:px-6">
          <div className="flex items-center gap-3">
            <button
              className="btn btn-ghost !min-h-10 !px-3 xl:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation menu"
            >
              <FaBars />
            </button>

            <div className="min-w-0 flex-1">
              <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-muted">
                <Link href="/dashboard" className="no-underline text-muted hover:text-[var(--aas-accent)]">
                  {APP_NAME}
                </Link>
                {crumbs.map((crumb) => (
                  <span key={crumb.href} className="flex items-center gap-2 truncate">
                    <span aria-hidden>/</span>
                    <Link href={crumb.href} className="truncate no-underline text-[var(--aas-text)] hover:text-[var(--aas-accent)]">
                      {crumb.label}
                    </Link>
                  </span>
                ))}
              </nav>
              <div className="mt-0.5 hidden sm:block">
                <Clock />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge tone={connection === "live" ? "success" : "warning"}>{connection === "live" ? "AI Live" : connection}</Badge>

              <button
                className="btn btn-ghost !min-h-10 !px-3"
                onClick={cycleFontSize}
                aria-label={`Text size: ${fontSize}. Activate to change.`}
                title={`Text size — ${fontSize}`}
              >
                <FaFont />
                <span className="hidden text-[0.68rem] uppercase tracking-wider sm:inline">{fontSize.slice(0, 1)}</span>
              </button>

              <button
                className="btn btn-ghost !min-h-10 !px-3"
                onClick={() => setTheme(theme === "light" ? "midnight" : "light")}
                aria-label={theme === "light" ? "Switch to dark theme" : "Switch to light theme"}
                title={theme === "light" ? "Dark theme" : "Light theme"}
              >
                {theme === "light" ? <FaMoon /> : <FaSun />}
              </button>

              <Link href="/notifications" className="relative btn btn-ghost !min-h-10 !px-3 no-underline" aria-label="Notifications">
                <FaBell />
                {unread > 0 ? (
                  <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-[var(--aas-danger)] px-1 text-[0.65rem] font-bold text-black">
                    {unread}
                  </span>
                ) : null}
              </Link>
              <Link href="/profile" className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-2 py-1.5 no-underline">
                <span className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-br from-[var(--aas-accent)] to-[var(--aas-accent-2)] text-xs font-bold text-[var(--aas-on-accent)]">
                  {initials(user?.fullName ?? "AA")}
                </span>
                <span className="hidden min-w-0 leading-tight md:block">
                  <span className="block truncate text-xs font-semibold text-[var(--aas-text)]">{user?.fullName ?? "Operator"}</span>
                  <span className="block truncate text-[0.65rem] text-muted">{(user?.role ?? "driver").replace("_", " ")}</span>
                </span>
              </Link>
              <button className="btn btn-ghost !min-h-10 !px-3" onClick={() => void logout()} aria-label="Sign out">
                <FaRightFromBracket />
              </button>
            </div>
          </div>
        </header>

        <main id="main-content" className="aas-scroll min-w-0 flex-1 px-4 py-5 sm:px-6 sm:py-6">
          {children}
        </main>

        <footer className="border-t border-white/8 px-4 py-4 text-xs text-muted sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span>© {new Date().getFullYear()} {APP_NAME} · Autonomous Safety Grid v4.2</span>
            <span className="mono">YOLOv8 · MediaPipe · TensorFlow · PyTorch · Channels</span>
          </div>
        </footer>
      </div>

      <AnimatePresence>
        {emergency.active ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90] grid place-items-center bg-[rgba(40,4,12,0.82)] p-4 backdrop-blur-md"
            role="alertdialog"
            aria-label="Critical emergency alert"
          >
            <motion.div
              initial={{ scale: 0.9, y: 24 }}
              animate={{ scale: 1, y: 0 }}
              className="glass neon-ring w-full max-w-lg border-[rgba(251,113,133,0.5)] p-7 text-center"
            >
              <span className="mx-auto grid h-16 w-16 animate-pulse-glow place-items-center rounded-2xl bg-[rgba(251,113,133,0.16)] text-3xl text-[var(--aas-danger)]">
                <FaTriangleExclamation />
              </span>
              <h2 className="mt-4 text-xl font-bold">Critical Event Detected</h2>
              <p className="mt-2 text-sm text-muted">{emergency.message}</p>
              <p className="mono mt-1 text-xs text-muted">
                vehicle #{emergency.vehicleId} · {fromNow(emergency.at)}
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                <Button
                  variant="danger"
                  onClick={() => {
                    dispatch(dismissEmergency());
                    router.push("/emergency");
                  }}
                >
                  Open Emergency Center
                </Button>
                <Button variant="ghost" onClick={() => dispatch(dismissEmergency())}>
                  <FaXmark /> Dismiss
                </Button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
