"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Props = {
  beforeSrc: string;
  afterSrc: string;
};

/**
 * Draggable before/after comparison. The handle is a real slider input for
 * full keyboard + screen-reader support; pointer dragging updates the same
 * value. The "after" (anime) image is revealed on the right.
 */
export function BeforeAfter({ beforeSrc, afterSrc }: Props) {
  const [pos, setPos] = useState(50); // percentage revealed of the "before" layer
  const containerRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);

  const setFromClientX = useCallback((clientX: number) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const pct = ((clientX - rect.left) / rect.width) * 100;
    setPos(Math.min(100, Math.max(0, pct)));
  }, []);

  useEffect(() => {
    const move = (e: PointerEvent) => {
      if (!draggingRef.current) return;
      setFromClientX(e.clientX);
    };
    const up = () => {
      draggingRef.current = false;
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
  }, [setFromClientX]);

  return (
    <div className="w-full">
      <div
        ref={containerRef}
        className="relative aspect-square w-full select-none overflow-hidden rounded-2xl bg-lavender"
        onPointerDown={(e) => {
          draggingRef.current = true;
          setFromClientX(e.clientX);
        }}
      >
        {/* After (anime) fills the background. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={afterSrc}
          alt="Anime-style result"
          draggable={false}
          className="absolute inset-0 h-full w-full object-cover"
        />

        {/* Before (original), full-size but clipped to the left of the handle. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={beforeSrc}
          alt="Your original photo"
          draggable={false}
          className="absolute inset-0 h-full w-full object-cover"
          style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}
        />

        <span
          className="absolute bottom-3 left-3 rounded-full bg-ink/75 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur transition-opacity"
          style={{ opacity: pos > 12 ? 1 : 0 }}
        >
          Before
        </span>
        <span
          className="absolute bottom-3 right-3 rounded-full bg-violet px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur transition-opacity"
          style={{ opacity: pos < 88 ? 1 : 0 }}
        >
          After
        </span>

        {/* Divider + handle. */}
        <div
          className="pointer-events-none absolute inset-y-0 z-10 w-0.5 bg-violet"
          style={{ left: `${pos}%` }}
        >
          <div className="pointer-events-none absolute top-1/2 left-1/2 grid h-10 w-10 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-2 border-violet bg-white text-violet">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 7l-5 5 5 5M15 7l5 5-5 5" />
            </svg>
          </div>
        </div>

        {/* Accessible slider overlay for keyboard control. */}
        <input
          type="range"
          min={0}
          max={100}
          value={Math.round(pos)}
          onChange={(e) => setPos(Number(e.target.value))}
          aria-label="Reveal slider: drag to compare your original photo with the anime result"
          className="absolute inset-0 z-20 h-full w-full cursor-ew-resize opacity-0"
        />
      </div>

      <p className="mt-2.5 text-center text-xs text-muted">
        Drag the handle — or use arrow keys — to compare
      </p>
    </div>
  );
}
