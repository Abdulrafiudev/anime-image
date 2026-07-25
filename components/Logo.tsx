/**
 * Brand logo: a flat violet mark plus the Space Grotesk wordmark.
 */
export function Logo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <span
        aria-hidden
        className="grid h-8 w-8 place-items-center rounded-[10px] bg-violet"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          {/* A simple spark/star mark — abstract, no franchise reference. */}
          <path
            d="M12 2.5c.4 3.9 2.6 6.1 6.5 6.5-3.9.4-6.1 2.6-6.5 6.5-.4-3.9-2.6-6.1-6.5-6.5 3.9-.4 6.1-2.6 6.5-6.5Z"
            fill="white"
          />
          <circle cx="18.5" cy="17.5" r="2" fill="white" opacity="0.9" />
        </svg>
      </span>
      <span className="font-display text-[19px] font-bold leading-none text-ink">
        Anime<span className="text-violet">Studio</span>
      </span>
    </div>
  );
}
