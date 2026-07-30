export const APP_NAME = "Autonomous Activation System";
export const APP_SHORT = "AAS";

export const NAV_SECTIONS = [
  {
    label: "Command",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: "gauge" },
      { href: "/vehicles", label: "Vehicles", icon: "car" },
      { href: "/gps", label: "GPS Navigation", icon: "map" },
    ],
  },
  {
    label: "Perception",
    items: [
      { href: "/camera", label: "Live Camera", icon: "camera" },
      { href: "/ai-detection", label: "AI Detection", icon: "cpu" },
      { href: "/driver", label: "Driver Monitoring", icon: "user" },
      { href: "/traffic", label: "Traffic Monitoring", icon: "traffic" },
    ],
  },
  {
    label: "Response",
    items: [
      { href: "/accidents", label: "Accident Detection", icon: "alert" },
      { href: "/emergency", label: "Emergency Center", icon: "sos" },
      { href: "/notifications", label: "Notifications", icon: "bell" },
    ],
  },
  {
    label: "Intelligence",
    items: [
      { href: "/analytics", label: "Analytics", icon: "chart" },
      { href: "/reports", label: "Reports", icon: "report" },
      { href: "/settings", label: "Settings", icon: "settings" },
      { href: "/profile", label: "User Profile", icon: "profile" },
    ],
  },
] as const;

export const ROLES = [
  { value: "fleet_admin", label: "Fleet Administrator" },
  { value: "driver", label: "Driver" },
  { value: "safety_officer", label: "Safety Officer" },
  { value: "viewer", label: "Control Room Viewer" },
];

export const SEVERITIES = ["normal", "warning", "accident", "critical"] as const;

export const DEMO_CREDENTIALS = { identifier: "commander@aas.ai", password: "Autonomy#2026" };

export const CHART_COLORS = {
  cyan: "#22d3ee",
  violet: "#a855f7",
  emerald: "#34d399",
  amber: "#fbbf24",
  rose: "#fb7185",
  blue: "#60a5fa",
};
