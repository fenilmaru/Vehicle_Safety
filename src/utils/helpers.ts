import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

export const formatDate = (value?: string | Date | null, pattern = "DD MMM YYYY") =>
  value ? dayjs(value).format(pattern) : "—";

export const formatTime = (value?: string | Date | null) => (value ? dayjs(value).format("HH:mm:ss") : "--:--:--");

export const fromNow = (value?: string | Date | null) => (value ? dayjs(value).fromNow() : "—");

export const pct = (value: number) => `${Math.round(value)}%`;

export const confidencePct = (value: number) => `${(value * 100).toFixed(1)}%`;

export const severityTone = (severity: string) => {
  switch (severity) {
    case "critical":
      return "danger";
    case "accident":
      return "warning";
    case "warning":
      return "amber";
    default:
      return "success";
  }
};

export const statusTone = (status: string) => {
  switch (status) {
    case "online":
    case "active":
    case "resolved":
    case "closed":
      return "success";
    case "idle":
    case "standby":
    case "acknowledged":
      return "amber";
    case "maintenance":
    case "responding":
    case "en_route":
      return "warning";
    default:
      return "muted";
  }
};

export function debounce<T extends (...args: never[]) => void>(fn: T, wait = 300) {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), wait);
  };
}

export function throttle<T extends (...args: never[]) => void>(fn: T, limit = 250) {
  let waiting = false;
  return (...args: Parameters<T>) => {
    if (waiting) return;
    fn(...args);
    waiting = true;
    setTimeout(() => {
      waiting = false;
    }, limit);
  };
}

export const initials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join("");

export const clamp = (value: number, min = 0, max = 100) => Math.min(max, Math.max(min, value));

export const kmh = (value: number) => `${value.toFixed(0)} km/h`;

export const titleCase = (value: string) =>
  value
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
