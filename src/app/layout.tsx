import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Providers } from "@/components/Providers";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Autonomous Activation System — AI Vehicle Safety Platform",
    template: "%s · Autonomous Activation System",
  },
  description:
    "Enterprise AI platform for autonomous vehicle monitoring, driver safety, accident detection and emergency response.",
  keywords: ["autonomous vehicles", "AI safety", "accident detection", "fleet monitoring", "ADAS"],
  applicationName: "Autonomous Activation System",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#04060d",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" data-theme="midnight" data-accent="cyan" data-font-size="medium">
      <body>
        <a className="skip-link" href="#main-content">
          Skip to main content
        </a>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
