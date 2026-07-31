import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { ErrorBoundary } from "@/components/ui/Primitives";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function ProtectedLayout({ children }: { children: ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <DashboardShell>
      <ErrorBoundary>{children}</ErrorBoundary>
    </DashboardShell>
  );
}
