import { Link, useLocation } from "react-router";
import { useState, useEffect } from "react";
import { CommandPalette } from "./CommandPalette";

const NAV_LINKS = [
  { to: "/members",  label: "Members"  },
  { to: "/bills",    label: "Bills"    },
  { to: "/topics",   label: "Topics"   },
  { to: "/sittings", label: "Sittings" },
  { to: "/about",    label: "About"    },
];

export function Nav() {
  const location = useLocation();
  const [searchOpen, setSearchOpen] = useState(false);

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
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center gap-8">
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <img src="/logo.png" alt="Bunge Hub" className="w-7 h-7 rounded-full" />
            <span className="font-serif text-lg font-semibold"
                  style={{ color: "var(--color-accent)" }}>
              Bunge Hub
            </span>
          </Link>

          <nav className="hidden sm:flex items-center gap-1 flex-1">
            {NAV_LINKS.map(({ to, label }) => {
              const active = location.pathname.startsWith(to);
              return (
                <Link key={to} to={to}
                      className="px-3 py-1.5 rounded text-sm transition-colors"
                      style={{
                        color: active ? "var(--color-accent)" : "var(--color-muted)",
                        backgroundColor: active ? "var(--color-surface)" : "transparent",
                        fontWeight: active ? 500 : 400,
                      }}>
                  {label}
                </Link>
              );
            })}
          </nav>

          <button onClick={() => setSearchOpen(true)}
                  className="ml-auto flex items-center gap-2 px-3 py-1.5 rounded text-sm"
                  style={{
                    border: "1px solid var(--color-border)",
                    color: "var(--color-muted)",
                    backgroundColor: "var(--color-surface)",
                  }}>
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 16 16"
                 stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" d="M6.5 12a5.5 5.5 0 100-11 5.5 5.5 0 000 11zM14 14l-3-3" />
            </svg>
            <span className="hidden sm:inline">Search</span>
            <kbd className="hidden sm:inline text-xs px-1 rounded"
                 style={{ border: "1px solid var(--color-border)" }}>⌘K</kbd>
          </button>
        </div>
      </header>

      <CommandPalette open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
