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
    SELECT s.url, s.date, s.house, s.session_type, s.summary, s.pdf_url,
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
        WHERE bm.sitting_id = s.id
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
        WHERE t.sitting_id = s.id
        ORDER BY t.speech_count DESC, t.title
      ) topics_for_sitting
    ) topic_previews ON TRUE
    WHERE TRUE
    ${houseFilter}
    ${yearFilter}
    ORDER BY s.date DESC
    LIMIT ${limit + 1} OFFSET ${offset}
  `;
}

export async function getSittingBySlug(slug: string) {
  // slug is the last path segment of the URL
  const [sitting] = await db`
    SELECT url, date, house, session_type, summary, sentiment,
           source, pdf_url, raw_json
    FROM sittings
    WHERE url LIKE ${"%/" + slug + "/"} OR url LIKE ${"%/" + slug}
  `;
  return sitting ?? null;
}

// Returns url→member_slug mapping for all speakers in a sitting
export async function getSpeakerSlugs(sittingUrl: string) {
  const rows = await db`
    SELECT sp.url AS speaker_url, m.slug AS member_slug,
           m.name AS member_name, m.photo_url AS member_photo,
           m.party AS member_party
    FROM sitting_speakers ss
    JOIN sittings s ON s.id = ss.sitting_id
    JOIN speakers sp ON sp.id = ss.speaker_id
    JOIN members m ON m.id = sp.member_id
    WHERE s.url = ${sittingUrl}
      AND sp.url IS NOT NULL
  `;
  return Object.fromEntries(
    rows.map((r: any) => [
      r.speakerUrl,
      {
        slug: r.memberSlug,
        name: r.memberName,
        photo: r.memberPhoto,
        party: r.memberParty,
      },
    ])
  );
}
