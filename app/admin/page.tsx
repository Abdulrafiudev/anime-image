"use client";

import { useCallback, useState } from "react";
import { getPreset } from "@/lib/presets";
import { WorldMap, type MapMarker } from "@/components/WorldMap";
import { countryName, countryFlag } from "@/lib/countries";

const PAGE_SIZE = 20;

type GenerationEvent = {
  t: number;
  ip: string;
  presetId: string;
  ok: boolean;
  ms: number;
  country?: string;
  city?: string;
  lat?: number;
  lon?: number;
  deviceType?: string;
  os?: string;
  browser?: string;
};

type Summary = {
  configured: boolean;
  success: number;
  fail: number;
  byStyle: Record<string, number>;
  byCountry: Record<string, number>;
  total: number;
  markers: MapMarker[];
};

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [summary, setSummary] = useState<Summary | null>(null);
  const [events, setEvents] = useState<GenerationEvent[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authed, setAuthed] = useState(false);

  const authFetch = useCallback(async (pw: string, url: string) => {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${pw}` },
      cache: "no-store",
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok)
      throw new Error(data?.error || `Request failed (${res.status}).`);
    return data;
  }, []);

  // Fetch a single page of the event log from the server (LRANGE batch).
  const fetchPage = useCallback(
    async (pw: string, p: number) => {
      setPageLoading(true);
      setError(null);
      try {
        const offset = (p - 1) * PAGE_SIZE;
        const data = await authFetch(
          pw,
          `/api/admin/events?offset=${offset}&limit=${PAGE_SIZE}`,
        );
        setEvents(data.events ?? []);
        setTotal(data.total ?? 0);
        setPage(p);
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setPageLoading(false);
      }
    },
    [authFetch],
  );

  // Unlock / refresh: load the summary (aggregates + map) and the first page.
  const load = useCallback(
    async (pw: string) => {
      setLoading(true);
      setError(null);
      try {
        const summaryData = (await authFetch(
          pw,
          "/api/admin/stats",
        )) as Summary;
        setSummary(summaryData);
        setTotal(summaryData.total ?? 0);
        await fetchPage(pw, 1);
        setAuthed(true);
      } catch (e) {
        setError((e as Error).message);
        setAuthed(false);
      } finally {
        setLoading(false);
      }
    },
    [authFetch, fetchPage],
  );

  if (!authed) {
    return (
      <main className="mx-auto flex min-h-dvh w-[90%] max-w-md flex-col justify-center py-16">
        <h1 className="font-display text-2xl font-bold text-ink">
          Usage dashboard
        </h1>
        <p className="mt-1 text-sm text-muted">
          Enter the admin password to view generation stats.
        </p>
        <form
          className="mt-6 space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            void load(password);
          }}
        >
          <input
            type="password"
            autoFocus
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Admin password"
            className="w-full rounded-xl border border-line bg-white px-4 py-3 text-ink placeholder:text-muted/60 focus:border-violet focus:outline-none"
          />
          <button
            type="submit"
            disabled={loading || !password}
            className="w-full rounded-xl bg-violet px-4 py-3 font-semibold text-white transition-colors hover:bg-violet-700 disabled:opacity-50"
          >
            {loading ? "Checking…" : "Unlock"}
          </button>
          {error && (
            <p role="alert" className="text-sm font-medium text-pink">
              {error}
            </p>
          )}
        </form>
      </main>
    );
  }

  const s = summary!;
  const attempts = s.success + s.fail;
  const rate = attempts ? Math.round((s.success / attempts) * 100) : 0;
  const styleRows = Object.entries(s.byStyle).sort((a, b) => b[1] - a[1]);
  const maxStyle = styleRows.length ? styleRows[0][1] : 0;
  const countryRows = Object.entries(s.byCountry).sort((a, b) => b[1] - a[1]);
  const markers = s.markers ?? [];

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageStart = (currentPage - 1) * PAGE_SIZE;

  return (
    <main className="mx-auto w-[90%] max-w-5xl py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">
            Usage dashboard
          </h1>
          <p className="mt-0.5 text-sm text-muted">
            Successful generations, styles, and source IPs.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load(password)}
          disabled={loading}
          className="rounded-xl border border-line bg-white px-4 py-2 text-sm font-semibold text-ink transition-colors hover:bg-lavender/50 disabled:opacity-50"
        >
          {loading ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      {!s.configured && (
        <div className="mt-6 rounded-2xl border border-pink/30 bg-pink/[0.06] p-4 text-sm text-pink">
          Datastore not configured. Set <code>UPSTASH_REDIS_REST_URL</code> and{" "}
          <code>UPSTASH_REDIS_REST_TOKEN</code> to start collecting stats.
        </div>
      )}

      <p className="mt-6 rounded-xl border border-line bg-lavender/40 px-4 py-2.5 text-xs text-muted">
        Reminder: IP addresses are personal data. Keep this page
        access-controlled and mind your retention/privacy obligations.
      </p>

      {/* Totals */}
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Successful" value={s.success} />
        <Stat label="Failed" value={s.fail} />
        <Stat label="Total attempts" value={attempts} />
        <Stat label="Success rate" value={`${rate}%`} />
      </div>

      {/* By style */}
      <section className="mt-8">
        <h2 className="font-display text-sm font-bold uppercase tracking-wide text-muted">
          By style
        </h2>
        {styleRows.length === 0 ? (
          <p className="mt-2 text-sm text-muted">
            No successful generations yet.
          </p>
        ) : (
          <div className="mt-3 space-y-2">
            {styleRows.map(([id, count]) => (
              <div key={id} className="flex items-center gap-3">
                <span className="w-40 shrink-0 truncate text-sm text-ink">
                  {getPreset(id).label}
                </span>
                <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-lavender">
                  <div
                    className="h-full rounded-full bg-violet"
                    style={{
                      width: `${maxStyle ? (count / maxStyle) * 100 : 0}%`,
                    }}
                  />
                </div>
                <span className="w-10 shrink-0 text-right text-sm tabular-nums text-muted">
                  {count}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Where requests come from */}
      <section className="mt-8">
        <h2 className="font-display text-sm font-bold uppercase tracking-wide text-muted">
          Where requests come from
        </h2>
        <div className="mt-3 grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <WorldMap markers={markers} />
            <p className="mt-2 text-xs text-muted">
              {markers.length > 0
                ? `${markers.length} location${markers.length === 1 ? "" : "s"} across all retained events. Bubble size = request count.`
                : "No geolocated requests yet. Geo data appears once deployed on Vercel (localhost has none)."}
            </p>
          </div>

          <div className="rounded-2xl border border-line bg-white p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">
              Top countries
            </h3>
            {countryRows.length === 0 ? (
              <p className="mt-2 text-sm text-muted">No country data yet.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {countryRows.slice(0, 8).map(([code, count]) => (
                  <li key={code} className="flex items-center gap-2 text-sm">
                    <span className="text-base leading-none">
                      {countryFlag(code)}
                    </span>
                    <span className="flex-1 truncate text-ink">
                      {countryName(code)}
                    </span>
                    <span className="tabular-nums text-muted">{count}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>

      {/* Recent events (server-paginated) */}
      <section className="mt-8">
        <h2 className="font-display text-sm font-bold uppercase tracking-wide text-muted">
          Recent activity
        </h2>
        <div className="mt-3 overflow-x-auto rounded-2xl border border-line">
          <table
            className={`w-full min-w-[820px] text-left text-sm transition-opacity ${pageLoading ? "opacity-50" : ""}`}
          >
            <thead className="bg-lavender/40 text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-2.5 font-semibold">Time</th>
                <th className="px-4 py-2.5 font-semibold">IP</th>
                <th className="px-4 py-2.5 font-semibold">Location</th>
                <th className="px-4 py-2.5 font-semibold">Device</th>
                <th className="px-4 py-2.5 font-semibold">Style</th>
                <th className="px-4 py-2.5 font-semibold">Result</th>
                <th className="px-4 py-2.5 font-semibold">Latency</th>
              </tr>
            </thead>
            <tbody>
              {total === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-muted">
                    No activity recorded yet.
                  </td>
                </tr>
              ) : (
                events.map((e, i) => (
                  <tr key={pageStart + i} className="border-t border-line">
                    <td className="whitespace-nowrap px-4 py-2.5 text-muted">
                      {new Date(e.t).toLocaleString()}
                    </td>
                    <td className="px-4 py-2.5 font-mono text-xs text-ink">
                      {e.ip}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2.5 text-ink">
                      {e.country ? (
                        <span className="flex items-center gap-1.5">
                          <span className="text-base leading-none">
                            {countryFlag(e.country)}
                          </span>
                          <span>{e.city || countryName(e.country)}</span>
                        </span>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2.5 text-ink">
                      {e.deviceType || e.browser ? (
                        <span>
                          {e.deviceType && e.deviceType !== "Desktop"
                            ? `${e.deviceType} · `
                            : ""}
                          {[e.os, e.browser].filter(Boolean).join(" · ") || "—"}
                        </span>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-ink">
                      {getPreset(e.presetId).label}
                    </td>
                    <td className="px-4 py-2.5">
                      <span
                        className={
                          e.ok
                            ? "rounded-full bg-ink px-2 py-0.5 text-xs font-semibold text-white"
                            : "rounded-full bg-pink/15 px-2 py-0.5 text-xs font-semibold text-pink"
                        }
                      >
                        {e.ok ? "success" : "failed"}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-2.5 tabular-nums text-muted">
                      {(e.ms / 1000).toFixed(1)}s
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {total > 0 && (
          <div className="mt-3 flex items-center justify-between gap-3">
            <p className="text-xs text-muted">
              Showing {pageStart + 1}–{pageStart + events.length} of {total}{" "}
              events (last 200 retained)
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => void fetchPage(password, currentPage - 1)}
                disabled={currentPage <= 1 || pageLoading}
                className="rounded-lg border border-line bg-white px-3 py-1.5 text-sm font-medium text-ink transition-colors hover:bg-lavender/50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Previous
              </button>
              <span className="tabular-nums text-sm text-muted">
                {currentPage} / {totalPages}
              </span>
              <button
                type="button"
                onClick={() => void fetchPage(password, currentPage + 1)}
                disabled={currentPage >= totalPages || pageLoading}
                className="rounded-lg border border-line bg-white px-3 py-1.5 text-sm font-medium text-ink transition-colors hover:bg-lavender/50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-2xl border border-line bg-white p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-muted">
        {label}
      </p>
      <p className="font-display mt-1 text-2xl font-bold text-ink tabular-nums">
        {value}
      </p>
    </div>
  );
}
