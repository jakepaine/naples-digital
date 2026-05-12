// Daily usage-sync cron.
//
// Tick (every 24h by default, configurable via TICK_INTERVAL_MS):
//   1. Compute yesterday's UTC window.
//   2. For each active tenant × each vendor adapter:
//      a. Adapter fetches usage from the vendor (or DB rollup).
//      b. Result is upserted into tenant_usage_snapshots.
//   3. Log summary: ok / skipped / errored counts per vendor.
//
// Failure mode is per-(tenant, vendor): a bad fetch on one combination
// does not block the rest. Re-running the cron is idempotent — the
// snapshot table's UNIQUE(tenant_id, vendor, period_start) means a
// retry overwrites yesterday's row rather than inserting duplicates.
//
// Defaults to running once at boot + every 24h. Override with
// TICK_INTERVAL_MS for testing. For one-shot CI invocation, use
// `pnpm tick` which runs tick-once.ts.

import { syncAllTenantUsage, yesterdayUtcWindow } from "@naples/usage";

const TICK_INTERVAL_MS = Number(process.env.TICK_INTERVAL_MS ?? 24 * 60 * 60 * 1000);

console.log("[usage-sync] starting…");
console.log(`[usage-sync] tick interval: ${(TICK_INTERVAL_MS / 1000 / 60 / 60).toFixed(1)} hours`);

main().catch((e) => {
  console.error("[usage-sync] fatal", e);
  process.exit(1);
});

async function main() {
  await tick().catch((e) => console.error("[usage-sync] tick error", e));
  setInterval(() => {
    tick().catch((e) => console.error("[usage-sync] tick error", e));
  }, TICK_INTERVAL_MS);
}

async function tick() {
  const window = yesterdayUtcWindow();
  console.log(`[usage-sync] tick start window=${window.start.toISOString()} to ${window.end.toISOString()}`);
  const results = await syncAllTenantUsage(window);
  const summary = results.reduce(
    (acc, r) => {
      acc[r.status] = (acc[r.status] ?? 0) + 1;
      if (r.status === "ok") acc.total_cost += r.cost_usd ?? 0;
      return acc;
    },
    { ok: 0, skipped: 0, error: 0, total_cost: 0 } as Record<string, number>
  );
  console.log(
    `[usage-sync] tick done ok=${summary.ok} skipped=${summary.skipped} error=${summary.error} total_cost_usd=${summary.total_cost.toFixed(4)}`
  );
  for (const r of results.filter((r) => r.status === "error")) {
    console.warn(`[usage-sync] error tenant=${r.tenant_id} vendor=${r.vendor} msg=${r.message}`);
  }
}
