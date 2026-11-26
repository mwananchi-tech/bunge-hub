import { useEffect, useState } from "react";
import { Form, Link, useFetcher, useNavigate } from "react-router";

import {
  AppliedChip,
  FilterSheet,
  type FilterSheetGroup,
  type FilterValues,
  FiltersButton,
} from "~/components/FilterSheet";
import { MemberAvatar } from "~/components/MemberAvatar";
import { Pagination } from "~/components/Pagination";
import { formatMemberName } from "~/lib/member-name";
import { fromParam } from "~/lib/navigation";
import {
  type MemberSort,
  type MemberType,
  countMembers,
  getCommitteesByHouse,
  listMembers,
} from "~/lib/queries/members.server";

import type { Route } from "./+types/members._index";

const LIMIT = 36;

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const house = url.searchParams.get("house") ?? undefined;
  const sort = (url.searchParams.get("sort") ?? "name") as MemberSort;
  const q = url.searchParams.get("q") ?? undefined;
  const committee = url.searchParams.get("committee") ?? undefined;
  const memberType = (url.searchParams.get("type") ?? undefined) as MemberType | undefined;
  const page = Number(url.searchParams.get("page") ?? 1);

  const [rows, committees, totalCount] = await Promise.all([
    listMembers({ house, sort, q, committee, memberType, page, limit: LIMIT }),
    getCommitteesByHouse(house),
    countMembers({ house, q, committee, memberType }),
  ]);

  const hasMore = rows.length > LIMIT;
  return {
    members: rows.slice(0, LIMIT),
    house,
    sort,
    q,
    committee,
    memberType,
    page,
    hasMore,
    totalCount,
    committees,
    searchStr: url.searchParams.toString(),
  };
}

export function meta() {
  const description =
    "Browse all Members of Parliament in Kenya's 13th Parliament. Filter by house, party, constituency, or committee and see speech and bill activity.";
  return [
    { title: "Members | Bunge Hub" },
    { name: "description", content: description },
    { property: "og:title", content: "Members | Bunge Hub" },
    { property: "og:description", content: description },
    { property: "og:type", content: "website" },
    { property: "og:url", content: "https://bunge-hub.mwananchi.tech/members" },
  ];
}

const SORT_OPTIONS = [
  { value: "name", label: "A to Z" },
  { value: "most-active", label: "Most active" },
  { value: "least-active", label: "Least active" },
  { value: "most-sponsored", label: "Most bills sponsored" },
];

export default function MembersIndex({ loaderData }: Route.ComponentProps) {
  const {
    members,
    house,
    sort,
    q,
    committee,
    memberType,
    page,
    hasMore,
    totalCount,
    committees,
    searchStr,
  } = loaderData;
  const [sheetOpen, setSheetOpen] = useState(false);
  const navigate = useNavigate();
  const applied: FilterValues = {
    sort,
    house: house ?? "",
    type: memberType ?? "",
    committee: committee ?? "",
  };
  const [draft, setDraft] = useState<FilterValues>(applied);

  // While the sheet is open, ask the server how many members the draft would show
  const preview = useFetcher<typeof loader>();
  const draftKey = toParams(draft, q).toString();
  useEffect(() => {
    if (sheetOpen) preview.load(`/members?index&${draftKey}`);
    // preview.load is stable enough here; re-run only when the draft changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sheetOpen, draftKey]);

  const draftCommittees =
    preview.data && preview.state === "idle" ? preview.data.committees : committees;
  const draftCount = preview.data && preview.state === "idle" ? preview.data.totalCount : undefined;

  const groups: FilterSheetGroup[] = [
    { key: "sort", label: "Sort by", defaultValue: "name", options: SORT_OPTIONS },
    {
      key: "house",
      label: "House",
      defaultValue: "",
      options: [
        { value: "", label: "Both" },
        { value: "National Assembly", label: "National Assembly" },
        { value: "Senate", label: "Senate" },
      ],
    },
    {
      key: "type",
      label: "Type",
      defaultValue: "",
      options: [
        { value: "", label: "All" },
        { value: "elected", label: "Elected" },
        { value: "nominated", label: "Nominated" },
        { value: "woman-rep", label: "Woman Rep (NA)" },
      ],
    },
    {
      key: "committee",
      label: "Committee",
      defaultValue: "",
      collapseAfter: 7,
      pluralLabel: "committees",
      options: [
        { value: "", label: "All" },
        ...draftCommittees.map((c: any) => ({
          value: c.name,
          label: c.name.charAt(0).toUpperCase() + c.name.slice(1),
        })),
      ],
    },
  ];

  // Filters that are on (anything that is not the default), shown as removable chips
  const activeChips = groups.flatMap((g) => {
    const value = applied[g.key];
    if (value === g.defaultValue) return [];
    const label =
      g.options.find((o) => o.value === value)?.label ??
      value.charAt(0).toUpperCase() + value.slice(1);
    return [{ key: g.key, label }];
  });

  function openSheet() {
    setDraft(applied);
    setSheetOpen(true);
  }

  return (
    <div className="page-frame py-12">
      <div className="mb-8">
        <h1 className="font-serif text-3xl mb-1">Members</h1>
        <p className="text-sm" style={{ color: "var(--color-muted)" }}>
          13th Parliament · 2022 to present ·{" "}
          <span>
            {totalCount.toLocaleString()} member{totalCount !== 1 ? "s" : ""}
          </span>
        </p>
      </div>

      {/* One search box and one Filters button. Press Enter to search. */}
      <div className="flex gap-2 md:max-w-xl">
        <Form method="get" role="search" className="flex-1 min-w-0">
          {[...toParams(applied, undefined)].map(([k, v]) => (
            <input key={k} type="hidden" name={k} value={v} />
          ))}
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Search by name, party or constituency"
            aria-label="Search members"
            className="h-11 md:h-8 w-full rounded-control border border-border bg-surface px-4 md:px-3 text-sm text-text"
          />
        </Form>
        <FiltersButton count={activeChips.length} onClick={openSheet} />
      </div>

      {activeChips.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {activeChips.map((chip) => {
            const group = groups.find((g) => g.key === chip.key)!;
            return (
              <AppliedChip
                key={chip.key}
                label={chip.label}
                onRemove={() =>
                  navigate(`?${toParams({ ...applied, [chip.key]: group.defaultValue }, q)}`)
                }
              />
            );
          })}
        </div>
      )}

      <div className="mb-8" />

      <FilterSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        groups={groups}
        draft={draft}
        onChange={setDraft}
        onApply={() => {
          setSheetOpen(false);
          navigate(`?${toParams(draft, q)}`);
        }}
        applyLabel={
          draftCount === undefined
            ? "Show members"
            : `Show ${draftCount.toLocaleString()} member${draftCount !== 1 ? "s" : ""}`
        }
      />

      {members.length === 0 ? (
        <p style={{ color: "var(--color-muted)" }}>No members found.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {members.map((m: any) => {
            const displayName = formatMemberName(m.name);
            return (
              <Link
                key={m.id}
                to={`/members/${m.id}${fromParam("/members", searchStr)}`}
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
                <MemberAvatar
                  name={displayName}
                  src={m.photoUrl}
                  className="w-11 h-11 rounded-full object-cover shrink-0"
                  style={{ border: "1px solid var(--color-border)" }}
                  fallbackStyle={{ fontSize: "1.1rem" }}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-medium text-sm truncate">{displayName}</span>
                    {speakerBadge(m.role, m.constituency)}
                  </div>
                  <div className="text-xs mt-0.5 flex items-center justify-between gap-2">
                    <span className="truncate" style={{ color: "var(--color-muted)" }}>
                      {m.party ?? m.house}
                    </span>
                    {(sort === "most-active" || sort === "least-active") && (
                      <span
                        className="shrink-0 tabular-nums"
                        style={{ color: "var(--color-muted)" }}
                      >
                        {Number(m.totalSpeeches).toLocaleString()} sp.
                      </span>
                    )}
                    {sort === "most-sponsored" && (
                      <span
                        className="shrink-0 tabular-nums"
                        style={{ color: "var(--color-muted)" }}
                      >
                        {Number(m.billsSponsored)} bills
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
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

/** URL params for a set of filters, leaving out defaults so links stay short. */
function toParams(values: FilterValues, q: string | undefined) {
  const p = new URLSearchParams();
  if (values.house) p.set("house", values.house);
  if (values.sort && values.sort !== "name") p.set("sort", values.sort);
  if (q) p.set("q", q);
  if (values.committee) p.set("committee", values.committee);
  if (values.type) p.set("type", values.type);
  return p;
}
