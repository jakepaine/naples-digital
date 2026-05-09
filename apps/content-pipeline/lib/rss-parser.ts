// Minimal podcast RSS parser. Adapted from rss-commentary's parser, plus
// the <enclosure url="...mp3"> handling that podcast feeds use to carry
// the audio URL. Regex-based — no native deps.

export interface ParsedPodcastItem {
  guid: string;
  title: string | null;
  audio_url: string | null;
  duration_seconds: number | null;
  description: string | null;
  published_at: string | null;
}

export interface ParsedPodcastFeed {
  title: string | null;
  items: ParsedPodcastItem[];
}

export function parsePodcastRssXml(xml: string): ParsedPodcastFeed {
  const channelTitle = pickFirst(xml, /<channel>[\s\S]*?<title[^>]*>([\s\S]*?)<\/title>/i);
  const items: ParsedPodcastItem[] = [];
  const itemRe = /<item[\s>][\s\S]*?<\/item>/g;
  let m: RegExpExecArray | null;
  let count = 0;
  while ((m = itemRe.exec(xml)) !== null) {
    if (count++ > 200) break;
    items.push(parseItemBlock(m[0]));
  }
  return { title: cleanText(channelTitle), items };
}

function parseItemBlock(block: string): ParsedPodcastItem {
  const title = pickFirst(block, /<title[^>]*>([\s\S]*?)<\/title>/i);
  // <enclosure url="https://.../episode.mp3" length="12345" type="audio/mpeg"/>
  const enclosure = block.match(/<enclosure[^>]*\surl=["']([^"']+)["'][^>]*\/?\s*>/i);
  const audio_url = enclosure?.[1] ?? null;
  // <itunes:duration>00:32:14</itunes:duration> or seconds form
  const durRaw =
    pickFirst(block, /<itunes:duration[^>]*>([\s\S]*?)<\/itunes:duration>/i) ??
    pickFirst(block, /<duration[^>]*>([\s\S]*?)<\/duration>/i);
  const duration_seconds = parseDuration(durRaw);
  const guid =
    pickFirst(block, /<guid[^>]*>([\s\S]*?)<\/guid>/i) ??
    pickFirst(block, /<link[^>]*>([^<]+)<\/link>/i) ??
    audio_url ??
    "";
  const pubDate =
    pickFirst(block, /<pubDate[^>]*>([\s\S]*?)<\/pubDate>/i) ??
    pickFirst(block, /<published[^>]*>([\s\S]*?)<\/published>/i);
  const description =
    pickFirst(block, /<description[^>]*>([\s\S]*?)<\/description>/i) ??
    pickFirst(block, /<itunes:summary[^>]*>([\s\S]*?)<\/itunes:summary>/i);
  return {
    guid: cleanText(guid) ?? "",
    title: cleanText(title),
    audio_url,
    duration_seconds,
    description: cleanText(description),
    published_at: parseDate(pubDate),
  };
}

function pickFirst(haystack: string, re: RegExp): string | null {
  const m = haystack.match(re);
  return m?.[1] ?? null;
}

function cleanText(s: string | null): string | null {
  if (!s) return null;
  const out = s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
  return out || null;
}

function parseDate(raw: string | null): string | null {
  if (!raw) return null;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

/** Accepts "HH:MM:SS", "MM:SS", or plain seconds. Returns total seconds. */
function parseDuration(raw: string | null): number | null {
  if (!raw) return null;
  const s = raw.trim();
  if (/^\d+$/.test(s)) return parseInt(s, 10);
  const parts = s.split(":").map((p) => parseInt(p, 10));
  if (parts.some((p) => Number.isNaN(p))) return null;
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return null;
}
