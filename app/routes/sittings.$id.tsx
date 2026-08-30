import { useEffect, useState } from "react";
import { Link, data, redirect } from "react-router";

import { MarkdownContent } from "~/components/MarkdownContent";
import { MemberAvatar } from "~/components/MemberAvatar";
import { ModelBadge } from "~/components/ModelBadge";
import {
  getSittingById,
  getSpeakerMembers,
  resolveLegacySittingSuffix,
} from "~/lib/queries/sittings.server";
import { resolveSourceUrl, sourceHost } from "~/lib/source-urls";

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
  const speakerMap = await getSpeakerMembers(sitting.id);
  return { sitting, speakerMap };
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
  const { sitting: s, speakerMap } = loaderData;
  const transcript = s.rawJson as any;
  const sections = transcript?.sections ?? [];
  const summary = s.generatedSummary ?? s.summary;

  const externalUrl = resolveSourceUrl(s.sourceUrl, s.sourceBaseUrl);
  const pdfUrl = s.pdfUrl ? resolveSourceUrl(s.pdfUrl, s.sourceBaseUrl ?? externalUrl) : null;

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      {/* Header */}
      <div className="mb-10">
        <div className="text-sm mb-2" style={{ color: "var(--color-muted)" }}>
          <Link to="/sittings" className="hover:underline">
            Sittings
          </Link>{" "}
          /
        </div>
        <h1 className="font-serif text-3xl mb-1">
          {s.house} · {s.sessionType}
        </h1>
        <p className="text-base mb-5" style={{ color: "var(--color-muted)" }}>
          {new Date(s.date).toLocaleDateString("en-KE", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </p>

        <div className="flex flex-wrap gap-2 mb-6">
          <a
            href={externalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded"
            style={{
              border: "1px solid var(--color-border)",
              color: "var(--color-muted)",
              backgroundColor: "var(--color-surface)",
            }}
          >
            View on {sourceHost(externalUrl)} ↗
          </a>
          {pdfUrl && (
            <a
              href={pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded"
              style={{
                border: "1px solid var(--color-border)",
                color: "var(--color-muted)",
                backgroundColor: "var(--color-surface)",
              }}
            >
              Download PDF ↗
            </a>
          )}
        </div>

        {summary && (
          <div
            className="p-5 rounded-xl mb-6"
            style={{
              backgroundColor: "var(--color-surface)",
              border: "1px solid var(--color-border)",
            }}
          >
            <div
              className="text-xs font-medium uppercase tracking-widest mb-2"
              style={{ color: "var(--color-muted)" }}
            >
              Session Summary
            </div>
            <MarkdownContent content={summary} />
            {s.generatedSummary && <ModelBadge model={s.generatedSummaryModel} />}
          </div>
        )}

        {/* YouTube live stream / archived recording
            youtube_url is set manually or via a future enrichment step.
            Renders as an embedded player when available. */}
        {s.youtubeUrl ? (
          <div
            className="rounded-xl overflow-hidden mb-6"
            style={{ border: "1px solid var(--color-border)", aspectRatio: "16/9" }}
          >
            <iframe
              src={`https://www.youtube.com/embed/${youtubeId(s.youtubeUrl)}`}
              title="Parliamentary sitting recording"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full"
            />
          </div>
        ) : null}
      </div>

      {/* Transcript */}
      <div className="space-y-10">
        {sections.map((section: any, si: number) => (
          <SectionBlock key={si} section={section} speakerMap={speakerMap} />
        ))}
      </div>
    </div>
  );
}

export function subsectionId(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function youtubeId(url: string): string {
  try {
    const u = new URL(url);
    return u.searchParams.get("v") ?? u.pathname.split("/").pop() ?? "";
  } catch {
    return url;
  }
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
