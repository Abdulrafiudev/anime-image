/**
 * Turn an ISO alpha-2 country code (as provided by Vercel's
 * x-vercel-ip-country header) into a display name — e.g. "US" → "United States".
 * Uses the built-in Intl.DisplayNames, so there's no country table to maintain.
 */

let display: Intl.DisplayNames | null = null;

function getDisplay(): Intl.DisplayNames | null {
  if (display) return display;
  try {
    display = new Intl.DisplayNames(["en"], { type: "region" });
  } catch {
    display = null;
  }
  return display;
}

export function countryName(code: string): string {
  if (!code) return "Unknown";
  const upper = code.toUpperCase();
  try {
    return getDisplay()?.of(upper) ?? upper;
  } catch {
    return upper;
  }
}

/** ISO alpha-2 → flag emoji (regional indicator letters). */
export function countryFlag(code: string): string {
  if (!code || code.length !== 2) return "🏳️";
  const A = 0x1f1e6;
  const base = "A".charCodeAt(0);
  const chars = code
    .toUpperCase()
    .split("")
    .map((c) => String.fromCodePoint(A + (c.charCodeAt(0) - base)));
  return chars.join("");
}
