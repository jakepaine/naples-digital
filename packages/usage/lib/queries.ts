import { createServerClient, hasSupabase } from "@naples/db";
import type { UsageVendor } from "./types";

export type UsageSnapshotRow = {
  id: string;
  tenant_id: string;
  vendor: UsageVendor;
  period_start: string;
  period_end: string;
  units: number;
  unit_label: string;
  cost_usd: number;
  fetched_at: string;
};

// Last N days of snapshots for a tenant. Newest first.
export async function listTenantUsageSnapshots(
  tenantId: string,
  daysBack = 30
): Promise<UsageSnapshotRow[]> {
  if (!hasSupabase()) return [];
  const sb = createServerClient();
  const since = new Date();
  since.setUTCDate(since.getUTCDate() - daysBack);
  // tenant_usage_snapshots not in generated Database types until 0036 is
  // applied and types regenerated — cast at the boundary.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (sb.from as any)("tenant_usage_snapshots")
    .select("id, tenant_id, vendor, period_start, period_end, units, unit_label, cost_usd, fetched_at")
    .eq("tenant_id", tenantId)
    .gte("period_start", since.toISOString())
    .order("period_start", { ascending: false });
  if (error) return [];
  return (data ?? []) as unknown as UsageSnapshotRow[];
}

export type VendorRollup = {
  vendor: UsageVendor;
  mtd_cost_usd: number;       // month-to-date
  last_30d_cost_usd: number;
  projected_eom_usd: number;  // straight-line projection from MTD daily avg
  daily: Array<{ date: string; cost_usd: number; units: number }>;
};

export type UsageSummary = {
  tenant_id: string;
  total_mtd_cost_usd: number;
  total_last_30d_cost_usd: number;
  total_projected_eom_usd: number;
  by_vendor: VendorRollup[];
};

// Aggregates a tenant's last-30-day snapshots into per-vendor rollups
// suitable for the dashboard. Vendors with zero snapshots in the window
// still appear in by_vendor with zeroed metrics so the UI shows them.
export async function getTenantUsageSummary(tenantId: string): Promise<UsageSummary> {
  const rows = await listTenantUsageSnapshots(tenantId, 30);
  const now = new Date();
  const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const daysIntoMonth = Math.max(1, now.getUTCDate());
  const daysInMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0)).getUTCDate();

  const vendors: UsageVendor[] = ["anthropic", "apify", "assemblyai", "resend"];
  const by_vendor: VendorRollup[] = vendors.map((vendor) => {
    const v = rows.filter((r) => r.vendor === vendor);
    const mtd = v
      .filter((r) => new Date(r.period_start) >= startOfMonth)
      .reduce((s, r) => s + Number(r.cost_usd), 0);
    const last30 = v.reduce((s, r) => s + Number(r.cost_usd), 0);
    const projected = (mtd / daysIntoMonth) * daysInMonth;
    const daily = v
      .map((r) => ({
        date: r.period_start.slice(0, 10),
        cost_usd: Number(r.cost_usd),
        units: Number(r.units),
      }))
      .reverse();
    return {
      vendor,
      mtd_cost_usd: round4(mtd),
      last_30d_cost_usd: round4(last30),
      projected_eom_usd: round4(projected),
      daily,
    };
  });

  const total_mtd = by_vendor.reduce((s, v) => s + v.mtd_cost_usd, 0);
  const total_30d = by_vendor.reduce((s, v) => s + v.last_30d_cost_usd, 0);
  const total_proj = by_vendor.reduce((s, v) => s + v.projected_eom_usd, 0);

  return {
    tenant_id: tenantId,
    total_mtd_cost_usd: round4(total_mtd),
    total_last_30d_cost_usd: round4(total_30d),
    total_projected_eom_usd: round4(total_proj),
    by_vendor,
  };
}

function round4(n: number): number {
  return Math.round(n * 10000) / 10000;
}
