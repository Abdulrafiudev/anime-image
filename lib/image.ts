/**
 * Client-side image helpers: validation and downscaling.
 *
 * We downscale large photos in the browser before uploading so requests stay
 * fast and well under the proxy's size limit. All work happens on a <canvas>;
 * nothing is sent anywhere from here.
 */

export const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/webp"];
export const MAX_FILE_BYTES = 20 * 1024 * 1024; // 20MB pre-downscale
export const MAX_DIMENSION = 1280; // longest edge after downscale

export type ValidationResult =
  | { ok: true }
  | { ok: false; reason: string };

export function validateFile(file: File): ValidationResult {
  if (!ACCEPTED_TYPES.includes(file.type)) {
    return {
      ok: false,
      reason: "That's not a supported image. Please use a PNG, JPEG, or WebP.",
    };
  }
  if (file.size > MAX_FILE_BYTES) {
    return {
      ok: false,
      reason: "That image is over 20MB. Please choose a smaller file.",
    };
  }
  return { ok: true };
}

/**
 * Read a File and return a downscaled JPEG/PNG data URL whose longest edge is
 * at most MAX_DIMENSION. Transparency-bearing PNGs are kept as PNG; everything
 * else is compressed to JPEG for size.
 */
export async function fileToDownscaledDataUrl(
  file: File,
  maxDimension = MAX_DIMENSION,
): Promise<string> {
  const bitmap = await loadImage(file);
  const { width, height } = bitmap;

  const scale = Math.min(1, maxDimension / Math.max(width, height));
  const targetW = Math.max(1, Math.round(width * scale));
  const targetH = Math.max(1, Math.round(height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is not supported in this browser.");

  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap, 0, 0, targetW, targetH);
  if ("close" in bitmap && typeof bitmap.close === "function") bitmap.close();

  const keepPng = file.type === "image/png";
  return canvas.toDataURL(
    keepPng ? "image/png" : "image/jpeg",
    keepPng ? undefined : 0.92,
  );
}

function loadImage(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof createImageBitmap === "function") {
    return createImageBitmap(file);
  }
  // Fallback for older browsers.
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read that image."));
    };
    img.src = url;
  });
}

/** Extract a File from a paste or drop event's items, if present. */
export function fileFromClipboard(items: DataTransferItemList | null): File | null {
  if (!items) return null;
  for (const item of Array.from(items)) {
    if (item.kind === "file" && item.type.startsWith("image/")) {
      const f = item.getAsFile();
      if (f) return f;
    }
  }
  return null;
}
