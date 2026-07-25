"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

type Props = {
  byokKey: string;
  onKeyChange: (key: string) => void;
};

/**
 * Advanced, off-by-default "bring your own key" panel. The key is held only in
 * React state (memory) for the session — never written to localStorage. It is
 * sent with a single conversion request and never stored server-side.
 */
export function AdvancedSettings({ byokKey, onKeyChange }: Props) {
  const [open, setOpen] = useState(false);
  const enabled = byokKey.length > 0 || open;

  return (
    <div className="rounded-2xl border border-line bg-white">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <span className="flex items-center gap-2 text-sm font-medium text-muted">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
          </svg>
          Advanced · bring your own key
        </span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={`text-muted transition-transform ${open ? "rotate-180" : ""}`}
        >
          <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      <AnimatePresence initial={false}>
        {enabled && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="space-y-2 px-4 pb-4">
              <label htmlFor="byok" className="block text-xs text-muted">
                Paste your own OpenAI key to use it for conversions. Held in
                memory only &mdash; never saved, sent with a single request and
                not stored on our server.
              </label>
              <input
                id="byok"
                type="password"
                autoComplete="off"
                spellCheck={false}
                placeholder="sk-…"
                value={byokKey}
                onChange={(e) => onKeyChange(e.target.value)}
                className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-muted/60 focus:border-violet focus:outline-none"
              />
              <p className="text-[11px] text-muted/80">
                Leave empty to use the server key (recommended).
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
