"use client";

import { motion } from "framer-motion";
import { Component, type ErrorInfo, type ReactNode } from "react";
import { FaCircleExclamation, FaXmark } from "react-icons/fa6";

/* ---------------------------------- card ---------------------------------- */
export function Card({
  children,
  className = "",
  interactive = false,
  delay = 0,
  as = "section",
  label,
}: {
  children: ReactNode;
  className?: string;
  interactive?: boolean;
  delay?: number;
  as?: "section" | "article" | "div";
  label?: string;
}) {
  const Tag = motion[as];
  return (
    <Tag
      aria-label={label}
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.22, 0.85, 0.25, 1] }}
      className={`glass ${interactive ? "glass-hover" : ""} p-5 ${className}`}
    >
      {children}
    </Tag>
  );
}

export function SectionTitle({
  title,
  subtitle,
  icon,
  action,
}: {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
      <div className="flex min-w-0 items-center gap-3">
        {icon ? (
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/5 text-[var(--aas-accent)]">
            {icon}
          </span>
        ) : null}
        <div className="min-w-0">
          <h2 className="m-0 truncate text-base font-semibold tracking-tight">{title}</h2>
          {subtitle ? <p className="m-0 mt-0.5 truncate text-xs text-muted">{subtitle}</p> : null}
        </div>
      </div>
      {action}
    </header>
  );
}

/* --------------------------------- badges --------------------------------- */
export function Badge({ tone = "muted", children }: { tone?: string; children: ReactNode }) {
  const map: Record<string, string> = {
    success: "chip-success",
    warning: "chip-warning",
    amber: "chip-amber",
    danger: "chip-danger",
    primary: "chip-primary",
    muted: "",
  };
  return <span className={`chip ${map[tone] ?? ""}`}>{children}</span>;
}

export function LiveDot({ tone = "success", label }: { tone?: string; label?: string }) {
  const color = tone === "danger" ? "#fb7185" : tone === "warning" ? "#fbbf24" : "#34d399";
  return (
    <span className="inline-flex items-center gap-2 text-xs text-muted">
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full rounded-full animate-ping-slow" style={{ background: color }} />
        <span className="relative inline-flex h-2 w-2 rounded-full" style={{ background: color }} />
      </span>
      {label}
    </span>
  );
}

/* --------------------------------- buttons -------------------------------- */
export function Button({
  children,
  variant = "primary",
  type = "button",
  onClick,
  disabled,
  className = "",
  ariaLabel,
}: {
  children: ReactNode;
  variant?: "primary" | "ghost" | "danger";
  type?: "button" | "submit";
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  ariaLabel?: string;
}) {
  return (
    <button
      type={type}
      aria-label={ariaLabel}
      onClick={onClick}
      disabled={disabled}
      className={`btn btn-${variant} ${className}`}
    >
      {children}
    </button>
  );
}

/* -------------------------------- stat tile ------------------------------- */
export function StatTile({
  label,
  value,
  unit,
  delta,
  icon,
  tone = "primary",
  delay = 0,
}: {
  label: string;
  value: string | number;
  unit?: string;
  delta?: string;
  icon?: ReactNode;
  tone?: string;
  delay?: number;
}) {
  const toneColor: Record<string, string> = {
    primary: "var(--aas-accent)",
    success: "var(--aas-success)",
    warning: "var(--aas-warning)",
    danger: "var(--aas-danger)",
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay }}
      className="glass glass-hover relative overflow-hidden p-4"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="m-0 text-[0.68rem] uppercase tracking-[0.14em] text-muted">{label}</p>
        {icon ? <span style={{ color: toneColor[tone] ?? toneColor.primary }}>{icon}</span> : null}
      </div>
      <p className="m-0 mt-2 flex items-baseline gap-1 text-2xl font-semibold tracking-tight">
        {value}
        {unit ? <span className="text-sm font-medium text-muted">{unit}</span> : null}
      </p>
      {delta ? <p className="m-0 mt-1 text-[0.72rem] text-muted">{delta}</p> : null}
      <span
        aria-hidden
        className="pointer-events-none absolute -right-8 -top-10 h-24 w-24 rounded-full blur-2xl"
        style={{ background: `${toneColor[tone] ?? toneColor.primary}22` }}
      />
    </motion.div>
  );
}

/* ---------------------------- progress indicators -------------------------- */
export function ProgressRing({
  value,
  label,
  sub,
  size = 116,
  tone = "primary",
}: {
  value: number;
  label: string;
  sub?: string;
  size?: number;
  tone?: "primary" | "success" | "warning" | "danger";
}) {
  const radius = size / 2 - 9;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, value));
  const stroke: Record<string, string> = {
    primary: "var(--aas-accent)",
    success: "var(--aas-success)",
    warning: "var(--aas-warning)",
    danger: "var(--aas-danger)",
  };
  return (
    <div className="flex flex-col items-center gap-2" role="img" aria-label={`${label} ${clamped}%`}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={radius} stroke="var(--aas-track)" strokeWidth="9" fill="none" />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={stroke[tone]}
            strokeWidth="9"
            strokeLinecap="round"
            fill="none"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: circumference - (clamped / 100) * circumference }}
            transition={{ duration: 0.9, ease: "easeOut" }}
            style={{ filter: `drop-shadow(0 0 8px ${stroke[tone]}66)` }}
          />
        </svg>
        <div className="absolute inset-0 grid place-items-center">
          <span className="text-xl font-semibold">{Math.round(clamped)}%</span>
        </div>
      </div>
      <div className="text-center">
        <p className="m-0 text-sm font-medium">{label}</p>
        {sub ? <p className="m-0 text-xs text-muted">{sub}</p> : null}
      </div>
    </div>
  );
}

export function MeterBar({ value, tone = "primary", label }: { value: number; tone?: string; label?: string }) {
  const colors: Record<string, string> = {
    primary: "linear-gradient(90deg,#22d3ee,#a855f7)",
    success: "linear-gradient(90deg,#34d399,#22d3ee)",
    warning: "linear-gradient(90deg,#fbbf24,#fb923c)",
    danger: "linear-gradient(90deg,#fb7185,#f43f5e)",
  };
  return (
    <div className="w-full">
      {label ? (
        <div className="mb-1 flex items-center justify-between text-xs text-muted">
          <span>{label}</span>
          <span className="mono">{Math.round(value)}%</span>
        </div>
      ) : null}
      <div className="h-2 w-full overflow-hidden rounded-full bg-white/8">
        <motion.div
          className="h-full rounded-full"
          style={{ background: colors[tone] ?? colors.primary }}
          initial={{ width: 0 }}
          animate={{ width: `${Math.max(0, Math.min(100, value))}%` }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

/* ------------------------------ state displays ---------------------------- */
export function Loader({ label = "Synchronising telemetry" }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-14" role="status" aria-live="polite">
      <div className="relative h-14 w-14">
        <span className="absolute inset-0 rounded-full border-2 border-white/10" />
        <span className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-[var(--aas-accent)]" />
        <span className="absolute inset-3 animate-pulse-glow rounded-full bg-[var(--aas-accent)]/30" />
      </div>
      <p className="m-0 text-sm text-muted">{label}</p>
    </div>
  );
}

export function SkeletonGrid({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="skeleton h-28" />
      ))}
    </div>
  );
}

export function EmptyState({ title, message, icon, action }: { title: string; message: string; icon?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-white/12 py-12 text-center">
      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/5 text-xl text-[var(--aas-accent)]">
        {icon ?? <FaCircleExclamation />}
      </span>
      <div>
        <p className="m-0 font-semibold">{title}</p>
        <p className="m-0 mt-1 max-w-sm text-sm text-muted">{message}</p>
      </div>
      {action}
    </div>
  );
}

/* ---------------------------------- modal --------------------------------- */
export function Modal({
  open,
  title,
  onClose,
  children,
  footer,
  tone = "default",
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  tone?: "default" | "critical";
}) {
  if (!open) return null;
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-[80] grid place-items-center bg-[var(--aas-backdrop)] p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.28 }}
        className={`glass w-full max-w-2xl p-6 ${tone === "critical" ? "neon-ring" : ""}`}
        onClick={(event) => event.stopPropagation()}
        style={tone === "critical" ? { borderColor: "rgba(251,113,133,0.5)" } : undefined}
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <h3 className="m-0 text-lg font-semibold">{title}</h3>
          <button className="btn btn-ghost !min-h-9 !px-3 !py-1" onClick={onClose} aria-label="Close dialog">
            <FaXmark />
          </button>
        </div>
        <div className="aas-scroll max-h-[65vh] overflow-y-auto pr-1">{children}</div>
        {footer ? <div className="mt-5 flex flex-wrap justify-end gap-2">{footer}</div> : null}
      </motion.div>
    </div>
  );
}

/* ---------------------------------- table --------------------------------- */
export type Column<T> = { key: string; header: string; render: (row: T) => ReactNode; hideOnMobile?: boolean };

export function DataTable<T extends { id?: number | string }>({
  columns,
  rows,
  empty = "No records available",
  onRowClick,
}: {
  columns: Column<T>[];
  rows: T[];
  empty?: string;
  onRowClick?: (row: T) => void;
}) {
  if (!rows.length) {
    return <EmptyState title="Nothing here yet" message={empty} />;
  }
  return (
    <div className="table-wrap aas-scroll">
      <table className="aas-table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key} className={column.hideOnMobile ? "hidden md:table-cell" : undefined}>
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr
              key={String(row.id ?? index)}
              onClick={() => onRowClick?.(row)}
              className={onRowClick ? "cursor-pointer" : undefined}
            >
              {columns.map((column) => (
                <td key={column.key} className={column.hideOnMobile ? "hidden md:table-cell" : undefined}>
                  {column.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ------------------------------ error boundary ---------------------------- */
export class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; message: string }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, message: "" };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[AAS ErrorBoundary]", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="glass p-8 text-center">
          <h2 className="m-0 text-lg font-semibold">Module failed to render</h2>
          <p className="mt-2 text-sm text-muted">{this.state.message}</p>
          <button className="btn btn-ghost mt-4" onClick={() => this.setState({ hasError: false, message: "" })}>
            Retry module
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
