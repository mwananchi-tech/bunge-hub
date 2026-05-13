import { Link } from "react-router";

interface Props {
  page: number;
  hasMore: boolean;
  /** The current URL search string (from loader), used to preserve other params. */
  searchStr?: string;
}

export function Pagination({ page, hasMore, searchStr = "" }: Props) {
  function pageUrl(p: number) {
    const params = new URLSearchParams(searchStr);
    params.set("page", String(p));
    return `?${params}`;
  }

  if (page === 1 && !hasMore) return null;

  return (
    <div className="flex items-center justify-center gap-3 mt-10">
      {page > 1 && (
        <Link to={pageUrl(page - 1)}
              className="px-4 py-2 text-sm rounded"
              style={{
                border: "1px solid var(--color-border)",
                backgroundColor: "var(--color-surface)",
                color: "var(--color-text)",
              }}>
          ← Previous
        </Link>
      )}
      <span className="text-sm tabular-nums" style={{ color: "var(--color-muted)" }}>
        Page {page}
      </span>
      {hasMore && (
        <Link to={pageUrl(page + 1)}
              className="px-4 py-2 text-sm rounded"
              style={{
                border: "1px solid var(--color-border)",
                backgroundColor: "var(--color-surface)",
                color: "var(--color-text)",
              }}>
          Next →
        </Link>
      )}
    </div>
  );
}
