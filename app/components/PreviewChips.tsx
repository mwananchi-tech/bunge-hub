import { useState } from "react";
import { Link } from "react-router";

export type PreviewItem = { id: string | number; name?: string; title?: string };

const CHIP =
  "inline-block max-w-full rounded-full border px-2.5 py-0.5 text-xs transition-colors truncate";
const CHIP_KIND = {
  /* Topics use the primary (accent) colour, bills the secondary (gold) colour */
  topics: "border-accent/20 bg-accent-subtle text-accent hover:bg-accent-subtle-pressed",
  bills: "border-secondary/25 bg-secondary-subtle text-secondary hover:bg-secondary-subtle-hover",
};

/** A labelled row of bill or topic chips. Shows 5, then "+N more" reveals 5 at a time. */
export function PreviewChips({
  title,
  items,
  total,
  kind,
}: {
  title: string;
  items: PreviewItem[];
  total: number;
  kind: "bills" | "topics";
}) {
  const [shownCount, setShownCount] = useState(5);
  if (!items.length) return null;

  const visibleItems = items.slice(0, shownCount);
  const revealableCount = Math.max(items.length - visibleItems.length, 0);
  const remainingTotal = Math.max(total - visibleItems.length, 0);
  const revealCount = Math.min(5, revealableCount);

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-1.5 sm:grid-cols-[3rem_minmax(0,1fr)] sm:items-start">
      <span className="text-xs font-medium text-muted sm:pt-1">{title}</span>
      <div className="flex flex-wrap items-center gap-1.5">
        {visibleItems.map((item) => {
          const label = item.name ?? item.title ?? String(item.id);
          return (
            <Link
              key={`${kind}-${item.id}`}
              to={`/${kind}/${item.id}`}
              title={label}
              className={`${CHIP} ${CHIP_KIND[kind]}`}
            >
              {label}
            </Link>
          );
        })}
        {revealCount > 0 ? (
          <button
            type="button"
            className={`${CHIP} cursor-pointer border-border text-muted hover:border-accent hover:text-accent`}
            onClick={() => setShownCount((count) => count + 5)}
          >
            +{revealCount} more
          </button>
        ) : remainingTotal > 0 ? (
          <span className="text-xs text-muted">+{remainingTotal} more</span>
        ) : null}
      </div>
    </div>
  );
}
