import { Link } from "react-router";

import { PageToolbar } from "~/components/PageToolbar";
import { Pagination } from "~/components/Pagination";
import { fromParam } from "~/lib/navigation";
import { type BillSort, countBills, listBills } from "~/lib/queries/bills.server";

import type { Route } from "./+types/bills._index";

const LIMIT = 40;
const STAGES_ORDER = [
  "First Reading",
  "Second Reading",
  "Committee Stage",
  "Report Stage",
  "Third Reading",
  "Mediation Approval",
  "Presidential Reservations",
  "Publication Period Reduction",
];

const SORT_OPTIONS = [
  { value: "recent", label: "Most recent" },
  { value: "most-debated", label: "Most debated" },
  { value: "most-speeches", label: "Most speeches" },
  { value: "name", label: "A to Z" },
];

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const q = url.searchParams.get("q") ?? undefined;
  const sort = (url.searchParams.get("sort") ?? "recent") as BillSort;
  const page = Number(url.searchParams.get("page") ?? 1);
  const [rows, total] = await Promise.all([
    listBills({ q, sort, page, limit: LIMIT }),
    countBills({ q }),
  ]);
  const hasMore = rows.length > LIMIT;
  const totalPages = Math.ceil(total / LIMIT);
  return {
    bills: rows.slice(0, LIMIT),
    q,
    sort,
    page,
    hasMore,
    totalPages,
    searchStr: url.searchParams.toString(),
  };
}

export function meta() {
  const description =
    "Browse all bills tabled in Kenya's 13th Parliament. Search by name, track legislative stages, and read AI-generated summaries of each debate.";
  return [
    { title: "Bills | Bunge Hub" },
    { name: "description", content: description },
    { property: "og:title", content: "Bills | Bunge Hub" },
    { property: "og:description", content: description },
    { property: "og:type", content: "website" },
    { property: "og:url", content: "https://bunge-hub.mwananchi.tech/bills" },
  ];
}

export default function BillsIndex({ loaderData }: Route.ComponentProps) {
  const { bills, q, sort, page, hasMore, totalPages, searchStr } = loaderData;

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <div className="mb-8">
        <h1 className="font-serif text-3xl mb-1">Bills</h1>
        <p className="text-sm" style={{ color: "var(--color-muted)" }}>
          Legislative tracker · 13th Parliament
        </p>
      </div>

      <PageToolbar
        q={q}
        searchPlaceholder="Search bills…"
        filterGroups={[]}
        sort={{ current: sort, options: SORT_OPTIONS }}
      />

      <div className="divide-y" style={{ borderColor: "var(--color-border)" }}>
        {bills.length === 0 && (
          <p className="py-10 text-center text-sm" style={{ color: "var(--color-muted)" }}>
            No bills found.
          </p>
        )}
        {bills.map((b: any) => {
          const stages: string[] = (b.stages ?? [])
            .filter(Boolean)
            .sort((a: string, z: string) => STAGES_ORDER.indexOf(a) - STAGES_ORDER.indexOf(z));
          return (
            <Link
              key={b.id}
              to={`/bills/${b.id}${fromParam("/bills", searchStr)}`}
              className="flex items-start gap-4 py-5 group"
            >
              <div className="flex-1 min-w-0">
                <div
                  className="text-sm font-medium group-hover:underline leading-snug"
                  style={{ color: "var(--color-accent)" }}
                >
                  {b.name}
                </div>
                <div
                  className="text-xs mt-1 flex flex-wrap items-center gap-x-2 gap-y-1"
                  style={{ color: "var(--color-muted)" }}
                >
                  {b.billNumber && <span>{b.billNumber}</span>}
                  {b.year && (
                    <>
                      <span>·</span>
                      <span>{b.year}</span>
                    </>
                  )}
                  {b.sponsor && (
                    <>
                      <span>·</span>
                      <span className="truncate max-w-xs">{b.sponsor}</span>
                    </>
                  )}
                </div>
                {stages.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {stages.map((s) => (
                      <span
                        key={s}
                        className="text-xs px-1.5 py-0.5 rounded"
                        style={{
                          backgroundColor: "var(--color-surface)",
                          border: "1px solid var(--color-border)",
                        }}
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="shrink-0 text-right min-w-[60px]">
                {sort === "most-speeches" ? (
                  <>
                    <div className="text-sm font-semibold">
                      {Number(b.speeches ?? 0).toLocaleString()}
                    </div>
                    <div className="text-xs" style={{ color: "var(--color-muted)" }}>
                      speeches
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-sm font-semibold">{b.sittings ?? 0}</div>
                    <div className="text-xs" style={{ color: "var(--color-muted)" }}>
                      sittings
                    </div>
                  </>
                )}
              </div>
            </Link>
          );
        })}
      </div>

      <Pagination page={page} hasMore={hasMore} totalPages={totalPages} searchStr={searchStr} />
    </div>
  );
}
