/**
 * GET /api/admin/events?offset=0&limit=20 — protected, paginated slice of the
 * event log (server-side batching via Redis LRANGE). Returns the page plus the
 * total count so the client can render pagination controls.
 *
 * Auth: same as /api/admin/stats.
 */

import { NextResponse } from "next/server";
import { getEvents } from "@/lib/analytics";
import { adminEnabled, isAuthorized } from "@/lib/adminAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_LIMIT = 100;

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

  const { searchParams } = new URL(req.url);
  const offset = Math.max(0, Number(searchParams.get("offset")) || 0);
  const limit = Math.min(
    MAX_LIMIT,
    Math.max(1, Number(searchParams.get("limit")) || 20),
  );

  try {
    const page = await getEvents(offset, limit);
    return NextResponse.json(page, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return NextResponse.json(
      { error: "Could not read events from the datastore." },
      { status: 502 },
    );
  }
}
