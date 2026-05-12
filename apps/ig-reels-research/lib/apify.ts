// Apify wrapper for IG Reels scrape. Same auth pattern as competitor-spy.
// Default actor: apify/instagram-reel-scraper (configurable via env).
//
// Falls back to deterministic stub data when no token configured so
// the dashboard renders the workflow shape on day one.

import { recordApifyRun, extractApifyRunId } from "@naples/usage";

export interface RawReel {
  ig_shortcode: string;
  ig_url: string | null;
  video_url: string | null;
  thumbnail_url: string | null;
  caption: string | null;
  hashtags: string[];
  music_title: string | null;
  music_artist: string | null;
  view_count: number | null;
  like_count: number | null;
  comment_count: number | null;
  duration_seconds: number | null;
  posted_at: string | null;
  raw: Record<string, unknown>;
}

export async function pullReelsForCreator(args: {
  apifyToken?: string | null;
  handle: string;
  maxReels?: number;
  tenantId?: string;
}): Promise<RawReel[]> {
  const token = args.apifyToken;
  if (!token) return stubReels(args.handle, args.maxReels ?? 6);

  const actorId =
    process.env.APIFY_ACTOR_IG_REELS ?? "apify/instagram-reel-scraper";
  const handle = args.handle.replace(/^@/, "");
  const max = args.maxReels ?? 12;

  try {
    const url = `https://api.apify.com/v2/acts/${actorId.replace("/", "~")}/run-sync-get-dataset-items?token=${token}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        username: [handle],
        resultsLimit: max,
      }),
    });
    const apifyRunId = extractApifyRunId(res.headers);
    if (apifyRunId && args.tenantId) {
      await recordApifyRun({
        tenantId: args.tenantId,
        apifyRunId,
        actorId,
        sourceApp: "ig-reels-research",
      }).catch(() => null);
    }
    if (!res.ok) {
      // Soft-fail: return stub instead of throwing
      return stubReels(handle, max);
    }
    const items = (await res.json().catch(() => [])) as any[];
    return (Array.isArray(items) ? items : [])
      .slice(0, max)
      .map((it) => normalizeReel(it, handle));
  } catch {
    return stubReels(handle, max);
  }
}

function normalizeReel(it: any, handle: string): RawReel {
  const shortcode = String(it.shortCode ?? it.shortcode ?? it.id ?? "");
  const hashtags: string[] = Array.isArray(it.hashtags)
    ? it.hashtags.filter((h: unknown): h is string => typeof h === "string")
    : extractHashtags(it.caption ?? "");
  return {
    ig_shortcode: shortcode || `${handle}-${Date.now()}`,
    ig_url:
      it.url ??
      (shortcode ? `https://www.instagram.com/reel/${shortcode}/` : null),
    video_url: it.videoUrl ?? it.video_url ?? null,
    thumbnail_url: it.displayUrl ?? it.thumbnail_url ?? null,
    caption:
      typeof it.caption === "string"
        ? it.caption
        : it.caption?.text ?? null,
    hashtags,
    music_title: it.musicInfo?.song_name ?? it.musicInfo?.song ?? null,
    music_artist: it.musicInfo?.artist_name ?? it.musicInfo?.artist ?? null,
    view_count: numOrNull(it.videoViewCount ?? it.videoPlayCount ?? it.views),
    like_count: numOrNull(it.likesCount ?? it.likes ?? it.likeCount),
    comment_count: numOrNull(it.commentsCount ?? it.comments ?? it.commentCount),
    duration_seconds: numOrNull(it.videoDuration ?? it.duration),
    posted_at:
      it.timestamp ??
      it.takenAtTimestamp ??
      it.taken_at_timestamp ??
      null,
    raw: it,
  };
}

function extractHashtags(s: string): string[] {
  const out: string[] = [];
  const re = /#([\p{L}0-9_]+)/gu;
  let m: RegExpExecArray | null;
  while ((m = re.exec(s)) !== null) {
    if (m[1]) out.push(m[1]);
  }
  return out;
}

function numOrNull(v: any): number | null {
  if (v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function stubReels(handle: string, n: number): RawReel[] {
  const now = Date.now();
  const captions = [
    "POV: you finally fix [pain point] in 30 days",
    "Stop doing X if you want Y",
    "3 things I wish I knew before [moment]",
    "This took me 2 years to figure out — saving you the time",
    "If your [niche] is doing X, you're leaving money on the table",
    "Watch til the end — the answer surprised me",
  ];
  return Array.from({ length: Math.min(n, 6) }, (_, i) => ({
    ig_shortcode: `stub-${handle}-${i + 1}`,
    ig_url: `https://www.instagram.com/reel/stub-${handle}-${i + 1}/`,
    video_url: null,
    thumbnail_url: `https://placehold.co/270x480/png?text=${encodeURIComponent(handle)}`,
    caption: captions[i % captions.length] ?? "",
    hashtags: ["smallbusiness", "marketing", "ai"].slice(0, (i % 3) + 1),
    music_title: "Original Audio",
    music_artist: handle,
    view_count: Math.floor(50_000 / (i + 1)),
    like_count: Math.floor(2_000 / (i + 1)),
    comment_count: Math.floor(120 / (i + 1)),
    duration_seconds: 24 + i * 6,
    posted_at: new Date(now - i * 86400000).toISOString(),
    raw: { stub: true },
  }));
}
