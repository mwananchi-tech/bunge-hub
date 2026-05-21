import { Form, Link } from "react-router";

import { PageToolbar } from "~/components/PageToolbar";
import { Pagination } from "~/components/Pagination";
import { fromParam } from "~/lib/navigation";
import { countTopics, listTopics } from "~/lib/queries/topics.server";

import type { Route } from "./+types/topics._index";

const LIMIT = 40;

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const tab = (url.searchParams.get("tab") ?? "qs") as "qs" | "hearings";
  const q = url.searchParams.get("q") ?? undefined;
  const house = url.searchParams.get("house") ?? undefined;
  const page = Number(url.searchParams.get("page") ?? 1);
  const [rows, total] = await Promise.all([
    listTopics({ tab, q, house, page, limit: LIMIT }),
    countTopics({ tab, q, house }),
  ]);
  const hasMore = rows.length > LIMIT;
  const totalPages = Math.ceil(total / LIMIT);
  return {
    topics: rows.slice(0, LIMIT),
    tab,
    q,
    house,
    page,
    hasMore,
    totalPages,
    searchStr: url.searchParams.toString(),
  };
}

export function meta() {
  return [{ title: "Topics | Bunge Hub" }];
}

export default function TopicsIndex({ loaderData }: Route.ComponentProps) {
  const { topics, tab, q, house, page, hasMore, totalPages, searchStr } = loaderData;

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <div className="mb-8">
        <h1 className="font-serif text-3xl mb-1">Topics</h1>
        <p className="text-sm" style={{ color: "var(--color-muted)" }}>
          Questions, statements, and hearings · 13th Parliament
        </p>
      </div>

      <PageToolbar
        q={q}
        searchPlaceholder="Search topics…"
        hiddenParams={{ tab, house }}
        filterGroups={[
          {
            paramName: "tab",
            current: tab,
            pills: [
              { value: "qs", label: "Questions & Statements" },
              { value: "hearings", label: "Hearings" },
            ],
            preserveParams: { q, house },
          },
        ]}
        extraActions={
          <Form method="get">
            {q && <input type="hidden" name="q" value={q} />}
            {tab && <input type="hidden" name="tab" value={tab} />}
            <select
              name="house"
              defaultValue={house ?? ""}
              onChange={(e) => e.currentTarget.form?.requestSubmit()}
              className="px-3 py-1.5 text-sm rounded outline-none cursor-pointer"
              style={{
                border: "1px solid var(--color-border)",
                backgroundColor: "var(--color-surface)",
                color: house ? "var(--color-text)" : "var(--color-muted)",
              }}
            >
              <option value="">All houses</option>
              <option value="National Assembly">National Assembly</option>
              <option value="Senate">Senate</option>
            </select>
          </Form>
        }
      />

      {topics.length === 0 ? (
        <p style={{ color: "var(--color-muted)" }}>No topics found.</p>
      ) : (
        <div className="divide-y" style={{ borderColor: "var(--color-border)" }}>
          {topics.map((t: any) => (
            <Link
              key={t.id}
              to={`/topics/${t.id}${fromParam("/topics", searchStr)}`}
              className="flex items-start gap-4 py-4 group"
            >
              <div className="flex-1 min-w-0">
                <div
                  className="text-sm font-medium group-hover:underline"
                  style={{ color: "var(--color-accent)" }}
                >
                  {t.title}
                </div>
                <div
                  className="text-xs mt-0.5 flex items-center gap-2"
                  style={{ color: "var(--color-muted)" }}
                >
                  <span>{t.sectionType}</span>
                  <span>·</span>
                  <span>
                    {new Date(t.date).toLocaleDateString("en-KE", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                  <span>·</span>
                  <span>{t.house}</span>
                  {t.speakers > 0 && (
                    <>
                      <span>·</span>
                      <span>{t.speakers} speakers</span>
                    </>
                  )}
                </div>
              </div>
              <div className="shrink-0 text-right">
                <div className="text-sm font-semibold">{t.speechCount}</div>
                <div className="text-xs" style={{ color: "var(--color-muted)" }}>
                  speeches
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      <Pagination page={page} hasMore={hasMore} totalPages={totalPages} searchStr={searchStr} />
    </div>
  );
}
