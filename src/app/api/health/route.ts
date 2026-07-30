import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { ensureSeeded } from "@/db/seed";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await db.execute(sql`select 1`);
    await ensureSeeded();
    return NextResponse.json({
      status: "ok",
      service: "autonomous-activation-system",
      database: "connected",
      realtime: "sse-channel-online",
      aiGateway: "ready",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      { status: "degraded", error: error instanceof Error ? error.message : "unknown" },
      { status: 500 },
    );
  }
}
