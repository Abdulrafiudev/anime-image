"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  fileToDownscaledDataUrl,
  validateFile,
  fileFromClipboard,
  MAX_DIMENSION,
} from "@/lib/image";

type Props = {
  onImageReady: (dataUrl: string) => void;
  /** Compact variant shown after an image already exists (for "start over"). */
  compact?: boolean;
};

export function UploadZone({ onImageReady, compact = false }: Props) {
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    async (file: File | null) => {
      if (!file) return;
      setError(null);
      const check = validateFile(file);
      if (!check.ok) {
        setError(check.reason);
        return;
      }
      try {
        setBusy(true);
        const dataUrl = await fileToDownscaledDataUrl(file);
        onImageReady(dataUrl);
      } catch {
        setError("We couldn't read that image. Try a different file.");
      } finally {
        setBusy(false);
      }
    },
    [onImageReady],
  );

  // Paste-to-upload support anywhere on the page.
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const file = fileFromClipboard(e.clipboardData?.items ?? null);
      if (file) {
        e.preventDefault();
        void handleFile(file);
      }
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [handleFile]);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file =
      fileFromClipboard(e.dataTransfer?.items ?? null) ??
      e.dataTransfer?.files?.[0] ??
      null;
    void handleFile(file);
  };

  return (
    <div className={compact ? "" : "w-full"}>
      <motion.button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        whileTap={{ scale: 0.99 }}
        aria-label="Upload a photo to convert. Drag and drop, paste, or click to browse."
        className={[
          "group relative flex w-full flex-col items-center justify-center gap-4 rounded-3xl border-2 border-dashed text-center transition-colors",
          compact ? "px-6 py-8" : "px-6 py-16 sm:py-20",
          dragging
            ? "border-violet bg-violet/5"
            : "border-line bg-white hover:border-violet/60 hover:bg-violet/[0.03]",
        ].join(" ")}
      >
        <span
          aria-hidden
          className={[
            "grid place-items-center rounded-2xl transition-transform",
            compact ? "h-12 w-12" : "h-16 w-16",
            dragging ? "scale-110" : "group-hover:scale-105",
            "bg-lavender text-violet",
          ].join(" ")}
        >
          {busy ? (
            <Spinner />
          ) : (
            <svg
              width={compact ? 22 : 28}
              height={compact ? 22 : 28}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 16V4m0 0L7 9m5-5 5 5" />
              <path d="M5 16v2a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-2" />
            </svg>
          )}
        </span>

        <div>
          <p
            className={`font-display font-bold text-ink ${compact ? "text-base" : "text-lg sm:text-xl"}`}
          >
            {busy ? "Preparing your photo…" : "Drop your photo here"}
          </p>
          {!busy && (
            <p className="mt-1 text-sm text-muted">
              or <span className="text-violet">browse</span>, or paste from
              clipboard
            </p>
          )}
        </div>

        {!compact && !busy && (
          <p className="text-xs text-muted/80">
            PNG, JPEG or WebP · up to 20MB · auto-resized to {MAX_DIMENSION}px
          </p>
        )}

        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="sr-only"
          onChange={(e) => void handleFile(e.target.files?.[0] ?? null)}
        />
      </motion.button>

      {error && (
        <p
          role="alert"
          className="mt-3 text-center text-sm font-medium text-pink"
        >
          {error}
        </p>
      )}
    </div>
  );
}

function Spinner() {
  return (
    <svg
      className="animate-spin"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeWidth="2.5"
        opacity="0.2"
      />
      <path
        d="M21 12a9 9 0 0 0-9-9"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
