"use client";

import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { FaBell, FaGear, FaMicrochip, FaPalette, FaShieldHalved } from "react-icons/fa6";
import { settingsApi } from "@/api/endpoints";
import { Button, Card, Loader, MeterBar, SectionTitle } from "@/components/ui/Primitives";
import { useApi } from "@/hooks/useApi";
import { useTheme } from "@/hooks/useTheme";
import type { AccentName, FontSizeName, ThemeName } from "@/contexts/ThemeContext";
import type { SettingsRow } from "@/utils/types";

const THEMES: { key: ThemeName; label: string; swatch: string; hint: string }[] = [
  { key: "midnight", label: "Midnight", swatch: "linear-gradient(135deg,#04060d,#12203a)", hint: "Dark" },
  { key: "carbon", label: "Carbon", swatch: "linear-gradient(135deg,#08080a,#26262b)", hint: "Dark" },
  { key: "aurora", label: "Aurora", swatch: "linear-gradient(135deg,#030b14,#0d4f5c)", hint: "Dark" },
  { key: "light", label: "Light", swatch: "linear-gradient(135deg,#ffffff,#dbe6f5)", hint: "Light" },
];
const ACCENTS: { key: AccentName; label: string; color: string }[] = [
  { key: "cyan", label: "Cyan", color: "#22d3ee" },
  { key: "violet", label: "Violet", color: "#a855f7" },
  { key: "emerald", label: "Emerald", color: "#34d399" },
  { key: "amber", label: "Amber", color: "#fbbf24" },
];
const FONT_SIZES: { key: FontSizeName; label: string; hint: string; preview: string }[] = [
  { key: "small", label: "Small", hint: "14px", preview: "0.78rem" },
  { key: "medium", label: "Medium", hint: "16px · default", preview: "0.92rem" },
  { key: "large", label: "Large", hint: "18px", preview: "1.05rem" },
  { key: "xlarge", label: "Extra large", hint: "20px", preview: "1.18rem" },
];

export default function SettingsPage() {
  const { data, loading } = useApi(() => settingsApi.get());
  const { theme, accent, fontSize, reducedMotion, setTheme, setAccent, setFontSize, toggleMotion } = useTheme();
  const [form, setForm] = useState<SettingsRow | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  if (loading || !form) return <Loader label="Loading operator preferences" />;

  const save = async () => {
    setSaving(true);
    try {
      await settingsApi.update({ ...form, theme, accent });
      toast.success("Preferences synced to command grid");
    } catch {
      toast.error("Unable to persist settings");
    } finally {
      setSaving(false);
    }
  };

  const toggles: { key: keyof SettingsRow; label: string; hint: string }[] = [
    { key: "emergencyAutoDispatch", label: "Autonomous emergency dispatch", hint: "Send SOS without operator confirmation on critical impact" },
    { key: "notifyEmail", label: "Email alerts", hint: "Incident digests and daily safety summaries" },
    { key: "notifySms", label: "SMS alerts", hint: "Critical severity events only" },
    { key: "notifyPush", label: "Push alerts", hint: "Realtime browser notifications" },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="m-0 text-xl font-semibold tracking-tight">Settings</h1>
        <p className="m-0 mt-1 text-sm text-muted">Appearance, AI thresholds and alert routing.</p>
      </div>

      <section className="grid gap-4 xl:grid-cols-2">
        <Card>
          <SectionTitle title="Appearance" subtitle="Theme and accent system" icon={<FaPalette />} />
          <div className="space-y-4">
            <div>
              <p className="label">Theme</p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {THEMES.map((item) => (
                  <button
                    key={item.key}
                    onClick={() => setTheme(item.key)}
                    aria-pressed={theme === item.key}
                    className="glass-soft flex flex-col items-start gap-2 p-2.5 text-left transition"
                    style={
                      theme === item.key
                        ? { borderColor: "var(--aas-accent)", boxShadow: "0 0 0 2px color-mix(in srgb, var(--aas-accent) 30%, transparent)" }
                        : undefined
                    }
                  >
                    <span
                      aria-hidden
                      className="h-9 w-full rounded-lg border border-[var(--aas-border)]"
                      style={{ background: item.swatch }}
                    />
                    <span className="text-xs font-semibold">{item.label}</span>
                    <span className="text-[0.65rem] text-muted">{item.hint}</span>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="label">Accent</p>
              <div className="flex flex-wrap gap-2">
                {ACCENTS.map((item) => (
                  <button
                    key={item.key}
                    onClick={() => setAccent(item.key)}
                    aria-label={`${item.label} accent`}
                    aria-pressed={accent === item.key}
                    className="h-10 w-10 rounded-2xl border-2 transition"
                    style={{
                      background: item.color,
                      borderColor: accent === item.key ? "#fff" : "transparent",
                      boxShadow: accent === item.key ? `0 0 18px ${item.color}` : "none",
                    }}
                  />
                ))}
              </div>
            </div>
            <div>
              <p className="label">Font size</p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {FONT_SIZES.map((item) => (
                  <button
                    key={item.key}
                    className={`btn ${fontSize === item.key ? "btn-primary" : "btn-ghost"} !min-h-11 flex-col !gap-0.5 !px-2`}
                    onClick={() => setFontSize(item.key)}
                    aria-pressed={fontSize === item.key}
                    title={item.hint}
                  >
                    <span style={{ fontSize: item.preview, lineHeight: 1.1 }}>Aa</span>
                    <span className="text-[0.62rem] font-medium opacity-80">{item.label}</span>
                  </button>
                ))}
              </div>
              <p className="m-0 mt-2 text-xs text-muted">
                Scales text, controls, tables, charts and map labels from a single root value — currently{" "}
                <span className="text-[var(--aas-accent)]">{FONT_SIZES.find((f) => f.key === fontSize)?.hint}</span>.
              </p>
            </div>

            <label className="flex items-center justify-between gap-3 rounded-2xl border border-white/8 bg-white/4 px-4 py-3">
              <span>
                <span className="block text-sm font-medium">Reduced motion</span>
                <span className="block text-xs text-muted">Disable animated transitions for accessibility</span>
              </span>
              <input type="checkbox" checked={reducedMotion} onChange={toggleMotion} className="h-5 w-5 accent-[var(--aas-accent)]" />
            </label>
          </div>
        </Card>

        <Card delay={0.05}>
          <SectionTitle title="AI configuration" subtitle="Perception thresholds" icon={<FaMicrochip />} />
          <div className="space-y-5">
            <div>
              <label className="label" htmlFor="sensitivity">Detection sensitivity — {form.aiSensitivity}%</label>
              <input
                id="sensitivity"
                type="range"
                min={40}
                max={99}
                value={form.aiSensitivity}
                onChange={(e) => setForm({ ...form, aiSensitivity: Number(e.target.value) })}
                className="w-full accent-[var(--aas-accent)]"
              />
              <MeterBar value={form.aiSensitivity} tone="primary" />
            </div>
            <div>
              <label className="label" htmlFor="autonomy">Autonomy level — L{form.autonomyLevel}</label>
              <input
                id="autonomy"
                type="range"
                min={0}
                max={5}
                value={form.autonomyLevel}
                onChange={(e) => setForm({ ...form, autonomyLevel: Number(e.target.value) })}
                className="w-full accent-[var(--aas-accent)]"
              />
            </div>
            <div>
              <label className="label" htmlFor="units">Measurement units</label>
              <select id="units" className="field" value={form.units} onChange={(e) => setForm({ ...form, units: e.target.value })}>
                <option value="metric">Metric (km/h)</option>
                <option value="imperial">Imperial (mph)</option>
              </select>
            </div>
          </div>
        </Card>
      </section>

      <Card delay={0.1}>
        <SectionTitle title="Alerting & safety" subtitle="Routing rules for incidents" icon={<FaBell />} />
        <div className="grid gap-3 sm:grid-cols-2">
          {toggles.map((toggle) => (
            <label key={String(toggle.key)} className="flex items-center justify-between gap-3 rounded-2xl border border-white/8 bg-white/4 px-4 py-3">
              <span className="min-w-0">
                <span className="block text-sm font-medium">{toggle.label}</span>
                <span className="block text-xs text-muted">{toggle.hint}</span>
              </span>
              <input
                type="checkbox"
                className="h-5 w-5 shrink-0 accent-[var(--aas-accent)]"
                checked={Boolean(form[toggle.key])}
                onChange={(event) => setForm({ ...form, [toggle.key]: event.target.checked })}
              />
            </label>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button onClick={() => void save()} disabled={saving}>
            <FaGear /> {saving ? "Saving…" : "Save preferences"}
          </Button>
          <span className="flex items-center gap-2 text-xs text-muted">
            <FaShieldHalved className="text-[var(--aas-accent)]" /> Settings are encrypted at rest and scoped to your operator identity.
          </span>
        </div>
      </Card>
    </div>
  );
}
