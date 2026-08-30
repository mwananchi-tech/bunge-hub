import { db } from "~/lib/db.server";

export type BillSort = "recent" | "most-debated" | "most-speeches" | "name";

export type Bill = {
  id: string;
  name: string;
  billNumber: string | null;
  year: number | null;
  sponsor: string | null;
  sponsorId: string | null;
  summary: string | null;
  summaryModel: string | null;
};

export type BillJourneySpeaker = {
  name: string;
  memberId: string | null;
  photo: string | null;
  party: string | null;
  speeches: number;
  text: string | null;
  summary: string | null;
  summaryModel: string | null;
};

export type BillJourneyItem = {
  id: string;
  date: string;
  house: string;
  stage: string | null;
  speechCount: number;
  sectionTitle: string;
  nodeSummary: string | null;
  nodeSummaryModel: string | null;
  sittingId: string;
  sittingUrl: string;
  sittingSourceBaseUrl: string | null;
  sessionType: string;
  speakers: BillJourneySpeaker[];
};

export async function listBills({
  q,
  sort = "recent",
  house,
  page = 1,
  limit = 40,
}: { q?: string; sort?: BillSort; house?: string; page?: number; limit?: number } = {}) {
  const offset = (page - 1) * limit;
  const searchFilter = q ? db`AND b.name ILIKE ${`%${q}%`}` : db``;
  const houseFilter = house ? db`AND bm.house = ${house}` : db``;
  const orderBy =
    sort === "most-debated"
      ? db`ORDER BY count(DISTINCT bm.sitting_id) DESC NULLS LAST, b.name`
      : sort === "most-speeches"
        ? db`ORDER BY sum(bm.speech_count) DESC NULLS LAST, b.name`
        : sort === "name"
          ? db`ORDER BY b.name`
          : db`ORDER BY max(bm.date) DESC NULLS LAST, b.name`;
  return db`
    SELECT b.id, b.name, b.bill_number, b.year, b.sponsor,
           count(DISTINCT bm.sitting_id)::int              AS sittings,
           sum(bm.speech_count)::int                       AS speeches,
           max(bm.date)                                    AS last_activity,
           array_agg(DISTINCT bm.stage)
             FILTER (WHERE bm.stage IS NOT NULL)           AS stages
    FROM bills b
    LEFT JOIN bill_mentions bm ON bm.bill_id = b.id AND bm.active
    WHERE TRUE
    ${searchFilter}
    ${houseFilter}
    GROUP BY b.id
    ${orderBy}
    LIMIT ${limit + 1} OFFSET ${offset}
  `;
}

export async function countBills({ q, house }: { q?: string; house?: string } = {}) {
  const searchFilter = q ? db`AND b.name ILIKE ${`%${q}%`}` : db``;
  const houseFilter = house ? db`AND bm.house = ${house}` : db``;
  const [r] = await db`
    SELECT count(DISTINCT b.id)::int AS n
    FROM bills b
    LEFT JOIN bill_mentions bm ON bm.bill_id = b.id AND bm.active
    WHERE TRUE ${searchFilter} ${houseFilter}
  `;
  return r.n as number;
}

export async function getBill(id: string) {
  const [bill] = await db<Bill[]>`
    SELECT b.*, m.id AS sponsor_id
    FROM bills b
    LEFT JOIN members m ON m.id = b.sponsor_id
    WHERE b.id = ${id}
  `;
  return bill ?? null;
}

export async function getBillJourney(billId: string) {
  // The subquery pre-aggregates bill_mention_speakers by effective name before
  // json_agg to avoid inflated speaker counts. Without it, a member with multiple
  // speaker rows (name variants) appears multiple times in the speakers list.
  // string_agg concatenates all contribution text across variants; max() picks the
  // best available summary where one exists.
  return db<BillJourneyItem[]>`
    SELECT bm.id, bm.date, bm.house, bm.stage, bm.speech_count,
           bm.section_title, bm.summary AS node_summary, bm.summary_model AS node_summary_model,
           s.id AS sitting_id, coalesce(source.source_url, s.url) AS sitting_url,
           source.base_url AS sitting_source_base_url, s.session_type,
           json_agg(
             json_build_object(
               'name',     spk.name,
                'memberId', spk.member_id,
               'photo',    spk.photo,
               'party',    spk.party,
               'speeches', spk.speeches,
               'text',     spk.text,
               'summary',  spk.summary,
               'summaryModel', spk.summary_model
             )
             ORDER BY spk.speeches DESC
           ) AS speakers
    FROM bill_mentions bm
    JOIN sittings s ON s.id = bm.sitting_id
    LEFT JOIN LATERAL (
      SELECT ss.source_url, ds.base_url
      FROM sitting_sources ss
      JOIN data_sources ds ON ds.id = ss.data_source_id
      WHERE ss.sitting_id = s.id
      ORDER BY (ss.source_url = s.url) DESC, ss.last_seen_at DESC, ss.id
      LIMIT 1
    ) source ON TRUE
    JOIN (
      SELECT bms.bill_mention_id,
             coalesce(m.name, sp.name)              AS name,
              m.id                                   AS member_id,
             m.photo_url                            AS photo,
             m.party,
             sum(bms.speech_count)::int             AS speeches,
             string_agg(bms.contributions_text, E'\n\n') AS text,
             max(bms.summary)                       AS summary,
             max(bms.summary_model)                 AS summary_model
      FROM bill_mention_speakers bms
      JOIN speakers sp ON sp.id = bms.speaker_id
      LEFT JOIN members m ON m.id = sp.member_id
      WHERE bms.active
      GROUP BY bms.bill_mention_id, coalesce(m.name, sp.name), m.id, m.photo_url, m.party
    ) spk ON spk.bill_mention_id = bm.id
    WHERE bm.bill_id = ${billId} AND bm.active
    GROUP BY bm.id, s.id, s.url, source.source_url, source.base_url, s.session_type
    ORDER BY bm.date, bm.stage NULLS LAST
  `;
}
