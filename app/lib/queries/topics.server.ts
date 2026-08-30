import { db } from "~/lib/db.server";

const QS_TYPES = [
  "Questions And Statements",
  "Statements",
  "Statement",
  "Notice Of Motion",
  "Notices Of Motion",
  "Notices Of Motions",
];
const HEARING_TYPES = ["Communication From The Chair", "Communications From The Chair"];

const ALL_TYPES = [...QS_TYPES, ...HEARING_TYPES];

export async function listTopics({
  tab = "qs",
  q,
  house,
  sort = "recent",
  page = 1,
  limit = 40,
}: {
  tab?: "qs" | "hearings" | "";
  q?: string;
  house?: string;
  sort?: "recent" | "most-speeches";
  page?: number;
  limit?: number;
} = {}) {
  const types = tab === "hearings" ? HEARING_TYPES : tab === "" ? ALL_TYPES : QS_TYPES;
  const offset = (page - 1) * limit;
  const searchFilter = q ? db`AND t.title ILIKE ${`%${q}%`}` : db``;
  const houseFilter = house ? db`AND s.house = ${house}` : db``;
  const orderBy =
    sort === "most-speeches" ? db`ORDER BY t.speech_count DESC` : db`ORDER BY s.date DESC`;
  return db`
    SELECT t.id, t.title, t.section_type, t.speech_count,
           s.date, s.house,
           count(DISTINCT ts.speaker_id)::int AS speakers
    FROM topics t
    JOIN sittings s ON s.id = t.sitting_id
     LEFT JOIN topic_speakers ts ON ts.topic_id = t.id AND ts.active
     WHERE t.section_type IN (SELECT unnest(${types}::text[]))
     AND t.active
    ${searchFilter}
    ${houseFilter}
    GROUP BY t.id, s.date, s.house
    ${orderBy}
    LIMIT ${limit + 1} OFFSET ${offset}
  `;
}

export async function countTopics({
  tab = "qs",
  q,
  house,
}: { tab?: "qs" | "hearings" | ""; q?: string; house?: string } = {}) {
  const types = tab === "hearings" ? HEARING_TYPES : tab === "" ? ALL_TYPES : QS_TYPES;
  const searchFilter = q ? db`AND t.title ILIKE ${`%${q}%`}` : db``;
  const houseFilter = house ? db`AND s.house = ${house}` : db``;
  const [r] = await db`
    SELECT count(*)::int AS n
    FROM topics t
    JOIN sittings s ON s.id = t.sitting_id
    WHERE t.section_type IN (SELECT unnest(${types}::text[]))
    AND t.active
    ${searchFilter}
    ${houseFilter}
  `;
  return r.n as number;
}

export async function getTopic(id: string) {
  const [topic] = await db`
    SELECT t.*, s.id AS sitting_id, s.date, s.house, s.session_type,
           coalesce(source.source_url, s.url) AS sitting_url
    FROM topics t
    JOIN sittings s ON s.id = t.sitting_id
    LEFT JOIN LATERAL (
      SELECT ss.source_url
      FROM sitting_sources ss
      WHERE ss.sitting_id = s.id
      ORDER BY (ss.source_url = s.url) DESC, ss.last_seen_at DESC, ss.id
      LIMIT 1
    ) source ON TRUE
    WHERE t.id = ${id} AND t.active
  `;
  return topic ?? null;
}

export async function getTopicSpeakers(topicId: string) {
  return db`
    SELECT coalesce(m.name, sp.name)              AS name,
           m.id AS member_id, m.photo_url, m.party, m.constituency,
           sum(ts.speech_count)::int              AS speech_count,
           string_agg(ts.contributions_text, E'\n\n') AS contributions_text,
           max(ts.summary)                        AS summary,
           max(ts.summary_model)                  AS summary_model
    FROM topic_speakers ts
    JOIN topics t ON t.id = ts.topic_id AND t.active
    JOIN speakers sp ON sp.id = ts.speaker_id
    LEFT JOIN members m ON m.id = sp.member_id
    WHERE ts.topic_id = ${topicId} AND ts.active
    GROUP BY coalesce(m.name, sp.name), m.id, m.photo_url, m.party, m.constituency
    ORDER BY sum(ts.speech_count) DESC
  `;
}
