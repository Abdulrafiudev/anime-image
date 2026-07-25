/**
 * Client-side wrapper around the /api/convert proxy.
 *
 * Returns a usable image URL (or data URL) or throws a friendly Error the UI can
 * display. Provider credentials remain server-side.
 */

import type { Controls } from "./controls";

export type ConvertArgs = {
  imageDataUrl: string;
  presetId: string;
  controls: Controls;
  signal?: AbortSignal;
};

export async function convertImage({
  imageDataUrl,
  presetId,
  controls,
  signal,
}: ConvertArgs): Promise<string> {
  const res = await fetch("/api/convert", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      imageDataUrl,
      presetId,
      controls,
    }),
    signal,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error || "Conversion failed. Please try again.");
  }
  return data.imageUrl as string;
}
