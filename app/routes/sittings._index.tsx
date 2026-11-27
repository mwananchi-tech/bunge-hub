import { Form } from "react-router";

import { NoVideoThumbnail } from "~/components/NoVideoThumbnail";
import { Pagination } from "~/components/Pagination";
import { PreviewChips, type PreviewItem } from "~/components/PreviewChips";
import { Button, ButtonLink, buttonClasses } from "~/components/ui/Button";
import { countSittings, listSittings } from "~/lib/queries/sittings.server";
import { resolveSourceUrl, sourceHost } from "~/lib/source-urls";
import { youtubeThumbnail } from "~/lib/youtube";

import type { Route } from "./+types/sittings._index";

const LIMIT = 40;
const YEARS = [2026, 2025, 2024, 2023, 2022];

type SittingListItem = {
  id: string;
  url: string;
  sourceUrl: string;
  sourceBaseUrl?: string;
  date: string | Date;
  house: string;
  sessionType: string;
  summary?: string;
  pdfUrl?: string;
  youtubeUrl?: string | null;
  billPreviews: PreviewItem[];
  billPreviewTotal: number;
  topicPreviews: PreviewItem[];
  topicPreviewTotal: number;
};

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const house = url.searchParams.get("house") ?? undefined;
  const year = url.searchParams.get("year") ? Number(url.searchParams.get("year")) : undefined;
  const page = Number(url.searchParams.get("page") ?? 1);

  const [rows, total] = await Promise.all([
    listSittings({ house, year, page, limit: LIMIT }),
    countSittings({ house, year }),
  ]);

  const hasMore = rows.length > LIMIT;
  const totalPages = Math.ceil(total / LIMIT);
  return {
    sittings: rows.slice(0, LIMIT),
    house,
    year,
    page,
    hasMore,
    totalPages,
    searchStr: url.searchParams.toString(),
  };
}

export function meta() {
  const description =
    "Browse all parliamentary sittings from Kenya's 13th Parliament. Full Hansard transcripts with bills debated, speakers, and AI-generated summaries.";
  return [
    { title: "Sittings | Bunge Hub" },
    { name: "description", content: description },
    { property: "og:title", content: "Sittings | Bunge Hub" },
    { property: "og:description", content: description },
    { property: "og:type", content: "website" },
    { property: "og:url", content: "https://bunge-hub.mwananchi.tech/sittings" },
  ];
}

const HOUSES = [
  { value: "", label: "All" },
  { value: "National Assembly", label: "National Assembly" },
  { value: "Senate", label: "Senate" },
];

function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString("en-KE", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function FilterRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
      <span className="w-12 text-xs font-medium uppercase tracking-widest text-muted">{label}</span>
      <div className="flex flex-wrap gap-1">{children}</div>
    </div>
  );
}

function SittingThumbnail({ s }: { s: SittingListItem }) {
  if (s.youtubeUrl) {
    return (
      <a
        href={s.youtubeUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Watch the ${s.house} sitting of ${formatDate(s.date)} on YouTube`}
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
    );
  }

  return (
    <div>
      <NoVideoThumbnail className="rounded-lg" />
      <p className="mt-2 text-xs text-muted">No video yet.</p>
    </div>
  );
}

export default function SittingsIndex({ loaderData }: Route.ComponentProps) {
  const { sittings, house, year, page, hasMore, totalPages, searchStr } = loaderData;

  function yearUrl(y: number | undefined) {
    const p = new URLSearchParams();
    if (house) p.set("house", house);
    if (y) p.set("year", String(y));
    return `?${p}`;
  }

  return (
    <div className="page-frame py-12">
      <div className="mb-8">
        <h1 className="font-serif text-3xl mb-1">Sittings</h1>
        <p className="text-sm text-muted">13th Parliament</p>
      </div>

      {/* Filters: house on top, year below */}
      <div className="mb-8 grid gap-3">
        <FilterRow label="House">
          <Form method="get" className="contents">
            {year && <input type="hidden" name="year" value={year} />}
            {HOUSES.map((h) => {
              const active = (house ?? "") === h.value;
              return (
                <Button
                  key={h.value}
                  name="house"
                  value={h.value}
                  type="submit"
                  variant={active ? "filled" : "outlined"}
                  aria-pressed={active}
                >
                  {h.label}
                </Button>
              );
            })}
          </Form>
        </FilterRow>
        <FilterRow label="Year">
          <ButtonLink
            to={yearUrl(undefined)}
            variant={!year ? "filled" : "outlined"}
            aria-current={!year ? "page" : undefined}
          >
            All
          </ButtonLink>
          {YEARS.map((y) => (
            <ButtonLink
              key={y}
              to={yearUrl(y)}
              variant={year === y ? "filled" : "outlined"}
              aria-current={year === y ? "page" : undefined}
              className="tabular-nums"
            >
              {y}
            </ButtonLink>
          ))}
        </FilterRow>
      </div>

      <div className="divide-y divide-border">
        {sittings.length === 0 && (
          <p className="py-10 text-center text-sm text-muted">No sittings found.</p>
        )}
        {(sittings as SittingListItem[]).map((s) => {
          const sourceUrl = resolveSourceUrl(s.sourceUrl, s.sourceBaseUrl);
          return (
            <article
              key={s.id}
              className="grid grid-cols-[minmax(0,1fr)] gap-4 py-6 md:grid-cols-[280px_minmax(0,1fr)] md:gap-6"
            >
              <SittingThumbnail s={s} />

              <div className="min-w-0">
                <h2 className="font-serif text-[22px] font-semibold leading-tight">
                  <span
                    aria-hidden="true"
                    className={`mr-2 inline-block h-2 w-2 -translate-y-0.5 rounded-full align-middle ${
                      s.house === "Senate" ? "bg-secondary" : "bg-accent"
                    }`}
                  />
                  {s.house}
                  {s.sessionType && (
                    <span className="font-medium text-muted"> · {s.sessionType}</span>
                  )}
                </h2>
                <p className="mt-1 mb-3 text-sm text-muted">{formatDate(s.date)}</p>

                {s.summary && (
                  <p className="mb-3 max-w-2xl text-xs leading-relaxed text-muted line-clamp-2">
                    {s.summary}
                  </p>
                )}

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
                    state={{ fromSittingsList: true }}
                    variant={s.youtubeUrl ? "outlined" : "filled"}
                    size="sm"
                  >
                    View transcript
                  </ButtonLink>
                  <a
                    href={sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={buttonClasses({ variant: "text", size: "sm" })}
                  >
                    {sourceHost(sourceUrl)} ↗
                  </a>
                  {s.pdfUrl && (
                    <a
                      href={resolveSourceUrl(s.pdfUrl, s.sourceBaseUrl ?? s.sourceUrl)}
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
          );
        })}
      </div>

      <Pagination page={page} hasMore={hasMore} totalPages={totalPages} searchStr={searchStr} />
    </div>
  );
}
