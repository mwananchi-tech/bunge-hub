import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("search", "routes/search.tsx"),
  route("members", "routes/members._index.tsx"),
  route("members/:id", "routes/members.$id.tsx"),
  route("bills", "routes/bills._index.tsx"),
  route("bills/:id", "routes/bills.$id.tsx"),
  route("topics", "routes/topics._index.tsx"),
  route("topics/:id", "routes/topics.$id.tsx"),
  route("sittings", "routes/sittings._index.tsx"),
  route("sittings/:id", "routes/sittings.$id.tsx"),
  route("about", "routes/about.tsx"),
  route("sitemap.xml", "routes/sitemap[.xml].tsx"),
] satisfies RouteConfig;
