"use client";

import Image from "next/image";
import { useCallback, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Header } from "@/components/Header";
import { UploadZone } from "@/components/UploadZone";
import { StyleGallery } from "@/components/StyleGallery";
import { Controls } from "@/components/Controls";
import { LoadingState } from "@/components/LoadingState";
import { BeforeAfter } from "@/components/BeforeAfter";
import { ResultActions } from "@/components/ResultActions";
import {
  DEFAULT_CONTROLS,
  type Controls as ControlsState,
} from "@/lib/controls";
import {
  DEFAULT_PRESET_ID,
  getPreset,
  type StylePreset,
} from "@/lib/presets";
import { convertImage } from "@/lib/convertClient";

type Status = "idle" | "converting" | "done" | "error";

export default function Home() {
  const [image, setImage] = useState<string | null>(null);
  const [presetId, setPresetId] = useState(DEFAULT_PRESET_ID);
  const [controls, setControls] = useState<ControlsState>(DEFAULT_CONTROLS);
  const [status, setStatus] = useState<Status>("idle");
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const stageRef = useRef<HTMLElement>(null);

  const preset = getPreset(presetId);

  // Bring the conversion canvas (preview / loading / result) into view. This
  // matters most on mobile, where the Convert button sits far below the stage.
  const scrollToStage = useCallback(() => {
    const el = stageRef.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  }, []);

  const handleImageReady = useCallback((dataUrl: string) => {
    setImage(dataUrl);
    setResult(null);
    setStatus("idle");
    setError(null);
  }, []);

  const handleSelectPreset = useCallback((p: StylePreset) => {
    setPresetId(p.id);
    // Nudge the stylization slider toward this preset's sweet spot.
    setControls((c) => ({
      ...c,
      stylization: Math.round(p.recommendedStrength * 100),
    }));
  }, []);

  const handleConvert = useCallback(async () => {
    if (!image) return;
    setStatus("converting");
    setError(null);
    setResult(null);
    // Jump to the canvas so the user sees progress (esp. on mobile).
    requestAnimationFrame(scrollToStage);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const url = await convertImage({
        imageDataUrl: image,
        presetId,
        controls,
        signal: controller.signal,
      });
      setResult(url);
      setStatus("done");
    } catch (err) {
      if ((err as Error)?.name === "AbortError") {
        setStatus("idle");
        return;
      }
      setError((err as Error)?.message || "Conversion failed. Please try again.");
      setStatus("error");
    } finally {
      abortRef.current = null;
    }
  }, [image, presetId, controls, scrollToStage]);

  const handleCancel = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const handleStartOver = useCallback(() => {
    abortRef.current?.abort();
    setImage(null);
    setResult(null);
    setStatus("idle");
    setError(null);
    setPresetId(DEFAULT_PRESET_ID);
    setControls(DEFAULT_CONTROLS);
  }, []);

  const handleTryAnother = useCallback(() => {
    setStatus("idle");
    setResult(null);
    setError(null);
  }, []);

  return (
    <>
      <Header />

      <main className="mx-auto w-[90%] max-w-[1600px] flex-1 pb-24 pt-8 sm:pt-12">
        {!image ? (
          <Landing onImageReady={handleImageReady} />
        ) : (
          <div className="grid gap-6 lg:grid-cols-5 lg:gap-8">
            {/* Stage: preview / loading / result */}
            <section ref={stageRef} className="scroll-mt-20 lg:col-span-3">
              <div className="rounded-3xl border border-line bg-white p-4 sm:p-5">
                <AnimatePresence mode="wait">
                  {status === "converting" ? (
                    <motion.div
                      key="loading"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <LoadingState />
                      <div className="text-center">
                        <button
                          type="button"
                          onClick={handleCancel}
                          className="rounded-lg px-4 py-2 text-sm font-medium text-muted transition-colors hover:text-ink"
                        >
                          Cancel
                        </button>
                      </div>
                    </motion.div>
                  ) : status === "done" && result ? (
                    <motion.div
                      key="result"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                    >
                      <BeforeAfter beforeSrc={image} afterSrc={result} />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="preview"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={image}
                        alt="Your uploaded photo, ready to convert"
                        className="aspect-square w-full rounded-2xl object-cover"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {status === "done" && result && (
                <div className="mt-4 lg:hidden">
                  <ResultActions
                    resultSrc={result}
                    onTryAnother={handleTryAnother}
                    onStartOver={handleStartOver}
                  />
                </div>
              )}

              <div className="mt-4">
                <UploadZone onImageReady={handleImageReady} compact />
              </div>
            </section>

            {/* Controls column */}
            <section className="space-y-5 lg:col-span-2">
              {status === "done" && result && (
                <div className="hidden lg:block">
                  <ResultActions
                    resultSrc={result}
                    onTryAnother={handleTryAnother}
                    onStartOver={handleStartOver}
                  />
                </div>
              )}

              <div className="rounded-3xl border border-line bg-white p-5">
                <h2 className="font-display mb-4 text-sm font-bold uppercase tracking-wide text-muted">
                  Choose a style
                </h2>
                <StyleGallery
                  selectedId={presetId}
                  onSelect={handleSelectPreset}
                />
              </div>

              <div className="rounded-3xl border border-line bg-white p-5">
                <Controls value={controls} onChange={setControls} />
              </div>

              {error && (
                <div
                  role="alert"
                  className="rounded-2xl border border-pink/30 bg-pink/[0.08] p-4 text-sm text-pink"
                >
                  <p className="font-semibold">Conversion failed</p>
                  <p className="mt-0.5 text-pink/90">{error}</p>
                </div>
              )}

              <motion.button
                type="button"
                whileTap={{ scale: 0.99 }}
                onClick={handleConvert}
                disabled={status === "converting"}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-violet px-6 py-4 text-base font-bold text-white transition-colors hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {status === "converting" ? (
                  "Converting…"
                ) : status === "done" ? (
                  <>Re-run with these settings</>
                ) : (
                  <>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M12 2.5c.4 3.9 2.6 6.1 6.5 6.5-3.9.4-6.1 2.6-6.5 6.5-.4-3.9-2.6-6.1-6.5-6.5 3.9-.4 6.1-2.6 6.5-6.5Z"
                        fill="white"
                      />
                    </svg>
                    Convert to {preset.label}
                  </>
                )}
              </motion.button>
              <p className="text-center text-xs text-muted">
                Secure server proxy · your key stays private
              </p>
            </section>
          </div>
        )}
      </main>

      <SiteFooter />
    </>
  );
}

/* --------------------------- Landing (no image) --------------------------- */

function Landing({
  onImageReady,
}: {
  onImageReady: (dataUrl: string) => void;
}) {
  return (
    <div className="mx-auto max-w-3xl">
      {/* Hero */}
      <div className="relative text-center">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-3.5 py-1.5 text-xs font-medium text-violet">
            Photo → anime in seconds
          </span>
          <h1 className="font-display mt-6 text-4xl font-bold leading-[1.05] text-violet sm:text-6xl">
            Turn your photo into an{" "}
            <span
              className="anime-wordmark-trigger relative inline-block cursor-default underline decoration-violet decoration-4 underline-offset-[6px]"
              tabIndex={0}
            >
              anime character
              <span className="anime-wordmark-popup" aria-hidden>
                <Image
                  src="/images/anime-studio-mark.png"
                  alt=""
                  width={54}
                  height={54}
                  className="anime-wordmark-popup-logo h-[54px] w-[54px] object-contain"
                />
                <span className="anime-wordmark-popup-dot anime-wordmark-popup-dot-cyan" />
                <span className="anime-wordmark-popup-dot anime-wordmark-popup-dot-coral" />
              </span>
            </span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base text-muted sm:text-lg">
            Upload a photo, pick from eleven hand-tuned styles, fine-tune the look,
            and compare before &amp; after. No sign-up, no clutter.
          </p>
        </motion.div>
      </div>

      {/* Upload */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="mt-10"
      >
        <UploadZone onImageReady={onImageReady} />
      </motion.div>

      {/* Reassurance row */}
      <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted">
        <Reassure>11 anime styles</Reassure>
        <Reassure>Fine control sliders</Reassure>
        <Reassure>Before / after compare</Reassure>
        <Reassure>Private — nothing stored</Reassure>
      </div>
    </div>
  );
}

function Reassure({ children }: { children: React.ReactNode }) {
  return (
    <span className="flex items-center gap-1.5">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-violet">
        <path
          d="M5 13l4 4L19 7"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {children}
    </span>
  );
}

function SiteFooter() {
  return (
    <footer className="border-t border-line py-6">
      <div className="mx-auto flex w-[90%] max-w-[1600px] flex-col items-center justify-between gap-2 text-xs text-muted sm:flex-row">
        <p>Anime Studio — a demo image-to-image converter.</p>
        <p>Your photos are processed on demand and never stored.</p>
      </div>
    </footer>
  );
}
