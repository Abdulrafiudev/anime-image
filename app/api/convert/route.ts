/**
 * POST /api/convert — the thin, secure proxy.
 *
 * The browser sends the source photo, the chosen preset id, and the fine
 * controls. This route builds the img2img parameters, reads the API key from a
 * server-side env var, calls the provider adapter, and returns the result URL.
 * The API key never leaves the server.
 */

import { NextResponse } from "next/server";
import { getPreset } from "@/lib/presets";
import { buildParams, DEFAULT_CONTROLS, type Controls } from "@/lib/controls";
import { getProvider, ProviderError } from "@/lib/providers";
import { recordGeneration } from "@/lib/analytics";
import { parseUserAgent } from "@/lib/useragent";

/** Best-effort client IP from proxy headers (Vercel sets x-forwarded-for). */
function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  return req.headers.get("x-real-ip")?.trim() || "unknown";
}

/**
 * Best-effort geolocation. Vercel injects these headers automatically in
 * production — no external API or dependency. Empty locally.
 */
function clientGeo(req: Request): {
  country?: string;
  city?: string;
  lat?: number;
  lon?: number;
} {
  const h = req.headers;
  const dec = (v: string | null) => {
    if (!v) return undefined;
    try {
      return decodeURIComponent(v);
    } catch {
      return v;
    }
  };
  const num = (v: string | null) => {
    const n = Number(v);
    return v && Number.isFinite(n) ? n : undefined;
  };
  return {
    country: h.get("x-vercel-ip-country")?.trim() || undefined,
    city: dec(h.get("x-vercel-ip-city")),
    lat: num(h.get("x-vercel-ip-latitude")),
    lon: num(h.get("x-vercel-ip-longitude")),
  };
}

export const runtime = "nodejs";
// gpt-image-1 can take a while at high quality. Vercel caps this per plan
// (60s on Hobby); raise the plan or lower the quality if you hit that ceiling.
export const maxDuration = 120;

// Guardrail: reject payloads that are implausibly large before doing any work.
// ~12MB of base64 ≈ a generously-sized downscaled image.
const MAX_BODY_BYTES = 12 * 1024 * 1024;
const REQUEST_TIMEOUT_MS = 115_000;

type ConvertBody = {
  imageDataUrl?: string;
  presetId?: string;
  controls?: Partial<Controls>;
};

export async function POST(req: Request) {
  let body: ConvertBody;
  try {
    body = (await req.json()) as ConvertBody;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { imageDataUrl, presetId, controls } = body;

  if (!imageDataUrl || !/^data:image\/(png|jpeg|jpg|webp);base64,/.test(imageDataUrl)) {
    return NextResponse.json(
      { error: "A valid image (PNG, JPEG, or WebP) is required." },
      { status: 400 },
    );
  }

  if (imageDataUrl.length > MAX_BODY_BYTES) {
    return NextResponse.json(
      { error: "Image is too large. Please use a smaller photo." },
      { status: 413 },
    );
  }

  const preset = getPreset(presetId ?? "");
  const mergedControls: Controls = { ...DEFAULT_CONTROLS, ...(controls ?? {}) };
  const params = buildParams(preset, mergedControls);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const ip = clientIp(req);
  const geo = clientGeo(req);
  const device = parseUserAgent(req.headers.get("user-agent"));
  const startedAt = Date.now();

  try {
    const provider = getProvider();
    const { imageUrl } = await provider.generate({
      imageDataUrl,
      params,
      signal: controller.signal,
    });

    // Fire-and-forget usage tracking (never throws, no-ops if unconfigured).
    await recordGeneration({
      t: startedAt,
      ip,
      ...geo,
      ...device,
      presetId: preset.id,
      ok: true,
      ms: Date.now() - startedAt,
    });

    return NextResponse.json({ imageUrl, provider: provider.name });
  } catch (err) {
    void recordGeneration({
      t: startedAt,
      ip,
      ...geo,
      ...device,
      presetId: preset.id,
      ok: false,
      ms: Date.now() - startedAt,
    });
    if (err instanceof ProviderError) {
      return NextResponse.json(
        { error: err.message, retryable: err.retryable },
        { status: err.status >= 400 && err.status < 600 ? err.status : 502 },
      );
    }
    if ((err as Error)?.name === "AbortError") {
      return NextResponse.json(
        { error: "The conversion took too long and timed out. Please try again.", retryable: true },
        { status: 504 },
      );
    }
    console.error("[convert] unexpected error:", err);
    return NextResponse.json(
      { error: "Something went wrong while converting. Please try again.", retryable: true },
      { status: 500 },
    );
  } finally {
    clearTimeout(timeout);
  }
}
