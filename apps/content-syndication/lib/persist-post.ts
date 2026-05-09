import { createServerClient, hasSupabase } from "@naples/db";
import type { Platform } from "./platforms";
import type { TailorResult } from "./tailor";

export interface PostRow {
  id: string;
  tenant_id: string;
  title: string;
  body: string;
  source_url: string | null;
  image_url: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  metadata: any;
}

export interface VariantRow {
  id: string;
  post_id: string;
  tenant_id: string;
  platform: Platform;
  text: string;
  hashtags: string[];
  status: string;
  scheduled_at: string | null;
  published_at: string | null;
  published_url: string | null;
  external_id: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export interface PostWithVariants {
  post: PostRow;
  variants: VariantRow[];
}

export async function savePostWithVariants(args: {
  tenantId: string;
  source: { title: string; body: string; sourceUrl?: string; imageUrl?: string };
  variants: TailorResult[];
}): Promise<PostWithVariants> {
  if (!hasSupabase()) {
    throw new Error("Supabase required to save posts.");
  }
  const sb = createServerClient();

  const { data: post, error: postErr } = await sb
    .from("content_posts")
    .insert({
      tenant_id: args.tenantId,
      title: args.source.title,
      body: args.source.body,
      source_url: args.source.sourceUrl ?? null,
      image_url: args.source.imageUrl ?? null,
      status: "tailored",
    })
    .select("*")
    .single();
  if (postErr) throw new Error(`post insert: ${postErr.message}`);

  const variantRows = args.variants.map((v) => ({
    post_id: (post as any).id,
    tenant_id: args.tenantId,
    platform: v.platform,
    text: v.text,
    hashtags: v.hashtags,
    status: "draft",
  }));
  const { data: variants, error: varErr } = await sb
    .from("content_variants")
    .insert(variantRows)
    .select("*");
  if (varErr) throw new Error(`variants insert: ${varErr.message}`);

  return { post: post as any, variants: (variants ?? []) as any };
}

export async function fetchPostsForTenant(
  tenantId: string,
  limit = 50,
): Promise<PostWithVariants[]> {
  if (!hasSupabase()) return [];
  const sb = createServerClient();
  const { data: posts, error: pErr } = await sb
    .from("content_posts")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (pErr) throw new Error(`posts fetch: ${pErr.message}`);
  const postIds = (posts ?? []).map((p: any) => p.id);
  if (postIds.length === 0) return [];
  const { data: variants, error: vErr } = await sb
    .from("content_variants")
    .select("*")
    .in("post_id", postIds);
  if (vErr) throw new Error(`variants fetch: ${vErr.message}`);
  const byPost = new Map<string, VariantRow[]>();
  for (const v of variants ?? []) {
    const list = byPost.get((v as any).post_id) ?? [];
    list.push(v as any);
    byPost.set((v as any).post_id, list);
  }
  return (posts ?? []).map((p: any) => ({
    post: p,
    variants: byPost.get(p.id) ?? [],
  }));
}

export async function fetchPostById(
  tenantId: string,
  id: string,
): Promise<PostWithVariants | null> {
  if (!hasSupabase()) return null;
  const sb = createServerClient();
  const { data: post, error: pErr } = await sb
    .from("content_posts")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("id", id)
    .maybeSingle();
  if (pErr) throw new Error(`post fetch: ${pErr.message}`);
  if (!post) return null;
  const { data: variants, error: vErr } = await sb
    .from("content_variants")
    .select("*")
    .eq("post_id", id)
    .order("platform");
  if (vErr) throw new Error(`variants fetch: ${vErr.message}`);
  return { post: post as any, variants: (variants ?? []) as any };
}

export async function getVariant(
  variantId: string,
): Promise<VariantRow | null> {
  if (!hasSupabase()) return null;
  const sb = createServerClient();
  const { data, error } = await sb
    .from("content_variants")
    .select("*")
    .eq("id", variantId)
    .maybeSingle();
  if (error) throw new Error(`variant fetch: ${error.message}`);
  return (data as any) ?? null;
}

export async function updateVariantText(args: {
  variantId: string;
  text: string;
  hashtags?: string[];
}): Promise<VariantRow> {
  if (!hasSupabase()) throw new Error("Supabase required.");
  const sb = createServerClient();
  const update: any = { text: args.text };
  if (args.hashtags !== undefined) update.hashtags = args.hashtags;
  const { data, error } = await sb
    .from("content_variants")
    .update(update)
    .eq("id", args.variantId)
    .select("*")
    .single();
  if (error) throw new Error(`variant update: ${error.message}`);
  return data as any;
}

export async function markVariantPublished(args: {
  variantId: string;
  publishedUrl: string;
  externalId?: string;
}): Promise<VariantRow> {
  if (!hasSupabase()) throw new Error("Supabase required.");
  const sb = createServerClient();
  const { data, error } = await sb
    .from("content_variants")
    .update({
      status: "published",
      published_at: new Date().toISOString(),
      published_url: args.publishedUrl,
      external_id: args.externalId ?? null,
      error_message: null,
    })
    .eq("id", args.variantId)
    .select("*")
    .single();
  if (error) throw new Error(`mark published: ${error.message}`);
  return data as any;
}

export async function markVariantFailed(args: {
  variantId: string;
  error: string;
}): Promise<void> {
  if (!hasSupabase()) return;
  const sb = createServerClient();
  await sb
    .from("content_variants")
    .update({ status: "failed", error_message: args.error })
    .eq("id", args.variantId);
}
