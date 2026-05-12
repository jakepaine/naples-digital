import { listTenants } from "@naples/db";
import type { UsageAdapter, UsageWindow } from "./types";
import { createAnthropicAdapter } from "./anthropic";
import { createApifyAdapter } from "./apify";
import { createAssemblyAIAdapter } from "./assemblyai";
import { createResendAdapter } from "./resend";
import { writeUsageSnapshot } from "./snapshot";

export type SyncResult = {
  tenant_id: string;
  vendor: string;
  status: "ok" | "skipped" | "error";
  cost_usd?: number;
  message?: string;
};

// Yesterday in UTC, 00:00 to 24:00. The default window for a nightly cron
// running shortly after midnight. Vendors lag 12-24h on their usage APIs,
// so we never sync "today" — only completed days.
export function yesterdayUtcWindow(now: Date = new Date()): UsageWindow {
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const start = new Date(end);
  start.setUTCDate(end.getUTCDate() - 1);
  return { start, end };
}

export function allAdapters(): UsageAdapter[] {
  return [
    createAnthropicAdapter(),
    createApifyAdapter(),
    createAssemblyAIAdapter(),
    createResendAdapter(),
  ];
}

// Runs every adapter against every active tenant for the given window.
// Returns one result per (tenant, vendor) attempt. Never throws — a
// failure on one tenant/vendor doesn't block the rest.
export async function syncAllTenantUsage(
  window: UsageWindow = yesterdayUtcWindow(),
  adapters: UsageAdapter[] = allAdapters()
): Promise<SyncResult[]> {
  const tenants = await listTenants();
  const active = tenants.filter((t) => t.status === "active");
  const results: SyncResult[] = [];
  for (const tenant of active) {
    for (const adapter of adapters) {
      try {
        const snapshot = await adapter.fetchUsage(tenant.id, window);
        if (!snapshot) {
          results.push({ tenant_id: tenant.id, vendor: adapter.vendor, status: "skipped", message: "no credentials or no workspace" });
          continue;
        }
        await writeUsageSnapshot(snapshot);
        results.push({
          tenant_id: tenant.id,
          vendor: adapter.vendor,
          status: "ok",
          cost_usd: snapshot.cost_usd,
        });
      } catch (err) {
        results.push({
          tenant_id: tenant.id,
          vendor: adapter.vendor,
          status: "error",
          message: err instanceof Error ? err.message : String(err),
        });
      }
    }
  }
  return results;
}
