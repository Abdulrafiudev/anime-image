/**
 * OpenAI image-to-image adapter (the default provider).
 *
 * Uses the Images Edits endpoint with the `gpt-image-1` model, which redraws an
 * input photo from a text prompt. Unlike diffusion img2img, gpt-image-1 has no
 * numeric "strength"/guidance knob — the stylization intent is carried entirely
 * in the prompt (see lib/controls.ts, which encodes the sliders into words).
 *
 * Override the model with OPENAI_IMAGE_MODEL. To swap providers entirely, add a
 * sibling file implementing ImageProvider and point lib/providers/index.ts at it.
 */

import type { GenerateInput, GenerateResult, ImageProvider } from "./types";
import { ProviderError } from "./types";

const DEFAULT_MODEL = "gpt-image-1";
const ENDPOINT = "https://api.openai.com/v1/images/edits";

type OpenAIImageResponse = {
  data?: { b64_json?: string; url?: string }[];
  error?: { message?: string };
};

export function createOpenAIProvider(): ImageProvider {
  const model = process.env.OPENAI_IMAGE_MODEL?.trim() || DEFAULT_MODEL;

  return {
    name: `openai (${model})`,

    async generate({
      imageDataUrl,
      params,
      signal,
    }: GenerateInput): Promise<GenerateResult> {
      const key = process.env.OPENAI_API_KEY?.trim();
      if (!key) {
        throw new ProviderError(
          "Image provider is not configured. Set OPENAI_API_KEY on the server.",
          500,
        );
      }

      const { blob, filename } = dataUrlToBlob(imageDataUrl);

      // Give the edit model a clear directive; the descriptive look + slider
      // intent already live in params.prompt.
      const prompt = `Redraw the main subject of this photograph as ${params.prompt}. Keep the original pose, framing, and composition. Full anime illustration, not a photo.`;

      const form = new FormData();
      form.append("model", model);
      form.append("image", blob, filename);
      form.append("prompt", prompt);
      form.append("n", "1");
      form.append("size", "auto");
      form.append("quality", params.quality ?? "high");

      let res: Response;
      try {
        res = await fetch(ENDPOINT, {
          method: "POST",
          headers: { Authorization: `Bearer ${key}` },
          body: form,
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
        const detail = await safeErrorMessage(res);
        if (res.status === 401 || res.status === 403) {
          throw new ProviderError(
            `OpenAI rejected the API key or account. ${detail}`.trim(),
            502,
          );
        }
        if (res.status === 429) {
          throw new ProviderError(
            "OpenAI is rate-limiting or out of quota. Please wait a moment and retry.",
            429,
            true,
          );
        }
        if (res.status === 400) {
          throw new ProviderError(
            `OpenAI rejected the request. ${detail}`.trim(),
            400,
          );
        }
        throw new ProviderError(
          `Image provider error (${res.status}). ${detail}`.trim(),
          502,
          res.status >= 500,
        );
      }

      let data: OpenAIImageResponse;
      try {
        data = (await res.json()) as OpenAIImageResponse;
      } catch {
        throw new ProviderError("Received an unreadable response from OpenAI.", 502);
      }

      const item = data.data?.[0];
      if (item?.b64_json) {
        return { imageUrl: `data:image/png;base64,${item.b64_json}` };
      }
      if (item?.url) {
        return { imageUrl: item.url };
      }
      throw new ProviderError(
        "OpenAI returned no image. Try a different style or a smaller photo.",
        502,
        true,
      );
    },
  };
}

/** Parse a `data:<mime>;base64,<data>` URL into a Blob for multipart upload. */
function dataUrlToBlob(dataUrl: string): { blob: Blob; filename: string } {
  const match = /^data:(image\/[a-zA-Z+]+);base64,(.+)$/.exec(dataUrl);
  if (!match) {
    throw new ProviderError("The uploaded image could not be read.", 400);
  }
  const mime = match[1];
  const bytes = Buffer.from(match[2], "base64");
  const ext = mime === "image/jpeg" ? "jpg" : mime.split("/")[1];
  // Use a fresh Uint8Array so the Blob owns a clean ArrayBuffer.
  return {
    blob: new Blob([new Uint8Array(bytes)], { type: mime }),
    filename: `photo.${ext}`,
  };
}

async function safeErrorMessage(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as OpenAIImageResponse;
    return body?.error?.message ? truncate(body.error.message) : "";
  } catch {
    return "";
  }
}

function truncate(s: string, max = 180): string {
  const clean = s.replace(/\s+/g, " ").trim();
  return clean.length > max ? `${clean.slice(0, max)}…` : clean;
}
