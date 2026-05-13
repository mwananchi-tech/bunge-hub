import { useState } from "react";
import { Link, data } from "react-router";
import type { Route } from "./+types/topics.$id";
import { getTopic, getTopicSpeakers } from "~/lib/queries/topics.server";
import { MarkdownContent } from "~/components/MarkdownContent";

export async function loader({ params }: Route.LoaderArgs) {
  const topic = await getTopic(params.id!);
  if (!topic) throw data("Topic not found", { status: 404 });
  const speakers = await getTopicSpeakers(params.id!);
  return { topic, speakers };
}

export function meta({ data }: Route.MetaArgs) {
  return [{ title: `${data?.topic?.title ?? "Topic"} | Bunge Hub` }];
}

export default function TopicDetail({ loaderData }: Route.ComponentProps) {
  const { topic: t, speakers } = loaderData;
  const sittingSlug = t.sittingUrl?.split("/").filter(Boolean).pop() ?? "";
  const externalUrl = t.sittingUrl?.startsWith("http")
    ? t.sittingUrl
    : `https://mzalendo.com${t.sittingUrl}`;

  // AI summary: aggregate from speaker summaries if no top-level summary exists yet
  // Future: replace with a dedicated topics.summary column once enrichment runs
  const speakerSummaries = speakers.filter((s: any) => s.summary).map((s: any) => s.summary);
  const hasSummaries = speakerSummaries.length > 0;

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      {/* Header */}
      <div className="mb-8">
        <div className="text-sm mb-2" style={{ color: "var(--color-muted)" }}>
          <Link to="/topics" className="hover:underline">Topics</Link>
          {" / "}
          <span>{t.sectionType}</span>
        </div>
        <h1 className="font-serif text-3xl mb-3 leading-snug">{t.title}</h1>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm mb-5"
             style={{ color: "var(--color-muted)" }}>
          <span>{new Date(t.date).toLocaleDateString("en-KE", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</span>
          <span>·</span>
          <span>{t.house}</span>
          <span>·</span>
          <span>{t.sessionType}</span>
          <span>·</span>
          <span>{t.speechCount} speeches</span>
        </div>

        <div className="flex flex-wrap gap-2">
          {sittingSlug && (
            <Link to={`/sittings/${sittingSlug}`}
                  className="text-xs px-3 py-1.5 rounded"
                  style={{ backgroundColor: "var(--color-accent)", color: "white" }}>
              View full sitting
            </Link>
          )}
          {t.sittingUrl && (
            <a href={externalUrl} target="_blank" rel="noopener noreferrer"
               className="text-xs px-3 py-1.5 rounded"
               style={{ border: "1px solid var(--color-border)", color: "var(--color-muted)", backgroundColor: "var(--color-surface)" }}>
              mzalendo.com ↗
            </a>
          )}
        </div>
      </div>

      {/* ── AI Summary provision ─────────────────────────────────────────────
          This section will show an AI-generated overview of the debate once
          the enrichment pipeline runs (topics.summary column, or aggregated
          from topic_speakers.summary). Speaker-level summaries are shown
          inline with each contribution below.
      ─────────────────────────────────────────────────────────────────────── */}
      <div className="mb-8 p-5 rounded-xl"
           style={{ border: "1px solid var(--color-border)", backgroundColor: "var(--color-surface)" }}>
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs font-medium uppercase tracking-widest" style={{ color: "var(--color-muted)" }}>
            Summary
          </div>
          {!hasSummaries && (
            <span className="text-xs px-2 py-0.5 rounded"
                  style={{ backgroundColor: "var(--color-gold)22", color: "var(--color-gold)", border: "1px solid var(--color-gold)44" }}>
              AI enrichment pending
            </span>
          )}
        </div>
        {hasSummaries ? (
          <div className="space-y-3">
            {speakerSummaries.map((summary: string, i: number) => (
              <MarkdownContent key={i} content={summary} />
            ))}
          </div>
        ) : (
          <p className="text-sm" style={{ color: "var(--color-muted)" }}>
            An AI-generated summary of this debate will appear here once the enrichment
            pipeline runs. Individual speaker contributions are shown below.
          </p>
        )}
      </div>

      {/* Speakers & contributions */}
      <div className="text-xs font-medium uppercase tracking-widest mb-5"
           style={{ color: "var(--color-muted)" }}>
        {speakers.length} contributor{speakers.length !== 1 ? "s" : ""}
      </div>

      <div className="space-y-6">
        {speakers.map((s: any, i: number) => (
          <Speaker key={i} speaker={s} />
        ))}
        {speakers.length === 0 && (
          <p style={{ color: "var(--color-muted)" }}>No speaker data available.</p>
        )}
      </div>
    </div>
  );
}

function Speaker({ speaker: s }: { speaker: any }) {
  const [expanded, setExpanded] = useState(false);
  const text = s.contributionsText ?? "";
  const truncLimit = 500;

  return (
    <div className="flex gap-4">
      {/* Avatar */}
      <div className="shrink-0 pt-0.5">
        {s.photoUrl ? (
          s.slug
            ? <Link to={`/members/${s.slug}`}>
                <img src={s.photoUrl} alt={s.name}
                     className="w-10 h-10 rounded-full object-cover"
                     style={{ border: "1px solid var(--color-border)" }} />
              </Link>
            : <img src={s.photoUrl} alt={s.name}
                   className="w-10 h-10 rounded-full object-cover"
                   style={{ border: "1px solid var(--color-border)" }} />
        ) : (
          <div className="w-10 h-10 rounded-full flex items-center justify-center font-serif text-sm"
               style={{ backgroundColor: "var(--color-surface)", color: "var(--color-muted)", border: "1px solid var(--color-border)" }}>
            {s.name?.[0] ?? "?"}
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        {/* Name + meta */}
        <div className="flex items-baseline gap-2 mb-1 flex-wrap">
          {s.slug ? (
            <Link to={`/members/${s.slug}`}
                  className="font-medium text-sm hover:underline"
                  style={{ color: "var(--color-accent)" }}>
              {s.name}
            </Link>
          ) : (
            <span className="font-medium text-sm">{s.name}</span>
          )}
          {s.party && <span className="text-xs" style={{ color: "var(--color-muted)" }}>{s.party}</span>}
          <span className="text-xs ml-auto shrink-0" style={{ color: "var(--color-muted)" }}>
            {s.speechCount} speech{s.speechCount !== 1 ? "es" : ""}
          </span>
        </div>

        {/* Per-speaker AI summary — renders markdown for richer output */}
        {s.summary && (
          <div className="mb-2 text-sm italic"
               style={{ borderLeft: "2px solid var(--color-gold)", paddingLeft: "0.75rem", color: "var(--color-muted)" }}>
            <MarkdownContent content={s.summary} />
          </div>
        )}

        {/* Contribution text */}
        {text && (
          <div className="text-sm leading-relaxed rounded-lg p-4"
               style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
            <p className="whitespace-pre-wrap">
              {text.length > truncLimit && !expanded ? text.slice(0, truncLimit) + "…" : text}
            </p>
            {text.length > truncLimit && (
              <button onClick={() => setExpanded(v => !v)}
                      className="mt-2 text-xs" style={{ color: "var(--color-accent)" }}>
                {expanded ? "Show less" : "Read more"}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
