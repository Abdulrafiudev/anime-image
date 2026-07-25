"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

const STATUSES = [
  "Mapping your features…",
  "Inking the first frame…",
  "Mixing the cel palette…",
  "Directing the highlights…",
  "Rendering the final frame…",
  "Adding the last details…",
];

/**
 * A lively anime-production sequence with an orbiting brand mark, animated
 * frame cards, rotating status copy, and segmented progress.
 */
export function LoadingState() {
  const [progress, setProgress] = useState(6);
  const [statusIdx, setStatusIdx] = useState(0);

  useEffect(() => {
    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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

  const activeSegments = Math.ceil((progress / 100) * 14);

  return (
    <div
      className="flex flex-col items-center justify-center gap-7 py-12 sm:py-16"
      role="status"
      aria-live="polite"
    >
      <div className="anime-loader-stage" aria-hidden>
        <div className="anime-loader-orbit">
          <span className="anime-loader-dot anime-loader-dot-violet" />
          <span className="anime-loader-dot anime-loader-dot-cyan" />
          <span className="anime-loader-dot anime-loader-dot-coral" />
        </div>
        <span className="anime-loader-slash anime-loader-slash-one" />
        <span className="anime-loader-slash anime-loader-slash-two" />
        <span className="anime-loader-slash anime-loader-slash-three" />
        <span className="anime-loader-card anime-loader-card-back" />
        <div className="anime-loader-card anime-loader-card-front">
          <Image
            src="/images/anime-studio-mark.png"
            alt=""
            width={58}
            height={58}
            className="h-[58px] w-[58px] object-contain"
          />
        </div>
      </div>

      <div className="w-full max-w-sm text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-violet/25 bg-lavender px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-violet">
          <span className="anime-loader-live-dot h-1.5 w-1.5 rounded-full bg-coral" />
          Studio rendering
        </span>
        <p className="font-display mt-3 text-lg font-bold text-ink">
          Your anime frame is taking shape
        </p>
        <p
          key={statusIdx}
          className="anime-loader-status mt-1 h-5 text-sm text-muted"
        >
          {STATUSES[statusIdx]}
        </p>

        <div className="mt-5 flex h-2.5 w-full gap-1" aria-hidden>
          {Array.from({ length: 14 }, (_, index) => {
            const active = index < activeSegments;
            const color =
              index % 3 === 0
                ? "bg-violet"
                : index % 3 === 1
                  ? "bg-cyan"
                  : "bg-coral";

            return (
              <span
                key={index}
                className={[
                  "h-full flex-1 rounded-full transition-all duration-300",
                  active ? `${color} scale-y-100` : "scale-y-75 bg-line",
                ].join(" ")}
              />
            );
          })}
        </div>

        <div className="mt-3 flex items-center justify-between text-xs text-muted">
          <span>Frame progress</span>
          <span className="rounded-full border border-line bg-white px-2.5 py-1 font-bold tabular-nums text-violet">
            {Math.round(progress)}%
          </span>
        </div>
      </div>
    </div>
  );
}
