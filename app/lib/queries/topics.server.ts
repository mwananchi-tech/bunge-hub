import { db } from "~/lib/db.server";

const QS_TYPES = [
  "Questions And Statements", "Statements", "Statement",
  "Notice Of Motion", "Notices Of Motion", "Notices Of Motions",
];
const HEARING_TYPES = ["Communication From The Chair", "Communications From The Chair"];

export async function listTopics({
  tab = "qs",
  q,
  page = 1,
  limit = 40,
}: { tab?: "qs" | "hearings"; q?: string; page?: number; limit?: number } = {}) {
  const types = tab === "hearings" ? HEARING_TYPES : QS_TYPES;
  const offset = (page - 1) * limit;
  const searchFilter = q ? db`AND t.title ILIKE ${`%${q}%`}` : db``;
  return db`
    SELECT t.id, t.title, t.section_type, t.speech_count,
           s.date, s.house,
           count(DISTINCT ts.speaker_id)::int AS speakers
    FROM topics t
    JOIN sittings s ON s.id = t.sitting_id
    LEFT JOIN topic_speakers ts ON ts.topic_id = t.id
    WHERE t.section_type IN (SELECT unnest(${types}::text[]))
    ${searchFilter}
    GROUP BY t.id, s.date, s.house
    ORDER BY s.date DESC
    LIMIT ${limit + 1} OFFSET ${offset}
  `;
}

export async function countTopics({
  tab = "qs",
  q,
}: { tab?: "qs" | "hearings"; q?: string } = {}) {
  const types = tab === "hearings" ? HEARING_TYPES : QS_TYPES;
  const searchFilter = q ? db`AND title ILIKE ${`%${q}%`}` : db``;
  const [r] = await db`
    SELECT count(*)::int AS n FROM topics
    WHERE section_type IN (SELECT unnest(${types}::text[]))
    ${searchFilter}
  `;
  return r.n as number;
}

export async function getTopic(id: string) {
  const [topic] = await db`
    SELECT t.*, s.date, s.house, s.session_type, s.url AS sitting_url
    FROM topics t
    JOIN sittings s ON s.id = t.sitting_id
    WHERE t.id = ${id}
  `;
  return topic ?? null;
}

export async function getTopicSpeakers(topicId: string) {
  return db`
    SELECT coalesce(m.name, sp.name) AS name,
           m.slug, m.photo_url, m.party, m.constituency,
           ts.speech_count, ts.contributions_text, ts.summary
    FROM topic_speakers ts
    JOIN speakers sp ON sp.id = ts.speaker_id
    LEFT JOIN members m ON m.id = sp.member_id
    WHERE ts.topic_id = ${topicId}
    ORDER BY ts.speech_count DESC
  `;
}
