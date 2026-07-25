/**
 * Provider selection. OpenAI is the default; fal.ai remains available as an
 * alternative. To add another, implement ImageProvider in a sibling file and
 * add a case here (select it with the IMAGE_PROVIDER env var).
 */

import type { ImageProvider } from "./types";
import { createOpenAIProvider } from "./openai";
import { createFalProvider } from "./fal";

let cached: ImageProvider | null = null;

export function getProvider(): ImageProvider {
  if (cached) return cached;

  switch (process.env.IMAGE_PROVIDER?.toLowerCase()) {
    case "fal":
      cached = createFalProvider();
      break;
    case "openai":
    default:
      cached = createOpenAIProvider();
  }
  return cached;
}

export type { ImageProvider } from "./types";
export { ProviderError } from "./types";
