// One-shot variant of the sync — useful for backfills, CI smoke tests,
// or operator-triggered re-runs after a fix. Exits non-zero if any
// (tenant, vendor) combo errored.

import { syncAllTenantUsage, yesterdayUtcWindow } from "@naples/usage";

async function main() {
  const window = yesterdayUtcWindow();
  console.log(`[usage-sync:tick-once] window=${window.start.toISOString()} to ${window.end.toISOString()}`);
  const results = await syncAllTenantUsage(window);
  const errors = results.filter((r) => r.status === "error");
  const ok = results.filter((r) => r.status === "ok");
  console.log(`[usage-sync:tick-once] ok=${ok.length} errors=${errors.length} skipped=${results.length - ok.length - errors.length}`);
  for (const r of errors) {
    console.error(`[usage-sync:tick-once] error tenant=${r.tenant_id} vendor=${r.vendor} msg=${r.message}`);
  }
  process.exit(errors.length > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error("[usage-sync:tick-once] fatal", e);
  process.exit(1);
});
