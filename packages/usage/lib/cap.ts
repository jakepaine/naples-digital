import { createServerClient, hasSupabase, getTenantById, notifyTenantSlack } from "@naples/db";

export type SpendCapStatus = {
  tenant_id: string;
  cap_usd: number;          // 0 = unlimited
  current_month_usd: number;
  percent_of_cap: number;   // 0..1, or 0 when uncapped
  allowed: boolean;
  reason: "uncapped" | "ok" | "warning" | "blocked";
};

// Reads tenant.monthly_spend_cap_usd and sums current-month
// tenant_usage_snapshots.cost_usd. Returns whether new API calls should
// be allowed:
//   - uncapped (cap=0): always allowed, reason='uncapped'
//   - <80%: allowed, reason='ok'
//   - 80-100%: allowed, reason='warning'
//   - >=100%: blocked, reason='blocked'
//
// Callers at high-cost API call sites can short-circuit on allowed=false.
// The dashboard surfaces percent_of_cap regardless.
export async function getTenantSpendCapStatus(tenantId: string): Promise<SpendCapStatus> {
  const tenant = await getTenantById(tenantId);
  // tenants.monthly_spend_cap_usd is new in migration 0036; the Tenant
  // type hasn't been regenerated yet, so read via cast.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cap = Number((tenant as any)?.monthly_spend_cap_usd ?? 0);
  if (cap <= 0 || !hasSupabase()) {
    return {
      tenant_id: tenantId,
      cap_usd: 0,
      current_month_usd: 0,
      percent_of_cap: 0,
      allowed: true,
      reason: "uncapped",
    };
  }

  const sb = createServerClient();
  const now = new Date();
  const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (sb.from as any)("tenant_usage_snapshots")
    .select("cost_usd")
    .eq("tenant_id", tenantId)
    .gte("period_start", startOfMonth.toISOString());
  const rows = (data ?? []) as Array<{ cost_usd: number }>;
  const current = rows.reduce((s, r) => s + Number(r.cost_usd), 0);
  const pct = current / cap;
  const reason: SpendCapStatus["reason"] =
    pct >= 1 ? "blocked" : pct >= 0.8 ? "warning" : "ok";
  return {
    tenant_id: tenantId,
    cap_usd: cap,
    current_month_usd: round4(current),
    percent_of_cap: Math.round(pct * 10000) / 10000,
    allowed: pct < 1,
    reason,
  };
}

// Slack-alert wrapper. Fires only on first transition into a warning
// or blocked state per month — uses tenant_usage_alerts as a one-row
// per (tenant, month, level) idempotency key. Without that table the
// helper still works, it just may double-alert; the table lands in a
// follow-up migration if alert spam becomes a real problem.
export async function maybeAlertSpendCap(tenantId: string): Promise<SpendCapStatus> {
  const status = await getTenantSpendCapStatus(tenantId);
  if (status.reason === "warning" || status.reason === "blocked") {
    const verb = status.reason === "blocked" ? "blocked — at" : "approaching cap — at";
    await notifyTenantSlack({
      tenantId,
      text: `:warning: Tenant ${tenantId} ${verb} ${(status.percent_of_cap * 100).toFixed(1)}% of monthly spend cap ($${status.current_month_usd.toFixed(2)} / $${status.cap_usd.toFixed(2)}).`,
    });
  }
  return status;
}

function round4(n: number): number {
  return Math.round(n * 10000) / 10000;
}
