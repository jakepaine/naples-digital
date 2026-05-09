// RSS commentary persistence + sync orchestration.

import { createServerClient, hasSupabase } from "@naples/db";
import { parseRssXml } from "./rss-parser";
import { generateCommentary } from "./commentary";

export type CommentaryStatus =
  | "pending"
  | "generated"
  | "approved"
  | "rejected"
  | "published"
  | "archived";

export interface FeedRow {
  id: string;
  tenant_id: string;
  url: string;
  title: string | null;
  category: string | null;
  enabled: boolean;
  last_polled_at: string | null;
  last_item_published_at: string | null;
  poll_interval_minutes: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ItemRow {
  id: string;
  tenant_id: string;
  feed_id: string;
  external_guid: string;
  title: string | null;
  link: string | null;
  published_at: string | null;
  author: string | null;
  excerpt: string | null;
  body_html: string | null;
  body_text: string | null;
  commentary_status: CommentaryStatus;
  commentary_title: string | null;
  commentary_body: string | null;
  commentary_angle: string | null;
  commentary_generated_at: string | null;
  approved_at: string | null;
  ingested_at: string;
}

export async function listFeeds(tenantId: string): Promise<FeedRow[]> {
  if (!hasSupabase()) return [];
  const sb = createServerClient() as any;
  const { data, error } = await sb
    .from("rss_feeds")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(`feeds fetch: ${error.message}`);
  return (data ?? []) as any;
}

export async function createFeed(args: {
  tenantId: string;
  url: string;
  title?: string | null;
  category?: string | null;
}): Promise<FeedRow> {
  if (!hasSupabase()) throw new Error("Supabase required");
  const sb = createServerClient() as any;
  const { data, error } = await sb
    .from("rss_feeds")
    .insert({
      tenant_id: args.tenantId,
      url: args.url,
      title: args.title ?? null,
      category: args.category ?? null,
    })
    .select("*")
    .single();
  if (error || !data) {
    if (error?.code === "23505") {
      throw new Error("feed already tracked");
    }
    throw new Error(`feed insert: ${error?.message ?? "unknown"}`);
  }
  return data as any;
}

export async function deleteFeed(args: {
  tenantId: string;
  id: string;
}): Promise<void> {
  if (!hasSupabase()) return;
  const sb = createServerClient() as any;
  await sb
    .from("rss_feeds")
    .delete()
    .eq("tenant_id", args.tenantId)
    .eq("id", args.id);
}

export async function listItems(
  tenantId: string,
  opts?: { feedId?: string; status?: CommentaryStatus; limit?: number },
): Promise<ItemRow[]> {
  if (!hasSupabase()) return [];
  const sb = createServerClient() as any;
  let q = sb
    .from("rss_items")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("ingested_at", { ascending: false })
    .limit(Math.min(200, opts?.limit ?? 80));
  if (opts?.feedId) q = q.eq("feed_id", opts.feedId);
  if (opts?.status) q = q.eq("commentary_status", opts.status);
  const { data, error } = await q;
  if (error) throw new Error(`items fetch: ${error.message}`);
  return (data ?? []) as any;
}

export async function getItem(
  tenantId: string,
  id: string,
): Promise<ItemRow | null> {
  if (!hasSupabase()) return null;
  const sb = createServerClient() as any;
  const { data } = await sb
    .from("rss_items")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("id", id)
    .maybeSingle();
  return (data as any) ?? null;
}

export async function updateItemStatus(args: {
  tenantId: string;
  id: string;
  status: CommentaryStatus;
}): Promise<void> {
  if (!hasSupabase()) return;
  const sb = createServerClient() as any;
  const patch: Record<string, unknown> = { commentary_status: args.status };
  if (args.status === "approved") patch.approved_at = new Date().toISOString();
  await sb
    .from("rss_items")
    .update(patch)
    .eq("tenant_id", args.tenantId)
    .eq("id", args.id);
}

export async function pollFeed(args: {
  tenantId: string;
  feedId: string;
}): Promise<{
  fetched: number;
  inserted: number;
  duplicate: number;
  feed_title: string | null;
  error?: string;
}> {
  if (!hasSupabase())
    return { fetched: 0, inserted: 0, duplicate: 0, feed_title: null, error: "no_supabase" };
  const sb = createServerClient() as any;

  const { data: feed } = await sb
    .from("rss_feeds")
    .select("*")
    .eq("id", args.feedId)
    .eq("tenant_id", args.tenantId)
    .maybeSingle();
  if (!feed) {
    return { fetched: 0, inserted: 0, duplicate: 0, feed_title: null, error: "feed_not_found" };
  }
  let xml = "";
  try {
    const res = await fetch((feed as any).url);
    if (!res.ok) {
      return {
        fetched: 0,
        inserted: 0,
        duplicate: 0,
        feed_title: (feed as any).title,
        error: `feed fetch ${res.status}`,
      };
    }
    xml = await res.text();
  } catch (e) {
    return {
      fetched: 0,
      inserted: 0,
      duplicate: 0,
      feed_title: (feed as any).title,
      error: (e as Error).message,
    };
  }

  const parsed = parseRssXml(xml);
  const itemsToInsert = parsed.items.map((it) => ({
    tenant_id: args.tenantId,
    feed_id: args.feedId,
    external_guid: it.guid,
    title: it.title,
    link: it.link,
    published_at: it.published_at,
    author: it.author,
    excerpt: it.excerpt,
    body_html: it.body_html,
    body_text: it.body_text,
    raw: { source: "rss-parser" },
  }));

  let inserted = 0;
  let duplicate = 0;
  for (const row of itemsToInsert) {
    if (!row.external_guid) {
      duplicate++;
      continue;
    }
    const { error: upErr, data } = await sb
      .from("rss_items")
      .upsert(row, { onConflict: "feed_id,external_guid", ignoreDuplicates: true })
      .select("id");
    if (upErr) {
      // ignore conflicts; bump duplicate.
      duplicate++;
      continue;
    }
    if (Array.isArray(data) && data.length > 0) inserted++;
    else duplicate++;
  }

  // Update feed metadata.
  const latest = parsed.items
    .map((it) => it.published_at)
    .filter(Boolean)
    .sort()
    .reverse()[0];
  await sb
    .from("rss_feeds")
    .update({
      last_polled_at: new Date().toISOString(),
      last_item_published_at: latest ?? (feed as any).last_item_published_at,
      title: (feed as any).title ?? parsed.title,
    })
    .eq("id", args.feedId);

  return {
    fetched: parsed.items.length,
    inserted,
    duplicate,
    feed_title: parsed.title,
  };
}

export async function generateForItem(args: {
  tenantId: string;
  itemId: string;
}): Promise<{
  ok: boolean;
  error?: string;
  item?: ItemRow;
}> {
  if (!hasSupabase()) return { ok: false, error: "no_supabase" };
  const sb = createServerClient() as any;
  const { data: item } = await sb
    .from("rss_items")
    .select("*")
    .eq("id", args.itemId)
    .eq("tenant_id", args.tenantId)
    .maybeSingle();
  if (!item) return { ok: false, error: "item_not_found" };

  // Look up the feed for context.
  const { data: feed } = await sb
    .from("rss_feeds")
    .select("title, category, notes")
    .eq("id", (item as any).feed_id)
    .maybeSingle();

  // Look up tenant voice profile if available.
  const { data: voice } = await sb
    .from("tenant_voice_profiles")
    .select("fingerprint, voice_summary, enabled")
    .eq("tenant_id", args.tenantId)
    .maybeSingle();
  const voiceContext =
    voice && (voice as any).enabled
      ? {
          fingerprint: (voice as any).fingerprint,
          summary: (voice as any).voice_summary,
        }
      : null;

  const draft = await generateCommentary({
    itemTitle: (item as any).title ?? "(no title)",
    itemUrl: (item as any).link,
    itemBodyText: (item as any).body_text,
    feedTitle: (feed as any)?.title ?? null,
    niche: (feed as any)?.category ?? null,
    voice: voiceContext,
  });

  const { data: updated, error } = await sb
    .from("rss_items")
    .update({
      commentary_status: "generated",
      commentary_title: draft.title,
      commentary_body: draft.body,
      commentary_angle: draft.angle,
      commentary_generated_at: new Date().toISOString(),
    })
    .eq("tenant_id", args.tenantId)
    .eq("id", args.itemId)
    .select("*")
    .single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, item: updated as any };
}
