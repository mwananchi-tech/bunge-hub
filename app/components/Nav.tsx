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
  const [menuOpen, setMenuOpen] = useState(false);
  const shortcutLabel = useShortcutLabel();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
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
            {/* lg:-ml-3 cancels the link padding so the "M" of Members sits on the frame edge */}
            <nav className="hidden sm:flex items-center gap-1 flex-1 lg:-ml-3">
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
                className="flex items-center gap-2 px-3 h-8 rounded-control text-sm"
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
                <span className="hidden sm:inline">Search</span>
                <kbd
                  className="hidden sm:inline text-xs px-1 rounded"
                  style={{ border: "1px solid var(--color-border)" }}
                >
                  {shortcutLabel}
                </kbd>
              </button>

              {/* Last item: its right edge is the page frame's right edge */}
              <ThemeToggle />

              {/* Hamburger — mobile only */}
              <button
                className="sm:hidden p-1.5 rounded"
                style={{ color: "var(--color-muted)" }}
                onClick={() => setMenuOpen((o) => !o)}
                aria-label="Toggle menu"
              >
                {menuOpen ? (
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div
            className="sm:hidden border-t px-6 py-3 flex flex-col gap-1"
            style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-bg)" }}
          >
            {NAV_LINKS.map(({ to, label }) => {
              const active = location.pathname.startsWith(to);
              return (
                <Link
                  key={to}
                  to={to}
                  onClick={() => setMenuOpen(false)}
                  className="px-3 py-2 rounded text-sm"
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
          </div>
        )}
      </header>

      <CommandPalette open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
