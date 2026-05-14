import { db } from "~/lib/db.server";

export type SearchResult = {
  type: "member" | "bill" | "topic";
  id: string;
  title: string;
  subtitle: string;
  urlPath: string;
  score: number;
};

export async function search(query: string, limit = 20): Promise<SearchResult[]> {
  if (query.trim().length < 2) return [];
  return db<SearchResult[]>`
    SELECT * FROM (
      SELECT 'member'::text                                                  AS type,
             m.id::text                                                      AS id,
             m.name                                                          AS title,
             coalesce(m.party, '') || ' · ' || coalesce(m.constituency, '') AS subtitle,
             '/members/' || m.slug                                           AS url_path,
             greatest(
               word_similarity(${query}, m.name),
               similarity(${query}, m.name),
               word_similarity(${query}, coalesce(m.constituency, '')),
               similarity(${query}, coalesce(m.constituency, ''))
             )::float AS score
      FROM members m
      WHERE m.name %>> ${query}
         OR m.name ILIKE ${'%' + query + '%'}
         OR m.constituency ILIKE ${'%' + query + '%'}

      UNION ALL

      SELECT 'bill',
             b.id::text,
             b.name,
             coalesce(b.bill_number, '') || coalesce(' · ' || b.year::text, ''),
             '/bills/' || b.id::text,
             ts_rank(to_tsvector('english', b.name), websearch_to_tsquery('english', ${query}))::float
      FROM bills b
      WHERE to_tsvector('english', b.name) @@ websearch_to_tsquery('english', ${query})
         OR b.name ILIKE ${'%' + query + '%'}
         OR b.bill_number ILIKE ${'%' + query + '%'}

      UNION ALL

      SELECT 'topic',
             t.id::text,
             t.title,
             t.section_type || ' · ' || to_char(s.date, 'DD Mon YYYY'),
             '/topics/' || t.id::text,
             ts_rank(to_tsvector('english', t.title), websearch_to_tsquery('english', ${query}))::float
      FROM topics t
      JOIN sittings s ON s.id = t.sitting_id
      WHERE to_tsvector('english', t.title) @@ websearch_to_tsquery('english', ${query})
         OR t.title ILIKE ${'%' + query + '%'}
    ) results
    ORDER BY score DESC
    LIMIT ${limit}
  `;
}
