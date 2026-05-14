import { Form, Link } from "react-router";

import { PageToolbar } from "~/components/PageToolbar";
import { Pagination } from "~/components/Pagination";
import { type MemberSort, getCommitteesByHouse, listMembers } from "~/lib/queries/members.server";

import type { Route } from "./+types/members._index";

const LIMIT = 36;

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const house = url.searchParams.get("house") ?? undefined;
  const sort = (url.searchParams.get("sort") ?? "name") as MemberSort;
  const q = url.searchParams.get("q") ?? undefined;
  const committee = url.searchParams.get("committee") ?? undefined;
  const page = Number(url.searchParams.get("page") ?? 1);

  const [rows, committees] = await Promise.all([
    listMembers({ house, sort, q, committee, page, limit: LIMIT }),
    getCommitteesByHouse(house),
  ]);

  const hasMore = rows.length > LIMIT;
  return {
    members: rows.slice(0, LIMIT),
    house,
    sort,
    q,
    committee,
    page,
    hasMore,
    committees,
    searchStr: url.searchParams.toString(),
  };
}

export function meta() {
  return [{ title: "Members | Bunge Hub" }];
}

const SORT_OPTIONS = [
  { value: "name", label: "A to Z" },
  { value: "most-active", label: "Most active" },
  { value: "least-active", label: "Least active" },
  { value: "most-sponsored", label: "Most bills sponsored" },
];

export default function MembersIndex({ loaderData }: Route.ComponentProps) {
  const { members, house, sort, q, committee, page, hasMore, committees, searchStr } = loaderData;

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="mb-8">
        <h1 className="font-serif text-3xl mb-1">Members</h1>
        <p className="text-sm" style={{ color: "var(--color-muted)" }}>
          13th Parliament · 2022 to present
        </p>
      </div>

      <PageToolbar
        q={q}
        searchPlaceholder="Search members…"
        hiddenParams={{}}
        filterGroups={[
          {
            paramName: "house",
            current: house ?? "",
            pills: [
              { value: "", label: "Both houses" },
              { value: "National Assembly", label: "National Assembly" },
              { value: "Senate", label: "Senate" },
            ],
            preserveParams: { sort, q, ...(committee ? { committee } : {}) },
          },
        ]}
        sort={{
          current: sort,
          options: SORT_OPTIONS,
          paramName: "sort",
        }}
      />

      {/* Committee filter — below toolbar, full-width select */}
      {committees.length > 0 && (
        <Form method="get" className="mb-6">
          {house && <input type="hidden" name="house" value={house} />}
          {sort !== "name" && <input type="hidden" name="sort" value={sort} />}
          {q && <input type="hidden" name="q" value={q} />}
          <div className="flex items-center gap-2">
            <label className="text-sm shrink-0" style={{ color: "var(--color-muted)" }}>
              Committee
            </label>
            <select
              name="committee"
              value={committee ?? ""}
              onChange={(e) => e.currentTarget.form?.requestSubmit()}
              className="flex-1 max-w-sm px-3 py-1.5 text-sm rounded outline-none cursor-pointer"
              style={{
                border: "1px solid var(--color-border)",
                backgroundColor: "var(--color-surface)",
                color: "var(--color-text)",
              }}
            >
              <option value="">All committees</option>
              {committees.map((c: any) => (
                <option key={c.name} value={c.name}>
                  {c.name.charAt(0).toUpperCase() + c.name.slice(1)} ({c.members})
                </option>
              ))}
            </select>
            {committee && (
              <Link
                to={`?${new URLSearchParams({ ...(house ? { house } : {}), sort, ...(q ? { q } : {}) })}`}
                className="text-xs px-2 py-1.5 rounded"
                style={{ border: "1px solid var(--color-border)", color: "var(--color-muted)" }}
              >
                Clear
              </Link>
            )}
          </div>
        </Form>
      )}

      {members.length === 0 ? (
        <p style={{ color: "var(--color-muted)" }}>No members found.</p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {members.map((m: any) => (
            <Link
              key={m.slug}
              to={`/members/${m.slug}`}
              className="flex items-center gap-3 p-4 rounded-lg border transition-all"
              style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-bg)" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "var(--color-surface)";
                e.currentTarget.style.borderColor = "var(--color-accent)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "var(--color-bg)";
                e.currentTarget.style.borderColor = "var(--color-border)";
              }}
            >
              {m.photoUrl ? (
                <img
                  src={m.photoUrl}
                  alt={m.name}
                  className="w-11 h-11 rounded-full object-cover shrink-0"
                  style={{ border: "1px solid var(--color-border)" }}
                />
              ) : (
                <div
                  className="w-11 h-11 rounded-full shrink-0 flex items-center justify-center font-serif"
                  style={{
                    backgroundColor: "var(--color-surface)",
                    color: "var(--color-muted)",
                    fontSize: "1.1rem",
                  }}
                >
                  {m.name[0]}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-medium text-sm truncate">{m.name}</span>
                  {speakerBadge(m.role, m.constituency)}
                </div>
                <div className="text-xs mt-0.5 flex items-center justify-between gap-2">
                  <span className="truncate" style={{ color: "var(--color-muted)" }}>
                    {m.party ?? m.house}
                  </span>
                  {(sort === "most-active" || sort === "least-active") && (
                    <span className="shrink-0 tabular-nums" style={{ color: "var(--color-muted)" }}>
                      {Number(m.totalSpeeches).toLocaleString()} sp.
                    </span>
                  )}
                  {sort === "most-sponsored" && (
                    <span className="shrink-0 tabular-nums" style={{ color: "var(--color-muted)" }}>
                      {Number(m.billsSponsored)} bills
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      <Pagination page={page} hasMore={hasMore} searchStr={searchStr} />
    </div>
  );
}

function speakerBadge(role: string | null, constituency: string | null) {
  const text = `${role ?? ""} ${constituency ?? ""}`.toLowerCase();
  if (text.includes("deputy speaker")) return <Badge label="Deputy Speaker" />;
  if (text.includes("speaker")) return <Badge label="Speaker" />;
  return null;
}

function Badge({ label }: { label: string }) {
  return (
    <span
      className="shrink-0 px-1.5 py-0.5 rounded font-medium"
      style={{ backgroundColor: "var(--color-accent)", color: "white", fontSize: "10px" }}
    >
      {label}
    </span>
  );
}
