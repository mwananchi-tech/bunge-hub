import { Form, Link } from "react-router";

interface FilterPill {
  value: string;
  label: string;
}

interface SortOption {
  value: string;
  label: string;
}

interface Props {
  /** Current search query */
  q?: string;
  searchPlaceholder?: string;
  /** Hidden params to carry through the search form */
  hiddenParams?: Record<string, string>;
  /** Pill-style filter groups (e.g. house, type) */
  filterGroups?: {
    paramName: string;
    current: string;
    pills: FilterPill[];
    /** Params to preserve when switching a filter */
    preserveParams?: Record<string, string | undefined>;
  }[];
  /** Dropdown sort selector */
  sort?: {
    current: string;
    options: SortOption[];
    paramName?: string;
  };
}

const inputStyle = {
  border: "1px solid var(--color-border)",
  backgroundColor: "var(--color-surface)",
  color: "var(--color-text)",
} as const;

const pillBase = {
  border: "1px solid var(--color-border)",
  fontSize: "0.8125rem",
} as const;

export function PageToolbar({
  q,
  searchPlaceholder = "Search…",
  hiddenParams = {},
  filterGroups = [],
  sort,
}: Props) {
  return (
    <div className="flex flex-wrap items-center gap-2 mb-8">

      {/* Search — carry sort + filter params so they survive a search */}
      <Form method="get" className="flex gap-2 flex-1 min-w-[180px] max-w-sm">
        {Object.entries(hiddenParams).map(([k, v]) =>
          v ? <input key={k} type="hidden" name={k} value={v} /> : null
        )}
        {/* Carry current sort so searching doesn't reset it */}
        {sort?.current && sort.current !== (sort.options[0]?.value ?? "") && (
          <input type="hidden" name={sort.paramName ?? "sort"} value={sort.current} />
        )}
        <input
          name="q"
          defaultValue={q}
          placeholder={searchPlaceholder}
          className="flex-1 px-3 py-1.5 text-sm rounded outline-none"
          style={inputStyle}
        />
        <button
          type="submit"
          className="px-3 py-1.5 text-sm rounded shrink-0"
          style={{ backgroundColor: "var(--color-accent)", color: "white" }}
        >
          Search
        </button>
      </Form>

      {/* Spacer */}
      <div className="flex-1 hidden sm:block" />

      {/* Filter pill groups */}
      {filterGroups.map(group => (
        <div key={group.paramName} className="flex gap-1">
          {group.pills.map(pill => {
            const active = group.current === pill.value;
            const params = new URLSearchParams({
              ...Object.fromEntries(
                Object.entries(group.preserveParams ?? {}).filter(([, v]) => v != null) as [string, string][]
              ),
              ...(pill.value ? { [group.paramName]: pill.value } : {}),
              ...(q ? { q } : {}),
            });
            return (
              <Link
                key={pill.value}
                to={`?${params}`}
                className="px-3 py-1.5 text-sm rounded whitespace-nowrap"
                style={{
                  ...pillBase,
                  backgroundColor: active ? "var(--color-accent)" : "var(--color-surface)",
                  color: active ? "white" : "var(--color-text)",
                }}
              >
                {pill.label}
              </Link>
            );
          })}
        </div>
      ))}

      {/* Sort dropdown — hiddenParams intentionally excluded to avoid conflict with select */}
      {sort && (
        <Form method="get">
          {q && <input type="hidden" name="q" value={q} />}
          {filterGroups.map(g =>
            g.current ? <input key={g.paramName} type="hidden" name={g.paramName} value={g.current} /> : null
          )}
          <select
            name={sort.paramName ?? "sort"}
            defaultValue={sort.current}
            onChange={e => e.currentTarget.form?.requestSubmit()}
            className="px-3 py-1.5 text-sm rounded outline-none cursor-pointer"
            style={inputStyle}
          >
            {sort.options.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </Form>
      )}

    </div>
  );
}
