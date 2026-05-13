import { db } from "~/lib/db.server";

export type MemberSort = "name" | "most-active" | "least-active" | "most-sponsored";

export async function getCommitteesByHouse(house?: string) {
  const houseFilter = house ? db`AND m.house = ${house}` : db``;
  return db`
    SELECT normalize_committee(c) AS name, count(DISTINCT m.id)::int AS members
    FROM members m, jsonb_array_elements_text(m.committees) AS c
    WHERE m.parliament = '13th-parliament'
      AND m.committees IS NOT NULL
    ${houseFilter}
    GROUP BY normalize_committee(c)
    HAVING normalize_committee(c) <> ''
    ORDER BY members DESC, normalize_committee(c)
  `;
}

export async function listMembers({
  house,
  sort = "name",
  q,
  committee,
  page = 1,
  limit = 36,
}: { house?: string; sort?: MemberSort; q?: string; committee?: string; page?: number; limit?: number } = {}) {
  const offset = (page - 1) * limit;
  const houseFilter     = house ? db`AND m.house = ${house}` : db``;
  const searchFilter    = q ? db`AND m.name ILIKE ${`%${q}%`}` : db``;
  const committeeFilter = committee ? db`
    AND EXISTS (
      SELECT 1 FROM jsonb_array_elements_text(m.committees) AS c
      WHERE normalize_committee(c) = ${committee}
    )
  ` : db``;
  const orderBy =
    sort === "most-active"   ? db`ORDER BY total_speeches DESC NULLS LAST, m.name` :
    sort === "least-active"  ? db`ORDER BY total_speeches ASC  NULLS LAST, m.name` :
    sort === "most-sponsored" ? db`ORDER BY bills_sponsored DESC NULLS LAST, m.name` :
                                db`ORDER BY m.name`;

  return db`
    SELECT m.id, m.name, m.slug, m.photo_url, m.party, m.house, m.constituency,
           m.role, m.speeches_total, m.bills_total,
           coalesce(sum(ss.speech_count), 0)::int  AS total_speeches,
           count(DISTINCT b.id)::int               AS bills_sponsored
    FROM members m
    LEFT JOIN speakers sp ON sp.member_id = m.id
    LEFT JOIN sitting_speakers ss ON ss.speaker_id = sp.id
    LEFT JOIN bills b ON b.sponsor_id = m.id
    WHERE m.parliament = '13th-parliament'
    ${houseFilter}
    ${searchFilter}
    ${committeeFilter}
    GROUP BY m.id
    ${orderBy}
    LIMIT ${limit + 1} OFFSET ${offset}
  `;
}

export async function getMember(slug: string) {
  const [m] = await db`
    SELECT id, name, slug, photo_url, party, house, constituency,
           biography, positions, committees,
           speeches_total, bills_total, speeches_last_year
    FROM members
    WHERE slug = ${slug}
  `;
  return m ?? null;
}

export async function getMemberBills(
  memberId: string,
  page = 1,
  limit = 20,
) {
  const offset = (page - 1) * limit;
  return db`
    SELECT b.id, b.name, b.bill_number, b.year,
           count(DISTINCT bms.bill_mention_id)::int        AS segments,
           sum(bms.speech_count)::int                      AS speeches,
           array_agg(DISTINCT bm.stage)
             FILTER (WHERE bm.stage IS NOT NULL)           AS stages,
           min(bm.date)                                    AS first_seen,
           max(bm.date)                                    AS last_seen
    FROM bill_mention_speakers bms
    JOIN bill_mentions bm ON bm.id = bms.bill_mention_id
    JOIN bills b ON b.id = bm.bill_id
    JOIN speakers sp ON sp.id = bms.speaker_id
    WHERE sp.member_id = ${memberId}
    GROUP BY b.id
    ORDER BY last_seen DESC, speeches DESC
    LIMIT ${limit + 1} OFFSET ${offset}
  `;
}

export async function getMemberTopics(
  memberId: string,
  page = 1,
  limit = 30,
) {
  const offset = (page - 1) * limit;
  return db`
    SELECT t.id, t.title, t.section_type,
           ts.speech_count, ts.summary, s.date, s.house
    FROM topic_speakers ts
    JOIN topics t ON t.id = ts.topic_id
    JOIN sittings s ON s.id = t.sitting_id
    JOIN speakers sp ON sp.id = ts.speaker_id
    WHERE sp.member_id = ${memberId}
    ORDER BY s.date DESC
    LIMIT ${limit + 1} OFFSET ${offset}
  `;
}

export async function getMemberSponsoredBills(memberId: string) {
  return db`
    SELECT b.id, b.name, b.bill_number, b.year,
           count(DISTINCT bm.sitting_id)::int  AS sittings,
           array_agg(DISTINCT bm.stage)
             FILTER (WHERE bm.stage IS NOT NULL) AS stages,
           min(bm.date) AS first_seen,
           max(bm.date) AS last_seen
    FROM bills b
    LEFT JOIN bill_mentions bm ON bm.bill_id = b.id
    WHERE b.sponsor_id = ${memberId}
    GROUP BY b.id
    ORDER BY max(bm.date) DESC NULLS LAST, b.name
  `;
}

export async function getMemberBillCount(memberId: string) {
  const [r] = await db`
    SELECT count(DISTINCT b.id)::int AS count
    FROM bill_mention_speakers bms
    JOIN bill_mentions bm ON bm.id = bms.bill_mention_id
    JOIN bills b ON b.id = bm.bill_id
    JOIN speakers sp ON sp.id = bms.speaker_id
    WHERE sp.member_id = ${memberId}
  `;
  return r.count as number;
}

export async function getMemberTopicCount(memberId: string) {
  const [r] = await db`
    SELECT count(*)::int AS count
    FROM topic_speakers ts
    JOIN speakers sp ON sp.id = ts.speaker_id
    WHERE sp.member_id = ${memberId}
  `;
  return r.count as number;
}

export async function getMemberStats(memberId: string) {
  const [stats] = await db`
    SELECT
      count(DISTINCT ss.sitting_id)::int AS sittings_attended,
      sum(ss.speech_count)::int          AS total_speeches
    FROM sitting_speakers ss
    JOIN speakers sp ON sp.id = ss.speaker_id
    WHERE sp.member_id = ${memberId}
  `;
  return stats;
}
