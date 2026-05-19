import { Link, data } from "react-router";

import { InfoTooltip } from "~/components/InfoTooltip";
import { Pagination } from "~/components/Pagination";
import { getFromParam } from "~/lib/navigation";
import {
  getMember,
  getMemberBillCount,
  getMemberBills,
  getMemberSponsoredBills,
  getMemberStats,
  getMemberTopicCount,
  getMemberTopics,
} from "~/lib/queries/members.server";

import type { Route } from "./+types/members.$slug";

const BILL_LIMIT = 20;
const TOPIC_LIMIT = 30;

type Tab = "sponsored" | "bills" | "topics";

export async function loader({ params, request }: Route.LoaderArgs) {
  const member = await getMember(params.slug!);
  if (!member) throw data("Member not found", { status: 404 });

  const url = new URL(request.url);
  const tab = (url.searchParams.get("tab") ?? "sponsored") as Tab;
  const page = Math.max(1, Number(url.searchParams.get("page") ?? 1));
  const from = getFromParam(url, "/members");

  const [stats, sponsored, billCount, topicCount] = await Promise.all([
    getMemberStats(member.id),
    getMemberSponsoredBills(member.id),
    getMemberBillCount(member.id),
    getMemberTopicCount(member.id),
  ]);

  const searchStr = url.searchParams.toString();

  if (tab === "topics") {
    const rows = await getMemberTopics(member.id, page, TOPIC_LIMIT);
    const hasMore = rows.length > TOPIC_LIMIT;
    return {
      member,
      stats,
      sponsored,
      billCount,
      topicCount,
      bills: [],
      topics: rows.slice(0, TOPIC_LIMIT),
      tab,
      page,
      hasMore,
      searchStr,
      from,
    };
  }
  if (tab === "bills") {
    const rows = await getMemberBills(member.id, page, BILL_LIMIT);
    const hasMore = rows.length > BILL_LIMIT;
    return {
      member,
      stats,
      sponsored,
      billCount,
      topicCount,
      bills: rows.slice(0, BILL_LIMIT),
      topics: [],
      tab,
      page,
      hasMore,
      searchStr,
      from,
    };
  }
  // default: sponsored tab (no pagination needed since most members have few sponsored bills)
  return {
    member,
    stats,
    sponsored,
    billCount,
    topicCount,
    bills: [],
    topics: [],
    tab,
    page,
    hasMore: false,
    searchStr,
    from,
  };
}

export function meta({ data }: Route.MetaArgs) {
  return [{ title: `${data?.member?.name ?? "Member"} | Bunge Hub` }];
}

export default function MemberProfile({ loaderData }: Route.ComponentProps) {
  const {
    member: m,
    stats,
    sponsored,
    billCount,
    topicCount,
    bills,
    topics,
    tab,
    page,
    hasMore,
    searchStr,
  } = loaderData;

  const positions: string[] = m.positions ?? [];
  const committees: string[] = m.committees ?? [];
  const primaryPosition =
    positions.find((p) => !p.startsWith("A member of the"))?.replace(/^Elected to be /, "") ?? null;

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <div className="text-sm mb-6" style={{ color: "var(--color-muted)" }}>
        <Link to={loaderData.from} className="hover:underline">
          Members
        </Link>
        {" / "}
        <span>{m.name}</span>
      </div>

      {/* Header */}
      <div className="flex gap-6 mb-10">
        {m.photoUrl ? (
          <img
            loading="lazy"
            decoding="async"
            src={m.photoUrl}
            alt={m.name}
            className="w-24 h-24 rounded-full object-cover shrink-0"
            style={{ border: "2px solid var(--color-border)" }}
          />
        ) : (
          <div
            className="w-24 h-24 rounded-full shrink-0 flex items-center justify-center font-serif text-3xl"
            style={{ backgroundColor: "var(--color-surface)", color: "var(--color-muted)" }}
          >
            {m.name[0]}
          </div>
        )}
        <div className="min-w-0">
          <h1 className="font-serif text-3xl mb-1">{m.name}</h1>
          <div className="flex flex-wrap items-center gap-2 text-sm mb-2">
            {m.party && (
              <span
                className="px-2 py-0.5 rounded text-xs font-medium"
                style={{
                  backgroundColor: "var(--color-surface)",
                  border: "1px solid var(--color-border)",
                }}
              >
                {m.party}
              </span>
            )}
            <span style={{ color: "var(--color-muted)" }}>{m.house}</span>
            {m.constituency && (
              <>
                <span style={{ color: "var(--color-border)" }}>·</span>
                <span style={{ color: "var(--color-muted)" }}>{m.constituency}</span>
              </>
            )}
          </div>
          {primaryPosition && (
            <p className="text-sm mb-3" style={{ color: "var(--color-muted)" }}>
              {primaryPosition}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-5 text-sm">
            <Stat label="Sittings" value={stats?.sittingsAttended ?? 0} />
            <Stat label="Speeches" value={stats?.totalSpeeches ?? 0} />
            <Stat label="Bills debated" value={billCount} />
            <Stat label="Topics raised" value={topicCount} />
            <InfoTooltip
              text="These figures are derived from the official Hansard. They reflect recorded activity and may not capture every contribution. Occasional name variations in transcripts can affect matching."
              width="w-64"
            />
          </div>
        </div>
      </div>

      {/* Committees */}
      {committees.length > 0 && (
        <div className="mb-8 p-4 rounded-lg" style={{ backgroundColor: "var(--color-surface)" }}>
          <div
            className="text-xs font-medium uppercase tracking-widest mb-2"
            style={{ color: "var(--color-muted)" }}
          >
            Committees
          </div>
          <div className="flex flex-wrap gap-2">
            {committees.slice(0, 6).map((c, i) => {
              const clean = c
                .replace(/^(The Chair|A member) of the /i, "")
                .replace(/ committee\.?$/i, "");
              const slug = clean.toLowerCase().trim();
              return (
                <Link
                  key={i}
                  to={`/members?committee=${encodeURIComponent(slug)}&house=${encodeURIComponent(m.house)}`}
                  className="text-xs px-2 py-1 rounded transition-colors"
                  style={{ border: "1px solid var(--color-border)", color: "var(--color-muted)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--color-accent)")}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--color-border)")}
                >
                  {clean}
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Tabs: URL-driven so pagination is preserved on tab switch */}
      <div className="flex gap-1 mb-6" style={{ borderBottom: "1px solid var(--color-border)" }}>
        {(
          [
            ["sponsored", `Sponsored (${sponsored.length})`],
            ["bills", `Debates (${billCount.toLocaleString()})`],
            ["topics", `Topics (${topicCount.toLocaleString()})`],
          ] as [string, string][]
        ).map(([t, label]) => (
          <Link
            key={t}
            to={`?tab=${t}`}
            className="px-4 py-2.5 text-sm font-medium -mb-px border-b-2 transition-colors"
            style={{
              borderColor: tab === t ? "var(--color-accent)" : "transparent",
              color: tab === t ? "var(--color-accent)" : "var(--color-muted)",
            }}
          >
            {label}
          </Link>
        ))}
      </div>

      {/* Sponsored bills */}
      {tab === "sponsored" && (
        <>
          <div className="flex items-center gap-1.5 mb-3">
            <p className="text-xs" style={{ color: "var(--color-muted)" }}>
              Bills identified from transcript text where this member moved a reading.
            </p>
            <InfoTooltip
              text="Sponsorship is inferred from contribution text using name matching. Some bills may be missing if the member's name could not be resolved, and a small number of entries may be procedural motions rather than substantive legislation."
              width="w-64"
            />
          </div>
          <div className="divide-y" style={{ borderColor: "var(--color-border)" }}>
            {sponsored.length === 0 ? (
              <Empty text="No sponsored bills found." />
            ) : (
              sponsored.map((b: any) => (
                <div key={b.id} className="py-4 flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <Link
                      to={`/bills/${b.id}`}
                      className="text-sm font-medium hover:underline"
                      style={{ color: "var(--color-accent)" }}
                    >
                      {b.name}
                    </Link>
                    <div
                      className="text-xs mt-1 flex flex-wrap gap-x-2 gap-y-0.5"
                      style={{ color: "var(--color-muted)" }}
                    >
                      {b.billNumber && <span>{b.billNumber}</span>}
                      {b.year && (
                        <>
                          <span>·</span>
                          <span>{b.year}</span>
                        </>
                      )}
                      {b.stages?.filter(Boolean).length > 0 && (
                        <>
                          <span>·</span>
                          <span>{b.stages.filter(Boolean).join(", ")}</span>
                        </>
                      )}
                      {b.firstSeen && (
                        <>
                          <span>·</span>
                          <span>
                            {fmt(b.firstSeen)}
                            {b.lastSeen && b.firstSeen !== b.lastSeen && ` – ${fmt(b.lastSeen)}`}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="text-sm font-semibold">{b.sittings ?? 0}</div>
                    <div className="text-xs" style={{ color: "var(--color-muted)" }}>
                      sittings
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {/* Bills debated */}
      {tab === "bills" && (
        <>
          <div className="divide-y" style={{ borderColor: "var(--color-border)" }}>
            {bills.length === 0 ? (
              <Empty text="No bills found." />
            ) : (
              bills.map((b: any) => (
                <div key={b.id} className="py-4 flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <Link
                      to={`/bills/${b.id}`}
                      className="text-sm font-medium hover:underline"
                      style={{ color: "var(--color-accent)" }}
                    >
                      {b.name}
                    </Link>
                    <div
                      className="text-xs mt-1 flex flex-wrap gap-x-2 gap-y-0.5"
                      style={{ color: "var(--color-muted)" }}
                    >
                      {b.billNumber && <span>{b.billNumber}</span>}
                      {b.stages?.filter(Boolean).length > 0 && (
                        <>
                          <span>·</span>
                          <span>{b.stages.filter(Boolean).join(", ")}</span>
                        </>
                      )}
                      <span>·</span>
                      <span>
                        {fmt(b.firstSeen)}
                        {b.firstSeen !== b.lastSeen && ` – ${fmt(b.lastSeen)}`}
                      </span>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="text-sm font-semibold">{b.speeches}</div>
                    <div className="text-xs" style={{ color: "var(--color-muted)" }}>
                      speeches
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          <Pagination page={page} hasMore={hasMore} searchStr={searchStr} />
        </>
      )}

      {/* Topics */}
      {tab === "topics" && (
        <>
          <div className="divide-y" style={{ borderColor: "var(--color-border)" }}>
            {topics.length === 0 ? (
              <Empty text="No topics found." />
            ) : (
              topics.map((t: any) => (
                <div key={t.id} className="py-4 flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <Link
                      to={`/topics/${t.id}`}
                      className="text-sm font-medium hover:underline"
                      style={{ color: "var(--color-accent)" }}
                    >
                      {t.title}
                    </Link>
                    <div
                      className="text-xs mt-1 flex gap-2"
                      style={{ color: "var(--color-muted)" }}
                    >
                      <span>{t.sectionType}</span>
                      <span>·</span>
                      <span>{fmt(t.date)}</span>
                      <span>·</span>
                      <span>{t.house}</span>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="text-sm font-semibold">{t.speechCount}</div>
                    <div className="text-xs" style={{ color: "var(--color-muted)" }}>
                      speeches
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          <Pagination page={page} hasMore={hasMore} searchStr={searchStr} />
        </>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="text-sm">
      <span className="font-semibold">{Number(value).toLocaleString()}</span>{" "}
      <span style={{ color: "var(--color-muted)" }}>{label}</span>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <p className="py-10 text-center text-sm" style={{ color: "var(--color-muted)" }}>
      {text}
    </p>
  );
}

function fmt(d: string) {
  return new Date(d).toLocaleDateString("en-KE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
