"use client";

import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  RadialLinearScale,
  Tooltip,
  type ChartOptions,
} from "chart.js";
import { useMemo } from "react";
import { Bar, Doughnut, Line, Radar } from "react-chartjs-2";
import { useAppearance, type AppearanceTokens } from "@/hooks/useAppearance";

ChartJS.register(
  CategoryScale,
  LinearScale,
  RadialLinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Filler,
  Tooltip,
  Legend,
);

ChartJS.defaults.font.family = "Inter, system-ui, sans-serif";

export type Series = { label: string; data: number[]; color: string; fill?: boolean };

/**
 * Deepens a hex colour so the neon dark-theme palette keeps WCAG-friendly
 * contrast when the same chart is rendered on the light canvas.
 */
function shade(hex: string, amount: number): string {
  const match = /^#?([a-f\d]{6})$/i.exec(hex.trim());
  if (!match) return hex;
  const int = parseInt(match[1], 16);
  const channel = (shift: number) =>
    Math.round(((int >> shift) & 255) * (1 - amount))
      .toString(16)
      .padStart(2, "0");
  return `#${channel(16)}${channel(8)}${channel(0)}`;
}

const useSeriesPalette = (series: Series[], isLight: boolean) =>
  useMemo(
    () => series.map((s) => ({ ...s, color: isLight ? shade(s.color, 0.24) : s.color })),
    [series, isLight],
  );

/** Builds Chart.js options from the live CSS tokens (theme + font size). */
function useChartBase(tokens: AppearanceTokens) {
  return useMemo(() => {
    const bodyFont = tokens.px(0.75);
    const tickFont = tokens.px(0.7);

    // keep global defaults aligned for any chart internals we don't override
    ChartJS.defaults.color = tokens.muted;
    ChartJS.defaults.font.size = tickFont;

    const options: ChartOptions<"line" | "bar"> = {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      animation: { duration: 900, easing: "easeOutQuart" },
      plugins: {
        legend: {
          display: false,
          labels: { boxWidth: 10, usePointStyle: true, color: tokens.muted, font: { size: bodyFont } },
        },
        tooltip: {
          backgroundColor: tokens.tooltipBg,
          titleColor: tokens.text,
          bodyColor: tokens.muted,
          borderColor: tokens.border,
          borderWidth: 1,
          padding: Math.max(8, tokens.px(0.6)),
          cornerRadius: 10,
          displayColors: false,
          titleFont: { size: bodyFont },
          bodyFont: { size: bodyFont },
        },
      },
      scales: {
        x: {
          grid: { color: tokens.grid },
          ticks: { maxRotation: 0, autoSkipPadding: 12, color: tokens.muted, font: { size: tickFont } },
          border: { display: false },
        },
        y: {
          grid: { color: tokens.grid },
          border: { display: false },
          ticks: { padding: 6, color: tokens.muted, font: { size: tickFont } },
        },
      },
    };
    return { options, bodyFont, tickFont };
  }, [tokens]);
}

export function AreaChart({
  labels,
  series,
  height = 240,
  legend = false,
}: {
  labels: string[];
  series: Series[];
  height?: number;
  legend?: boolean;
}) {
  const tokens = useAppearance();
  const { options, bodyFont } = useChartBase(tokens);
  const palette = useSeriesPalette(series, tokens.isLight);

  const data = useMemo(
    () => ({
      labels,
      datasets: palette.map((s) => ({
        label: s.label,
        data: s.data,
        borderColor: s.color,
        backgroundColor: (ctx: { chart: ChartJS }) => {
          const { ctx: canvas, chartArea } = ctx.chart;
          if (!chartArea) return `${s.color}22`;
          const gradient = canvas.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
          gradient.addColorStop(0, `${s.color}${tokens.isLight ? "44" : "55"}`);
          gradient.addColorStop(1, `${s.color}00`);
          return gradient;
        },
        fill: s.fill ?? true,
        tension: 0.42,
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 5,
        pointHoverBackgroundColor: s.color,
      })),
    }),
    [labels, palette, tokens.isLight],
  );

  return (
    <div style={{ height }}>
      <Line
        key={tokens.version}
        data={data}
        options={{
          ...(options as ChartOptions<"line">),
          plugins: {
            ...options.plugins,
            legend: {
              display: legend,
              position: "top",
              labels: { boxWidth: 8, usePointStyle: true, color: tokens.muted, font: { size: bodyFont } },
            },
          },
        }}
      />
    </div>
  );
}

export function BarChart({
  labels,
  series,
  height = 240,
  stacked = false,
  legend = false,
  horizontal = false,
}: {
  labels: string[];
  series: Series[];
  height?: number;
  stacked?: boolean;
  legend?: boolean;
  horizontal?: boolean;
}) {
  const tokens = useAppearance();
  const { options, bodyFont, tickFont } = useChartBase(tokens);
  const palette = useSeriesPalette(series, tokens.isLight);

  const data = {
    labels,
    datasets: palette.map((s) => ({
      label: s.label,
      data: s.data,
      backgroundColor: `${s.color}${tokens.isLight ? "d9" : "cc"}`,
      hoverBackgroundColor: s.color,
      borderRadius: 8,
      borderSkipped: false as const,
      barThickness: horizontal ? 14 : undefined,
      maxBarThickness: 34,
    })),
  };

  return (
    <div style={{ height }}>
      <Bar
        key={tokens.version}
        data={data}
        options={{
          ...(options as ChartOptions<"bar">),
          indexAxis: horizontal ? "y" : "x",
          plugins: {
            ...options.plugins,
            legend: {
              display: legend,
              position: "top",
              labels: { boxWidth: 8, usePointStyle: true, color: tokens.muted, font: { size: bodyFont } },
            },
          },
          scales: {
            x: {
              stacked,
              grid: { color: tokens.grid },
              border: { display: false },
              ticks: { color: tokens.muted, font: { size: tickFont } },
            },
            y: {
              stacked,
              grid: { color: tokens.grid },
              border: { display: false },
              ticks: { color: tokens.muted, font: { size: tickFont } },
            },
          },
        }}
      />
    </div>
  );
}

export function DonutChart({
  labels,
  values,
  colors,
  height = 240,
}: {
  labels: string[];
  values: number[];
  colors: string[];
  height?: number;
}) {
  const tokens = useAppearance();
  return (
    <div style={{ height }}>
      <Doughnut
        key={tokens.version}
        data={{
          labels,
          datasets: [
            {
              data: values,
              backgroundColor: colors.map(
                (c) => `${tokens.isLight ? shade(c, 0.2) : c}${tokens.isLight ? "e6" : "cc"}`,
              ),
              hoverBackgroundColor: colors.map((c) => (tokens.isLight ? shade(c, 0.2) : c)),
              borderColor: tokens.isLight ? "rgba(255,255,255,0.9)" : "rgba(4,6,13,0.9)",
              borderWidth: 2,
              hoverOffset: 8,
            },
          ],
        }}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          cutout: "68%",
          animation: { animateRotate: true, duration: 1000 },
          plugins: {
            legend: {
              position: "bottom",
              labels: {
                boxWidth: 8,
                usePointStyle: true,
                padding: 14,
                color: tokens.muted,
                font: { size: tokens.px(0.75) },
              },
            },
            tooltip: {
              backgroundColor: tokens.tooltipBg,
              titleColor: tokens.text,
              bodyColor: tokens.muted,
              borderColor: tokens.border,
              borderWidth: 1,
              cornerRadius: 10,
              titleFont: { size: tokens.px(0.75) },
              bodyFont: { size: tokens.px(0.75) },
            },
          },
        }}
      />
    </div>
  );
}

export function RadarChart({
  labels,
  values,
  color = "#22d3ee",
  height = 260,
}: {
  labels: string[];
  values: number[];
  color?: string;
  height?: number;
}) {
  const tokens = useAppearance();
  return (
    <div style={{ height }}>
      <Radar
        key={tokens.version}
        data={{
          labels,
          datasets: [
            {
              label: "Score",
              data: values,
              borderColor: tokens.isLight ? shade(color, 0.24) : color,
              backgroundColor: `${tokens.isLight ? shade(color, 0.24) : color}33`,
              pointBackgroundColor: tokens.isLight ? shade(color, 0.24) : color,
              borderWidth: 2,
            },
          ],
        }}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          animation: { duration: 900 },
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: tokens.tooltipBg,
              titleColor: tokens.text,
              bodyColor: tokens.muted,
              borderColor: tokens.border,
              borderWidth: 1,
              titleFont: { size: tokens.px(0.75) },
              bodyFont: { size: tokens.px(0.75) },
            },
          },
          scales: {
            r: {
              angleLines: { color: tokens.grid },
              grid: { color: tokens.grid },
              pointLabels: { color: tokens.muted, font: { size: tokens.px(0.68) } },
              ticks: { display: false },
              suggestedMin: 0,
              suggestedMax: 100,
            },
          },
        }}
      />
    </div>
  );
}
