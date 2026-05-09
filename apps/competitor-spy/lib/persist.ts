import { createServerClient, hasSupabase } from "@naples/db";
import { pullFbAdsForBrand } from "./apify";
import { analyzeAd } from "./analyze-ad";

export interface BrandRow {
  id: string;
  tenant_id: string;
  name: string;
  fb_page_id: string | null;
  notes: string | null;
  enabled: boolean;
  last_synced_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdRow {
  id: string;
  tenant_id: string;
  brand_id: string;
  ad_archive_id: string;
  ad_text: string | null;
  cta_text: string | null;
  cta_url: string | null;
  image_url: string | null;
  video_url: string | null;
  first_seen_at: string | null;
  last_seen_at: string | null;
  asset_type: string | null;
  visual_format: string | null;
  messaging_angle: string | null;
  hook_tactic: string | null;
  offer_type: string | null;
  ai_summary: string | null;
  weeks_in_top10: number;
  raw: any;
  created_at: string;
  updated_at: string;
}

export async function listBrands(tenantId: string): Promise<BrandRow[]> {
  if (!hasSupabase()) return [];
  const sb = createServerClient();
  const { data, error } = await sb
    .from("competitor_brands")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(`brands fetch: ${error.message}`);
  return (data ?? []) as any;
}

export async function createBrand(args: {
  tenantId: string;
  name: string;
  fbPageId?: string | null;
  notes?: string | null;
}): Promise<BrandRow> {
  if (!hasSupabase()) throw new Error("Supabase required.");
  const sb = createServerClient();
  const { data, error } = await sb
    .from("competitor_brands")
    .insert({
      tenant_id: args.tenantId,
      name: args.name,
      fb_page_id: args.fbPageId ?? null,
      notes: args.notes ?? null,
    })
    .select("*")
    .single();
  if (error) throw new Error(`brand insert: ${error.message}`);
  return data as any;
}

export async function deleteBrand(tenantId: string, id: string): Promise<void> {
  if (!hasSupabase()) return;
  const sb = createServerClient();
  await sb
    .from("competitor_brands")
    .delete()
    .eq("id", id)
    .eq("tenant_id", tenantId);
}

export async function listAdsForTenant(
  tenantId: string,
  limit = 60,
): Promise<AdRow[]> {
  if (!hasSupabase()) return [];
  const sb = createServerClient();
  const { data, error } = await sb
    .from("competitor_ads")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("last_seen_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(`ads fetch: ${error.message}`);
  return (data ?? []) as any;
}

export async function syncBrand(args: {
  tenantId: string;
  brandId: string;
}): Promise<{ pulled: number; persisted: number; errors: string[] }> {
  if (!hasSupabase()) return { pulled: 0, persisted: 0, errors: ["no_supabase"] };
  const sb = createServerClient();

  const { data: brand } = await sb
    .from("competitor_brands")
    .select("*")
    .eq("id", args.brandId)
    .eq("tenant_id", args.tenantId)
    .maybeSingle();
  if (!brand) return { pulled: 0, persisted: 0, errors: ["brand_not_found"] };

  // Per-tenant Apify token (optional)
  let apifyToken: string | undefined;
  try {
    const { data: tk } = await sb.rpc("get_tenant_secret", {
      p_tenant_id: args.tenantId,
      p_kind: "apify",
    });
    const row = (tk ?? [])[0] as any;
    if (row?.out_secret) apifyToken = row.out_secret;
  } catch {
    /* fall through to platform */
  }

  const ads = await pullFbAdsForBrand({
    apifyToken,
    pageId: (brand as any).fb_page_id,
    brandName: (brand as any).name,
  });

  const errors: string[] = [];
  let persisted = 0;
  for (const ad of ads) {
    try {
      const analysis = await analyzeAd({
        adText: ad.ad_text,
        imageUrl: ad.image_url,
        ctaText: ad.cta_text,
        hasVideo: !!ad.video_url,
      });
      await sb
        .from("competitor_ads")
        .upsert(
          {
            tenant_id: args.tenantId,
            brand_id: args.brandId,
            ad_archive_id: ad.ad_archive_id,
            ad_text: ad.ad_text,
            cta_text: ad.cta_text,
            cta_url: ad.cta_url,
            image_url: ad.image_url,
            video_url: ad.video_url,
            first_seen_at: ad.first_seen_at,
            last_seen_at: ad.last_seen_at ?? new Date().toISOString(),
            asset_type: analysis.asset_type,
            visual_format: analysis.visual_format,
            messaging_angle: analysis.messaging_angle,
            hook_tactic: analysis.hook_tactic,
            offer_type: analysis.offer_type,
            ai_summary: analysis.ai_summary,
            raw: ad.raw,
          },
          { onConflict: "tenant_id,ad_archive_id" },
        );
      persisted++;
    } catch (e) {
      errors.push(`${ad.ad_archive_id}: ${(e as Error).message}`);
    }
  }

  await sb
    .from("competitor_brands")
    .update({ last_synced_at: new Date().toISOString() })
    .eq("id", args.brandId);

  return { pulled: ads.length, persisted, errors };
}
