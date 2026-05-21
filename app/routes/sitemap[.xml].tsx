import { db } from "~/lib/db.server";

const BASE = "https://bunge-hub.mwananchi.tech";

const STATIC = ["/", "/bills", "/members", "/topics", "/sittings", "/about"];

export async function loader() {
  const [bills, members, topics, sittings] = await Promise.all([
    db`SELECT id FROM bills`,
    db`SELECT slug FROM members WHERE slug IS NOT NULL`,
    db`SELECT id FROM topics`,
    db`SELECT url FROM sittings`,
  ]);

  const urls = [
    ...STATIC.map((path) => `${BASE}${path}`),
    ...bills.map((b: any) => `${BASE}/bills/${b.id}`),
    ...members.map((m: any) => `${BASE}/members/${m.slug}`),
    ...topics.map((t: any) => `${BASE}/topics/${t.id}`),
    ...sittings
      .map((s: any) => {
        const slug = s.url?.split("/").filter(Boolean).pop();
        return slug ? `${BASE}/sittings/${slug}` : null;
      })
      .filter(Boolean),
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
