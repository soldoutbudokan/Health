"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

/*
 * Only the three pages in daily use, by request on November 10, 2026. History,
 * Foods, Training and Program still build and still answer at their URLs; they
 * are just not linked from anywhere.
 */
const LINKS = [
  { href: "/", label: "Today" },
  { href: "/last-stretch", label: "Last stretch" },
  { href: "/next-block", label: "Next block" },
];

function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark" | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("nc-theme");
    if (stored === "light" || stored === "dark") setTheme(stored);
    else
      setTheme(
        window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light",
      );
  }, []);

  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("nc-theme", next);
  }

  return (
    <button
      onClick={toggle}
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      className="site-nav-link rounded-lg border border-current/30 px-2.5 py-1.5 transition-colors"
    >
      {theme === "dark" ? (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
          <circle cx="12" cy="12" r="4.5" stroke="currentColor" strokeWidth="2" />
          <path
            d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M20 14.5A8.5 8.5 0 019.5 4a8.5 8.5 0 1010.5 10.5z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </button>
  );
}

export function Nav() {
  const pathname = usePathname();

  return (
    <header className="site-nav sticky top-0 z-30">
      <div className="mx-auto flex w-full max-w-5xl items-center gap-1 px-4 py-3 sm:px-6">
        <Link
          href="/"
          className="mr-3 shrink-0 font-display text-xl font-bold uppercase tracking-wider text-white"
        >
          Health
        </Link>

        {/* Five links no longer fit a narrow phone. Scrolling the strip keeps
            every destination reachable without collapsing them behind a menu
            that costs a tap to open — but a link sheared off mid-word reads as
            a broken layout, not as "there is more this way", so the right edge
            fades. Where the links already fit, the fade lands on empty space
            and shows nothing. */}
        <nav className="-mx-1 flex min-w-0 flex-1 items-center gap-1 overflow-x-auto px-1 [mask-image:linear-gradient(to_right,#000_calc(100%-32px),transparent)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {LINKS.map((l) => {
            const active = pathname === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                aria-current={active ? "page" : undefined}
                className="site-nav-link shrink-0 rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors"
              >
                {l.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-2 shrink-0">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
