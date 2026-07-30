"use client";

import { useCallback, useEffect, useState } from "react";

export type AppearanceTokens = {
  /** Root font size in px — canvas modules cannot use rem. */
  rootPx: number;
  text: string;
  muted: string;
  grid: string;
  tooltipBg: string;
  border: string;
  accent: string;
  isLight: boolean;
  /** Convert a rem-ish scale step into px for canvas rendering. */
  px: (rem: number) => number;
  version: number;
};

function readTokens(): AppearanceTokens {
  if (typeof window === "undefined") {
    return {
      rootPx: 16,
      text: "#e8eefc",
      muted: "#8ea0c4",
      grid: "rgba(148,176,255,0.08)",
      tooltipBg: "rgba(6,10,20,0.94)",
      border: "rgba(148,176,255,0.2)",
      accent: "#22d3ee",
      isLight: false,
      px: (rem: number) => Math.round(rem * 16),
      version: 0,
    };
  }
  const root = document.documentElement;
  const styles = getComputedStyle(root);
  const rootPx = parseFloat(styles.fontSize) || 16;
  const value = (name: string, fallback: string) => styles.getPropertyValue(name).trim() || fallback;

  return {
    rootPx,
    text: value("--aas-text", "#e8eefc"),
    muted: value("--aas-chart-text", "#8ea0c4"),
    grid: value("--aas-chart-grid", "rgba(148,176,255,0.08)"),
    tooltipBg: value("--aas-chart-tooltip", "rgba(6,10,20,0.94)"),
    border: value("--aas-border", "rgba(148,176,255,0.2)"),
    accent: value("--aas-accent", "#22d3ee"),
    isLight: root.dataset.theme === "light",
    px: (rem: number) => Math.round(rem * rootPx),
    version: 0,
  };
}

/**
 * Subscribes any canvas/imperative module (Chart.js, Leaflet) to live theme
 * and font-size changes so they restyle together with the CSS-driven UI.
 */
export function useAppearance(): AppearanceTokens {
  const [tokens, setTokens] = useState<AppearanceTokens>(() => readTokens());

  const sync = useCallback(() => {
    setTokens((prev) => ({ ...readTokens(), version: prev.version + 1 }));
  }, []);

  useEffect(() => {
    sync();
    window.addEventListener("aas:appearance", sync);
    return () => window.removeEventListener("aas:appearance", sync);
  }, [sync]);

  return tokens;
}
