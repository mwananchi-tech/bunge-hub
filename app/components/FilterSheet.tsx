import { type ReactNode, useEffect, useState } from "react";

import { Button } from "~/components/ui/Button";

/**
 * Filters for a list page, Airbnb style: one Filters button opens a sheet
 * (bottom sheet on phones, centred window on web) with every option as a chip.
 * Picks are a draft until the reader taps "Show N …", so the list only
 * reloads once.
 */

export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterSheetGroup {
  key: string;
  label: string;
  /** The value that means "no filter" (listed first, e.g. "Both", "All", "A to Z") */
  defaultValue: string;
  options: FilterOption[];
  /** Show this many chips, then a "Show all" link */
  collapseAfter?: number;
  /** Words for the "Show all" link, e.g. "committees" */
  pluralLabel?: string;
}

export type FilterValues = Record<string, string>;

/** Chip for one option inside the sheet. 44px tall on phones, 32px on web. */
export function FilterChip({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`inline-flex h-11 md:h-8 items-center rounded-full border px-4 md:px-3 text-sm md:text-[13px] cursor-pointer transition-colors ${
        selected
          ? "border-accent bg-accent-subtle text-accent font-medium"
          : "border-border bg-bg text-text hover:border-muted"
      }`}
    >
      {children}
    </button>
  );
}

/**
 * Small chip for a filter that is already applied. Same look as PreviewChips
 * (12px text, 24px tall); an invisible area around it keeps the tap target 44px.
 */
export function AppliedChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <button
      type="button"
      onClick={onRemove}
      aria-label={`Remove filter: ${label}`}
      className="relative inline-flex h-6 items-center gap-1 rounded-full border border-accent/20 bg-accent-subtle px-2.5 text-xs text-accent cursor-pointer hover:bg-accent-subtle-pressed before:absolute before:-inset-x-1 before:-inset-y-2.5 before:content-['']"
    >
      {label}
      <span aria-hidden className="text-sm leading-none">
        ×
      </span>
    </button>
  );
}

/** The Filters button. The badge shows how many filters are on. */
export function FiltersButton({ count, onClick }: { count: number; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-haspopup="dialog"
      className="inline-flex h-11 md:h-8 shrink-0 items-center gap-2 rounded-control border border-border bg-bg px-4 md:px-3 text-sm font-medium text-text cursor-pointer hover:border-muted"
    >
      <svg
        className="size-3.5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
        aria-hidden
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h18M7 12h10M11 20h2" />
      </svg>
      Filters
      {count > 0 && (
        <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1.5 text-[11px] text-accent-contrast">
          {count}
        </span>
      )}
    </button>
  );
}

export function FilterSheet({
  open,
  onClose,
  groups,
  draft,
  onChange,
  onApply,
  applyLabel,
}: {
  open: boolean;
  onClose: () => void;
  groups: FilterSheetGroup[];
  draft: FilterValues;
  onChange: (next: FilterValues) => void;
  onApply: () => void;
  /** e.g. "Show 71 members" */
  applyLabel: string;
}) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  // Escape closes; the page behind does not scroll while the sheet is open
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = overflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  const cleared = Object.fromEntries(groups.map((g) => [g.key, g.defaultValue]));

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center md:justify-center">
      {/* Dimmed page: tap it to close without applying */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="filter-sheet-title"
        className="relative flex max-h-[85vh] w-full flex-col rounded-t-xl bg-bg md:w-[560px] md:rounded-lg"
      >
        <div className="relative flex h-14 shrink-0 items-center justify-center border-b border-border px-4">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close filters"
            className="absolute left-2 flex size-11 items-center justify-center rounded-control text-muted cursor-pointer hover:text-text"
          >
            <svg
              className="size-4"
              fill="none"
              viewBox="0 0 16 16"
              stroke="currentColor"
              strokeWidth={1.5}
              aria-hidden
            >
              <path strokeLinecap="round" d="M3 3l10 10M13 3L3 13" />
            </svg>
          </button>
          <h2 id="filter-sheet-title" className="text-base font-semibold">
            Filters
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          {groups.map((g, i) => {
            const limit = g.collapseAfter ?? Infinity;
            const showAll = expanded[g.key] || g.options.length <= limit;
            const picked = draft[g.key] ?? g.defaultValue;
            // Keep the picked chip visible even when the list is collapsed
            const visible = showAll
              ? g.options
              : g.options.filter((o, idx) => idx < limit || o.value === picked);
            return (
              <section key={g.key} className={i > 0 ? "mt-8" : ""}>
                <h3 className="mb-3 text-sm font-semibold">{g.label}</h3>
                <div className="flex flex-wrap gap-2">
                  {visible.map((o) => (
                    <FilterChip
                      key={o.value}
                      selected={picked === o.value}
                      onClick={() => onChange({ ...draft, [g.key]: o.value })}
                    >
                      {o.label}
                    </FilterChip>
                  ))}
                </div>
                {!showAll && (
                  <button
                    type="button"
                    onClick={() => setExpanded({ ...expanded, [g.key]: true })}
                    className="mt-3 min-h-11 md:min-h-0 text-sm text-accent underline cursor-pointer"
                  >
                    Show all {g.options.length - 1} {g.pluralLabel ?? g.label.toLowerCase()}
                  </button>
                )}
              </section>
            );
          })}
        </div>

        <div className="flex shrink-0 items-center justify-between border-t border-border px-6 py-4">
          <button
            type="button"
            onClick={() => onChange(cleared)}
            className="min-h-11 md:min-h-0 text-sm font-medium underline cursor-pointer"
          >
            Clear all
          </button>
          <Button variant="filled" onClick={onApply} className="h-11 md:h-10 px-6">
            {applyLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
