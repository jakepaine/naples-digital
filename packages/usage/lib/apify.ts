import { createServerClient, hasSupabase } from "@naples/db";
import type { UsageAdapter, UsageSnapshot, UsageWindow } from "./types";

// Apify usage adapter. Apify's REST API does not expose a user-settable
// meta field on runs, so per-tenant attribution is tracked in our own
// tenant_apify_runs mapping table (populated by every Apify caller at
// launch time via recordApifyRun()).
//
// Daily sync flow:
//   1. SELECT apify_run_id FROM tenant_apify_runs WHERE tenant_id = ?
//      AND started_at in window.
//   2. For each run_id, GET /v2/actor-runs/:id → usageTotalUsd.
//   3. Sum and write a snapshot.

const APIFY_API_BASE = "https://api.apify.com/v2";

type ApifyRunDetail = {
  data: {
    id: string;
    actId: string;
    startedAt: string;
    finishedAt: string | null;
    status: string;
    usageTotalUsd?: number;
    usage?: Record<string, number>;
  };
};

export function createApifyAdapter(): UsageAdapter {
  return {
    vendor: "apify",
    async fetchUsage(tenantId, window): Promise<UsageSnapshot | null> {
      const token = process.env.APIFY_API_TOKEN;
      if (!token) return null;
      if (!hasSupabase()) return null;

      // Pull tenant's run IDs in the window from our mapping table.
      const sb = createServerClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (sb.from as any)("tenant_apify_runs")
        .select("apify_run_id, actor_id, source_app, started_at")
        .eq("tenant_id", tenantId)
        .gte("started_at", window.start.toISOString())
        .lt("started_at", window.end.toISOString());
      if (error) return null;
      const mappings = (data ?? []) as Array<{
        apify_run_id: string;
        actor_id: string;
        source_app: string | null;
        started_at: string;
      }>;

      if (mappings.length === 0) {
        return {
          tenant_id: tenantId,
          vendor: "apify",
          period_start: window.start.toISOString(),
          period_end: window.end.toISOString(),
          units: 0,
          unit_label: "actor_runs",
          cost_usd: 0,
          raw_payload: { run_count: 0 },
        };
      }

      // Fetch each run's detail in parallel. Capped at modest concurrency
      // to stay polite — Apify's rate limit is generous but bursting
      // a thousand requests is rude.
      const detailUrls = mappings.map((m) => `${APIFY_API_BASE}/actor-runs/${m.apify_run_id}?token=${token}`);
      const details = await fetchAllWithLimit(detailUrls, 8);

      let totalCost = 0;
      let runsCounted = 0;
      const breakdown: Array<{ run_id: string; cost_usd: number; source_app: string | null }> = [];
      for (let i = 0; i < mappings.length; i++) {
        const mapping = mappings[i];
        const detail = details[i];
        if (!mapping || !detail) continue;
        const cost = detail.data?.usageTotalUsd ?? 0;
        totalCost += cost;
        runsCounted += 1;
        breakdown.push({
          run_id: mapping.apify_run_id,
          cost_usd: cost,
          source_app: mapping.source_app,
        });
      }

      return {
        tenant_id: tenantId,
        vendor: "apify",
        period_start: window.start.toISOString(),
        period_end: window.end.toISOString(),
        units: runsCounted,
        unit_label: "actor_runs",
        cost_usd: Math.round(totalCost * 10000) / 10000,
        raw_payload: { run_count: runsCounted, breakdown },
      };
    },
  };
}

async function fetchAllWithLimit(urls: string[], limit: number): Promise<Array<ApifyRunDetail | null>> {
  const results: Array<ApifyRunDetail | null> = new Array(urls.length).fill(null);
  let nextIndex = 0;
  async function worker() {
    while (nextIndex < urls.length) {
      const i = nextIndex++;
      try {
        const res = await fetch(urls[i] as string);
        if (res.ok) results[i] = (await res.json()) as ApifyRunDetail;
      } catch {
        // Swallow — null result is treated as zero usage.
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, urls.length) }, () => worker()));
  return results;
}
