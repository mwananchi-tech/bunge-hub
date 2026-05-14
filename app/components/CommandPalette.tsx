import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";

import type { SearchResult } from "~/lib/queries/search.server";

const TYPE_LABELS: Record<string, string> = {
  member: "Members",
  bill: "Bills",
  topic: "Topics",
};

const TYPE_COLORS: Record<string, string> = {
  member: "#2D6A4F",
  bill: "#C8A45F",
  topic: "#78716C",
};

interface Props {
  open: boolean;
  onClose: () => void;
}

export function CommandPalette({ open, onClose }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setQuery("");
      setResults([]);
      setActiveIdx(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  // Debounced search
  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(data.results ?? []);
        setActiveIdx(0);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [query]);

  const grouped = results.reduce<Record<string, SearchResult[]>>((acc, r) => {
    (acc[r.type] ??= []).push(r);
    return acc;
  }, {});

  const flat = Object.values(grouped).flat();

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, flat.length - 1));
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    }
    if (e.key === "Enter" && flat[activeIdx]) {
      navigate(flat[activeIdx].urlPath);
      onClose();
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4"
      style={{ backgroundColor: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-xl rounded-xl shadow-2xl overflow-hidden"
        style={{ backgroundColor: "var(--color-bg)", border: "1px solid var(--color-border)" }}
      >
        {/* Input */}
        <div
          className="flex items-center gap-3 px-4 py-3 border-b"
          style={{ borderColor: "var(--color-border)" }}
        >
          <svg
            className="w-4 h-4 shrink-0"
            style={{ color: "var(--color-muted)" }}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z"
            />
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search members, bills, topics…"
            className="flex-1 bg-transparent outline-none text-sm"
            style={{ color: "var(--color-text)" }}
          />
          {loading && (
            <div
              className="w-3 h-3 rounded-full border-2 border-t-transparent animate-spin"
              style={{ borderColor: "var(--color-accent)" }}
            />
          )}
        </div>

        {/* Results */}
        {results.length > 0 && (
          <div className="max-h-96 overflow-y-auto py-2">
            {Object.entries(grouped).map(([type, items]) => (
              <div key={type}>
                <div
                  className="px-4 pt-3 pb-1 text-xs font-medium uppercase tracking-widest"
                  style={{ color: "var(--color-muted)" }}
                >
                  {TYPE_LABELS[type]}
                </div>
                {items.map((item) => {
                  const idx = flat.indexOf(item);
                  return (
                    <button
                      key={item.id}
                      className="w-full text-left px-4 py-2.5 flex items-center gap-3 transition-colors"
                      style={{
                        backgroundColor: idx === activeIdx ? "var(--color-surface)" : "transparent",
                      }}
                      onMouseEnter={() => setActiveIdx(idx)}
                      onClick={() => {
                        navigate(item.urlPath);
                        onClose();
                      }}
                    >
                      <span
                        className="shrink-0 text-xs px-1.5 py-0.5 rounded font-medium"
                        style={{
                          backgroundColor: TYPE_COLORS[item.type] + "18",
                          color: TYPE_COLORS[item.type],
                        }}
                      >
                        {item.type}
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className="block truncate text-sm">{item.title}</span>
                        <span
                          className="block truncate text-xs"
                          style={{ color: "var(--color-muted)" }}
                        >
                          {item.subtitle}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        )}

        {query.length >= 2 && results.length === 0 && !loading && (
          <div className="px-4 py-8 text-center text-sm" style={{ color: "var(--color-muted)" }}>
            No results for &ldquo;{query}&rdquo;
          </div>
        )}

        {query.length < 2 && (
          <div className="px-4 py-6 text-center text-sm" style={{ color: "var(--color-muted)" }}>
            Type at least 2 characters to search
          </div>
        )}
      </div>
    </div>
  );
}
