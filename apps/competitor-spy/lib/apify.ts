// Thin wrapper around Apify's FB Ad Library actor.
// In dark mode (no APIFY_TOKEN), returns deterministic stub data so the
// pipeline runs end-to-end for demos / typecheck / Kevin pitch.
//
// Real actor: apify/facebook-ads-library-scraper
//   docs: https://apify.com/apify/facebook-ads-library-scraper
//
// Per-tenant token override: tenant_integrations(kind='apify') is checked
// first — falls back to platform APIFY_TOKEN. The actor id is configurable
// via APIFY_ACTOR_FB_ADS env (defaults to apify/facebook-ads-library-scraper).

import { recordApifyRun, extractApifyRunId } from "@naples/usage";

export interface RawApifyAd {
  ad_archive_id: string;
  page_name: string;
  ad_text: string | null;
  cta_text: string | null;
  cta_url: string | null;
  image_url: string | null;
  video_url: string | null;
  first_seen_at: string | null;
  last_seen_at: string | null;
  raw: any;
}

export class ApifyNotConfiguredError extends Error {
  constructor() {
    super("APIFY_TOKEN not set; using stub data.");
    this.name = "ApifyNotConfiguredError";
  }
}

export async function pullFbAdsForBrand(args: {
  apifyToken?: string;
  pageId?: string | null;
  brandName: string;
  countryCode?: string;
  maxAds?: number;
  tenantId?: string;
}): Promise<RawApifyAd[]> {
  const token = args.apifyToken ?? process.env.APIFY_TOKEN;
  if (!token) {
    return stubAds(args.brandName);
  }

  const actorId =
    process.env.APIFY_ACTOR_FB_ADS ?? "apify/facebook-ads-library-scraper";
  const country = args.countryCode ?? "US";
  const maxAds = args.maxAds ?? 25;

  const input: any = {
    country,
    activeStatus: "active",
    adType: "all",
    maxItems: maxAds,
  };
  if (args.pageId) {
    input.urls = [
      {
        url: `https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=${country}&view_all_page_id=${args.pageId}`,
      },
    ];
  } else {
    input.searchTerms = [args.brandName];
  }

  // Fire actor synchronously and read the dataset
  const runRes = await fetch(
    `https://api.apify.com/v2/acts/${actorId.replace("/", "~")}/run-sync-get-dataset-items?token=${token}`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input),
    },
  );
  const apifyRunId = extractApifyRunId(runRes.headers);
  if (apifyRunId && args.tenantId) {
    await recordApifyRun({
      tenantId: args.tenantId,
      apifyRunId,
      actorId,
      sourceApp: "competitor-spy",
    }).catch(() => null);
  }
  if (!runRes.ok) {
    throw new Error(
      `apify run failed: ${runRes.status} ${await runRes.text().catch(() => "")}`,
    );
  }
  const items = (await runRes.json()) as any[];
  return items.slice(0, maxAds).map((it) => normalize(it, args.brandName));
}

function normalize(it: any, brandName: string): RawApifyAd {
  const id =
    String(
      it.ad_archive_id ??
        it.ad_id ??
        it.id ??
        `${brandName}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    );
  return {
    ad_archive_id: id,
    page_name: String(it.page_name ?? brandName),
    ad_text: String(
      it.ad_text ??
        it.snapshot?.body?.markup?.__html ??
        it.snapshot?.body?.text ??
        "",
    ).slice(0, 4000) || null,
    cta_text: it.cta_text ?? it.snapshot?.cta_text ?? null,
    cta_url: it.cta_url ?? it.snapshot?.cta_url ?? null,
    image_url:
      it.image_url ??
      it.snapshot?.images?.[0]?.original_image_url ??
      it.snapshot?.images?.[0]?.resized_image_url ??
      null,
    video_url:
      it.video_url ??
      it.snapshot?.videos?.[0]?.video_hd_url ??
      it.snapshot?.videos?.[0]?.video_sd_url ??
      null,
    first_seen_at: it.first_seen_at ?? it.start_date ?? null,
    last_seen_at: it.last_seen_at ?? it.end_date ?? null,
    raw: it,
  };
}

function stubAds(brand: string): RawApifyAd[] {
  const seed = (n: number) =>
    `${brand.toLowerCase().replace(/[^a-z0-9]/g, "")}-stub-${n}`;
  const now = new Date();
  return [
    {
      ad_archive_id: seed(1),
      page_name: brand,
      ad_text: `Get 30% off your first month with ${brand}. Limited-time offer for new customers.`,
      cta_text: "Shop Now",
      cta_url: `https://example.com/${brand}`,
      image_url: `https://placehold.co/600x600/png?text=${encodeURIComponent(brand)}+Ad+1`,
      video_url: null,
      first_seen_at: new Date(now.getTime() - 14 * 86400000).toISOString(),
      last_seen_at: now.toISOString(),
      raw: { stub: true },
    },
    {
      ad_archive_id: seed(2),
      page_name: brand,
      ad_text: `Why our customers love ${brand}. Real results in 30 days.`,
      cta_text: "Learn More",
      cta_url: `https://example.com/${brand}`,
      image_url: `https://placehold.co/600x600/png?text=${encodeURIComponent(brand)}+Ad+2`,
      video_url: null,
      first_seen_at: new Date(now.getTime() - 21 * 86400000).toISOString(),
      last_seen_at: now.toISOString(),
      raw: { stub: true },
    },
    {
      ad_archive_id: seed(3),
      page_name: brand,
      ad_text: `Stop overpaying for ${brand} alternatives. Switch and save.`,
      cta_text: "Compare",
      cta_url: `https://example.com/${brand}`,
      image_url: `https://placehold.co/600x600/png?text=${encodeURIComponent(brand)}+Ad+3`,
      video_url: null,
      first_seen_at: new Date(now.getTime() - 7 * 86400000).toISOString(),
      last_seen_at: now.toISOString(),
      raw: { stub: true },
    },
  ];
}
