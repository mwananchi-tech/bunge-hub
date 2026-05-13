import { Link, Form, useSearchParams } from "react-router";
import type { Route } from "./+types/sittings._index";
import { listSittings } from "~/lib/queries/sittings.server";
import { Pagination } from "~/components/Pagination";

const LIMIT = 40;

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const house = url.searchParams.get("house") ?? undefined;
  const page = Number(url.searchParams.get("page") ?? 1);
  const rows = await listSittings({ house, page, limit: LIMIT });
  const hasMore = rows.length > LIMIT;
  return { sittings: rows.slice(0, LIMIT), house, page, hasMore, searchStr: url.searchParams.toString() };
}

export function meta() { return [{ title: "Sittings | Bunge Hub" }]; }

const HOUSES = [{ value: "", label: "All" }, { value: "National Assembly", label: "National Assembly" }, { value: "Senate", label: "Senate" }];

export default function SittingsIndex({ loaderData }: Route.ComponentProps) {
  const { sittings, house, page, hasMore, searchStr } = loaderData;

  function sittingSlug(url: string) {
    return url.split("/").filter(Boolean).pop() ?? url;
  }

  function externalUrl(url: string) {
    return url.startsWith("http") ? url : `https://mzalendo.com${url}`;
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-serif text-3xl">Sittings</h1>
          <p className="text-sm mt-1" style={{ color: "var(--color-muted)" }}>13th Parliament</p>
        </div>
        <Form method="get" className="flex gap-1">
          {HOUSES.map(h => {
            const active = (house ?? "") === h.value;
            return (
              <button key={h.value} name="house" value={h.value} type="submit"
                      className="px-3 py-1.5 text-sm rounded transition-colors"
                      style={{ backgroundColor: active ? "var(--color-accent)" : "var(--color-surface)", color: active ? "white" : "var(--color-text)", border: "1px solid var(--color-border)" }}>
                {h.label}
              </button>
            );
          })}
        </Form>
      </div>

      <div className="divide-y" style={{ borderColor: "var(--color-border)" }}>
        {sittings.map((s: any) => (
          <div key={s.url} className="py-5 flex items-start gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs px-2 py-0.5 rounded font-medium"
                      style={{ backgroundColor: s.house === "Senate" ? "#2D6A4F18" : "#C8A45F18",
                               color: s.house === "Senate" ? "#2D6A4F" : "#A07840" }}>
                  {s.house}
                </span>
                <span className="text-sm font-medium">{s.sessionType}</span>
              </div>
              <div className="text-sm mb-1" style={{ color: "var(--color-muted)" }}>
                {new Date(s.date).toLocaleDateString("en-KE", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
              </div>
              {s.summary && (
                <p className="text-xs leading-relaxed line-clamp-2 max-w-2xl" style={{ color: "var(--color-muted)" }}>
                  {s.summary}
                </p>
              )}
              <div className="flex items-center gap-3 mt-2">
                <Link to={`/sittings/${sittingSlug(s.url)}`}
                      className="text-xs px-2.5 py-1 rounded"
                      style={{ backgroundColor: "var(--color-accent)", color: "white" }}>
                  View transcript
                </Link>
                <a href={externalUrl(s.url)} target="_blank" rel="noopener noreferrer"
                   className="text-xs px-2.5 py-1 rounded"
                   style={{ border: "1px solid var(--color-border)", color: "var(--color-muted)" }}>
                  mzalendo.com ↗
                </a>
                {s.pdfUrl && (
                  <a href={s.pdfUrl.startsWith("http") ? s.pdfUrl : `https://mzalendo.com${s.pdfUrl}`}
                     target="_blank" rel="noopener noreferrer"
                     className="text-xs px-2.5 py-1 rounded"
                     style={{ border: "1px solid var(--color-border)", color: "var(--color-muted)" }}>
                    PDF ↗
                  </a>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <Pagination page={page} hasMore={hasMore} searchStr={searchStr} />
    </div>
  );
}
