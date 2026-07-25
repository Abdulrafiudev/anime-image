import Image from "next/image";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <div
      className={`flex items-center gap-2.5 ${className}`}
      aria-label="Anime Studio"
    >
      <Image
        src="/images/anime-studio-mark.png"
        alt=""
        width={36}
        height={36}
        priority
        className="h-9 w-9 object-contain"
      />
      <span className="font-display text-[19px] font-bold leading-none tracking-[-0.045em] text-ink">
        Anime <span className="font-medium text-muted">Studio</span>
      </span>
    </div>
  );
}
