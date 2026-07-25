import { Logo } from "./Logo";

export function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-surface/85 backdrop-blur-lg">
      <div className="mx-auto flex w-[90%] max-w-[1600px] items-center justify-between py-3.5">
        <Logo />
        <span className="hidden items-center gap-1.5 rounded-full border border-line bg-white px-3 py-1 text-xs text-muted sm:flex">
          <span className="h-1.5 w-1.5 rounded-full bg-violet" />
          No account · nothing stored
        </span>
      </div>
    </header>
  );
}
