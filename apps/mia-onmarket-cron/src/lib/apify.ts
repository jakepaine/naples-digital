// Minimal Apify client. Talks to Apify's REST API for actor runs + dataset fetch.
//
// We pull the per-tenant Apify token from Vault via getTenantSecret. The token
// is a project token with limited scope; a missing token short-circuits the
// scrape with a logged warning rather than crashing the loop.

import { getTenantSecret } from "@naples/db";

export type ApifyRunOptions = {
  actorId: string; // e.g. 'epctex/loopnet-scraper' or whatever Apify actor we use
  input: Record<string, unknown>;
  timeoutSeconds?: number; // bound how long to wait
};

export type RawListing = {
  source: "loopnet" | "crexi";
  source_listing_id: string;
  source_url?: string;
  title?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  units?: number;
  year_built?: number;
  asking_price?: number;
  noi_advertised?: number;
  cap_rate_advertised?: number;
  broker_name?: string;
  broker_company?: string;
  broker_email?: string;
  broker_phone?: string;
  raw: unknown;
};

const APIFY_API = "https://api.apify.com/v2";

export async function getApifyToken(tenantId: string): Promise<string | null> {
  const result = await getTenantSecret(tenantId, "apify");
  if (!result) return null;
  // The placeholder we seeded earlier — treat as missing
  if (result.secret === "placeholder-will-be-overwritten-by-real-token") return null;
  return result.secret;
}

export async function runActor(
  token: string,
  opts: ApifyRunOptions
): Promise<unknown[]> {
  // Start the run
  const startRes = await fetch(`${APIFY_API}/acts/${encodeURIComponent(opts.actorId)}/runs?token=${token}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(opts.input),
  });
  if (!startRes.ok) {
    throw new Error(`apify run start failed: ${startRes.status} ${await startRes.text()}`);
  }
  const startJson = (await startRes.json()) as { data?: { id?: string; defaultDatasetId?: string } };
  const runId = startJson?.data?.id;
  const datasetId = startJson?.data?.defaultDatasetId;
  if (!runId || !datasetId) throw new Error("apify response missing run id or dataset id");

  // Poll until complete or timeout
  const deadline = Date.now() + (opts.timeoutSeconds ?? 300) * 1000;
  while (Date.now() < deadline) {
    await sleep(5_000);
    const statusRes = await fetch(`${APIFY_API}/actor-runs/${runId}?token=${token}`);
    if (!statusRes.ok) continue;
    const statusJson = (await statusRes.json()) as { data?: { status?: string } };
    const status = statusJson?.data?.status;
    if (status === "SUCCEEDED") break;
    if (status === "FAILED" || status === "ABORTED" || status === "TIMED-OUT") {
      throw new Error(`apify run ${runId} ended with status ${status}`);
    }
  }

  // Fetch dataset items
  const itemsRes = await fetch(`${APIFY_API}/datasets/${datasetId}/items?token=${token}&format=json`);
  if (!itemsRes.ok) throw new Error(`apify dataset fetch failed: ${itemsRes.status}`);
  const items = (await itemsRes.json()) as unknown;
  return Array.isArray(items) ? items : [];
}

// Actor IDs discovered via Apify Store search 2026-05-07. Most-used community
// actors at the time. If schemas drift we re-tune normalize* functions; the
// actor IDs here are the moving parts.
//   - memo23/loopnet-scraper-ppe — LoopNet, 6.8k+ runs, ~$1.50/run pricing
//   - powerai/crexi-listing-scraper — Crexi, 540+ runs
const LOOPNET_ACTOR = "memo23/loopnet-scraper-ppe";
const CREXI_ACTOR = "powerai/crexi-listing-scraper";

export async function scrapeLoopnet(token: string, criteria: { metros: string[]; states: string[] }): Promise<RawListing[]> {
  // memo23 actor accepts startUrls or keyword search. We feed it constructed
  // LoopNet search URLs for multifamily for-sale in each metro. Actor returns
  // a flat list of listings.
  const startUrls = criteria.metros.map((metro) => ({
    url: `https://www.loopnet.com/search/multifamily/${slugify(metro)}/for-sale/`,
  }));
  try {
    const items = await runActor(token, {
      actorId: LOOPNET_ACTOR,
      input: {
        startUrls,
        maxItems: 200,
        proxyConfiguration: { useApifyProxy: true },
      },
      timeoutSeconds: 600,
    });
    return items.map((raw) => normalizeLoopnetItem(raw));
  } catch (e) {
    console.warn("[apify] loopnet actor failed — skipping:", e instanceof Error ? e.message : e);
    return [];
  }
}

export async function scrapeCrexi(token: string, criteria: { metros: string[]; states: string[] }): Promise<RawListing[]> {
  // powerai/crexi-listing-scraper accepts search URLs or terms.
  try {
    const items = await runActor(token, {
      actorId: CREXI_ACTOR,
      input: {
        startUrls: criteria.metros.flatMap((metro) =>
          criteria.states.map((state) => ({
            url: `https://www.crexi.com/properties?types[]=Multifamily&locations[]=${encodeURIComponent(`${metro}, ${state}`)}`,
          }))
        ),
        maxItems: 200,
        proxyConfiguration: { useApifyProxy: true },
      },
      timeoutSeconds: 600,
    });
    return items.map((raw) => normalizeCrexiItem(raw));
  } catch (e) {
    console.warn("[apify] crexi actor failed — skipping:", e instanceof Error ? e.message : e);
    return [];
  }
}

function normalizeLoopnetItem(raw: any): RawListing {
  // Defensive parsing — actor schemas drift. Wrap every field in a try/catch
  // by using ?? null fallbacks.
  return {
    source: "loopnet",
    source_listing_id: String(raw?.id ?? raw?.listingId ?? raw?.url ?? Date.now()),
    source_url: raw?.url,
    title: raw?.title ?? raw?.name,
    address: raw?.address?.fullAddress ?? raw?.address,
    city: raw?.address?.city ?? raw?.city,
    state: raw?.address?.state ?? raw?.state,
    zip: raw?.address?.zipCode ?? raw?.zip,
    units: numberOrNull(raw?.units ?? raw?.numberOfUnits ?? raw?.unitCount),
    year_built: numberOrNull(raw?.yearBuilt ?? raw?.year_built),
    asking_price: numberOrNull(raw?.price ?? raw?.askingPrice),
    noi_advertised: numberOrNull(raw?.noi ?? raw?.netOperatingIncome),
    cap_rate_advertised: numberOrNull(raw?.capRate ?? raw?.cap_rate),
    broker_name: raw?.broker?.name ?? raw?.brokerName,
    broker_company: raw?.broker?.company ?? raw?.brokerCompany,
    broker_email: raw?.broker?.email,
    broker_phone: raw?.broker?.phone,
    raw,
  };
}

function normalizeCrexiItem(raw: any): RawListing {
  return {
    source: "crexi",
    source_listing_id: String(raw?.id ?? raw?.listingId ?? raw?.url ?? Date.now()),
    source_url: raw?.url ?? raw?.detailUrl,
    title: raw?.title ?? raw?.name,
    address: raw?.address,
    city: raw?.city,
    state: raw?.state,
    zip: raw?.zip ?? raw?.postalCode,
    units: numberOrNull(raw?.units ?? raw?.numberOfUnits),
    year_built: numberOrNull(raw?.yearBuilt),
    asking_price: numberOrNull(raw?.askingPrice ?? raw?.price),
    noi_advertised: numberOrNull(raw?.noi),
    cap_rate_advertised: numberOrNull(raw?.capRate),
    broker_name: raw?.brokerName ?? raw?.broker,
    broker_company: raw?.brokerCompany,
    raw,
  };
}

function numberOrNull(v: unknown): number | undefined {
  if (v === null || v === undefined) return undefined;
  const n = typeof v === "string" ? Number(v.replace(/[^\d.-]/g, "")) : Number(v);
  return Number.isFinite(n) ? n : undefined;
}

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
