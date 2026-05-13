import { db } from "~/lib/db.server";

export async function getHomeStats() {
  const [counts] = await db`
    SELECT
      (SELECT count(*) FROM sittings)::int                               AS sittings,
      (SELECT count(*) FROM members)::int                                AS members,
      (SELECT count(*) FROM bills WHERE sponsor_id IS NOT NULL)::int     AS bills,
      (SELECT count(*) FROM topics)::int                                 AS topics
  `;
  return counts;
}

export async function getTopMembersByHouse(house: string, limit = 8) {
  return db`
    SELECT m.id, m.name, m.slug, m.photo_url, m.party, m.house, m.constituency,
           coalesce(sum(ss.speech_count), 0)::int AS speeches
    FROM members m
    LEFT JOIN speakers sp ON sp.member_id = m.id
    LEFT JOIN sitting_speakers ss ON ss.speaker_id = sp.id
    WHERE m.house = ${house}
      AND m.parliament = '13th-parliament'
      AND coalesce(m.role, '') NOT ILIKE '%speaker%'
      AND coalesce(m.constituency, '') NOT ILIKE '%speaker%'
    GROUP BY m.id
    ORDER BY speeches DESC
    LIMIT ${limit}
  `;
}

export async function getRecentTabledBills(limit = 8) {
  // Bills with a known sponsor, ordered by most recently tabled
  return db`
    SELECT b.id, b.name, b.bill_number, b.year, b.sponsor,
           m.slug        AS sponsor_slug,
           min(bm.date)  AS tabled_date,
           array_agg(DISTINCT bm.stage)
             FILTER (WHERE bm.stage IS NOT NULL) AS stages
    FROM bills b
    JOIN bill_mentions bm ON bm.bill_id = b.id
    LEFT JOIN members m ON m.id = b.sponsor_id
    WHERE b.sponsor_id IS NOT NULL
    GROUP BY b.id, m.slug
    ORDER BY min(bm.date) DESC
    LIMIT ${limit}
  `;
}

export async function getRecentTopics(limit = 8) {
  return db`
    SELECT t.id, t.title, t.section_type, t.speech_count, s.date, s.house
    FROM topics t
    JOIN sittings s ON s.id = t.sitting_id
    WHERE t.section_type IN (
      SELECT unnest(ARRAY[
        'Questions And Statements', 'Statements', 'Statement',
        'Notice Of Motion', 'Notices Of Motion', 'Notices Of Motions',
        'Communication From The Chair', 'Communications From The Chair'
      ]::text[])
    )
    ORDER BY s.date DESC, t.speech_count DESC
    LIMIT ${limit}
  `;
}

export async function getRecentSittings(limit = 5) {
  return db`
    SELECT url, date, house, session_type
    FROM sittings
    ORDER BY date DESC
    LIMIT ${limit}
  `;
}
