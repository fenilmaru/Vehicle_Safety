"use client";

import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from "react";

export type ThemeName = "midnight" | "carbon" | "aurora" | "light";
export type AccentName = "cyan" | "violet" | "emerald" | "amber";
export type FontSizeName = "small" | "medium" | "large" | "xlarge";

export const THEME_NAMES: ThemeName[] = ["midnight", "carbon", "aurora", "light"];
export const FONT_SIZE_NAMES: FontSizeName[] = ["small", "medium", "large", "xlarge"];

/** Platform default reading size. */
export const DEFAULT_FONT_SIZE: FontSizeName = "medium";
/** Themes that render on a light canvas — used by charts, maps and toasts. */
export const isLightTheme = (theme: ThemeName) => theme === "light";

type ThemeValue = {
  theme: ThemeName;
  accent: AccentName;
  fontSize: FontSizeName;
  reducedMotion: boolean;
  setTheme: (theme: ThemeName) => void;
  setAccent: (accent: AccentName) => void;
  setFontSize: (size: FontSizeName) => void;
  toggleMotion: () => void;
};

export const ThemeContext = createContext<ThemeValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeName>("midnight");
  const [accent, setAccentState] = useState<AccentName>("cyan");
  const [fontSize, setFontSizeState] = useState<FontSizeName>(DEFAULT_FONT_SIZE);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const storedTheme = (localStorage.getItem("aas.theme") as ThemeName) || "midnight";
    const storedAccent = (localStorage.getItem("aas.accent") as AccentName) || "cyan";
    const storedSize = (localStorage.getItem("aas.fontSize") as FontSizeName) || DEFAULT_FONT_SIZE;
    const storedMotion = localStorage.getItem("aas.motion") === "reduced";
    setThemeState(THEME_NAMES.includes(storedTheme) ? storedTheme : "midnight");
    setAccentState(storedAccent);
    setFontSizeState(FONT_SIZE_NAMES.includes(storedSize) ? storedSize : DEFAULT_FONT_SIZE);
    setReducedMotion(storedMotion);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = theme;
    root.dataset.accent = accent;
    root.dataset.fontSize = fontSize;
    root.dataset.motion = reducedMotion ? "reduced" : "full";
    root.style.colorScheme = isLightTheme(theme) ? "light" : "dark";
    // Notify canvas-rendered modules (Chart.js) that CSS tokens changed.
    window.dispatchEvent(new CustomEvent("aas:appearance", { detail: { theme, accent, fontSize } }));
  }, [theme, accent, fontSize, reducedMotion]);

  const setTheme = useCallback((next: ThemeName) => {
    setThemeState(next);
    localStorage.setItem("aas.theme", next);
  }, []);

  const setAccent = useCallback((next: AccentName) => {
    setAccentState(next);
    localStorage.setItem("aas.accent", next);
  }, []);

  const setFontSize = useCallback((next: FontSizeName) => {
    setFontSizeState(next);
    localStorage.setItem("aas.fontSize", next);
  }, []);

  const toggleMotion = useCallback(() => {
    setReducedMotion((prev) => {
      localStorage.setItem("aas.motion", prev ? "full" : "reduced");
      return !prev;
    });
  }, []);

  const value = useMemo(
    () => ({ theme, accent, fontSize, reducedMotion, setTheme, setAccent, setFontSize, toggleMotion }),
    [theme, accent, fontSize, reducedMotion, setTheme, setAccent, setFontSize, toggleMotion],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
