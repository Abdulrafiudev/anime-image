/**
 * POST /api/convert — the thin, secure proxy.
 *
 * The browser sends the source photo, the chosen preset id, and the fine
 * controls. This route builds the img2img parameters, reads the API key from a
 * server-side env var, calls the provider adapter, and returns the result URL.
 * The API key never leaves the server in default mode.
 *
 * Bring-your-own-key: if the client sends `apiKey`, it is forwarded to the
 * adapter for this single request only and never stored.
 */

import { NextResponse } from "next/server";
import { getPreset } from "@/lib/presets";
import { buildParams, DEFAULT_CONTROLS, type Controls } from "@/lib/controls";
import { getProvider, ProviderError } from "@/lib/providers";

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
  apiKey?: string;
};

export async function POST(req: Request) {
  let body: ConvertBody;
  try {
    body = (await req.json()) as ConvertBody;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { imageDataUrl, presetId, controls, apiKey } = body;

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

  try {
    const provider = getProvider();
    const { imageUrl } = await provider.generate({
      imageDataUrl,
      params,
      apiKey: apiKey?.trim() || undefined,
      signal: controller.signal,
    });

    return NextResponse.json({ imageUrl, provider: provider.name });
  } catch (err) {
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
