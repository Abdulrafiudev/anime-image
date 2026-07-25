"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { STYLE_PRESETS, type StylePreset } from "@/lib/presets";

type Props = {
  selectedId: string;
  onSelect: (preset: StylePreset) => void;
};

export function StyleGallery({ selectedId, onSelect }: Props) {
  return (
    <fieldset>
      <legend className="sr-only">Choose an anime style</legend>
      <div
        role="radiogroup"
        aria-label="Anime style presets"
        className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3"
      >
        {STYLE_PRESETS.map((preset) => {
          const selected = preset.id === selectedId;
          return (
            <motion.button
              key={preset.id}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onSelect(preset)}
              whileTap={{ scale: 0.97 }}
              className={[
                "group relative overflow-hidden rounded-2xl border-2 p-3 text-left transition-colors",
                selected
                  ? "border-violet bg-violet/[0.06]"
                  : "border-line bg-white hover:border-violet/50",
              ].join(" ")}
            >
              <span className="relative mb-2.5 block aspect-[4/3] w-full overflow-hidden rounded-xl bg-lavender">
                <Image
                  src={preset.image}
                  alt={`${preset.label} example`}
                  fill
                  sizes="(min-width: 1280px) 150px, (min-width: 1024px) 220px, (min-width: 640px) 180px, 42vw"
                  className="object-cover transition-transform duration-300 group-hover:scale-[1.04]"
                />
              </span>
              <span className="font-display block text-sm font-bold text-ink">
                {preset.label}
              </span>
              <span className="mt-0.5 block text-[11px] leading-snug text-muted">
                {preset.description}
              </span>

              {selected && (
                <span
                  aria-hidden
                  className="absolute right-2.5 top-2.5 grid h-5 w-5 place-items-center rounded-full bg-violet text-white"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M5 13l4 4L19 7"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
              )}
            </motion.button>
          );
        })}
      </div>
    </fieldset>
  );
}
