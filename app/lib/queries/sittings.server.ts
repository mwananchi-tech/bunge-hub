import { db } from "~/lib/db.server";

export async function listSittings({
  house,
  page = 1,
  limit = 40,
}: { house?: string; page?: number; limit?: number } = {}) {
  const offset = (page - 1) * limit;
  const houseFilter = house ? db`AND house = ${house}` : db``;
  return db`
    SELECT url, date, house, session_type, summary, pdf_url
    FROM sittings
    WHERE TRUE
    ${houseFilter}
    ORDER BY date DESC
    LIMIT ${limit + 1} OFFSET ${offset}
  `;
}

export async function getSittingBySlug(slug: string) {
  // slug is the last path segment of the URL
  const [sitting] = await db`
    SELECT url, date, house, session_type, summary, sentiment,
           source, pdf_url, raw_json
    FROM sittings
    WHERE url LIKE ${'%/' + slug + '/'} OR url LIKE ${'%/' + slug}
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
    rows.map((r: any) => [r.speakerUrl, {
      slug: r.memberSlug,
      name: r.memberName,
      photo: r.memberPhoto,
      party: r.memberParty,
    }])
  );
}
