import { createServerClient, hasSupabase } from "@naples/db";
import type { UsageSnapshot } from "./types";

// Writes a snapshot via the upsert_tenant_usage_snapshot RPC. Idempotent
// on (tenant_id, vendor, period_start) — re-running the cron for the
// same day refreshes the existing row rather than inserting a duplicate.
export async function writeUsageSnapshot(snapshot: UsageSnapshot): Promise<string | null> {
  if (!hasSupabase()) return null;
  const sb = createServerClient();
  // RPC name + params not yet in generated Database types — they appear
  // after migration 0036 is applied and types are regenerated.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (sb.rpc as any)("upsert_tenant_usage_snapshot", {
    p_tenant_id: snapshot.tenant_id,
    p_vendor: snapshot.vendor,
    p_period_start: snapshot.period_start,
    p_period_end: snapshot.period_end,
    p_units: snapshot.units,
    p_unit_label: snapshot.unit_label,
    p_cost_usd: snapshot.cost_usd,
    p_raw_payload: snapshot.raw_payload,
  });
  if (error) return null;
  return (data as unknown as string) ?? null;
}
