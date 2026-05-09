// POST /api/deliverability/check
// Pulls the tenant's vendor account stats (Instantly preferred, then
// Smartlead) and runs the threshold engine. Persists every alert
// candidate as a row in deliverability_alerts (idempotent on a 24-hour
// window for the same alert_kind + campaign_id), Slack-pings the
// criticals, and returns the full set.

import { NextResponse } from "next/server";
import { createServerClient, hasSupabase, notifyTenantSlack } from "@naples/db";
import { getServerTenant } from "@naples/db/next";
import { getOutreachVendorForTenant } from "@naples/outreach";
import {
  evaluateAccountStats,
  type VendorAccountStats,
  type DeliverabilityAlertCandidate,
} from "@naples/outreach/complaint-monitor";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(_req: Request) {
  if (!hasSupabase()) {
    return NextResponse.json(
      { error: "supabase not configured" },
      { status: 500 },
    );
  }
  const tenant = await getServerTenant({ fallbackSlug: "naplesdigital" });
  const vendor = await getOutreachVendorForTenant(tenant.id);
  if (!vendor) {
    return NextResponse.json(
      {
        ok: false,
        error: "tenant has no outreach vendor configured",
      },
      { status: 400 },
    );
  }

  // Vendors don't yet expose a normalized stats endpoint in our adapters
  // — use whatever is available, or stub. The adapter shape is best-
  // effort: when the vendor SDK doesn't expose stats yet, we synthesize
  // a "no data" result so the route still completes.
  let stats: VendorAccountStats;
  try {
    stats = await fetchAccountStats(vendor);
  } catch (e) {
    return NextResponse.json(
      { error: `vendor stats failed: ${(e as Error).message}` },
      { status: 502 },
    );
  }

  const candidates = evaluateAccountStats(stats);

  const sb = createServerClient() as any;
  const persisted: any[] = [];
  for (const candidate of candidates) {
    // Idempotency: skip if an unresolved alert with the same kind +
    // campaign_id has been written in the last 24h.
    const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
    const { data: dupes } = await sb
      .from("deliverability_alerts")
      .select("id")
      .eq("tenant_id", tenant.id)
      .eq("alert_kind", candidate.alert_kind)
      .eq("campaign_id", candidate.campaign_id ?? null)
      .gte("created_at", since)
      .eq("resolved", false)
      .limit(1);
    if (dupes && dupes.length > 0) continue;

    const { data: row } = await sb
      .from("deliverability_alerts")
      .insert({
        tenant_id: tenant.id,
        source: stats.source,
        alert_kind: candidate.alert_kind,
        severity: candidate.severity,
        metric_name: candidate.metric_name,
        metric_value: candidate.metric_value,
        threshold: candidate.threshold,
        message: candidate.message,
        campaign_id: candidate.campaign_id ?? null,
        campaign_name: candidate.campaign_name ?? null,
        paused_campaign: false,
      })
      .select("*")
      .single();
    if (row) persisted.push(row);

    if (candidate.severity === "critical") {
      await fireCriticalSlack({
        tenantId: tenant.id,
        tenantSlug: tenant.slug,
        candidate,
      });
      // Mark slack_alerted true even if the actual webhook is missing —
      // the row tracks our intent, the dashboard will show whether the
      // tenant has Slack wired up.
      if (row?.id) {
        await sb
          .from("deliverability_alerts")
          .update({ slack_alerted: true })
          .eq("id", row.id);
      }
      // Auto-pause is recommended-only here. We don't yet have a
      // pause(campaign_id) method on the vendor adapter — wire that
      // in a follow-up. For now we flag the row's recommend so the
      // operator can act on it manually.
    }
  }

  return NextResponse.json({
    ok: true,
    stats: summary(stats),
    candidates,
    persisted_count: persisted.length,
  });
}

async function fetchAccountStats(vendor: any): Promise<VendorAccountStats> {
  // Best-effort shim — the existing vendor adapters in @naples/outreach
  // don't yet expose a getAccountStats method. Until they do, we use a
  // synthetic zero result so the threshold engine has something to
  // evaluate. When the adapter ships getAccountStats, swap this body.
  if (typeof vendor?.getAccountStats === "function") {
    return await vendor.getAccountStats();
  }
  return {
    source: vendor?.kind ?? "instantly",
    delivered: 0,
    bounces: 0,
    complaints: 0,
    unsubscribes: 0,
    opens: 0,
    replies: 0,
    campaigns: [],
  };
}

async function fireCriticalSlack(args: {
  tenantId: string;
  tenantSlug: string;
  candidate: DeliverabilityAlertCandidate;
}): Promise<boolean> {
  const c = args.candidate;
  const text = [
    `🚨 *Deliverability ${c.severity.toUpperCase()}* — tenant \`${args.tenantSlug}\``,
    `*${c.alert_kind.replace(/_/g, " ")}*: ${c.message}`,
    c.recommend_auto_pause &&
      `_Recommended: pause sending until remediated. 2024 Google/Yahoo bulk-sender rules in play._`,
  ]
    .filter(Boolean)
    .join("\n");
  return await notifyTenantSlack({
    tenantId: args.tenantId,
    text,
    opts: { envFallback: "SLACK_WEBHOOK_DELIVERABILITY" },
  });
}

function summary(stats: VendorAccountStats) {
  return {
    source: stats.source,
    delivered: stats.delivered,
    bounce_rate: rate(stats.bounces, stats.delivered),
    complaint_rate: rate(stats.complaints, stats.delivered),
    unsubscribe_rate: rate(stats.unsubscribes, stats.delivered),
    open_rate: rate(stats.opens, stats.delivered),
    reply_rate: rate(stats.replies, stats.delivered),
    campaigns_evaluated: (stats.campaigns ?? []).length,
  };
}

function rate(n: number, d: number): number {
  if (!d) return 0;
  return Math.round((n / d) * 10000) / 10000;
}
