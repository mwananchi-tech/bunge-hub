import { useState } from "react";
import { Link, data } from "react-router";
import { MarkdownContent } from "~/components/MarkdownContent";
import type { Route } from "./+types/sittings.$slug";
import { getSittingBySlug, getSpeakerSlugs } from "~/lib/queries/sittings.server";

export async function loader({ params }: Route.LoaderArgs) {
  const sitting = await getSittingBySlug(decodeURIComponent(params.slug!));
  if (!sitting) throw data("Sitting not found", { status: 404 });
  const speakerMap = await getSpeakerSlugs(sitting.url);
  return { sitting, speakerMap };
}

export function meta({ data }: Route.MetaArgs) {
  const s = data?.sitting;
  return [{
    title: s
      ? `${s.house} · ${new Date(s.date).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })} | Bunge Hub`
      : "Sitting | Bunge Hub",
  }];
}

export default function SittingDetail({ loaderData }: Route.ComponentProps) {
  const { sitting: s, speakerMap } = loaderData;
  const transcript = s.rawJson as any;
  const sections = transcript?.sections ?? [];

  const externalUrl = s.url.startsWith("http") ? s.url : `https://mzalendo.com${s.url}`;
  const pdfUrl = s.pdfUrl ? (s.pdfUrl.startsWith("http") ? s.pdfUrl : `https://mzalendo.com${s.pdfUrl}`) : null;

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      {/* Header */}
      <div className="mb-10">
        <div className="text-sm mb-2" style={{ color: "var(--color-muted)" }}>
          <Link to="/sittings" className="hover:underline">Sittings</Link> /
        </div>
        <h1 className="font-serif text-3xl mb-1">{s.house} · {s.sessionType}</h1>
        <p className="text-base mb-5" style={{ color: "var(--color-muted)" }}>
          {new Date(s.date).toLocaleDateString("en-KE", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </p>

        <div className="flex flex-wrap gap-2 mb-6">
          <a href={externalUrl} target="_blank" rel="noopener noreferrer"
             className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded"
             style={{ border: "1px solid var(--color-border)", color: "var(--color-muted)", backgroundColor: "var(--color-surface)" }}>
            View on mzalendo.com ↗
          </a>
          {pdfUrl && (
            <a href={pdfUrl} target="_blank" rel="noopener noreferrer"
               className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded"
               style={{ border: "1px solid var(--color-border)", color: "var(--color-muted)", backgroundColor: "var(--color-surface)" }}>
              Download PDF ↗
            </a>
          )}
        </div>

        {s.summary && (
          <div className="p-5 rounded-xl mb-6"
               style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
            <div className="text-xs font-medium uppercase tracking-widest mb-2"
                 style={{ color: "var(--color-muted)" }}>
              Session Summary
            </div>
            <MarkdownContent content={s.summary} />
          </div>
        )}

        {/* YouTube live stream / archived recording
            youtube_url is set manually or via a future enrichment step.
            Renders as an embedded player when available. */}
        {s.youtubeUrl ? (
          <div className="rounded-xl overflow-hidden mb-6"
               style={{ border: "1px solid var(--color-border)", aspectRatio: "16/9" }}>
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
    (section.contributions?.length ?? 0) > 0 ||
    (section.subsections?.length ?? 0) > 0;

  if (!hasContent && !section.sectionType) return null;

  return (
    <div>
      {section.sectionType && (
        <button
          onClick={() => setOpen(v => !v)}
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

function SubsectionBlock({ subsection, speakerMap }: { subsection: any; speakerMap: Record<string, any> }) {
  const count = subsection.contributions?.length ?? 0;
  // Open by default; only collapse large subsections (> 20 contributions)
  const [open, setOpen] = useState(count <= 20);

  if (!subsection.title && count === 0) return null;

  return (
    <div className="pl-4" style={{ borderLeft: "2px solid var(--color-border)" }}>
      {subsection.title && (
        <button
          onClick={() => setOpen(v => !v)}
          className="w-full text-left flex items-center justify-between gap-2 mb-4"
        >
          <span className="font-medium text-base">{subsection.title}</span>
          <span className="text-xs shrink-0 ml-2" style={{ color: "var(--color-muted)" }}>
            {count} contribution{count !== 1 ? "s" : ""} {open ? "↑" : "↓"}
          </span>
        </button>
      )}
      {open && <ContributionList contributions={subsection.contributions ?? []} speakerMap={speakerMap} />}
    </div>
  );
}

function ContributionList({ contributions, speakerMap }: { contributions: any[]; speakerMap: Record<string, any> }) {
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
  const member = c.speakerUrl ? speakerMap[c.speakerUrl] : null;
  const content = c.content ?? "";
  const truncLimit = 400;
  const needsTrunc = content.length > truncLimit;

  return (
    <div className="flex gap-3">
      {/* Avatar */}
      <div className="shrink-0 pt-0.5">
        {member?.photo ? (
          <Link to={`/members/${member.slug}`}>
            <img src={member.photo} alt={member.name}
                 className="w-9 h-9 rounded-full object-cover"
                 style={{ border: "1px solid var(--color-border)" }} />
          </Link>
        ) : (
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-serif font-medium"
               style={{ backgroundColor: "var(--color-surface)", color: "var(--color-muted)", border: "1px solid var(--color-border)" }}>
            {(c.speakerName ?? "?")[0]}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Speaker name + role */}
        <div className="flex items-baseline gap-2 mb-1.5 flex-wrap">
          {member?.slug ? (
            <Link to={`/members/${member.slug}`}
                  className="font-medium text-sm hover:underline"
                  style={{ color: "var(--color-accent)" }}>
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
            <span className="text-xs px-1.5 py-0.5 rounded"
                  style={{ backgroundColor: "var(--color-surface)", color: "var(--color-muted)", border: "1px solid var(--color-border)" }}>
              {member.party}
            </span>
          )}
        </div>

        {/* Speech */}
        <p className="text-sm leading-relaxed whitespace-pre-wrap">
          {needsTrunc && !expanded ? content.slice(0, truncLimit) + "…" : content}
        </p>
        {needsTrunc && (
          <button onClick={() => setExpanded(v => !v)}
                  className="mt-1 text-xs" style={{ color: "var(--color-accent)" }}>
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
