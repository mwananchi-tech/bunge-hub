import { Form, Link } from "react-router";

import { Pagination } from "~/components/Pagination";
import { countSittings, listSittings } from "~/lib/queries/sittings.server";

import type { Route } from "./+types/sittings._index";

const LIMIT = 40;
const YEARS = [2026, 2025, 2024, 2023, 2022];

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const house = url.searchParams.get("house") ?? undefined;
  const year = url.searchParams.get("year") ? Number(url.searchParams.get("year")) : undefined;
  const page = Number(url.searchParams.get("page") ?? 1);

  const [rows, total] = await Promise.all([
    listSittings({ house, year, page, limit: LIMIT }),
    countSittings({ house, year }),
  ]);

  const hasMore = rows.length > LIMIT;
  const totalPages = Math.ceil(total / LIMIT);
  return {
    sittings: rows.slice(0, LIMIT),
    house,
    year,
    page,
    hasMore,
    totalPages,
    searchStr: url.searchParams.toString(),
  };
}

export function meta() {
  return [{ title: "Sittings | Bunge Hub" }];
}

const HOUSES = [
  { value: "", label: "All" },
  { value: "National Assembly", label: "National Assembly" },
  { value: "Senate", label: "Senate" },
];

export default function SittingsIndex({ loaderData }: Route.ComponentProps) {
  const { sittings, house, year, page, hasMore, totalPages, searchStr } = loaderData;

  function sittingSlug(url: string) {
    return url.split("/").filter(Boolean).pop() ?? url;
  }
  function externalUrl(url: string) {
    return url.startsWith("http") ? url : `https://mzalendo.com${url}`;
  }
  function yearUrl(y: number | undefined) {
    const p = new URLSearchParams();
    if (house) p.set("house", house);
    if (y) p.set("year", String(y));
    return `?${p}`;
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <div className="mb-8">
        <h1 className="font-serif text-3xl mb-1">Sittings</h1>
        <p className="text-sm" style={{ color: "var(--color-muted)" }}>
          13th Parliament
        </p>
      </div>

      {/* Toolbar — house filter + year shortcuts */}
      <div className="flex flex-wrap items-center gap-3 mb-8">
        {/* House filter */}
        <Form method="get" className="flex gap-1">
          {year && <input type="hidden" name="year" value={year} />}
          {HOUSES.map((h) => {
            const active = (house ?? "") === h.value;
            return (
              <button
                key={h.value}
                name="house"
                value={h.value}
                type="submit"
                className="px-3 py-1.5 text-sm rounded"
                style={{
                  backgroundColor: active ? "var(--color-accent)" : "var(--color-surface)",
                  color: active ? "white" : "var(--color-text)",
                  border: "1px solid var(--color-border)",
                }}
              >
                {h.label}
              </button>
            );
          })}
        </Form>

        <div className="w-px h-5 shrink-0" style={{ backgroundColor: "var(--color-border)" }} />

        {/* Year shortcuts */}
        <div className="flex gap-1">
          <Link
            to={yearUrl(undefined)}
            className="px-3 py-1.5 text-sm rounded"
            style={{
              backgroundColor: !year ? "var(--color-surface)" : "transparent",
              color: !year ? "var(--color-text)" : "var(--color-muted)",
              border: !year ? "1px solid var(--color-border)" : "1px solid transparent",
              fontWeight: !year ? 500 : 400,
            }}
          >
            All
          </Link>
          {YEARS.map((y) => {
            const active = year === y;
            return (
              <Link
                key={y}
                to={yearUrl(y)}
                className="px-3 py-1.5 text-sm rounded tabular-nums"
                style={{
                  backgroundColor: active ? "var(--color-accent)" : "transparent",
                  color: active ? "white" : "var(--color-muted)",
                  border: active ? "1px solid var(--color-accent)" : "1px solid transparent",
                  fontWeight: active ? 500 : 400,
                }}
              >
                {y}
              </Link>
            );
          })}
        </div>
      </div>

      <div className="divide-y" style={{ borderColor: "var(--color-border)" }}>
        {sittings.length === 0 && (
          <p className="py-10 text-center text-sm" style={{ color: "var(--color-muted)" }}>
            No sittings found.
          </p>
        )}
        {sittings.map((s: any) => (
          <div key={s.url} className="py-5 flex items-start gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span
                  className="text-xs px-2 py-0.5 rounded font-medium"
                  style={{
                    backgroundColor:
                      s.house === "Senate" ? "var(--color-accent)18" : "var(--color-gold)18",
                    color: s.house === "Senate" ? "var(--color-accent)" : "var(--color-gold)",
                  }}
                >
                  {s.house}
                </span>
                <span className="text-sm font-medium">{s.sessionType}</span>
              </div>
              <div className="text-sm mb-1" style={{ color: "var(--color-muted)" }}>
                {new Date(s.date).toLocaleDateString("en-KE", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </div>
              {s.summary && (
                <p
                  className="text-xs leading-relaxed line-clamp-2 max-w-2xl mb-1"
                  style={{ color: "var(--color-muted)" }}
                >
                  {s.summary}
                </p>
              )}
              <div className="flex items-center gap-3 mt-2">
                <Link
                  to={`/sittings/${sittingSlug(s.url)}`}
                  className="text-xs px-2.5 py-1 rounded"
                  style={{ backgroundColor: "var(--color-accent)", color: "white" }}
                >
                  View transcript
                </Link>
                <a
                  href={externalUrl(s.url)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs px-2.5 py-1 rounded"
                  style={{ border: "1px solid var(--color-border)", color: "var(--color-muted)" }}
                >
                  mzalendo.com ↗
                </a>
                {s.pdfUrl && (
                  <a
                    href={
                      s.pdfUrl.startsWith("http") ? s.pdfUrl : `https://mzalendo.com${s.pdfUrl}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs px-2.5 py-1 rounded"
                    style={{ border: "1px solid var(--color-border)", color: "var(--color-muted)" }}
                  >
                    PDF ↗
                  </a>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <Pagination page={page} hasMore={hasMore} totalPages={totalPages} searchStr={searchStr} />
    </div>
  );
}
