import { Link } from "react-router";

import { InfoTooltip } from "~/components/InfoTooltip";
import {
  getHomeStats,
  getRecentSittings,
  getRecentTabledBills,
  getRecentTopics,
  getTopMembersByHouse,
} from "~/lib/queries/home.server";

import type { Route } from "./+types/home";

export async function loader() {
  const [stats, topMPs, topSenators, recentBills, recentTopics, recentSittings] = await Promise.all(
    [
      getHomeStats(),
      getTopMembersByHouse("National Assembly", 8),
      getTopMembersByHouse("Senate", 8),
      getRecentTabledBills(8),
      getRecentTopics(8),
      getRecentSittings(5),
    ]
  );
  return { stats, topMPs, topSenators, recentBills, recentTopics, recentSittings };
}

export function meta() {
  return [{ title: "Bunge Hub | Kenya's parliamentary record, open and queryable" }];
}

export default function Home({ loaderData }: Route.ComponentProps) {
  const { stats, topMPs, topSenators, recentBills, recentTopics, recentSittings } = loaderData;

  return (
    <div className="max-w-7xl mx-auto px-6 py-16">
      <div className="mb-16">
        <h1 className="font-serif text-5xl font-light mb-3">
          Kenya&apos;s parliamentary record,
          <br />
          open and queryable.
        </h1>
        <p className="text-lg max-w-xl mb-4" style={{ color: "var(--color-muted)" }}>
          Raw data from the 13th Parliament. Every bill, every debate, every contribution:
          structured, searchable, and openly available.
        </p>
        <p className="text-sm max-w-lg" style={{ color: "var(--color-muted)", opacity: 0.75 }}>
          Summaries generated progressively using open-source AI models.
        </p>
      </div>

      {/* Stats */}
      <div
        className="grid grid-cols-2 sm:grid-cols-4 gap-px mb-16"
        style={{ backgroundColor: "var(--color-border)" }}
      >
        {[
          {
            label: "Sittings",
            value: stats.sittings,
            note: "Counts all parliamentary sittings indexed from the Hansard. A single calendar day may have multiple sittings across houses or sessions.",
          },
          { label: "Members", value: stats.members },
          {
            label: "Bills tabled",
            value: stats.bills,
            note: "Derived from bills where a sponsor was identified in the transcript. Some sponsors could not be matched, and some entries may be procedural items rather than new legislation.",
          },
          {
            label: "Topics",
            value: stats.topics,
            note: "Questions, statements, motions, and other non-bill discussion items extracted from the Hansard. Some entries may overlap with bill debates where the section heading does not follow a standard format.",
          },
        ].map(({ label, value, note }) => (
          <div
            key={label}
            className="py-8 px-6 text-center"
            style={{ backgroundColor: "var(--color-bg)" }}
          >
            <div className="font-serif text-4xl font-light mb-1">
              {Number(value).toLocaleString()}
            </div>
            <div
              className="text-sm flex items-center justify-center gap-1"
              style={{ color: "var(--color-muted)" }}
            >
              {label}
              {note && <InfoTooltip text={note} />}
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-4 gap-10">
        <section>
          <SectionHeader
            href="/members?house=National+Assembly&sort=most-active"
            title="Most Active NA Members"
            tooltip="Based on recorded speeches in the Hansard. Occasional name variations in transcripts may affect ranking."
          />
          <MemberList members={topMPs} />
        </section>

        <section>
          <SectionHeader
            href="/members?house=Senate&sort=most-active"
            title="Most Active Senators"
            tooltip="Based on recorded speeches in the Hansard. Occasional name variations in transcripts may affect ranking."
          />
          <MemberList members={topSenators} />
        </section>

        <section>
          <SectionHeader href="/bills?sort=most-sponsored" title="Recently Tabled Bills" />
          <ol className="space-y-3">
            {recentBills.map((b: any, i: number) => (
              <li key={b.id} className="flex gap-3">
                <span
                  className="w-5 text-right text-sm shrink-0 pt-0.5"
                  style={{ color: "var(--color-muted)" }}
                >
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <Link
                    to={`/bills/${b.id}`}
                    className="text-sm font-medium hover:underline line-clamp-2 leading-snug"
                    style={{ color: "var(--color-accent)" }}
                  >
                    {b.name}
                  </Link>
                  <div className="text-xs mt-0.5" style={{ color: "var(--color-muted)" }}>
                    {b.sponsorSlug ? (
                      <Link
                        to={`/members/${b.sponsorSlug}`}
                        className="hover:underline"
                        style={{ color: "var(--color-muted)" }}
                      >
                        {b.sponsor}
                      </Link>
                    ) : (
                      <span>{b.sponsor}</span>
                    )}
                    {b.tabledDate && (
                      <span>
                        {" "}
                        ·{" "}
                        {new Date(b.tabledDate).toLocaleDateString("en-KE", {
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section>
          <SectionHeader href="/topics" title="Recently Discussed Topics" />
          <ol className="space-y-3">
            {recentTopics.map((t: any, i: number) => (
              <li key={t.id} className="flex gap-3">
                <span
                  className="w-5 text-right text-sm shrink-0 pt-0.5"
                  style={{ color: "var(--color-muted)" }}
                >
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <Link
                    to={`/topics/${t.id}`}
                    className="text-sm font-medium hover:underline line-clamp-2 leading-snug"
                    style={{ color: "var(--color-accent)" }}
                  >
                    {t.title}
                  </Link>
                  <div className="text-xs mt-0.5" style={{ color: "var(--color-muted)" }}>
                    <span>
                      {new Date(t.date).toLocaleDateString("en-KE", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                    <span> · {t.house}</span>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </section>
      </div>

      <section className="mt-16">
        <SectionHeader href="/sittings" title="Recent Sittings" />
        <div
          className="grid sm:grid-cols-2 lg:grid-cols-5 gap-px"
          style={{ backgroundColor: "var(--color-border)" }}
        >
          {recentSittings.map((s: any) => (
            <Link
              key={s.url}
              to={`/sittings/${s.url.split("/").filter(Boolean).pop()}`}
              className="block py-5 px-4 transition-colors"
              style={{ backgroundColor: "var(--color-bg)" }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--color-surface)")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "var(--color-bg)")}
            >
              <div className="text-xs mb-1" style={{ color: "var(--color-muted)" }}>
                {new Date(s.date).toLocaleDateString("en-KE", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </div>
              <div className="text-sm font-medium truncate">{s.house}</div>
              <div className="text-xs mt-0.5 truncate" style={{ color: "var(--color-muted)" }}>
                {s.sessionType}
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

function MemberList({ members }: { members: any[] }) {
  return (
    <ol className="space-y-3">
      {members.map((m: any, i: number) => (
        <li key={m.slug} className="flex items-center gap-3">
          <span className="w-5 text-right text-sm shrink-0" style={{ color: "var(--color-muted)" }}>
            {i + 1}
          </span>
          {m.photoUrl ? (
            <img
              src={m.photoUrl}
              alt={m.name}
              className="w-8 h-8 rounded-full object-cover shrink-0"
              style={{ border: "1px solid var(--color-border)" }}
            />
          ) : (
            <div
              className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-xs font-serif"
              style={{ backgroundColor: "var(--color-surface)", color: "var(--color-muted)" }}
            >
              {m.name[0]}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <Link
              to={`/members/${m.slug}`}
              className="text-sm font-medium hover:underline truncate block"
              style={{ color: "var(--color-accent)" }}
            >
              {m.name}
            </Link>
            <span className="text-xs" style={{ color: "var(--color-muted)" }}>
              {Number(m.speeches).toLocaleString()} speeches
            </span>
          </div>
        </li>
      ))}
    </ol>
  );
}

function SectionHeader({
  href,
  title,
  tooltip,
}: {
  href: string;
  title: string;
  tooltip?: string;
}) {
  return (
    <div className="flex items-baseline justify-between mb-4">
      <div className="flex items-center gap-1.5">
        <h2 className="font-serif text-lg">{title}</h2>
        {tooltip && <InfoTooltip text={tooltip} />}
      </div>
      <Link to={href} className="text-xs hover:underline" style={{ color: "var(--color-muted)" }}>
        View all →
      </Link>
    </div>
  );
}
