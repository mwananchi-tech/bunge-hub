import { useEffect, useState } from "react";
import { useFetcher, useNavigate } from "react-router";

import {
  AppliedChip,
  FilterSheet,
  type FilterSheetGroup,
  type FilterValues,
  FiltersButton,
} from "~/components/FilterSheet";
import { NoVideoThumbnail } from "~/components/NoVideoThumbnail";
import { Pagination } from "~/components/Pagination";
import { PreviewChips, type PreviewItem } from "~/components/PreviewChips";
import { ButtonLink, buttonClasses } from "~/components/ui/Button";
import { countSittings, listSittings } from "~/lib/queries/sittings.server";
import { resolveSourceUrl, sourceHost } from "~/lib/source-urls";
import { youtubeThumbnail } from "~/lib/youtube";

import type { Route } from "./+types/sittings._index";

const LIMIT = 40;
const YEARS = [2026, 2025, 2024, 2023, 2022];

const GROUPS: FilterSheetGroup[] = [
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
    key: "year",
    label: "Year",
    defaultValue: "",
    options: [
      { value: "", label: "All" },
      ...YEARS.map((y) => ({ value: String(y), label: String(y) })),
    ],
  },
];

/** URL params for a set of filters, leaving out defaults so links stay short. */
function toParams(values: FilterValues) {
  const p = new URLSearchParams();
  if (values.house) p.set("house", values.house);
  if (values.year) p.set("year", values.year);
  return p;
}

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
    total,
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

function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString("en-KE", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
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
  const navigate = useNavigate();
  const applied: FilterValues = { house: house ?? "", year: year ? String(year) : "" };
  const [sheetOpen, setSheetOpen] = useState(false);
  const [draft, setDraft] = useState<FilterValues>(applied);

  // While the sheet is open, ask the server how many sittings the draft would show
  const preview = useFetcher<typeof loader>();
  const draftKey = toParams(draft).toString();
  useEffect(() => {
    if (sheetOpen) preview.load(`/sittings?index&${draftKey}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sheetOpen, draftKey]);
  const draftCount = preview.data && preview.state === "idle" ? preview.data.total : undefined;

  const activeChips = GROUPS.filter((g) => applied[g.key] !== g.defaultValue).map((g) => ({
    key: g.key,
    label: g.options.find((o) => o.value === applied[g.key])?.label ?? applied[g.key],
  }));

  return (
    <div className="page-frame py-12">
      <div className="mb-8">
        <h1 className="font-serif text-3xl mb-1">Sittings</h1>
        <p className="text-sm text-muted">13th Parliament</p>
      </div>

      {/* Only filters here: search lives in the header */}
      <div className="mb-8">
        <FiltersButton
          count={activeChips.length}
          onClick={() => {
            setDraft(applied);
            setSheetOpen(true);
          }}
        />
        {activeChips.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {activeChips.map((chip) => (
              <AppliedChip
                key={chip.key}
                label={chip.label}
                onRemove={() => navigate(`?${toParams({ ...applied, [chip.key]: "" })}`)}
              />
            ))}
          </div>
        )}
      </div>

      <FilterSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        groups={GROUPS}
        draft={draft}
        onChange={setDraft}
        onApply={() => {
          setSheetOpen(false);
          navigate(`?${toParams(draft)}`);
        }}
        applyLabel={
          draftCount === undefined
            ? "Show sittings"
            : `Show ${draftCount.toLocaleString()} sitting${draftCount !== 1 ? "s" : ""}`
        }
      />

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
