import { Link } from "react-router";

interface Props {
  page: number;
  hasMore: boolean;
  totalPages?: number;
  searchStr?: string;
}

function pageUrl(searchStr: string, p: number): string {
  const params = new URLSearchParams(searchStr);
  params.set("page", String(p));
  return `?${params}`;
}

function pageNumbers(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const included = new Set([
    1,
    Math.max(1, current - 1),
    current,
    Math.min(total, current + 1),
    total,
  ]);

  const result: (number | "…")[] = [];
  let prev = 0;
  for (const p of [...included].sort((a, b) => a - b)) {
    if (p - prev > 1) result.push("…");
    result.push(p);
    prev = p;
  }
  return result;
}

const linkStyle = {
  border: "1px solid var(--color-border)",
  backgroundColor: "var(--color-surface)",
  color: "var(--color-text)",
} as const;

const activeStyle = {
  backgroundColor: "var(--color-accent)",
  color: "white",
  border: "1px solid var(--color-accent)",
} as const;

export function Pagination({ page, hasMore, totalPages, searchStr = "" }: Props) {
  const total = totalPages ?? (hasMore ? page + 1 : page);

  if (page === 1 && !hasMore && total <= 1) return null;

  const pages = totalPages ? pageNumbers(page, total) : null;

  return (
    <div className="flex items-center justify-center gap-1 mt-10 flex-wrap">
      {/* Previous */}
      {page > 1 && (
        <Link to={pageUrl(searchStr, page - 1)}
              className="px-3 py-1.5 text-sm rounded"
              style={linkStyle}>
          ←
        </Link>
      )}

      {/* Page numbers */}
      {pages
        ? pages.map((p, i) =>
            p === "…"
              ? <span key={`dots-${i}`} className="px-1 text-sm"
                      style={{ color: "var(--color-muted)" }}>…</span>
              : <Link key={p} to={pageUrl(searchStr, p)}
                      className="px-3 py-1.5 text-sm rounded tabular-nums min-w-[36px] text-center"
                      style={p === page ? activeStyle : linkStyle}>
                  {p}
                </Link>
          )
        : (
          <span className="px-3 py-1.5 text-sm tabular-nums"
                style={{ color: "var(--color-muted)" }}>
            Page {page}
          </span>
        )
      }

      {/* Next */}
      {(hasMore || (totalPages && page < totalPages)) && (
        <Link to={pageUrl(searchStr, page + 1)}
              className="px-3 py-1.5 text-sm rounded"
              style={linkStyle}>
          →
        </Link>
      )}
    </div>
  );
}
