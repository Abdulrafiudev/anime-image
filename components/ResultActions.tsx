"use client";

import { useState } from "react";
import { motion } from "framer-motion";

type Props = {
  resultSrc: string;
  onTryAnother: () => void;
  onStartOver: () => void;
};

export function ResultActions({ resultSrc, onTryAnother, onStartOver }: Props) {
  const [toast, setToast] = useState<string | null>(null);

  const flash = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2200);
  };

  const fetchBlob = async (): Promise<Blob> => {
    const res = await fetch(resultSrc);
    if (!res.ok) throw new Error("fetch failed");
    return res.blob();
  };

  const handleDownload = async () => {
    try {
      const blob = await fetchBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `anime-studio-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      // Cross-origin fallback: open in a new tab so the user can save manually.
      window.open(resultSrc, "_blank", "noopener,noreferrer");
      flash("Opened in a new tab — long-press or right-click to save");
    }
  };

  const handleShare = async () => {
    // Prefer sharing the actual image file where supported.
    try {
      const blob = await fetchBlob();
      const file = new File([blob], "anime-studio.png", { type: blob.type || "image/png" });
      const nav = navigator as Navigator & {
        canShare?: (data?: ShareData) => boolean;
      };
      if (nav.share && nav.canShare?.({ files: [file] })) {
        await nav.share({
          files: [file],
          title: "My anime character",
          text: "Made with Anime Studio",
        });
        return;
      }
    } catch {
      /* fall through to link/clipboard fallbacks */
    }

    // Fallback 1: copy the image URL to clipboard.
    try {
      await navigator.clipboard.writeText(resultSrc);
      flash("Image link copied to clipboard");
      return;
    } catch {
      /* fall through */
    }

    // Fallback 2: open the image.
    window.open(resultSrc, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="relative">
      <div className="grid grid-cols-2 gap-3">
        <motion.button
          type="button"
          whileTap={{ scale: 0.98 }}
          onClick={handleDownload}
          className="col-span-2 flex items-center justify-center gap-2 rounded-xl bg-violet px-4 py-3 font-semibold text-white transition-colors hover:bg-violet-700 sm:col-span-1"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 3v12m0 0l-4-4m4 4l4-4M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
          </svg>
          Download
        </motion.button>

        <motion.button
          type="button"
          whileTap={{ scale: 0.98 }}
          onClick={handleShare}
          className="col-span-2 flex items-center justify-center gap-2 rounded-xl border border-line bg-white px-4 py-3 font-semibold text-ink transition-colors hover:border-violet/50 hover:bg-lavender/40 sm:col-span-1"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7" />
            <path d="M16 6l-4-4-4 4M12 2v13" />
          </svg>
          Share
        </motion.button>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={onTryAnother}
          className="rounded-xl px-4 py-2.5 text-sm font-medium text-violet transition-colors hover:bg-violet/10"
        >
          Try another style
        </button>
        <button
          type="button"
          onClick={onStartOver}
          className="rounded-xl px-4 py-2.5 text-sm font-medium text-muted transition-colors hover:bg-lavender/40 hover:text-ink"
        >
          Start over
        </button>
      </div>

      {toast && (
        <div
          role="status"
          className="absolute -top-12 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-ink px-4 py-2 text-xs font-medium text-white"
        >
          {toast}
        </div>
      )}
    </div>
  );
}
