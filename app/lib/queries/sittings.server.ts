import { db } from "~/lib/db.server";

export async function countSittings({ house, year }: { house?: string; year?: number } = {}) {
  const houseFilter = house ? db`AND house = ${house}` : db``;
  const yearFilter = year ? db`AND EXTRACT(YEAR FROM date) = ${year}` : db``;
  const [r] =
    await db`SELECT count(*)::int AS n FROM sittings WHERE TRUE ${houseFilter} ${yearFilter}`;
  return r.n as number;
}

export async function listSittings({
  house,
  year,
  page = 1,
  limit = 40,
}: { house?: string; year?: number; page?: number; limit?: number } = {}) {
  const offset = (page - 1) * limit;
  const houseFilter = house ? db`AND s.house = ${house}` : db``;
  const yearFilter = year ? db`AND EXTRACT(YEAR FROM s.date) = ${year}` : db``;
  return db`
    SELECT s.id, s.url, s.date, s.house, s.session_type,
           coalesce(s.generated_summary, s.summary) AS summary, s.pdf_url,
           coalesce(source.source_url, s.url) AS source_url,
           source.base_url AS source_base_url,
           coalesce(bill_previews.items, '[]'::json) AS bill_previews,
           coalesce(bill_previews.total, 0)::int AS bill_preview_total,
           coalesce(topic_previews.items, '[]'::json) AS topic_previews,
           coalesce(topic_previews.total, 0)::int AS topic_preview_total
    FROM sittings s
    LEFT JOIN LATERAL (
      SELECT count(*)::int AS total,
             coalesce(
               json_agg(json_build_object('id', id, 'name', name) ORDER BY date DESC, name)
                 FILTER (WHERE rn <= 10),
               '[]'::json
             ) AS items
      FROM (
        SELECT b.id, b.name, max(bm.date) AS date,
               row_number() OVER (ORDER BY max(bm.date) DESC, b.name) AS rn
        FROM bill_mentions bm
        JOIN bills b ON b.id = bm.bill_id
        WHERE bm.sitting_id = s.id AND bm.active
        GROUP BY b.id, b.name
      ) bills_for_sitting
    ) bill_previews ON TRUE
    LEFT JOIN LATERAL (
      SELECT count(*)::int AS total,
             coalesce(
               json_agg(json_build_object('id', id, 'title', title) ORDER BY speech_count DESC, title)
                 FILTER (WHERE rn <= 10),
               '[]'::json
             ) AS items
      FROM (
        SELECT t.id, t.title, t.speech_count,
               row_number() OVER (ORDER BY t.speech_count DESC, t.title) AS rn
        FROM topics t
        WHERE t.sitting_id = s.id AND t.active
        ORDER BY t.speech_count DESC, t.title
      ) topics_for_sitting
    ) topic_previews ON TRUE
    LEFT JOIN LATERAL (
      SELECT ss.source_url, ds.base_url
      FROM sitting_sources ss
      JOIN data_sources ds ON ds.id = ss.data_source_id
      WHERE ss.sitting_id = s.id
      ORDER BY (ss.source_url = s.url) DESC, ss.last_seen_at DESC, ss.id
      LIMIT 1
    ) source ON TRUE
    WHERE TRUE
    ${houseFilter}
    ${yearFilter}
    ORDER BY s.date DESC
    LIMIT ${limit + 1} OFFSET ${offset}
  `;
}

export async function getSittingById(id: string) {
  const [sitting] = await db`
    SELECT s.id, s.url, s.date, s.house, s.session_type, s.summary,
           s.generated_summary, s.generated_summary_model, s.sentiment,
           s.source, s.pdf_url, s.raw_json, s.youtube_url,
           coalesce(source.source_url, s.url) AS source_url,
           source.base_url AS source_base_url
    FROM sittings s
    LEFT JOIN LATERAL (
      SELECT ss.source_url, ds.base_url
      FROM sitting_sources ss
      JOIN data_sources ds ON ds.id = ss.data_source_id
      WHERE ss.sitting_id = s.id
      ORDER BY (ss.source_url = s.url) DESC, ss.last_seen_at DESC, ss.id
      LIMIT 1
    ) source ON TRUE
    WHERE s.id = ${id}
  `;
  return sitting ?? null;
}

export async function resolveLegacySittingSuffix(suffix: string) {
  const rows = await db<{ id: string }[]>`
    SELECT DISTINCT s.id
    FROM sittings s
    LEFT JOIN sitting_sources ss ON ss.sitting_id = s.id
    WHERE regexp_replace(regexp_replace(split_part(coalesce(ss.source_url, s.url), '?', 1), '/+$', ''), '^.*/', '') = ${suffix}
       OR regexp_replace(regexp_replace(split_part(s.url, '?', 1), '/+$', ''), '^.*/', '') = ${suffix}
    ORDER BY s.id
    LIMIT 2
  `;
  return rows.map((row) => row.id);
}

// Returns transcript speaker identifiers mapped to canonical member identities.
export async function getSpeakerMembers(sittingId: string) {
  const rows = await db<
    {
      speakerUrl: string | null;
      speakerName: string;
      memberId: string;
      memberName: string;
      memberPhoto: string | null;
      memberParty: string | null;
    }[]
  >`
    SELECT sp.url AS speaker_url, sp.name AS speaker_name, m.id AS member_id,
           m.name AS member_name, m.photo_url AS member_photo,
           m.party AS member_party
    FROM sitting_speakers ss
    JOIN speakers sp ON sp.id = ss.speaker_id
    JOIN members m ON m.id = sp.member_id
    WHERE ss.sitting_id = ${sittingId}
      AND ss.active
  `;
  return Object.fromEntries(
    rows.flatMap((r) => {
      const member = {
        id: r.memberId,
        name: r.memberName,
        photo: r.memberPhoto,
        party: r.memberParty,
      };
      return [
        [`name:${r.speakerName}`, member],
        ...(r.speakerUrl ? [[`url:${r.speakerUrl}`, member] as const] : []),
      ];
    })
  );
}
