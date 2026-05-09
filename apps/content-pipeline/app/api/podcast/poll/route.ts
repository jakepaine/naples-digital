// POST /api/podcast/poll  — poll all enabled feeds for the tenant (or one
// feed when ?feed_id=... query param is set). Cron-friendly.
//
// For each new RSS item, inserts a podcast_episode_inbox row. Idempotent
// on (feed_id, external_guid). Updates feed.last_polled_at + last_item_published_at.

import { NextResponse } from "next/server";
import { createServerClient, hasSupabase } from "@naples/db";
import { getServerTenant } from "@naples/db/next";
import { parsePodcastRssXml } from "@/lib/rss-parser";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function POST(req: Request) {
  if (!hasSupabase()) return NextResponse.json({ error: "Supabase required" }, { status: 500 });
  const tenant = await getServerTenant({ fallbackSlug: "naplesdigital" });
  const sb = createServerClient() as any;

  const url = new URL(req.url);
  const feedId = url.searchParams.get("feed_id");

  let query = sb.from("podcast_feeds").select("*").eq("tenant_id", tenant.id).eq("enabled", true);
  if (feedId) query = query.eq("id", feedId);
  const { data: feeds } = await query;

  const summary: unknown[] = [];
  for (const feed of (feeds ?? []) as Array<{
    id: string;
    feed_url: string;
    last_polled_at: string | null;
    last_item_published_at: string | null;
  }>) {
    let inserted = 0;
    let skipped = 0;
    let error: string | null = null;
    let latestPublished: string | null = feed.last_item_published_at;
    try {
      const resp = await fetch(feed.feed_url, { headers: { "user-agent": "naples-podcast-poller/1.0" } });
      if (!resp.ok) {
        error = `feed fetch ${resp.status}`;
      } else {
        const xml = await resp.text();
        const parsed = parsePodcastRssXml(xml);
        for (const item of parsed.items) {
          if (!item.guid) {
            skipped++;
            continue;
          }
          const { error: insErr } = await sb
            .from("podcast_episode_inbox")
            .insert({
              tenant_id: tenant.id,
              feed_id: feed.id,
              external_guid: item.guid,
              title: item.title,
              description: item.description,
              audio_url: item.audio_url,
              duration_seconds: item.duration_seconds,
              published_at: item.published_at,
              raw: item as unknown as Record<string, unknown>,
            });
          // 23505 = unique violation = already-ingested item; expected.
          if (insErr) {
            if ((insErr as { code?: string }).code === "23505") {
              skipped++;
            } else {
              error = insErr.message;
            }
          } else {
            inserted++;
            if (item.published_at && (!latestPublished || item.published_at > latestPublished)) {
              latestPublished = item.published_at;
            }
          }
        }
      }
    } catch (e) {
      error = (e as Error).message;
    }

    await sb
      .from("podcast_feeds")
      .update({
        last_polled_at: new Date().toISOString(),
        last_item_published_at: latestPublished,
      })
      .eq("id", feed.id);

    summary.push({ feed_id: feed.id, inserted, skipped, error });
  }

  return NextResponse.json({ ok: true, polled: summary.length, summary });
}
