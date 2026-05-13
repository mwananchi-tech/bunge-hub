import { data } from "react-router";
import type { Route } from "./+types/search";
import { search } from "~/lib/queries/search.server";

export async function loader({ request }: Route.LoaderArgs) {
  const q = new URL(request.url).searchParams.get("q") ?? "";
  const results = await search(q);
  return data({ results });
}
