import { Link } from "react-router";
import type { Route } from "./+types/bills._index";
import { listBills, countBills, type BillSort } from "~/lib/queries/bills.server";
import { Pagination } from "~/components/Pagination";
import { PageToolbar } from "~/components/PageToolbar";

const LIMIT = 40;
const STAGES_ORDER = [
  "First Reading","Second Reading","Committee Stage","Report Stage",
  "Third Reading","Mediation Approval","Presidential Reservations","Publication Period Reduction",
];

const SORT_OPTIONS = [
  { value: "recent",       label: "Most recent"     },
  { value: "most-debated", label: "Most debated"    },
  { value: "most-speeches",label: "Most speeches"   },
  { value: "name",         label: "A to Z"          },
];

export async function loader({ request }: Route.LoaderArgs) {
  const url   = new URL(request.url);
  const q     = url.searchParams.get("q") ?? undefined;
  const sort  = (url.searchParams.get("sort") ?? "recent") as BillSort;
  const house = url.searchParams.get("house") ?? undefined;
  const page  = Number(url.searchParams.get("page") ?? 1);
  const [rows, total] = await Promise.all([
    listBills({ q, sort, house, page, limit: LIMIT }),
    countBills({ q, house }),
  ]);
  const hasMore = rows.length > LIMIT;
  const totalPages = Math.ceil(total / LIMIT);
  return { bills: rows.slice(0, LIMIT), q, sort, house, page, hasMore, totalPages, searchStr: url.searchParams.toString() };
}

export function meta() { return [{ title: "Bills | Bunge Hub" }]; }

export default function BillsIndex({ loaderData }: Route.ComponentProps) {
  const { bills, q, sort, house, page, hasMore, totalPages, searchStr } = loaderData;

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
        filterGroups={[
          {
            paramName: "house",
            current: house ?? "",
            pills: [
              { value: "",                  label: "Both houses"       },
              { value: "National Assembly", label: "National Assembly" },
              { value: "Senate",            label: "Senate"            },
            ],
            preserveParams: { sort, q },
          },
        ]}
        sort={{ current: sort, options: SORT_OPTIONS }}
      />

      <div className="divide-y" style={{ borderColor: "var(--color-border)" }}>
        {bills.length === 0 && (
          <p className="py-10 text-center text-sm" style={{ color: "var(--color-muted)" }}>
            No bills found.
          </p>
        )}
        {bills.map((b: any) => {
          const stages: string[] = (b.stages ?? []).filter(Boolean).sort(
            (a: string, z: string) => STAGES_ORDER.indexOf(a) - STAGES_ORDER.indexOf(z)
          );
          return (
            <Link key={b.id} to={`/bills/${b.id}`} className="flex items-start gap-4 py-5 group">
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium group-hover:underline leading-snug"
                     style={{ color: "var(--color-accent)" }}>
                  {b.name}
                </div>
                <div className="text-xs mt-1 flex flex-wrap items-center gap-x-2 gap-y-1"
                     style={{ color: "var(--color-muted)" }}>
                  {b.billNumber && <span>{b.billNumber}</span>}
                  {b.year && <><span>·</span><span>{b.year}</span></>}
                  {b.sponsor && <><span>·</span><span className="truncate max-w-xs">{b.sponsor}</span></>}
                </div>
                {stages.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {stages.map(s => (
                      <span key={s} className="text-xs px-1.5 py-0.5 rounded"
                            style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
                        {s}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="shrink-0 text-right min-w-[60px]">
                {sort === "most-speeches" ? (
                  <>
                    <div className="text-sm font-semibold">{Number(b.speeches ?? 0).toLocaleString()}</div>
                    <div className="text-xs" style={{ color: "var(--color-muted)" }}>speeches</div>
                  </>
                ) : (
                  <>
                    <div className="text-sm font-semibold">{b.sittings ?? 0}</div>
                    <div className="text-xs" style={{ color: "var(--color-muted)" }}>sittings</div>
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
