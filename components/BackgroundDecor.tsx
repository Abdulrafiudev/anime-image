import Image from "next/image";

/**
 * Fixed, non-interactive brand backdrop:
 *   1. A fine "net" of crosshatch lines rising from the bottom, faded upward.
 *   2. A faded original anime character anchored bottom-right.
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
      <div
        className="absolute inset-x-0 bottom-0 h-[70vh]"
        style={{
          WebkitMaskImage: "linear-gradient(to top, #000 0%, #000 35%, transparent 100%)",
          maskImage: "linear-gradient(to top, #000 0%, #000 35%, transparent 100%)",
        }}
      >
        <svg width="100%" height="100%" className="text-ink">
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
                opacity="0.16"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#brand-net)" />
        </svg>
      </div>

      {/* Faded original anime character, bottom-right. */}
      <div className="absolute -bottom-12 right-[1%] hidden h-[82vh] w-[44vw] max-w-[680px] sm:block">
        <Image
          src="/images/anime-character.webp"
          alt=""
          fill
          sizes="44vw"
          className="object-contain object-bottom mix-blend-multiply opacity-[0.12]"
        />
      </div>
    </div>
  );
}
