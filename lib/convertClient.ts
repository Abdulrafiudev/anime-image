/**
 * Client-side wrapper around the /api/convert proxy.
 *
 * Returns a usable image URL (or data URL) or throws a friendly Error the UI can
 * display. When the user supplies their own key (advanced mode), it is sent with
 * this single request and used server-side only for that call — never stored.
 * (OpenAI's API can't be called directly from the browser due to CORS, so BYOK
 * still routes through our own proxy rather than a third-party server.)
 */

import type { Controls } from "./controls";

export type ConvertArgs = {
  imageDataUrl: string;
  presetId: string;
  controls: Controls;
  signal?: AbortSignal;
  /** Advanced: the user's own provider key, held in memory only. */
  byokKey?: string;
};

export async function convertImage({
  imageDataUrl,
  presetId,
  controls,
  signal,
  byokKey,
}: ConvertArgs): Promise<string> {
  const res = await fetch("/api/convert", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      imageDataUrl,
      presetId,
      controls,
      apiKey: byokKey || undefined,
    }),
    signal,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error || "Conversion failed. Please try again.");
  }
  return data.imageUrl as string;
}
