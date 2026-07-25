/**
 * fal.ai image-to-image adapter (the default provider).
 *
 * Uses fal's synchronous run endpoint, which accepts a data URL directly as
 * `image_url` — so we never have to upload the photo separately. The default
 * model is a FLUX img2img endpoint; override it with the FAL_MODEL env var.
 *
 * To swap providers entirely, add a sibling file implementing ImageProvider and
 * point lib/providers/index.ts at it.
 */

import type {
  GenerateInput,
  GenerateResult,
  ImageProvider,
} from "./types";
import { ProviderError } from "./types";

const DEFAULT_MODEL = "fal-ai/flux/dev/image-to-image";

type FalImage = { url: string };
type FalResponse = {
  images?: FalImage[];
  image?: FalImage;
  detail?: unknown;
  error?: string;
};

export function createFalProvider(): ImageProvider {
  const model = process.env.FAL_MODEL?.trim() || DEFAULT_MODEL;

  return {
    name: `fal.ai (${model})`,

    async generate({
      imageDataUrl,
      params,
      apiKey,
      signal,
    }: GenerateInput): Promise<GenerateResult> {
      const key = apiKey?.trim() || process.env.FAL_KEY?.trim();
      if (!key) {
        throw new ProviderError(
          "Image provider is not configured. Set FAL_KEY on the server (or enable bring-your-own-key).",
          500,
        );
      }

      // Map our provider-agnostic params onto FLUX img2img inputs.
      // Note: FLUX endpoints don't take a negative prompt; SDXL-style adapters
      // would use params.negativePrompt here instead.
      const body = {
        image_url: imageDataUrl,
        prompt: params.prompt,
        strength: params.strength,
        guidance_scale: params.guidanceScale,
        num_inference_steps: 34,
        num_images: 1,
        enable_safety_checker: true,
        output_format: "png",
      };

      let res: Response;
      try {
        res = await fetch(`https://fal.run/${model}`, {
          method: "POST",
          headers: {
            Authorization: `Key ${key}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
          signal,
        });
      } catch (err) {
        if ((err as Error)?.name === "AbortError") {
          throw new ProviderError("Request was cancelled.", 499);
        }
        throw new ProviderError(
          "Could not reach the image provider. Check your connection and try again.",
          502,
          true,
        );
      }

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        if (res.status === 401 || res.status === 403) {
          throw new ProviderError(
            "The image provider rejected the API key.",
            502,
          );
        }
        if (res.status === 429) {
          throw new ProviderError(
            "The image provider is rate-limiting requests. Please wait a moment and retry.",
            429,
            true,
          );
        }
        throw new ProviderError(
          `Image provider error (${res.status}). ${truncate(text)}`,
          502,
          res.status >= 500,
        );
      }

      let data: FalResponse;
      try {
        data = (await res.json()) as FalResponse;
      } catch {
        throw new ProviderError("Received an unreadable response from the provider.", 502);
      }

      const url = data.images?.[0]?.url ?? data.image?.url;
      if (!url) {
        throw new ProviderError(
          "The provider returned no image. Try a different style or a lower stylization.",
          502,
          true,
        );
      }

      return { imageUrl: url };
    },
  };
}

function truncate(s: string, max = 180): string {
  const clean = s.replace(/\s+/g, " ").trim();
  return clean.length > max ? `${clean.slice(0, max)}…` : clean;
}
