// MIA on-market deal cron.
//
// Loop (every 6 hours):
//   1. Pull MIA's deal_criteria from Supabase (markets, units, vintage, ceiling).
//   2. Pull MIA's Apify token from Vault (or skip with warning if placeholder/missing).
//   3. For each metro: scrape LoopNet + Crexi via Apify actors.
//   4. Normalize → upsert into re_deals (dedupe by source + source_listing_id).
//   5. For new + updated listings: run underwrite() → insert re_underwrites.
//   6. For newly-qualifying deals: send email alert via Resend (or console fallback).
//
// Failure mode is graceful per stage. A bad scrape doesn't kill the loop;
// an Apify error logs and continues to the next metro. Worker restarts on
// process exit (Railway restartPolicy ON_FAILURE).

import {
  getTenantBySlug,
  getDealCriteria,
  upsertDeal,
  createUnderwrite,
  type ReDeal,
} from "@naples/db";
import { getApifyToken, scrapeLoopnet, scrapeCrexi, type RawListing } from "./lib/apify.js";
import { underwrite } from "./lib/underwriting.js";
import { sendDealAlert } from "./lib/email.js";

const TICK_INTERVAL_MS = Number(process.env.TICK_INTERVAL_MS ?? 6 * 60 * 60 * 1000); // 6h default
const MIA_TOOLS_URL = process.env.NEXT_PUBLIC_MIA_URL ?? "https://mia-production.up.railway.app";

console.log("[mia-onmarket-cron] starting…");
console.log(`[mia-onmarket-cron] tick interval: ${(TICK_INTERVAL_MS / 1000 / 60).toFixed(0)} minutes`);

main().catch((e) => {
  console.error("[mia-onmarket-cron] fatal", e);
  process.exit(1);
});

async function main() {
  // Run immediately on boot, then on interval.
  await tick().catch((e) => console.error("[mia-onmarket-cron] tick error", e));
  setInterval(() => {
    tick().catch((e) => console.error("[mia-onmarket-cron] tick error", e));
  }, TICK_INTERVAL_MS);
}

async function tick() {
  const startedAt = new Date().toISOString();
  console.log(`[mia-onmarket-cron] tick start ${startedAt}`);

  const tenant = await getTenantBySlug("mia");
  if (!tenant) {
    console.warn("[mia-onmarket-cron] MIA tenant not found — exiting tick");
    return;
  }
  const criteria = await getDealCriteria(tenant.id);
  if (!criteria) {
    console.warn("[mia-onmarket-cron] no re_deal_criteria row for MIA — exiting tick");
    return;
  }
  const token = await getApifyToken(tenant.id);
  if (!token) {
    console.warn("[mia-onmarket-cron] Apify token not set or still placeholder — skipping scrape. Will try again next tick.");
    return;
  }

  const allListings: RawListing[] = [];
  for (const market of criteria.markets) {
    console.log(`[mia-onmarket-cron] scraping ${market.metro}…`);
    try {
      const lp = await scrapeLoopnet(token, { metros: [market.metro], states: market.states });
      console.log(`[mia-onmarket-cron]   loopnet: ${lp.length} raw listings`);
      allListings.push(...lp);
    } catch (e) {
      console.error(`[mia-onmarket-cron]   loopnet failed:`, e instanceof Error ? e.message : e);
    }
    try {
      const cx = await scrapeCrexi(token, { metros: [market.metro], states: market.states });
      console.log(`[mia-onmarket-cron]   crexi: ${cx.length} raw listings`);
      allListings.push(...cx);
    } catch (e) {
      console.error(`[mia-onmarket-cron]   crexi failed:`, e instanceof Error ? e.message : e);
    }
  }

  console.log(`[mia-onmarket-cron] total ${allListings.length} raw listings to process`);
  let upserted = 0;
  let newDeals = 0;
  let newQualifying = 0;
  let alertsSent = 0;

  for (const listing of allListings) {
    try {
      // Pre-filter: skip listings missing critical fields
      if (!listing.units || !listing.asking_price) continue;

      const isNewBeforeUpsert = await isNewListing(tenant.id, listing.source, listing.source_listing_id);
      const deal = await upsertDeal(tenant.id, {
        source: listing.source,
        source_url: listing.source_url ?? null,
        source_listing_id: listing.source_listing_id,
        title: listing.title ?? null,
        address: listing.address ?? null,
        city: listing.city ?? null,
        state: listing.state ?? null,
        zip: listing.zip ?? null,
        units: listing.units ?? null,
        year_built: listing.year_built ?? null,
        asking_price: listing.asking_price ?? null,
        noi_advertised: listing.noi_advertised ?? null,
        cap_rate_advertised: listing.cap_rate_advertised ?? null,
        broker_name: listing.broker_name ?? null,
        broker_company: listing.broker_company ?? null,
        broker_email: listing.broker_email ?? null,
        broker_phone: listing.broker_phone ?? null,
        raw: listing.raw,
        status: "new",
      });
      if (!deal) continue;
      upserted++;
      if (isNewBeforeUpsert) newDeals++;

      // Underwrite (uses zero-rent-comp inputs for v1; rent comps come later)
      const uw = underwrite(
        {
          units: deal.units,
          year_built: deal.year_built,
          asking_price: deal.asking_price,
          noi_advertised: deal.noi_advertised,
          cap_rate_advertised: deal.cap_rate_advertised,
          city: deal.city,
          state: deal.state,
        },
        criteria
      );
      await createUnderwrite(tenant.id, {
        deal_id: deal.id,
        model_version: uw.model_version,
        inputs: uw.inputs,
        cap_rate_actual: uw.cap_rate_actual,
        noi_estimated: uw.noi_estimated,
        dscr_at_market: uw.dscr_at_market,
        value_add_upside: uw.value_add_upside,
        target_irr: uw.target_irr,
        qualifying: uw.qualifying,
        summary: uw.summary,
        score: uw.score,
      });

      // Alert email only on new + qualifying
      if (isNewBeforeUpsert && uw.qualifying) {
        newQualifying++;
        const result = await sendDealAlert({
          tenantId: tenant.id,
          dealUrl: `${MIA_TOOLS_URL}/deals/${deal.id}`,
          title: deal.title ?? deal.address ?? "New qualifying deal",
          underwritingSummary: uw.summary,
          unitCount: deal.units,
          askingPrice: deal.asking_price,
          city: deal.city,
          state: deal.state,
        });
        if (result.ok && result.via !== "skipped") alertsSent++;
      }
    } catch (e) {
      console.error("[mia-onmarket-cron] listing processing error", e);
    }
  }

  console.log(
    `[mia-onmarket-cron] tick done · upserted ${upserted}, new ${newDeals}, qualifying ${newQualifying}, alerts ${alertsSent}`
  );
}

async function isNewListing(
  tenantId: string,
  source: string,
  sourceListingId: string | null | undefined
): Promise<boolean> {
  if (!sourceListingId) return true;
  const { createServerClient } = await import("@naples/db");
  const sb = createServerClient();
  const { data } = await sb
    .from("re_deals")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("source", source)
    .eq("source_listing_id", sourceListingId)
    .maybeSingle();
  return !data;
}

// Type re-import workaround: ReDeal lifted at top so eslint doesn't whine on
// unused import in some configurations.
type _Refed = ReDeal;
