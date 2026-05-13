import { db } from "~/lib/db.server";

export type BillSort = "recent" | "most-debated" | "most-speeches" | "name";

export async function listBills({
  q,
  sort = "recent",
  house,
  page = 1,
  limit = 40,
}: { q?: string; sort?: BillSort; house?: string; page?: number; limit?: number } = {}) {
  const offset = (page - 1) * limit;
  const searchFilter = q ? db`AND b.name ILIKE ${`%${q}%`}` : db``;
  const houseFilter  = house ? db`AND bm.house = ${house}` : db``;
  const orderBy =
    sort === "most-debated"  ? db`ORDER BY count(DISTINCT bm.sitting_id) DESC NULLS LAST, b.name` :
    sort === "most-speeches" ? db`ORDER BY sum(bm.speech_count) DESC NULLS LAST, b.name` :
    sort === "name"          ? db`ORDER BY b.name` :
                               db`ORDER BY max(bm.date) DESC NULLS LAST, b.name`;
  return db`
    SELECT b.id, b.name, b.bill_number, b.year, b.sponsor,
           count(DISTINCT bm.sitting_id)::int              AS sittings,
           sum(bm.speech_count)::int                       AS speeches,
           max(bm.date)                                    AS last_activity,
           array_agg(DISTINCT bm.stage)
             FILTER (WHERE bm.stage IS NOT NULL)           AS stages
    FROM bills b
    LEFT JOIN bill_mentions bm ON bm.bill_id = b.id
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
  const houseFilter  = house ? db`AND bm.house = ${house}` : db``;
  const [r] = await db`
    SELECT count(DISTINCT b.id)::int AS n
    FROM bills b
    LEFT JOIN bill_mentions bm ON bm.bill_id = b.id
    WHERE TRUE ${searchFilter} ${houseFilter}
  `;
  return r.n as number;
}

export async function getBill(id: string) {
  const [bill] = await db`
    SELECT b.*, m.slug AS sponsor_slug
    FROM bills b
    LEFT JOIN members m ON m.id = b.sponsor_id
    WHERE b.id = ${id}
  `;
  return bill ?? null;
}

export async function getBillJourney(billId: string) {
  return db`
    SELECT bm.id, bm.date, bm.house, bm.stage, bm.speech_count,
           bm.section_title, s.url AS sitting_url, s.session_type,
           json_agg(
             json_build_object(
               'name',     coalesce(m.name, sp.name),
               'slug',     m.slug,
               'photo',    m.photo_url,
               'party',    m.party,
               'speeches', bms.speech_count,
               'text',     bms.contributions_text,
               'summary',  bms.summary
             )
             ORDER BY bms.speech_count DESC
           ) AS speakers
    FROM bill_mentions bm
    JOIN sittings s ON s.id = bm.sitting_id
    JOIN bill_mention_speakers bms ON bms.bill_mention_id = bm.id
    JOIN speakers sp ON sp.id = bms.speaker_id
    LEFT JOIN members m ON m.id = sp.member_id
    WHERE bm.bill_id = ${billId}
    GROUP BY bm.id, s.url, s.session_type
    ORDER BY bm.date, bm.stage NULLS LAST
  `;
}
