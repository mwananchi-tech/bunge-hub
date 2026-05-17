/**
 * Builds a `?from=<encoded-url>` query string to append to detail page links.
 * The detail page reads this param in its loader and uses it for the breadcrumb
 * back link, restoring the list page's filter/search state.
 *
 * Returns an empty string when there are no search params so links stay clean.
 */
export function fromParam(basePath: string, searchStr: string): string {
  if (!searchStr) return "";
  return `?from=${encodeURIComponent(`${basePath}?${searchStr}`)}`;
}

/**
 * Reads the `from` query param from a request URL for use in loaders.
 * Falls back to the given default path when the param is absent.
 */
export function getFromParam(url: URL, defaultPath: string): string {
  return url.searchParams.get("from") ?? defaultPath;
}
