// Monthly Stripe push entry point.
//
// For each active tenant with a stripe integration row, sum this month's
// usage and post the totals to Stripe as metered usage records (one per
// vendor). Idempotent — uses action='set' so re-runs replace rather than
// add. Safe to run multiple times during the month; we typically run once
// near the end of each billing cycle, just before Stripe finalizes the
// invoice.
//
// Schedule (Railway cron): on the 1st of each month at 02:00 UTC. The
// month argument defaults to the previous month so the push captures the
// completed billing period.

import { listTenants } from "@naples/db";
import { pushUsageToStripe } from "@naples/usage";

async function main() {
  // Push for the previous month by default — the one just completed.
  const now = new Date();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));

  const tenants = (await listTenants()).filter((t) => t.status === "active");
  console.log(`[push-stripe] pushing ${tenants.length} tenants for ${monthStart.toISOString().slice(0, 7)}`);

  let totalOk = 0;
  let totalSkipped = 0;
  let totalError = 0;
  for (const tenant of tenants) {
    const summary = await pushUsageToStripe(tenant.id, monthStart);
    for (const r of summary.results) {
      if (r.status === "ok") totalOk += 1;
      else if (r.status === "skipped") totalSkipped += 1;
      else totalError += 1;
      if (r.status === "error") {
        console.error(`[push-stripe] error tenant=${tenant.id} vendor=${r.vendor} msg=${r.message}`);
      } else if (r.status === "ok") {
        console.log(`[push-stripe] ok tenant=${tenant.id} vendor=${r.vendor} cents=${r.cents}`);
      }
    }
  }
  console.log(`[push-stripe] done ok=${totalOk} skipped=${totalSkipped} error=${totalError}`);
  process.exit(totalError > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error("[push-stripe] fatal", e);
  process.exit(1);
});
