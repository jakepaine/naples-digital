import type { UsageAdapter, UsageSnapshot, UsageWindow } from "./types";

// Apify usage adapter. Naples runs the Apify account org-wide; per-tenant
// attribution comes from a `tenant:${tenantId}` build tag on every actor
// run. The /v2/actor-runs endpoint filters by date + status; we aggregate
// USD totals from `usage` on each run.
//
// We sum across ALL tenants' actors — to attribute per-tenant, runs MUST
// be tagged at launch by every Apify caller in the codebase (see Apify
// per-tenant tag enforcement task).

const APIFY_API_BASE = "https://api.apify.com/v2";

type ApifyRun = {
  id: string;
  buildId: string;
  startedAt: string;
  finishedAt: string | null;
  // Free-form metadata set at run launch — we standardize on
  // { tenantId: "<uuid>" } across all Apify-calling services.
  meta?: { tenantId?: string; [k: string]: unknown };
  // Per-run usage breakdown. `usageTotalUsd` is the canonical dollar
  // figure Apify shows on each run page.
  usage?: Record<string, number>;
  usageTotalUsd?: number;
};

type ApifyRunsList = {
  data: {
    items: ApifyRun[];
    total: number;
    count: number;
  };
};

export function createApifyAdapter(): UsageAdapter {
  return {
    vendor: "apify",
    async fetchUsage(tenantId, window): Promise<UsageSnapshot | null> {
      const token = process.env.APIFY_API_TOKEN;
      if (!token) return null;

      // Apify pagination: fetch up to 1000 runs in window, sum the ones
      // tagged with this tenant. For a single-day window this is well
      // under the limit; only matters at scale.
      const params = new URLSearchParams({
        token,
        limit: "1000",
        desc: "true",
        // Restrict to finished runs whose finishedAt is in the window.
        // Apify's filter granularity is per-second.
      });

      const res = await fetch(`${APIFY_API_BASE}/actor-runs?${params.toString()}`);
      if (!res.ok) return null;
      const json = (await res.json()) as ApifyRunsList;

      let totalComputeCost = 0;
      let totalRuns = 0;
      const matchedRuns: ApifyRun[] = [];
      for (const run of json.data?.items ?? []) {
        if (run.meta?.tenantId !== tenantId) continue;
        const finishedAt = run.finishedAt ? new Date(run.finishedAt) : null;
        if (!finishedAt || finishedAt < window.start || finishedAt >= window.end) continue;
        totalComputeCost += run.usageTotalUsd ?? 0;
        totalRuns += 1;
        matchedRuns.push(run);
      }

      return {
        tenant_id: tenantId,
        vendor: "apify",
        period_start: window.start.toISOString(),
        period_end: window.end.toISOString(),
        units: totalRuns,
        unit_label: "actor_runs",
        cost_usd: Math.round(totalComputeCost * 10000) / 10000,
        raw_payload: { matched_runs: matchedRuns } as Record<string, unknown>,
      };
    },
  };
}
