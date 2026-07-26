/**
 * FINE CONTROLS — the user-facing tuning model and its mapping to
 * provider-agnostic image-to-image parameters.
 *
 * The UI speaks in friendly 0–100 sliders; this module translates those into
 * the numeric knobs (strength, guidance) and prompt fragments that every
 * provider adapter understands. Keeping the mapping here means the UI and the
 * providers never need to know about each other.
 */

import type { StylePreset } from "./presets";

export type Controls = {
  /** How far to transform from the original photo. 0 = subtle, 100 = fully stylized. */
  stylization: number;
  /** How strongly to keep the person recognizable. 0 = loose, 100 = faithful. */
  identity: number;
  /** Line and detail intensity. 0 = soft, 100 = crisp/intricate. */
  detail: number;
  /** Color vibrancy. 0 = muted, 100 = vivid. */
  vibrancy: number;
};

export const DEFAULT_CONTROLS: Controls = {
  stylization: 60,
  identity: 65,
  detail: 55,
  vibrancy: 60,
};

/** Provider-agnostic parameters produced from the controls + chosen preset. */
export type Img2ImgParams = {
  prompt: string;
  negativePrompt: string;
  /** Denoising strength, 0.30–0.90 (used by diffusion img2img adapters). */
  strength: number;
  /** Guidance scale (CFG), typically ~4–9 (diffusion adapters). */
  guidanceScale: number;
  /** Whether to request a face/identity adapter when the provider supports it. */
  preserveIdentity: boolean;
  /** Render quality hint for adapters that accept one (e.g. OpenAI gpt-image-1). */
  quality: "low" | "medium" | "high";
};

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Fold the four sliders + the preset into concrete img2img parameters.
 * Identity preservation acts as a governor on stylization strength: the more a
 * user wants to stay recognizable, the more we cap how far the model can drift.
 */
export function buildParams(
  preset: StylePreset,
  controls: Controls,
): Img2ImgParams {
  const stylization01 = clamp(controls.stylization, 0, 100) / 100;
  const identity01 = clamp(controls.identity, 0, 100) / 100;
  const detail01 = clamp(controls.detail, 0, 100) / 100;
  const vibrancy01 = clamp(controls.vibrancy, 0, 100) / 100;

  // Base strength blends the slider toward the preset's recommended value,
  // so the preset's character is respected even at default settings.
  const sliderStrength = lerp(0.3, 0.9, stylization01);
  let strength = lerp(sliderStrength, preset.recommendedStrength, 0.35);

  // Identity preservation caps how far strength may go. High identity → lower ceiling.
  const identityCeiling = lerp(0.9, 0.5, identity01);
  strength = clamp(Math.min(strength, identityCeiling), 0.3, 0.9);

  // Guidance rises with requested detail for crisper, more literal linework.
  const guidanceScale = Number(lerp(4.5, 8.5, detail01).toFixed(1));

  // Prompt fragments derived from the sliders.
  const detailTerms =
    detail01 > 0.66
      ? "intricate fine linework, crisp sharp details, highly detailed"
      : detail01 < 0.33
        ? "soft gentle lines, smooth minimal detail"
        : "balanced clean linework, moderate detail";

  const vibrancyTerms =
    vibrancy01 > 0.66
      ? "vivid saturated colors, bright and punchy palette"
      : vibrancy01 < 0.33
        ? "muted desaturated colors, soft understated palette"
        : "natural balanced colors";

  const identityTerms =
    identity01 > 0.6
      ? "preserve each person's facial features and likeness, keep everyone recognizable"
      : "";

  // Encode stylization intent into words too, so providers without a numeric
  // strength knob (e.g. OpenAI gpt-image-1) still honor the slider.
  const stylizationTerms =
    stylization01 > 0.66
      ? "fully reimagined in anime style, heavily stylized"
      : stylization01 < 0.33
        ? "lightly anime-stylized while keeping the photo's realism"
        : "clearly anime-stylized";

  const prompt = [
    preset.basePrompt,
    stylizationTerms,
    detailTerms,
    vibrancyTerms,
    identityTerms,
  ]
    .filter(Boolean)
    .join(", ");

  const quality: Img2ImgParams["quality"] =
    detail01 > 0.66 ? "high" : detail01 < 0.33 ? "low" : "medium";

  return {
    prompt,
    negativePrompt: preset.negativePrompt,
    strength,
    guidanceScale,
    preserveIdentity: identity01 > 0.6,
    quality,
  };
}
