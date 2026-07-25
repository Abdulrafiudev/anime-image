/**
 * STYLE PRESETS — the single place to add, remove, or tune anime looks.
 *
 * Prompts are intentionally generic and descriptive: they never reference real
 * studios, franchises, or copyrighted characters. To add a style, append one
 * object to STYLE_PRESETS — nothing else in the app needs to change.
 */

export type StylePreset = {
  /** Stable id used as a key and in requests. */
  id: string;
  /** Short human label shown on the card. */
  label: string;
  /** One-line description shown under the label. */
  description: string;
  /** Local preview image shown in the style picker. */
  image: string;
  /** Positive prompt describing the target look. */
  basePrompt: string;
  /** Negative prompt steering the model away from artifacts. */
  negativePrompt: string;
  /** Default stylization strength for this look (0.30–0.90). */
  recommendedStrength: number;
  /** Two-color accent used to tint the card thumbnail (purely cosmetic). */
  swatch: [string, string];
};

const SHARED_NEGATIVE =
  "photorealistic, 3d render, deformed, extra limbs, extra fingers, bad anatomy, blurry, low quality, watermark, text, signature, jpeg artifacts, disfigured face";

export const STYLE_PRESETS: StylePreset[] = [
  {
    id: "classic-cel",
    label: "Classic Cel Anime",
    description: "Clean cel-shading, bold outlines, flat vibrant colors.",
    image: "/images/styles/classic-cel.webp",
    basePrompt:
      "anime character portrait, classic cel-shaded anime style, bold clean ink outlines, flat vibrant colors, crisp two-tone shading, expressive eyes",
    negativePrompt: SHARED_NEGATIVE,
    recommendedStrength: 0.6,
    swatch: ["#7C5CFF", "#5CC7FF"],
  },
  {
    id: "modern-anime",
    label: "Modern Anime",
    description: "Soft gradients, detailed eyes, contemporary TV look.",
    image: "/images/styles/modern-anime.webp",
    basePrompt:
      "modern anime style portrait, soft gradient shading, highly detailed glossy eyes, contemporary television anime look, delicate lighting, clean digital rendering",
    negativePrompt: SHARED_NEGATIVE,
    recommendedStrength: 0.55,
    swatch: ["#FF5FA2", "#FFB65C"],
  },
  {
    id: "shonen-ninja",
    label: "Shonen Ninja",
    description: "Spiky-haired ninja action-anime hero look.",
    image: "/images/styles/shonen-ninja.webp",
    basePrompt:
      "classic shonen action anime style, bold spiky hair, thick confident cel-shaded outlines, dynamic energetic shading, warm earthy ochre and burnt-orange palette, determined expressive eyes, ninja forehead-protector headband, late-90s to 2000s ninja action anime aesthetic, heroic pose",
    negativePrompt: SHARED_NEGATIVE,
    recommendedStrength: 0.6,
    swatch: ["#E8703A", "#F2B34B"],
  },
  {
    id: "soft-painterly",
    label: "Soft Painterly",
    description: "Watercolor-like, gentle light, painterly backdrop.",
    image: "/images/styles/soft-painterly.webp",
    basePrompt:
      "soft painterly anime illustration, watercolor texture, gentle diffused lighting, delicate color blending, dreamy painterly background, subtle brush strokes",
    negativePrompt: SHARED_NEGATIVE,
    recommendedStrength: 0.62,
    swatch: ["#B79CFF", "#FFC2E2"],
  },
  {
    id: "manga-ink",
    label: "Manga Ink",
    description: "Black & white, screentones, high-contrast linework.",
    image: "/images/styles/manga-ink.webp",
    basePrompt:
      "black and white manga illustration, high contrast ink linework, detailed screentone shading, dramatic hatching, monochrome, sharp clean lines",
    negativePrompt: SHARED_NEGATIVE + ", color, colored",
    recommendedStrength: 0.65,
    swatch: ["#2C2740", "#B7B2C7"],
  },
  {
    id: "chibi",
    label: "Chibi",
    description: "Cute, big head, small body, rounded features.",
    image: "/images/styles/chibi.webp",
    basePrompt:
      "cute chibi anime character, oversized head, small rounded body, big sparkling eyes, soft pastel colors, adorable simplified features, kawaii",
    negativePrompt: SHARED_NEGATIVE + ", realistic proportions",
    recommendedStrength: 0.72,
    swatch: ["#FF9EC4", "#FFE08A"],
  },
  {
    id: "webtoon",
    label: "Webtoon",
    description: "Crisp digital color, clean lines, soft cel shadows.",
    image: "/images/styles/webtoon.webp",
    basePrompt:
      "korean webtoon style portrait, crisp clean digital coloring, smooth line art, soft cel shadows, glossy skin, modern manhwa aesthetic",
    negativePrompt: SHARED_NEGATIVE,
    recommendedStrength: 0.58,
    swatch: ["#7C5CFF", "#FF9EC4"],
  },
  {
    id: "cyberpunk",
    label: "Cyberpunk Anime",
    description: "Neon palette, moody lighting, high detail.",
    image: "/images/styles/cyberpunk.webp",
    basePrompt:
      "cyberpunk anime portrait, vivid neon rim lighting, moody dark atmosphere, glowing magenta and cyan highlights, high detail, futuristic city bokeh background",
    negativePrompt: SHARED_NEGATIVE,
    recommendedStrength: 0.66,
    swatch: ["#FF5FA2", "#3FE0FF"],
  },
  {
    id: "retro-90s",
    label: "Retro 90s Anime",
    description: "Grainy, muted palette, vintage cel look.",
    image: "/images/styles/retro-90s.webp",
    basePrompt:
      "retro 1990s anime style, muted vintage color palette, visible film grain, hand-painted cel look, nostalgic soft focus, classic analog animation aesthetic",
    negativePrompt: SHARED_NEGATIVE,
    recommendedStrength: 0.6,
    swatch: ["#C7A98F", "#8FA9C7"],
  },
  {
    id: "fantasy",
    label: "Fantasy Illustration",
    description: "Ornate, glowing, storybook fantasy styling.",
    image: "/images/styles/fantasy.webp",
    basePrompt:
      "ornate fantasy anime illustration, glowing magical light, intricate detailed costume, storybook painterly rendering, ethereal atmosphere, rich saturated colors",
    negativePrompt: SHARED_NEGATIVE,
    recommendedStrength: 0.64,
    swatch: ["#9C6BFF", "#FFD36B"],
  },
  {
    id: "minimal-line",
    label: "Minimal Line Art",
    description: "Sparse, elegant, single-weight line drawing.",
    image: "/images/styles/minimal-line.webp",
    basePrompt:
      "minimalist single-weight line art portrait, elegant sparse clean lines, mostly white space, subtle flat color accents, refined simple anime linework",
    negativePrompt: SHARED_NEGATIVE + ", heavy shading, busy details",
    recommendedStrength: 0.7,
    swatch: ["#17141F", "#E9E4FF"],
  },
];

export const DEFAULT_PRESET_ID = STYLE_PRESETS[0].id;

export function getPreset(id: string): StylePreset {
  return STYLE_PRESETS.find((p) => p.id === id) ?? STYLE_PRESETS[0];
}
