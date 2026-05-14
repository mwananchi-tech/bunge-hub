import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("search", "routes/search.tsx"),
  route("members", "routes/members._index.tsx"),
  route("members/:slug", "routes/members.$slug.tsx"),
  route("bills", "routes/bills._index.tsx"),
  route("bills/:id", "routes/bills.$id.tsx"),
  route("topics", "routes/topics._index.tsx"),
  route("topics/:id", "routes/topics.$id.tsx"),
  route("sittings", "routes/sittings._index.tsx"),
  route("sittings/:slug", "routes/sittings.$slug.tsx"),
  route("about", "routes/about.tsx"),
] satisfies RouteConfig;
