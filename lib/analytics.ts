/**
 * Lightweight, server-only usage tracking backed by Upstash Redis (REST API).
 *
 * "No backend to run": Upstash is a managed serverless datastore reached over
 * plain fetch — no server process, no ORM, no dependency. If the two env vars
 * are absent, every function here safely no-ops so conversions keep working.
 *
 * Env:
 *   UPSTASH_REDIS_REST_URL
 *   UPSTASH_REDIS_REST_TOKEN
 *
 * Data model (metadata only — no images are stored):
 *   anime:count:success / anime:count:fail   → INCR counters
 *   anime:by_style (hash)                     → per-preset success counts
 *   anime:events (list, capped at 200)        → recent {t, ip, presetId, ok, ms}
 */

import { countryName } from "./countries";

const URL_ENV = process.env.UPSTASH_REDIS_REST_URL?.replace(/\/$/, "");
const TOKEN_ENV = process.env.UPSTASH_REDIS_REST_TOKEN;

export function analyticsConfigured(): boolean {
  return Boolean(URL_ENV && TOKEN_ENV);
}

/** Run a Redis pipeline over Upstash's REST endpoint. Returns raw results. */
async function pipeline(commands: (string | number)[][]): Promise<unknown[]> {
  if (!analyticsConfigured()) return [];
  const res = await fetch(`${URL_ENV}/pipeline`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${TOKEN_ENV}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(commands),
    // Never let analytics hang a request.
    signal: AbortSignal.timeout(4000),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Upstash ${res.status}`);
  const json = (await res.json()) as { result?: unknown }[];
  return json.map((r) => r?.result);
}

export type GenerationEvent = {
  /** epoch ms */
  t: number;
  ip: string;
  presetId: string;
  ok: boolean;
  /** provider latency in ms */
  ms: number;
  /** Geo (from Vercel headers in prod; absent locally). */
  country?: string;
  city?: string;
  lat?: number;
  lon?: number;
  /** Device (parsed from the User-Agent). */
  deviceType?: string;
  os?: string;
  browser?: string;
};

/**
 * Record one generation attempt. Fire-and-forget from the caller's view: this
 * never throws, so a tracking outage can't break a conversion.
 */
export async function recordGeneration(evt: GenerationEvent): Promise<void> {
  if (!analyticsConfigured()) return;
  try {
    const commands: (string | number)[][] = [
      ["INCR", evt.ok ? "anime:count:success" : "anime:count:fail"],
      ["LPUSH", "anime:events", JSON.stringify(evt)],
      ["LTRIM", "anime:events", 0, 199],
    ];
    if (evt.ok) {
      commands.push(["HINCRBY", "anime:by_style", evt.presetId || "unknown", 1]);
    }
    if (evt.country) {
      commands.push(["HINCRBY", "anime:by_country", evt.country, 1]);
    }
    await pipeline(commands);
  } catch (err) {
    console.error("[analytics] record failed:", err);
  }
}

export type MapMarker = { lat: number; lon: number; count: number; label?: string };

/** Aggregate figures + map data — loaded once (not paginated). */
export type Summary = {
  configured: boolean;
  success: number;
  fail: number;
  byStyle: Record<string, number>;
  byCountry: Record<string, number>;
  /** Total retained events (the paginated log's length). */
  total: number;
  /** Location bubbles built from the full retained window. */
  markers: MapMarker[];
};

/**
 * Read the dashboard summary: counters, per-style/per-country breakdowns, the
 * total event count, and map markers aggregated across the whole retained
 * window. The itemized event log is fetched separately + paginated (getEvents).
 */
export async function getSummary(): Promise<Summary> {
  if (!analyticsConfigured()) {
    return {
      configured: false,
      success: 0,
      fail: 0,
      byStyle: {},
      byCountry: {},
      total: 0,
      markers: [],
    };
  }
  const [success, fail, byStyleRaw, byCountryRaw, total, allRaw] =
    await pipeline([
      ["GET", "anime:count:success"],
      ["GET", "anime:count:fail"],
      ["HGETALL", "anime:by_style"],
      ["HGETALL", "anime:by_country"],
      ["LLEN", "anime:events"],
      ["LRANGE", "anime:events", 0, -1],
    ]);

  return {
    configured: true,
    success: toInt(success),
    fail: toInt(fail),
    byStyle: hashToObject(byStyleRaw),
    byCountry: hashToObject(byCountryRaw),
    total: toInt(total),
    markers: buildMarkers(parseEvents(allRaw)),
  };
}

export type EventsPage = { events: GenerationEvent[]; total: number };

/** Read one page of the event log via LRANGE — the server-side batch. */
export async function getEvents(offset = 0, limit = 20): Promise<EventsPage> {
  if (!analyticsConfigured()) return { events: [], total: 0 };
  const start = Math.max(0, Math.floor(offset));
  const stop = start + Math.max(1, Math.floor(limit)) - 1;
  const [raw, total] = await pipeline([
    ["LRANGE", "anime:events", start, stop],
    ["LLEN", "anime:events"],
  ]);
  return { events: parseEvents(raw), total: toInt(total) };
}

/** Aggregate events into location bubbles by rounded coordinate. */
function buildMarkers(events: GenerationEvent[]): MapMarker[] {
  const byLoc = new Map<string, MapMarker>();
  for (const e of events) {
    if (typeof e.lat !== "number" || typeof e.lon !== "number") continue;
    const key = `${e.lat.toFixed(1)},${e.lon.toFixed(1)}`;
    const existing = byLoc.get(key);
    if (existing) {
      existing.count += 1;
    } else {
      byLoc.set(key, {
        lat: e.lat,
        lon: e.lon,
        count: 1,
        label: e.city || (e.country ? countryName(e.country) : undefined),
      });
    }
  }
  return [...byLoc.values()];
}

function toInt(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

/** Upstash returns HGETALL as a flat [field, value, field, value, …] array. */
function hashToObject(raw: unknown): Record<string, number> {
  const out: Record<string, number> = {};
  if (Array.isArray(raw)) {
    for (let i = 0; i + 1 < raw.length; i += 2) {
      out[String(raw[i])] = toInt(raw[i + 1]);
    }
  }
  return out;
}

function parseEvents(raw: unknown): GenerationEvent[] {
  if (!Array.isArray(raw)) return [];
  const events: GenerationEvent[] = [];
  for (const item of raw) {
    try {
      events.push(JSON.parse(String(item)) as GenerationEvent);
    } catch {
      /* skip malformed */
    }
  }
  return events;
}
