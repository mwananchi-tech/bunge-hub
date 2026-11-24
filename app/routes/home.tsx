import { useState } from "react";
import { Link } from "react-router";

import { InfoTooltip } from "~/components/InfoTooltip";
import { MemberAvatar } from "~/components/MemberAvatar";
import { openSearch } from "~/components/Nav";
import { NoVideoThumbnail } from "~/components/NoVideoThumbnail";
import { PreviewChips, type PreviewItem } from "~/components/PreviewChips";
import { ButtonLink, buttonClasses } from "~/components/ui/Button";
import { formatMemberName } from "~/lib/member-name";
import { getHomeStats, getRecentTopics, getTopMembersByHouse } from "~/lib/queries/home.server";
import { listSittings } from "~/lib/queries/sittings.server";
import { resolveSourceUrl } from "~/lib/source-urls";
import { youtubeThumbnail } from "~/lib/youtube";

import type { Route } from "./+types/home";

// Fixed by the Constitution of Kenya (Article 89 and the First Schedule), so they are not
// counted from the data. They become links once constituencies and counties have pages.
const CONSTITUENCIES = 290;
const COUNTIES = 47;

type HomeMember = {
  id: string;
  name: string;
  photoUrl?: string | null;
  party?: string | null;
  constituency?: string | null;
  speeches: number;
};

type LatestSitting = {
  id: string;
  date: string | Date;
  house: string;
  sessionType?: string;
  youtubeUrl?: string | null;
  pdfUrl?: string;
  sourceUrl: string;
  sourceBaseUrl?: string;
  billPreviews: PreviewItem[];
  billPreviewTotal: number;
  topicPreviews: PreviewItem[];
  topicPreviewTotal: number;
};

export async function loader() {
  const [stats, topMPs, topSenators, recentTopics, latest] = await Promise.all([
    getHomeStats(),
    getTopMembersByHouse("National Assembly", 5),
    getTopMembersByHouse("Senate", 5),
    getRecentTopics(5),
    listSittings({ limit: 1 }),
  ]);
  return {
    stats,
    topMPs,
    topSenators,
    recentTopics,
    latestSitting: (latest[0] ?? null) as LatestSitting | null,
  };
}

export function meta() {
  const description =
    "Kenya's parliamentary record, open and searchable. Every sitting, bill and member of the 13th Parliament.";
  return [
    { title: "Bunge Hub | Kenya's Parliament, open to every mwananchi" },
    { name: "description", content: description },
    { property: "og:title", content: "Bunge Hub | Kenya's Parliament, open to every mwananchi" },
    { property: "og:description", content: description },
    { property: "og:type", content: "website" },
    { property: "og:url", content: "https://bunge-hub.mwananchi.tech" },
  ];
}

export default function Home({ loaderData }: Route.ComponentProps) {
  const { stats, topMPs, topSenators, recentTopics, latestSitting } = loaderData;

  return (
    <div className="page-frame pt-8 pb-12 sm:pt-16">
      {/* On web the search sits under the hero, close to the latest sitting.
          On phones (below 768px) it moves above the heading, since the header has no search icon on home. */}
      <div className="flex flex-col">
        {/* Hero: stands on its own, with more space under it than between the sections below */}
        <div className="mb-10 sm:mb-14">
          <h1 className="mb-3 max-w-2xl font-serif text-[32px] font-light leading-tight sm:text-5xl">
            Kenya&apos;s Parliament, open to every mwananchi.
          </h1>
          <p className="max-w-xl text-muted sm:text-lg">
            Every sitting, bill and member of the 13th Parliament, searchable.
          </p>
        </div>

        <button
          type="button"
          onClick={openSearch}
          className="order-first mb-8 flex h-11 w-full cursor-pointer items-center gap-2 rounded-control border border-border bg-surface px-4 text-left text-sm text-muted transition-colors hover:border-muted md:order-none md:mb-6 md:h-10"
        >
          <SearchIcon />
          <span className="truncate">Search a member, county, bill or topic</span>
        </button>
      </div>

      {latestSitting && <LatestSittingCard s={latestSitting} />}

      <section className="mb-12">
        <SectionHeader title="The members" href="/members" linkLabel="All members" />
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-4">
          <StatTile value={stats.mps} label="MPs" to="/members?house=National+Assembly" />
          <StatTile value={stats.senators} label="Senators" to="/members?house=Senate" />
          <StatTile value={CONSTITUENCIES} label="Constituencies" />
          <StatTile value={COUNTIES} label="Counties" />
        </div>
        <MostActive mps={topMPs as HomeMember[]} senators={topSenators as HomeMember[]} />
      </section>

      <section className="mb-12">
        <SectionHeader
          title="The record"
          tooltip="Sittings counts every sitting indexed from the Hansard; one day can have several. Bills tabled are bills whose sponsor was identified in the transcript. Topics are questions, statements, motions and other non-bill items."
        />
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-4">
          <StatTile value={stats.sittings} label="Sittings" to="/sittings" />
          <StatTile value={stats.bills} label="Bills tabled" to="/bills" />
          <StatTile
            value={stats.topics}
            label="Topics debated"
            to="/topics"
            className="col-span-2 sm:col-span-1"
          />
        </div>

        <div className="mt-8">
          <SectionHeader title="Recently discussed" href="/topics" linkLabel="All topics" />
          <ol>
            {recentTopics.map((t: any) => (
              <li key={t.id} className="border-b border-border py-3 last:border-b-0">
                <Link
                  to={`/topics/${t.id}`}
                  className="font-medium leading-snug hover:text-accent hover:underline"
                >
                  {t.title}
                </Link>
                <div className="mt-1 text-sm text-muted">
                  {formatDate(t.date, { day: "numeric", month: "short", year: "numeric" })} ·{" "}
                  {t.house}
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </div>
  );
}

function formatDate(date: string | Date, options: Intl.DateTimeFormatOptions) {
  return new Date(date).toLocaleDateString("en-KE", options);
}

function SearchIcon() {
  return (
    <svg
      className="h-4 w-4 shrink-0"
      fill="none"
      viewBox="0 0 16 16"
      stroke="currentColor"
      strokeWidth={1.5}
      aria-hidden="true"
    >
      <path strokeLinecap="round" d="M6.5 12a5.5 5.5 0 100-11 5.5 5.5 0 000 11zM14 14l-3-3" />
    </svg>
  );
}

function SectionHeader({
  title,
  href,
  linkLabel,
  tooltip,
}: {
  title: string;
  href?: string;
  linkLabel?: string;
  tooltip?: string;
}) {
  return (
    <div className="mb-3 flex items-baseline justify-between gap-4">
      <div className="flex items-center gap-1">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted">{title}</h2>
        {tooltip && <InfoTooltip text={tooltip} />}
      </div>
      {href && (
        <Link to={href} className="text-sm text-accent hover:underline">
          {linkLabel} →
        </Link>
      )}
    </div>
  );
}

/* The latest sitting, as a small version of a card on the Sittings page */
function LatestSittingCard({ s }: { s: LatestSitting }) {
  const pdfUrl = s.pdfUrl ? resolveSourceUrl(s.pdfUrl, s.sourceBaseUrl ?? s.sourceUrl) : null;
  return (
    <section className="mb-12">
      <SectionHeader title="Latest sitting" href="/sittings" linkLabel="All sittings" />
      <article className="grid grid-cols-[minmax(0,1fr)] gap-4 md:grid-cols-[280px_minmax(0,1fr)] md:gap-6">
        {s.youtubeUrl ? (
          <a
            href={s.youtubeUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Watch the ${s.house} sitting of ${formatDate(s.date, { day: "numeric", month: "long", year: "numeric" })} on YouTube`}
            className="group relative block aspect-video overflow-hidden rounded-lg bg-surface"
          >
            <img
              src={youtubeThumbnail(s.youtubeUrl)}
              alt=""
              loading="lazy"
              className="h-full w-full object-cover"
            />
            <span className="absolute inset-0 m-auto grid h-12 w-12 place-items-center rounded-full bg-black/55 transition-transform group-hover:scale-110 group-hover:bg-[#c4302b]">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff" aria-hidden="true">
                <path d="M8 5v14l11-7z" />
              </svg>
            </span>
          </a>
        ) : (
          <NoVideoThumbnail className="rounded-lg" />
        )}

        <div className="min-w-0">
          <h3 className="font-serif text-[22px] font-semibold leading-tight">
            <span
              aria-hidden="true"
              className={`mr-2 inline-block h-2 w-2 -translate-y-0.5 rounded-full align-middle ${
                s.house === "Senate" ? "bg-secondary" : "bg-accent"
              }`}
            />
            {s.house}
            {s.sessionType && <span className="font-medium text-muted"> · {s.sessionType}</span>}
          </h3>
          <p className="mt-1 mb-3 text-sm text-muted">
            {formatDate(s.date, {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
          <div className="space-y-2">
            <PreviewChips
              title="Bills"
              items={s.billPreviews}
              total={s.billPreviewTotal}
              kind="bills"
            />
            <PreviewChips
              title="Topics"
              items={s.topicPreviews}
              total={s.topicPreviewTotal}
              kind="topics"
            />
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {s.youtubeUrl && (
              <a
                href={s.youtubeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonClasses({ variant: "filled", size: "sm" })}
              >
                ▶ Watch on YouTube
              </a>
            )}
            <ButtonLink
              to={`/sittings/${s.id}`}
              variant={s.youtubeUrl ? "outlined" : "filled"}
              size="sm"
            >
              View transcript
            </ButtonLink>
            {pdfUrl && (
              <a
                href={pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonClasses({ variant: "text", size: "sm" })}
              >
                PDF ↗
              </a>
            )}
          </div>
        </div>
      </article>
    </section>
  );
}

/* A number with a label. With `to`, the whole tile is a link: a quiet "View" at rest;
   on hover it tints, lifts and "View" turns red as the arrow slides in. Phones have no
   hover, so they show the arrow on its own. */
function StatTile({
  value,
  label,
  to,
  className = "",
}: {
  value: number;
  label: string;
  to?: string;
  className?: string;
}) {
  const body = (
    <>
      <span className="mb-1 block font-serif text-3xl leading-none sm:text-4xl">
        {Number(value).toLocaleString()}
      </span>
      <span className="text-sm text-muted">{label}</span>
    </>
  );
  const base = `relative block rounded-control border border-border bg-bg p-4 ${className}`;
  if (!to) return <div className={base}>{body}</div>;
  return (
    <Link
      to={to}
      className={`group ${base} transition hover:-translate-y-0.5 hover:border-accent hover:bg-accent-subtle hover:shadow-md`}
    >
      {body}
      <span className="absolute top-1/2 right-4 inline-flex -translate-y-1/2 items-center text-sm font-medium text-muted transition-colors group-hover:text-accent sm:top-auto sm:bottom-4 sm:translate-y-0">
        <span className="hidden sm:inline">View</span>
        <span
          aria-hidden="true"
          className="text-lg text-accent transition-all sm:ml-0 sm:max-w-0 sm:overflow-hidden sm:text-sm sm:opacity-0 sm:group-hover:ml-2 sm:group-hover:max-w-4 sm:group-hover:opacity-100"
        >
          →
        </span>
      </span>
    </Link>
  );
}

// Short party names, as most people say them. Anything not listed shows in full.
const PARTY_SHORT: Record<string, string> = {
  "Orange Democratic Movement": "ODM",
  "United Democratic Alliance": "UDA",
  "Wiper Democratic Movement - Kenya": "Wiper",
  "Jubilee Party": "Jubilee",
  "Amani National Congress": "ANC",
  "Kenya African National Union": "KANU",
  "Ford - Kenya": "Ford Kenya",
};

/* "MNA for Homa Bay Town constituency" → "MP for Homa Bay Town" */
function placeLabel(constituency?: string | null) {
  if (!constituency) return "";
  return constituency
    .replace(/^MNA for (.+) constituency$/i, "MP for $1")
    .replace(/^Senator for (.+) county$/i, "Senator for $1 County")
    .replace(/ · (.+) county$/i, " · $1 County");
}

function MostActive({ mps, senators }: { mps: HomeMember[]; senators: HomeMember[] }) {
  const [tab, setTab] = useState<"mps" | "senators">("mps");
  const members = tab === "mps" ? mps : senators;
  const tabs = [
    { id: "mps", label: "MPs" },
    { id: "senators", label: "Senators" },
  ] as const;

  return (
    <div className="mt-8">
      <SectionHeader
        title="Most active"
        tooltip="Based on recorded speeches in the Hansard. The Speaker and chair are left out. Occasional name variations in transcripts may affect ranking."
      />
      <div role="tablist" className="flex gap-6 border-b border-border">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`-mb-px cursor-pointer border-b-2 py-2 text-sm transition-colors ${
              tab === t.id
                ? "border-accent font-semibold text-text"
                : "border-transparent text-muted hover:text-text"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <ol>
        {members.map((m, i) => (
          <li
            key={m.id}
            className="flex items-center gap-3 border-b border-border py-3 last:border-b-0"
          >
            <span className="w-4 shrink-0 text-right text-sm text-muted">{i + 1}</span>
            <MemberAvatar
              name={formatMemberName(m.name)}
              src={m.photoUrl}
              className="h-10 w-10 shrink-0 rounded-full border border-border object-cover object-top"
              fallbackClassName="font-serif text-xs"
            />
            <div className="min-w-0 flex-1">
              <Link
                to={`/members/${m.id}`}
                className="block truncate font-medium text-accent hover:underline"
              >
                {formatMemberName(m.name)}
              </Link>
              <span className="block truncate text-sm text-muted">
                {[placeLabel(m.constituency), m.party && (PARTY_SHORT[m.party] ?? m.party)]
                  .filter(Boolean)
                  .join(" · ")}
              </span>
            </div>
            <span className="shrink-0 text-sm text-muted">
              {Number(m.speeches).toLocaleString()}
              <span className="hidden sm:inline"> speeches</span>
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
