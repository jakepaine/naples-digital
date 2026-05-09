// IG Reels research persistence + sync orchestration.

import { createServerClient, hasSupabase, getTenantSecret } from "@naples/db";
import { pullReelsForCreator } from "./apify";
import { analyzeReel } from "./analyze";

export interface CreatorRow {
  id: string;
  tenant_id: string;
  handle: string;
  display_name: string | null;
  niche: string | null;
  notes: string | null;
  enabled: boolean;
  last_synced_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ReelRow {
  id: string;
  tenant_id: string;
  creator_id: string;
  ig_shortcode: string;
  ig_url: string | null;
  video_url: string | null;
  thumbnail_url: string | null;
  caption: string | null;
  hashtags: string[] | null;
  music_title: string | null;
  music_artist: string | null;
  view_count: number | null;
  like_count: number | null;
  comment_count: number | null;
  duration_seconds: number | null;
  posted_at: string | null;
  transcript: string | null;
  hook_first_3s: string | null;
  hook_pattern: string | null;
  niche_relevance: number | null;
  retention_signal: string | null;
  cta_present: boolean | null;
  cta_text: string | null;
  ai_summary: string | null;
  raw: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export async function listCreators(tenantId: string): Promise<CreatorRow[]> {
  if (!hasSupabase()) return [];
  const sb = createServerClient() as any;
  const { data, error } = await sb
    .from("ig_creators")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(`creators fetch: ${error.message}`);
  return (data ?? []) as any;
}

export async function createCreator(args: {
  tenantId: string;
  handle: string;
  displayName?: string | null;
  niche?: string | null;
  notes?: string | null;
}): Promise<CreatorRow> {
  if (!hasSupabase()) throw new Error("Supabase required");
  const sb = createServerClient() as any;
  const handle = args.handle.replace(/^@/, "").trim().toLowerCase();
  if (!handle) throw new Error("handle required");
  const { data, error } = await sb
    .from("ig_creators")
    .insert({
      tenant_id: args.tenantId,
      handle,
      display_name: args.displayName ?? null,
      niche: args.niche ?? null,
      notes: args.notes ?? null,
    })
    .select("*")
    .single();
  if (error || !data) {
    if (error?.code === "23505") {
      throw new Error(`creator @${handle} already tracked for this tenant`);
    }
    throw new Error(`creator insert: ${error?.message ?? "unknown"}`);
  }
  return data as any;
}

export async function deleteCreator(args: {
  tenantId: string;
  id: string;
}): Promise<void> {
  if (!hasSupabase()) return;
  const sb = createServerClient() as any;
  await sb
    .from("ig_creators")
    .delete()
    .eq("tenant_id", args.tenantId)
    .eq("id", args.id);
}

export async function listReels(
  tenantId: string,
  opts?: { creatorId?: string; limit?: number },
): Promise<ReelRow[]> {
  if (!hasSupabase()) return [];
  const sb = createServerClient() as any;
  let q = sb
    .from("ig_reels")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("posted_at", { ascending: false })
    .limit(Math.min(200, opts?.limit ?? 60));
  if (opts?.creatorId) q = q.eq("creator_id", opts.creatorId);
  const { data, error } = await q;
  if (error) throw new Error(`reels fetch: ${error.message}`);
  return (data ?? []) as any;
}

export async function syncCreator(args: {
  tenantId: string;
  creatorId: string;
}): Promise<{ pulled: number; persisted: number; errors: string[] }> {
  if (!hasSupabase())
    return { pulled: 0, persisted: 0, errors: ["no_supabase"] };
  const sb = createServerClient() as any;

  const { data: creator } = await sb
    .from("ig_creators")
    .select("*")
    .eq("id", args.creatorId)
    .eq("tenant_id", args.tenantId)
    .maybeSingle();
  if (!creator) {
    return { pulled: 0, persisted: 0, errors: ["creator_not_found"] };
  }

  // Per-tenant Apify token (optional).
  let apifyToken: string | null = null;
  try {
    const sec = await getTenantSecret(args.tenantId, "apify");
    if (sec?.secret) apifyToken = sec.secret;
  } catch {
    /* fall through */
  }

  const reels = await pullReelsForCreator({
    apifyToken,
    handle: (creator as any).handle,
    maxReels: 12,
  });

  const errors: string[] = [];
  let persisted = 0;
  for (const r of reels) {
    try {
      const analysis = await analyzeReel({
        caption: r.caption,
        hashtags: r.hashtags,
        thumbnailUrl: r.thumbnail_url,
        niche: (creator as any).niche,
      });
      await sb.from("ig_reels").upsert(
        {
          tenant_id: args.tenantId,
          creator_id: args.creatorId,
          ig_shortcode: r.ig_shortcode,
          ig_url: r.ig_url,
          video_url: r.video_url,
          thumbnail_url: r.thumbnail_url,
          caption: r.caption,
          hashtags: r.hashtags,
          music_title: r.music_title,
          music_artist: r.music_artist,
          view_count: r.view_count,
          like_count: r.like_count,
          comment_count: r.comment_count,
          duration_seconds: r.duration_seconds,
          posted_at: r.posted_at,
          hook_first_3s: analysis.hook_first_3s,
          hook_pattern: analysis.hook_pattern,
          niche_relevance: analysis.niche_relevance,
          retention_signal: analysis.retention_signal,
          cta_present: analysis.cta_present,
          cta_text: analysis.cta_text,
          ai_summary: analysis.ai_summary,
          raw: r.raw,
        },
        { onConflict: "tenant_id,ig_shortcode" },
      );
      persisted++;
    } catch (e) {
      errors.push(`${r.ig_shortcode}: ${(e as Error).message}`);
    }
  }

  await sb
    .from("ig_creators")
    .update({ last_synced_at: new Date().toISOString() })
    .eq("id", args.creatorId);

  return { pulled: reels.length, persisted, errors };
}
