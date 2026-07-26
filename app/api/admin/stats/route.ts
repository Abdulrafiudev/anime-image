/**
 * GET /api/admin/stats — protected read of the dashboard summary (aggregates +
 * map data). The itemized event log is fetched separately via /api/admin/events.
 *
 * Auth: send `Authorization: Bearer <ADMIN_PASSWORD>`. If ADMIN_PASSWORD is not
 * set on the server, the endpoint refuses access entirely.
 */

import { NextResponse } from "next/server";
import { getSummary } from "@/lib/analytics";
import { adminEnabled, isAuthorized } from "@/lib/adminAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!adminEnabled()) {
    return NextResponse.json(
      { error: "Admin dashboard is not enabled. Set ADMIN_PASSWORD on the server." },
      { status: 503 },
    );
  }
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const summary = await getSummary();
    return NextResponse.json(summary, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return NextResponse.json(
      { error: "Could not read stats from the datastore." },
      { status: 502 },
    );
  }
}
