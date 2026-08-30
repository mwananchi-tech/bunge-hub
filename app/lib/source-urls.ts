const DEFAULT_SOURCE_ORIGIN = "https://mzalendo.com";

export function resolveSourceUrl(value: string, baseUrl?: string | null): string {
  try {
    return new URL(value, baseUrl ?? DEFAULT_SOURCE_ORIGIN).toString();
  } catch {
    return value;
  }
}

export function sourceHost(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return "Mzalendo";
  }
}
