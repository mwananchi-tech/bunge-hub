import { db } from "~/lib/db.server";

const BASE = "https://bunge-hub.mwananchi.tech";

const STATIC = ["/", "/bills", "/members", "/topics", "/sittings", "/about"];

export async function loader() {
  const [bills, members, topics, sittings] = await Promise.all([
    db`SELECT id FROM bills`,
    db`SELECT id FROM members`,
    db`SELECT id FROM topics WHERE active`,
    db`SELECT id FROM sittings`,
  ]);

  const urls = [
    ...STATIC.map((path) => `${BASE}${path}`),
    ...bills.map((b: any) => `${BASE}/bills/${b.id}`),
    ...members.map((m: any) => `${BASE}/members/${m.id}`),
    ...topics.map((t: any) => `${BASE}/topics/${t.id}`),
    ...sittings.map((s: any) => `${BASE}/sittings/${s.id}`),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((url) => `  <url><loc>${url}</loc></url>`).join("\n")}
</urlset>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
