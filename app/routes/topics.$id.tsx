import { useState } from "react";
import { Link, data } from "react-router";

import { MarkdownContent } from "~/components/MarkdownContent";
import { ModelBadge } from "~/components/ModelBadge";
import { getFromParam } from "~/lib/navigation";
import { getTopic, getTopicSpeakers } from "~/lib/queries/topics.server";

import type { Route } from "./+types/topics.$id";

export async function loader({ params, request }: Route.LoaderArgs) {
  const topic = await getTopic(params.id!);
  if (!topic) throw data("Topic not found", { status: 404 });
  const speakers = await getTopicSpeakers(params.id!);
  const from = getFromParam(new URL(request.url), "/topics");
  return { topic, speakers, from };
}

export function meta({ data }: Route.MetaArgs) {
  return [{ title: `${data?.topic?.title ?? "Topic"} | Bunge Hub` }];
}

function sittingSlugFromUrl(url: string) {
  return url?.split("/").filter(Boolean).pop() ?? "";
}

function subsectionAnchor(title: string) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

const INITIAL = 8;
const BATCH = 8;

export default function TopicDetail({ loaderData }: Route.ComponentProps) {
  const { topic: t, speakers, from } = loaderData;
  const [shownCount, setShownCount] = useState(INITIAL);

  const sittingSlug = sittingSlugFromUrl(t.sittingUrl ?? "");
  const transcriptUrl = sittingSlug
    ? `/sittings/${sittingSlug}#${subsectionAnchor(t.title)}`
    : null;
  const externalUrl = t.sittingUrl?.startsWith("http")
    ? t.sittingUrl
    : `https://mzalendo.com${t.sittingUrl}`;

  const speakerSummaries = speakers.filter((s: any) => s.summary);
  const hasTopicSummary = !!t.summary;
  const hasSummaries = hasTopicSummary || speakerSummaries.length > 0;

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      {/* Header */}
      <div className="mb-8">
        <div className="text-sm mb-2" style={{ color: "var(--color-muted)" }}>
          <Link to={from} className="hover:underline">
            Topics
          </Link>
          {" / "}
          <span>{t.sectionType}</span>
        </div>
        <h1 className="font-serif text-3xl mb-3 leading-snug">{t.title}</h1>
        <div
          className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm mb-5"
          style={{ color: "var(--color-muted)" }}
        >
          <span>
            {new Date(t.date).toLocaleDateString("en-KE", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </span>
          <span>·</span>
          <span>{t.house}</span>
          <span>·</span>
          <span>{t.sessionType}</span>
          <span>·</span>
          <span>{t.speechCount} speeches</span>
        </div>

        <div className="flex flex-wrap gap-2">
          {transcriptUrl && (
            <Link
              to={transcriptUrl}
              className="text-xs px-3 py-1.5 rounded font-medium"
              style={{ backgroundColor: "var(--color-accent)", color: "white" }}
            >
              Jump to transcript
            </Link>
          )}
          {t.sittingUrl && (
            <a
              href={externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs px-3 py-1.5 rounded"
              style={{
                border: "1px solid var(--color-border)",
                color: "var(--color-muted)",
                backgroundColor: "var(--color-surface)",
              }}
            >
              mzalendo.com ↗
            </a>
          )}
        </div>
      </div>

      {/* AI summary */}
      <div
        className="mb-8 p-5 rounded-xl"
        style={{ border: "1px solid var(--color-border)", backgroundColor: "var(--color-surface)" }}
      >
        <div className="flex items-center justify-between mb-2">
          <div
            className="text-xs font-medium uppercase tracking-widest"
            style={{ color: "var(--color-muted)" }}
          >
            Summary
          </div>
          {!hasSummaries && (
            <span
              className="text-xs px-2 py-0.5 rounded"
              style={{
                backgroundColor: "var(--color-gold)22",
                color: "var(--color-gold)",
                border: "1px solid var(--color-gold)44",
              }}
            >
              AI enrichment pending
            </span>
          )}
        </div>
        {hasTopicSummary ? (
          <>
            <MarkdownContent content={t.summary} />
            <ModelBadge model={t.summaryModel} />
          </>
        ) : hasSummaries ? (
          <div className="space-y-3">
            {speakerSummaries.map((s: any, i: number) => (
              <div key={i}>
                <MarkdownContent content={s.summary} />
                <ModelBadge model={s.summaryModel} />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm" style={{ color: "var(--color-muted)" }}>
            An AI-generated summary will appear here once the enrichment pipeline runs.
          </p>
        )}
      </div>

      {/* Speakers — lightweight list, no contribution text */}
      <div
        className="text-xs font-medium uppercase tracking-widest mb-4"
        style={{ color: "var(--color-muted)" }}
      >
        {speakers.length} contributor{speakers.length !== 1 ? "s" : ""}
      </div>

      <div className="divide-y" style={{ borderColor: "var(--color-border)" }}>
        {speakers.slice(0, shownCount).map((s: any, i: number) => (
          <div key={i} className="flex items-center gap-3 py-3">
            {s.photoUrl ? (
              s.slug ? (
                <Link to={`/members/${s.slug}`}>
                  <img
                    loading="lazy"
                    decoding="async"
                    src={s.photoUrl}
                    alt={s.name}
                    className="w-8 h-8 rounded-full object-cover shrink-0"
                    style={{ border: "1px solid var(--color-border)" }}
                  />
                </Link>
              ) : (
                <img
                  loading="lazy"
                  decoding="async"
                  src={s.photoUrl}
                  alt={s.name}
                  className="w-8 h-8 rounded-full object-cover shrink-0"
                  style={{ border: "1px solid var(--color-border)" }}
                />
              )
            ) : (
              <div
                className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center font-serif text-xs"
                style={{
                  backgroundColor: "var(--color-surface)",
                  color: "var(--color-muted)",
                  border: "1px solid var(--color-border)",
                }}
              >
                {s.name?.[0] ?? "?"}
              </div>
            )}
            <div className="flex-1 min-w-0">
              {s.slug ? (
                <Link
                  to={`/members/${s.slug}`}
                  className="text-sm font-medium hover:underline"
                  style={{ color: "var(--color-accent)" }}
                >
                  {s.name}
                </Link>
              ) : (
                <span className="text-sm font-medium">{s.name}</span>
              )}
              {s.party && (
                <span className="text-xs ml-2" style={{ color: "var(--color-muted)" }}>
                  {s.party}
                </span>
              )}
            </div>
            <div className="shrink-0 text-right">
              <span className="text-xs tabular-nums" style={{ color: "var(--color-muted)" }}>
                {s.speechCount} speech{s.speechCount !== 1 ? "es" : ""}
              </span>
            </div>
          </div>
        ))}
        {speakers.length === 0 && (
          <p className="py-6 text-sm" style={{ color: "var(--color-muted)" }}>
            No speaker data available.
          </p>
        )}
      </div>
      {shownCount < speakers.length && (
        <button
          onClick={() => setShownCount((c) => c + BATCH)}
          className="text-xs w-full mt-2 py-1.5 rounded transition-colors"
          style={{
            border: "1px solid var(--color-border)",
            color: "var(--color-muted)",
            backgroundColor: "var(--color-surface)",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-accent)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-muted)")}
        >
          + {Math.min(BATCH, speakers.length - shownCount)} more contributors
        </button>
      )}

      {/* Jump to transcript CTA */}
      {transcriptUrl && (
        <div
          className="mt-8 pt-6 text-center"
          style={{ borderTop: "1px solid var(--color-border)" }}
        >
          <Link
            to={transcriptUrl}
            className="text-sm font-medium hover:underline"
            style={{ color: "var(--color-accent)" }}
          >
            Read the full debate in the sitting transcript →
          </Link>
        </div>
      )}
    </div>
  );
}
