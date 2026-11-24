import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router";

import { CommandPalette } from "./CommandPalette";
import { ThemeToggle } from "./ThemeToggle";

const NAV_LINKS = [
  { to: "/members", label: "Members" },
  { to: "/bills", label: "Bills" },
  { to: "/topics", label: "Topics" },
  { to: "/sittings", label: "Sittings" },
  { to: "/about", label: "About" },
];

/** Dispatch this on window to open the search palette from anywhere. */
export const OPEN_SEARCH_EVENT = "bungehub:open-search";

export function openSearch() {
  window.dispatchEvent(new Event(OPEN_SEARCH_EVENT));
}

function useShortcutLabel() {
  const [label, setLabel] = useState("⌘K");
  useEffect(() => {
    const isMac =
      /Mac|iPhone|iPad|iPod/.test(navigator.platform) || navigator.userAgent.includes("Mac");
    setLabel(isMac ? "⌘K" : "Ctrl+K");
  }, []);
  return label;
}

export function Nav() {
  const location = useLocation();
  const [searchOpen, setSearchOpen] = useState(false);
  const shortcutLabel = useShortcutLabel();
  // The home page has its own search bar in the page, so the header hides its search button there (one search per screen)
  const isHome = location.pathname === "/";

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    // Other parts of the page (like the home page search box) can open search too
    const open = () => setSearchOpen(true);
    window.addEventListener("keydown", handler);
    window.addEventListener(OPEN_SEARCH_EVENT, open);
    return () => {
      window.removeEventListener("keydown", handler);
      window.removeEventListener(OPEN_SEARCH_EVENT, open);
    };
  }, []);

  return (
    <>
      <header
        className="sticky top-0 z-40 border-b"
        style={{
          borderColor: "var(--color-border)",
          backgroundColor: "color-mix(in srgb, var(--color-bg) 94%, transparent)",
          backdropFilter: "blur(8px)",
        }}
      >
        {/* Below 1024px the logo sits in the row. From 1024px it is pinned 32px from the
            screen edge and the menu starts on the page frame's left edge (see .page-frame). */}
        <div className="flex items-center pl-6 lg:block lg:pl-0">
          <Link
            to="/"
            className="flex items-center gap-2 shrink-0 lg:absolute lg:left-8 lg:top-0 lg:h-14"
          >
            <img src="/logo.png" alt="Bunge Hub" className="w-7 h-7 rounded-full" />
            <span
              className="font-serif text-lg font-semibold"
              style={{ color: "var(--color-accent)" }}
            >
              Bunge Hub
            </span>
          </Link>

          <div className="page-frame flex-1 h-14 flex items-center gap-8">
            {/* lg:-ml-3 cancels the link padding so the first letter of the first link sits on the frame edge */}
            {/* Below 768px these links move to the bottom tab bar (BottomNav) */}
            <nav className="hidden md:flex items-center gap-1 flex-1 lg:-ml-3">
              {NAV_LINKS.map(({ to, label }) => {
                const active = location.pathname.startsWith(to);
                return (
                  <Link
                    key={to}
                    to={to}
                    className="px-3 py-1.5 rounded text-sm transition-colors"
                    style={{
                      color: active ? "var(--color-accent)" : "var(--color-muted)",
                      backgroundColor: active ? "var(--color-surface)" : "transparent",
                      fontWeight: active ? 500 : 400,
                    }}
                  >
                    {label}
                  </Link>
                );
              })}
            </nav>

            <div className="ml-auto flex items-center gap-2">
              <button
                onClick={() => setSearchOpen(true)}
                aria-label="Search"
                className={`${isHome ? "hidden" : "flex"} items-center justify-center gap-2 size-11 md:size-auto md:px-3 md:h-8 rounded-control text-sm`}
                style={{
                  border: "1px solid var(--color-border)",
                  color: "var(--color-muted)",
                  backgroundColor: "var(--color-surface)",
                }}
              >
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  viewBox="0 0 16 16"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    d="M6.5 12a5.5 5.5 0 100-11 5.5 5.5 0 000 11zM14 14l-3-3"
                  />
                </svg>
                <span className="hidden md:inline">Search</span>
                <kbd
                  className="hidden md:inline text-xs px-1 rounded"
                  style={{ border: "1px solid var(--color-border)" }}
                >
                  {shortcutLabel}
                </kbd>
              </button>

              {/* Last item: its right edge is the page frame's right edge */}
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <CommandPalette open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
