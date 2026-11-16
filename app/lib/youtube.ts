/** Video id from a YouTube URL (watch?v=..., youtu.be/..., /live/..., /embed/...). */
export function youtubeId(url: string): string {
  try {
    const u = new URL(url);
    return u.searchParams.get("v") ?? u.pathname.split("/").pop() ?? "";
  } catch {
    return url;
  }
}

/** YouTube's own thumbnail image for a video (480x360, letterboxed to 16:9 with object-cover). */
export function youtubeThumbnail(url: string): string {
  return `https://i.ytimg.com/vi/${youtubeId(url)}/hqdefault.jpg`;
}
