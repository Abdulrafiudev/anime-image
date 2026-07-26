/**
 * Tiny, dependency-free User-Agent parser — enough to label dashboard rows with
 * device type, OS, and browser. Not exhaustive; good enough for analytics.
 */

export type DeviceInfo = {
  /** Desktop | Mobile | Tablet | Bot | Unknown */
  deviceType: string;
  os: string;
  browser: string;
};

export function parseUserAgent(ua: string | null | undefined): DeviceInfo {
  if (!ua) return { deviceType: "Unknown", os: "Unknown", browser: "Unknown" };
  const s = ua.toLowerCase();

  // Device type
  let deviceType = "Desktop";
  if (/bot|crawler|spider|crawling|headless/.test(s)) deviceType = "Bot";
  else if (/ipad|(android(?!.*mobile))|tablet|playbook|silk/.test(s)) deviceType = "Tablet";
  else if (/mobi|iphone|ipod|android.*mobile|windows phone|blackberry/.test(s))
    deviceType = "Mobile";

  // OS
  let os = "Unknown";
  if (/iphone|ipad|ipod/.test(s)) os = "iOS";
  else if (/android/.test(s)) os = "Android";
  else if (/windows/.test(s)) os = "Windows";
  else if (/mac os x|macintosh/.test(s)) os = "macOS";
  else if (/cros/.test(s)) os = "ChromeOS";
  else if (/linux/.test(s)) os = "Linux";

  // Browser (order matters — check the more specific ones first)
  let browser = "Unknown";
  if (/edg\//.test(s)) browser = "Edge";
  else if (/opr\/|opera/.test(s)) browser = "Opera";
  else if (/samsungbrowser/.test(s)) browser = "Samsung Internet";
  else if (/firefox|fxios/.test(s)) browser = "Firefox";
  else if (/chrome|crios/.test(s)) browser = "Chrome";
  else if (/safari/.test(s)) browser = "Safari";

  return { deviceType, os, browser };
}
