import Image from "next/image";

/**
 * Fixed, non-interactive brand backdrop:
 *   1. A fine "net" of crosshatch lines rising from the bottom, faded upward.
 *   2. A pair of faded original anime characters framing the page.
 *
 * The artwork stays at low opacity so content remains legible. Everything sits
 * behind the page (-z-10), and white cards naturally cover it where they overlap.
 */
export function BackgroundDecor() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      {/* The net — crosshatch lines anchored to the bottom, fading toward the top. */}
      <div className="absolute inset-x-0 bottom-0 h-[70vh] opacity-[0.36]">
        <svg width="100%" height="100%" className="text-violet">
          <defs>
            <pattern
              id="brand-net"
              width="46"
              height="46"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M46 0H0V46"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
                opacity="0.22"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#brand-net)" />
        </svg>
      </div>

      {/* Faded original male character, bottom-left. */}
      <div className="anime-character-shell anime-character-shell-left absolute -bottom-14 -left-[10%] hidden h-[84vh] w-[44vw] max-w-[680px] md:block">
        <div className="anime-character-float anime-character-float-left absolute inset-0">
          <Image
            src="/images/anime-character-male-color.webp"
            alt=""
            fill
            sizes="44vw"
            className="object-contain object-bottom mix-blend-multiply opacity-[0.18] lg:opacity-[0.26]"
          />
        </div>
      </div>

      {/* Faded original female character, bottom-right. */}
      <div className="anime-character-shell anime-character-shell-right absolute -bottom-14 -right-[10%] hidden h-[84vh] w-[46vw] max-w-[700px] sm:block">
        <div className="anime-character-float anime-character-float-right absolute inset-0">
          <Image
            src="/images/anime-character-color.webp"
            alt=""
            fill
            sizes="46vw"
            className="object-contain object-bottom mix-blend-multiply opacity-[0.24]"
          />
        </div>
      </div>
    </div>
  );
}
