import type { ReactNode } from "react";
import { Link } from "react-router";

import { InfoTooltip } from "~/components/InfoTooltip";

interface FilterOption {
  value: string;
  label: string;
  tooltip?: string;
}

export interface FilterGroup {
  label: string;
  paramName: string;
  current: string;
  options: FilterOption[];
  preserveParams?: Record<string, string | undefined>;
}

interface FilterButtonProps {
  activeCount: number;
  onClick: () => void;
}

interface FilterPanelProps {
  isOpen: boolean;
  groups: FilterGroup[];
  clearUrl: string;
  extra?: ReactNode;
}

export function FilterButton({ activeCount, onClick }: FilterButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded shrink-0 cursor-pointer"
      style={{
        border: "1px solid var(--color-border)",
        backgroundColor: activeCount > 0 ? "var(--color-accent)" : "var(--color-surface)",
        color: activeCount > 0 ? "white" : "var(--color-text)",
      }}
    >
      <svg
        className="w-3.5 h-3.5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h18M7 12h10M11 20h2" />
      </svg>
      Filters
      {activeCount > 0 && <span className="text-xs font-semibold">{activeCount}</span>}
    </button>
  );
}

export function FilterPanel({ isOpen, groups, clearUrl, extra }: FilterPanelProps) {
  if (!isOpen) return null;

  const activeCount = groups.filter((g) => g.current).length;

  return (
    <div
      className="mb-6 p-4 rounded-lg space-y-4"
      style={{
        backgroundColor: "var(--color-surface)",
        border: "1px solid var(--color-border)",
      }}
    >
      {activeCount > 0 && (
        <div className="flex justify-end">
          <Link
            to={clearUrl}
            className="text-xs px-2.5 py-1 rounded hover:underline"
            style={{ border: "1px solid var(--color-border)", color: "var(--color-text)" }}
          >
            Clear all filters
          </Link>
        </div>
      )}

      {groups.map((group) => (
        <div key={group.paramName}>
          <div
            className="text-xs font-medium uppercase tracking-widest mb-2"
            style={{ color: "var(--color-muted)" }}
          >
            {group.label}
          </div>
          <div className="flex flex-wrap gap-1">
            {group.options.map((opt) => {
              const active = group.current === opt.value;
              const params = new URLSearchParams({
                ...Object.fromEntries(
                  Object.entries(group.preserveParams ?? {}).filter(([, v]) => v != null) as [
                    string,
                    string,
                  ][]
                ),
                ...(opt.value ? { [group.paramName]: opt.value } : {}),
              });
              return (
                <Link
                  key={opt.value}
                  to={`?${params}`}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-sm rounded"
                  style={{
                    border: "1px solid var(--color-border)",
                    backgroundColor: active ? "var(--color-accent)" : "var(--color-bg)",
                    color: active ? "white" : "var(--color-text)",
                  }}
                >
                  {opt.label}
                  {opt.tooltip && <InfoTooltip text={opt.tooltip} iconColor="inherit" />}
                </Link>
              );
            })}
          </div>
        </div>
      ))}

      {extra}
    </div>
  );
}
