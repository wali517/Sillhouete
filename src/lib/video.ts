export type ParsedVideo =
  | { type: "youtube"; youtubeId: string; embedUrl: string; watchUrl: string }
  | { type: "mp4"; src: string }
  | null;

/**
 * Robust parser for YouTube URLs (watch, shorts, embed, youtu.be, or bare IDs)
 * and direct MP4/video files.
 */
export function parseVideoSource(
  videoUrl?: string | null,
  videoId?: string | null
): ParsedVideo {
  const url = (videoUrl || "").trim();
  const id = (videoId || "").trim();

  // 1. Check if url contains YouTube patterns
  const ytMatch = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/|v\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i
  );
  if (ytMatch && ytMatch[1] && ytMatch[1] !== "SK1-CnWBQpo") {
    const yId = ytMatch[1];
    return {
      type: "youtube",
      youtubeId: yId,
      embedUrl: `https://www.youtube-nocookie.com/embed/${yId}?autoplay=1&mute=1&playsinline=1&rel=0&modestbranding=1&enablejsapi=1&loop=1&playlist=${yId}`,
      watchUrl: `https://www.youtube.com/watch?v=${yId}`,
    };
  }

  // 2. Check if videoId looks like a valid YouTube ID
  if (id && id.length >= 8 && id !== "SK1-CnWBQpo" && !id.includes("/") && !id.includes(".")) {
    return {
      type: "youtube",
      youtubeId: id,
      embedUrl: `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&mute=1&playsinline=1&rel=0&modestbranding=1&enablejsapi=1&loop=1&playlist=${id}`,
      watchUrl: `https://www.youtube.com/watch?v=${id}`,
    };
  }

  // 3. Direct video file URL (.mp4, .webm, .mov, /api/uploads, etc.)
  if (
    url &&
    (url.includes(".mp4") ||
      url.includes(".webm") ||
      url.includes(".mov") ||
      url.startsWith("/api/upload") ||
      url.startsWith("blob:") ||
      url.startsWith("data:video") ||
      url.includes("cdn.shopify.com/videos"))
  ) {
    return {
      type: "mp4",
      src: url,
    };
  }

  // 4. Any other non-YouTube URL that is an HTTP link
  if (url && !url.includes("youtube") && !url.includes("youtu.be") && url.startsWith("http")) {
    return {
      type: "mp4",
      src: url,
    };
  }

  return null;
}

