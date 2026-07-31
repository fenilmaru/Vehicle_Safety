import Link from "next/link";
import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[1.05fr_1fr]">
      <aside className="relative hidden overflow-hidden border-r border-white/8 p-10 lg:flex lg:flex-col lg:justify-between">
        <div aria-hidden className="grid-overlay absolute inset-0 opacity-40" />
        <div aria-hidden className="absolute -left-20 top-10 h-72 w-72 rounded-full bg-[var(--aas-accent)]/15 blur-3xl" />
        <div aria-hidden className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-[var(--aas-accent-2)]/15 blur-3xl" />

        <Link href="/" className="relative flex items-center gap-3 no-underline">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-[var(--aas-accent)] to-[var(--aas-accent-2)] text-sm font-black text-[var(--aas-on-accent)]">
            AA
          </span>
          <span className="leading-tight">
            <span className="block text-sm font-semibold">Autonomous Activation System</span>
            <span className="block text-[0.62rem] uppercase tracking-[0.2em] text-muted">Vehicle Safety Command</span>
          </span>
        </Link>

        <div className="relative max-w-md">
          <h2 className="text-[clamp(1.8rem,2.6vw,2.6rem)] font-semibold leading-tight tracking-tight">
            Secure access to the autonomous safety grid
          </h2>
          <p className="mt-3 text-sm text-muted">
            Multi-factor operator identity combining JWT credentials, face recognition and fingerprint templates before
            any vehicle telemetry is exposed.
          </p>
          <ul className="mt-6 space-y-2 p-0 text-sm text-muted">
            {["JWT session with rotating refresh window", "MediaPipe FaceMesh + ArcFace verification", "Minutiae fingerprint template match", "Role-based route protection"].map(
              (item) => (
                <li key={item} className="glass-soft list-none px-4 py-2.5">
                  {item}
                </li>
              ),
            )}
          </ul>
        </div>

        <p className="relative m-0 text-xs text-muted">
          Demo operator · <span className="mono text-[var(--aas-accent)]">commander@aas.ai</span> /{" "}
          <span className="mono text-[var(--aas-accent)]">Autonomy#2026</span>
        </p>
      </aside>

      <main id="main-content" className="flex min-w-0 items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-md">{children}</div>
      </main>
    </div>
  );
}
