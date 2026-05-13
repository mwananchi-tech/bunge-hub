import { db } from "~/lib/db.server";

export type SearchResult = {
  type: "member" | "bill" | "topic";
  id: string;
  title: string;
  subtitle: string;
  urlPath: string;
  score: number;
};

export async function search(query: string): Promise<SearchResult[]> {
  if (query.trim().length < 2) return [];
  const rows = await db<SearchResult[]>`SELECT * FROM search(${query}, 20)`;
  return rows;
}
