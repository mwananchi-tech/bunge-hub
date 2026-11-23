import { useEffect, useState } from "react";
import { Link, data, redirect, useLocation, useNavigate } from "react-router";

import { MarkdownContent } from "~/components/MarkdownContent";
import { MemberAvatar } from "~/components/MemberAvatar";
import { ModelBadge } from "~/components/ModelBadge";
import { NoVideoThumbnail } from "~/components/NoVideoThumbnail";
import { PreviewChips } from "~/components/PreviewChips";
import { Button, buttonClasses } from "~/components/ui/Button";
import {
  getSittingById,
  getSittingPreviews,
  getSpeakerMembers,
  resolveLegacySittingSuffix,
} from "~/lib/queries/sittings.server";
import {
  type Contributor,
  type SpeakerMap,
  type TopicTime,
  type TranscriptNode,
  analyseSitting,
} from "~/lib/sitting-stats";
import { resolveSourceUrl, sourceHost } from "~/lib/source-urls";
import { youtubeId } from "~/lib/youtube";

import type { Route } from "./+types/sittings.$id";

export async function loader({ params }: Route.LoaderArgs) {
  const routeParam = decodeURIComponent(params.id!);
  const isUuid = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(routeParam);
  if (!isUuid) {
    const matches = await resolveLegacySittingSuffix(routeParam);
    if (matches.length > 1) {
      throw data("Sitting route is ambiguous", { status: 409 });
    }
    if (matches.length === 1) throw redirect(`/sittings/${matches[0]}`, 308);
    throw data("Sitting not found", { status: 404 });
  }

  const sitting = await getSittingById(routeParam);
  if (!sitting) throw data("Sitting not found", { status: 404 });
  if (routeParam !== sitting.id) throw redirect(`/sittings/${sitting.id}`, 308);
  const [speakerMap, previews] = await Promise.all([
    getSpeakerMembers(sitting.id),
    getSittingPreviews(sitting.id),
  ]);
  return { sitting, speakerMap, previews };
}

export function meta({ data }: Route.MetaArgs) {
  const s = data?.sitting;
  const dateStr = s
    ? new Date(s.date).toLocaleDateString("en-KE", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;
  const title = s ? `${s.house} · ${dateStr} | Bunge Hub` : "Sitting | Bunge Hub";
  const description = s
    ? `${s.house} sitting on ${dateStr}. Full Hansard transcript with bills debated, speaker contributions, and AI-generated summaries.`
    : "Parliamentary sitting transcript from Kenya's 13th Parliament.";
  return [
    { title },
    { name: "description", content: description },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:type", content: "article" },
  ];
}

export default function SittingDetail({ loaderData }: Route.ComponentProps) {
  const { sitting: s, speakerMap, previews } = loaderData;
  const transcript = s.rawJson as any;
  const sections: TranscriptNode[] = transcript?.sections ?? [];
  const stats = analyseSitting(sections, speakerMap as SpeakerMap);
  const summary = s.generatedSummary ?? s.summary;

  const externalUrl = resolveSourceUrl(s.sourceUrl, s.sourceBaseUrl);
  const pdfUrl = s.pdfUrl ? resolveSourceUrl(s.pdfUrl, s.sourceBaseUrl ?? externalUrl) : null;

  return (
    <div className="page-frame py-12">
      <div className="max-w-4xl">
        {/* Header */}
        <div className="mb-12">
          <BackToSittings />
          <nav aria-label="Breadcrumb" className="mb-2 text-sm text-muted">
            <ol className="flex flex-wrap items-center gap-1.5">
              <li>
                <Link to="/sittings" className="hover:text-accent hover:underline">
                  Sittings
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li aria-current="page" className="font-medium text-text">
                Sitting overview
              </li>
            </ol>
          </nav>
          <h1 className="font-serif text-3xl mb-1">
            {s.house}
            {s.sessionType && <span className="text-muted"> · {s.sessionType}</span>}
          </h1>
          <p className="text-base mb-6 text-muted">
            {new Date(s.date).toLocaleDateString("en-KE", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>

          {/* 1. Video: YouTube player when linked, otherwise the Bunge Hub seal */}
          <SittingVideo youtubeUrl={s.youtubeUrl} />

          {/* 2. Bills and topics debated in this sitting */}
          {(previews.bills.length > 0 || previews.topics.length > 0) && (
            <div className="mt-6 space-y-2">
              <PreviewChips
                title="Bills"
                items={previews.bills}
                total={previews.bills.length}
                kind="bills"
              />
              <PreviewChips
                title="Topics"
                items={previews.topics}
                total={previews.topics.length}
                kind="topics"
              />
            </div>
          )}

          <div className="mt-6 flex flex-wrap gap-2">
            <a
              href={externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonClasses({ variant: "outlined", size: "sm" })}
            >
              View on {sourceHost(externalUrl)} ↗
            </a>
            {pdfUrl && (
              <a
                href={pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonClasses({ variant: "outlined", size: "sm" })}
              >
                Download PDF ↗
              </a>
            )}
          </div>

          {summary && (
            <div className="p-5 rounded-xl mt-8 border border-border bg-surface">
              <div className="text-xs font-medium uppercase tracking-widest mb-2 text-muted">
                Session Summary
              </div>
              <MarkdownContent content={summary} />
              {s.generatedSummary && <ModelBadge model={s.generatedSummaryModel} />}
            </div>
          )}
        </div>

        {/* 3. Sitting overview */}
        <SittingOverview stats={stats} />

        {/* Transcript */}
        <div className="text-xs font-medium uppercase tracking-widest mb-6 text-muted">
          Full transcript
        </div>
        <div className="space-y-10">
          {sections.map((section: any, si: number) => (
            <SectionBlock key={si} section={section} speakerMap={speakerMap} />
          ))}
        </div>
      </div>
    </div>
  );
}

/* "Back to Sittings". When the reader came from the Sittings list (the list marks
   its links with fromSittingsList), go back in history so their filters, page and
   scroll position are kept. Otherwise (Google, Home, a shared link) open the list. */
function BackToSittings() {
  const navigate = useNavigate();
  const location = useLocation();
  const cameFromList = Boolean(
    (location.state as { fromSittingsList?: boolean } | null)?.fromSittingsList
  );
  return (
    <Link
      to="/sittings"
      onClick={(e) => {
        if (cameFromList) {
          e.preventDefault();
          navigate(-1);
        }
      }}
      className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-accent"
    >
      <span aria-hidden="true">←</span> Back to Sittings
    </Link>
  );
}

/* YouTube recording of the sitting. youtube_url is set manually or by a future
   enrichment step; until then the Bunge Hub seal stands in. */
function SittingVideo({ youtubeUrl }: { youtubeUrl?: string | null }) {
  if (youtubeUrl) {
    return (
      <div className="aspect-video overflow-hidden rounded-xl border border-border bg-surface">
        <iframe
          src={`https://www.youtube.com/embed/${youtubeId(youtubeUrl)}`}
          title="Parliamentary sitting recording"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="h-full w-full"
        />
      </div>
    );
  }
  return (
    <div>
      <NoVideoThumbnail className="rounded-xl" />
      <p className="mt-2 text-xs text-muted">No video yet.</p>
    </div>
  );
}

const TOP_COUNT = 6;
const TOP_TOPICS = 8;

/* Ranked list of MPs with a bar for their share of words. */
function ContributorList({
  id,
  title,
  note,
  ranked,
}: {
  id: string;
  title: string;
  note: string;
  ranked: Contributor[];
}) {
  const [showAll, setShowAll] = useState(false);
  if (ranked.length === 0) return null;

  const shown = showAll ? ranked : ranked.slice(0, TOP_COUNT);
  const maxWords = ranked[0].words;

  return (
    <section aria-labelledby={id}>
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <h2 id={id} className="text-xs font-medium uppercase tracking-widest text-muted">
          {title}
        </h2>
        <span className="text-xs text-muted">{note}</span>
      </div>

      <ol className="grid gap-x-8 gap-y-1 sm:grid-cols-2">
        {shown.map((c, i) => (
          <li key={c.member.id} className="flex items-center gap-3 py-2">
            <span className="w-5 shrink-0 text-right text-xs tabular-nums text-muted">{i + 1}</span>
            <Link to={`/members/${c.member.id}`} className="shrink-0">
              <MemberAvatar
                name={c.member.name}
                src={c.member.photo}
                className="h-9 w-9 rounded-full object-cover border border-border"
                fallbackClassName="font-serif text-xs font-medium"
              />
            </Link>
            <div className="min-w-0 flex-1">
              <Link
                to={`/members/${c.member.id}`}
                className="block truncate text-sm font-medium text-accent hover:underline"
              >
                {c.member.name}
              </Link>
              {c.member.party && (
                <div className="truncate text-xs text-muted">{c.member.party}</div>
              )}
              {/* Bar: share of words compared with the top speaker */}
              <div className="mt-1.5 h-1 rounded-full bg-surface">
                <div
                  className="h-1 rounded-full bg-accent"
                  style={{ width: `${Math.max(4, (c.words / maxWords) * 100)}%` }}
                />
              </div>
              <div className="mt-1 text-xs tabular-nums text-muted">
                {c.words.toLocaleString("en-KE")} words · spoke {c.turns}{" "}
                {c.turns === 1 ? "time" : "times"}
              </div>
            </div>
          </li>
        ))}
      </ol>

      {ranked.length > TOP_COUNT && (
        <Button size="sm" className="mt-3" onClick={() => setShowAll((v) => !v)}>
          {showAll ? `Show top ${TOP_COUNT}` : `Show all ${ranked.length} MPs`}
        </Button>
      )}
    </section>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="bg-bg px-4 py-4">
      <div className="font-serif text-2xl tabular-nums">{value.toLocaleString("en-KE")}</div>
      <div className="mt-0.5 text-xs text-muted">{label}</div>
    </div>
  );
}

/* Horizontal bar list: one bar per agenda item, longest debate first.
   Single series, so one colour (accent) and no legend; each row is also plain
   text, which doubles as the table view for screen readers. */
function TopicChart({ topics }: { topics: TopicTime[] }) {
  const [showAll, setShowAll] = useState(false);
  if (topics.length === 0) return null;
  const shown = showAll ? topics : topics.slice(0, TOP_TOPICS);
  const max = topics[0].words;

  return (
    <section aria-labelledby="topic-time">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <h3 id="topic-time" className="text-xs font-medium uppercase tracking-widest text-muted">
          What the time went on
        </h3>
        <span className="text-xs text-muted">words spoken per agenda item, chair left out</span>
      </div>
      <ol className="space-y-3">
        {shown.map((t) => {
          const label = t.anchor ? (
            <a href={`#${t.anchor}`} className="hover:underline">
              {t.label}
            </a>
          ) : (
            t.label
          );
          return (
            <li
              key={t.label + t.words}
              title={`${t.label}: ${t.words.toLocaleString("en-KE")} words by ${t.mps} MPs`}
            >
              <div className="flex items-baseline justify-between gap-4 text-sm">
                <span className="min-w-0">{label}</span>
                <span className="shrink-0 text-xs tabular-nums text-muted">
                  {t.words.toLocaleString("en-KE")} words · {t.mps} {t.mps === 1 ? "MP" : "MPs"}
                </span>
              </div>
              <div className="mt-1 h-2 rounded-r bg-surface">
                <div
                  className="h-2 rounded-r bg-accent"
                  style={{ width: `${Math.max(1.5, (t.words / max) * 100)}%` }}
                />
              </div>
            </li>
          );
        })}
      </ol>
      {topics.length > TOP_TOPICS && (
        <Button size="sm" className="mt-4" onClick={() => setShowAll((v) => !v)}>
          {showAll ? `Show top ${TOP_TOPICS}` : `Show all ${topics.length} items`}
        </Button>
      )}
    </section>
  );
}

/* Version B: totals, who chaired, where the time went, then the debating MPs */
function SittingOverview({ stats }: { stats: ReturnType<typeof analyseSitting> }) {
  if (stats.totals.contributions === 0) return null;
  return (
    <section aria-labelledby="sitting-overview" className="mb-14 space-y-10">
      <div>
        <h2 id="sitting-overview" className="mb-4 font-serif text-2xl">
          Sitting overview
        </h2>
        <div className="grid grid-cols-3 gap-px overflow-hidden rounded-xl border border-border bg-border">
          <Stat
            value={stats.totals.mps}
            label={stats.totals.mps === 1 ? "MP spoke" : "MPs spoke"}
          />
          <Stat value={stats.totals.contributions} label="contributions" />
          <Stat value={stats.totals.words} label="words spoken" />
        </div>
      </div>

      {stats.chairs.length > 0 && (
        <div>
          <h3 className="mb-3 text-xs font-medium uppercase tracking-widest text-muted">
            In the chair
          </h3>
          <ul className="flex flex-wrap gap-2">
            {stats.chairs.map((c) => (
              <li key={c.member.id}>
                <Link
                  to={`/members/${c.member.id}`}
                  className="flex items-center gap-2.5 rounded-full border border-border bg-surface py-1 pl-1 pr-4 hover:border-accent"
                >
                  <MemberAvatar
                    name={c.member.name}
                    src={c.member.photo}
                    className="h-8 w-8 rounded-full object-cover"
                    fallbackClassName="font-serif text-xs font-medium"
                  />
                  <span className="text-sm">
                    <span className="font-medium">{c.member.name}</span>
                    <span className="text-muted"> · {c.role}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      <TopicChart topics={stats.topics} />

      <ContributorList
        id="participants"
        title="Who spoke most"
        note="ranked by words spoken, chair left out"
        ranked={stats.participants}
      />
    </section>
  );
}

export function subsectionId(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function SectionBlock({ section, speakerMap }: { section: any; speakerMap: Record<string, any> }) {
  const [open, setOpen] = useState(true);
  const hasContent =
    (section.contributions?.length ?? 0) > 0 || (section.subsections?.length ?? 0) > 0;

  if (!hasContent && !section.sectionType) return null;

  return (
    <div>
      {section.sectionType && (
        <button
          onClick={() => setOpen((v) => !v)}
          className="w-full text-left flex items-center justify-between gap-2 pb-2 mb-4"
          style={{ borderBottom: `2px solid var(--color-accent)` }}
        >
          <span className="font-serif text-xl font-medium" style={{ color: "var(--color-accent)" }}>
            {section.sectionType}
          </span>
          <span className="text-xs shrink-0" style={{ color: "var(--color-muted)" }}>
            {open ? "collapse ↑" : "expand ↓"}
          </span>
        </button>
      )}

      {open && (
        <div className="space-y-8">
          {(section.contributions ?? []).length > 0 && (
            <ContributionList contributions={section.contributions} speakerMap={speakerMap} />
          )}
          {(section.subsections ?? []).map((sub: any, ssi: number) => (
            <SubsectionBlock key={ssi} subsection={sub} speakerMap={speakerMap} />
          ))}
        </div>
      )}
    </div>
  );
}

function SubsectionBlock({
  subsection,
  speakerMap,
}: {
  subsection: any;
  speakerMap: Record<string, any>;
}) {
  const count = subsection.contributions?.length ?? 0;
  const id = subsectionId(subsection.title);
  const [open, setOpen] = useState(count <= 20);

  // If this subsection is the URL anchor target, ensure it is open
  useEffect(() => {
    if (window.location.hash === `#${id}`) {
      setOpen(true);
    }
  }, [id]);

  if (!subsection.title && count === 0) return null;

  return (
    <div
      id={subsectionId(subsection.title)}
      className="pl-4"
      style={{ borderLeft: "2px solid var(--color-border)", scrollMarginTop: "5rem" }}
    >
      {subsection.title && (
        <button
          onClick={() => setOpen((v) => !v)}
          className="w-full text-left flex items-center justify-between gap-2 mb-4"
        >
          <span className="font-medium text-base">{subsection.title}</span>
          <span className="text-xs shrink-0 ml-2" style={{ color: "var(--color-muted)" }}>
            {count} contribution{count !== 1 ? "s" : ""} {open ? "↑" : "↓"}
          </span>
        </button>
      )}
      {open && (
        <ContributionList contributions={subsection.contributions ?? []} speakerMap={speakerMap} />
      )}
    </div>
  );
}

function ContributionList({
  contributions,
  speakerMap,
}: {
  contributions: any[];
  speakerMap: Record<string, any>;
}) {
  return (
    <div className="space-y-5">
      {contributions.map((c: any, ci: number) => (
        <Contribution key={ci} c={c} speakerMap={speakerMap} />
      ))}
    </div>
  );
}

function Contribution({ c, speakerMap }: { c: any; speakerMap: Record<string, any> }) {
  const [expanded, setExpanded] = useState(false);
  const member =
    (c.speakerUrl ? speakerMap[`url:${c.speakerUrl}`] : null) ??
    speakerMap[`name:${c.speakerName}`];
  const content = c.content ?? "";
  const truncLimit = 400;
  const needsTrunc = content.length > truncLimit;

  return (
    <div className="flex gap-3">
      {/* Avatar */}
      <div className="shrink-0 pt-0.5">
        {member?.id ? (
          <Link to={`/members/${member.id}`}>
            <MemberAvatar
              name={member.name}
              src={member.photo}
              className="w-9 h-9 rounded-full object-cover"
              fallbackClassName="font-serif text-xs font-medium"
              style={{ border: "1px solid var(--color-border)" }}
            />
          </Link>
        ) : (
          <MemberAvatar
            name={c.speakerName ?? "Unknown speaker"}
            className="w-9 h-9 rounded-full object-cover"
            fallbackClassName="font-serif text-xs font-medium"
            style={{ border: "1px solid var(--color-border)" }}
          />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Speaker name + role */}
        <div className="flex items-baseline gap-2 mb-1.5 flex-wrap">
          {member?.id ? (
            <Link
              to={`/members/${member.id}`}
              className="font-medium text-sm hover:underline"
              style={{ color: "var(--color-accent)" }}
            >
              {c.speakerName}
            </Link>
          ) : (
            <span className="font-medium text-sm" style={{ color: "var(--color-text)" }}>
              {c.speakerName}
            </span>
          )}
          {c.speakerRole && (
            <span className="text-xs" style={{ color: "var(--color-muted)" }}>
              {c.speakerRole}
            </span>
          )}
          {member?.party && (
            <span
              className="text-xs px-1.5 py-0.5 rounded"
              style={{
                backgroundColor: "var(--color-surface)",
                color: "var(--color-muted)",
                border: "1px solid var(--color-border)",
              }}
            >
              {member.party}
            </span>
          )}
        </div>

        {/* Speech */}
        <p className="text-sm leading-relaxed whitespace-pre-wrap">
          {needsTrunc && !expanded ? content.slice(0, truncLimit) + "…" : content}
        </p>
        {needsTrunc && (
          <button
            onClick={() => setExpanded((v) => !v)}
            className="mt-1 text-xs"
            style={{ color: "var(--color-accent)" }}
          >
            {expanded ? "Show less" : "Read more"}
          </button>
        )}

        {/* Procedural notes */}
        {(c.proceduralNotes ?? []).map((n: string, i: number) => (
          <p key={i} className="text-xs italic mt-1" style={{ color: "var(--color-muted)" }}>
            [{n}]
          </p>
        ))}
      </div>
    </div>
  );
}
