"use client";

import { useEffect, useState } from "react";

const STATUSES = [
  "Reading your photo…",
  "Sketching the linework…",
  "Blocking in cel colors…",
  "Adding anime shading…",
  "Polishing the details…",
  "Almost there…",
];

/**
 * A tasteful loading state: a smoothly-easing progress bar that approaches (but
 * never reaches) 100% until the real result lands, plus rotating status text.
 * Reduced-motion users get the same information without the animation.
 */
export function LoadingState() {
  const [progress, setProgress] = useState(6);
  const [statusIdx, setStatusIdx] = useState(0);

  useEffect(() => {
    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Ease toward ~92% so it feels like real work, then hold.
    const tick = setInterval(
      () => {
        setProgress((p) => (p >= 92 ? p : p + Math.max(0.5, (92 - p) * 0.06)));
      },
      prefersReduced ? 600 : 180,
    );

    const rotate = setInterval(() => {
      setStatusIdx((i) => (i + 1) % STATUSES.length);
    }, 2200);

    return () => {
      clearInterval(tick);
      clearInterval(rotate);
    };
  }, []);

  return (
    <div
      className="flex flex-col items-center justify-center gap-6 py-16"
      role="status"
      aria-live="polite"
    >
      <div className="grid h-16 w-16 place-items-center rounded-2xl bg-lavender text-violet">
        <svg
          className="animate-spin"
          width="30"
          height="30"
          viewBox="0 0 24 24"
          fill="none"
        >
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.5" opacity="0.25" />
          <path
            d="M21 12a9 9 0 0 0-9-9"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </svg>
      </div>

      <div className="w-full max-w-xs text-center">
        <p className="font-display font-bold text-ink">Converting your photo</p>
        <p className="mt-1 h-5 text-sm text-muted transition-all">
          {STATUSES[statusIdx]}
        </p>

        <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-lavender">
          <div
            className="h-full rounded-full bg-violet transition-[width] duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="mt-2 tabular-nums text-xs text-muted">
          {Math.round(progress)}%
        </p>
      </div>
    </div>
  );
}
