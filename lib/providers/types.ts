/**
 * PROVIDER ADAPTER CONTRACT
 *
 * The rest of the app talks to image generation only through this interface.
 * Swapping fal.ai for Replicate, Stability, or anything else means writing one
 * new file that implements `ImageProvider` — no UI or route changes required.
 */

import type { Img2ImgParams } from "../controls";

export type GenerateInput = {
  /** The source photo as a data URL (data:image/...;base64,...). */
  imageDataUrl: string;
  /** Provider-agnostic img2img parameters (see lib/controls.ts). */
  params: Img2ImgParams;
  /** Abort signal so a slow request can be cancelled. */
  signal?: AbortSignal;
};

export type GenerateResult = {
  /** The generated image, as a URL or data URL the client can render/download. */
  imageUrl: string;
};

export interface ImageProvider {
  /** Human-readable id, useful for logs and the UI. */
  readonly name: string;
  generate(input: GenerateInput): Promise<GenerateResult>;
}

/** Thrown by adapters so the route can translate to friendly HTTP responses. */
export class ProviderError extends Error {
  constructor(
    message: string,
    readonly status: number = 502,
    readonly retryable: boolean = false,
  ) {
    super(message);
    this.name = "ProviderError";
  }
}
