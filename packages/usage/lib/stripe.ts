import { getTenantIntegration } from "@naples/db";
import { listTenantUsageSnapshots } from "./queries";
import type { UsageVendor } from "./types";

// Stripe metered-usage publisher.
//
// Setup (done once in Stripe dashboard per tenant):
//   1. Create 4 Products in Stripe: "Anthropic Usage", "Apify Usage",
//      "AssemblyAI Usage", "Resend Usage". Each Product has a metered
//      Price priced at $0.01 per unit (so we report cents).
//   2. Create a Subscription per tenant containing:
//        - The fixed-price tier Item (Premium / Design Partner /…)
//        - One metered Item per vendor (subscription_item_id captured)
//   3. Store the subscription_item_ids on the tenant via:
//        upsertTenantIntegration({
//          tenant_id, kind: 'stripe',
//          config: { customer_id, subscription_id,
//            subscription_items: {
//              anthropic: 'si_…', apify: 'si_…',
//              assemblyai: 'si_…', resend: 'si_…',
//            }}
//        })
//
// Monthly cron calls pushUsageToStripe(tenantId, month) which:
//   - Sums tenant_usage_snapshots.cost_usd per vendor for the month
//   - Posts usage_records to each vendor's subscription_item_id
//   - Quantity = cents (cost_usd × 100). Stripe Price is $0.01/unit
//     → resulting invoice line equals exact cost in dollars.

const STRIPE_API_BASE = "https://api.stripe.com/v1";

type StripeIntegrationConfig = {
  customer_id?: string;
  subscription_id?: string;
  subscription_items?: Partial<Record<UsageVendor, string>>;
};

export type PushResult = {
  tenant_id: string;
  vendor: UsageVendor;
  status: "ok" | "skipped" | "error";
  cents?: number;
  message?: string;
  usage_record_id?: string;
};

export type PushSummary = {
  tenant_id: string;
  month_start: string;
  month_end: string;
  results: PushResult[];
};

// Pushes one billing-period's usage to Stripe for one tenant. Idempotent
// per (subscription_item, period) since Stripe replaces the latest usage
// record when action='set' is used. Default action='increment' is unsafe
// for re-runs; we use 'set'.
export async function pushUsageToStripe(
  tenantId: string,
  // Month start in UTC, e.g. 2026-05-01T00:00:00Z. Defaults to first day
  // of the current month.
  monthStart: Date = firstOfCurrentMonth()
): Promise<PushSummary> {
  const apiKey = process.env.STRIPE_SECRET_KEY;
  const monthEnd = new Date(Date.UTC(monthStart.getUTCFullYear(), monthStart.getUTCMonth() + 1, 1));

  if (!apiKey) {
    return {
      tenant_id: tenantId,
      month_start: monthStart.toISOString(),
      month_end: monthEnd.toISOString(),
      results: [{ tenant_id: tenantId, vendor: "anthropic", status: "skipped", message: "STRIPE_SECRET_KEY not set" }],
    };
  }

  const integration = await getTenantIntegration(tenantId, "stripe");
  const config = (integration?.config ?? {}) as StripeIntegrationConfig;
  const items = config.subscription_items ?? {};

  // Read this tenant's full month of snapshots (queries.ts caps the
  // window at the default 30 days, which fully covers any month).
  const snapshots = await listTenantUsageSnapshots(tenantId, 35);
  const inMonth = snapshots.filter((s) => {
    const t = new Date(s.period_start);
    return t >= monthStart && t < monthEnd;
  });

  const vendors: UsageVendor[] = ["anthropic", "apify", "assemblyai", "resend"];
  const results: PushResult[] = [];
  for (const vendor of vendors) {
    const subscriptionItemId = items[vendor];
    if (!subscriptionItemId) {
      results.push({
        tenant_id: tenantId,
        vendor,
        status: "skipped",
        message: "no subscription_item_id configured for this vendor",
      });
      continue;
    }
    const vendorRows = inMonth.filter((s) => s.vendor === vendor);
    const totalCost = vendorRows.reduce((s, r) => s + Number(r.cost_usd), 0);
    const cents = Math.round(totalCost * 100);

    try {
      const body = new URLSearchParams({
        quantity: String(cents),
        // Anchor the record at month-end so Stripe attributes it to the
        // correct billing period. Math handles month-rollover.
        timestamp: String(Math.floor((monthEnd.getTime() - 1000) / 1000)),
        // 'set' is idempotent — re-running this push replaces the record
        // for this period rather than adding to it.
        action: "set",
      });
      const res = await fetch(
        `${STRIPE_API_BASE}/subscription_items/${subscriptionItemId}/usage_records`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: body.toString(),
        }
      );
      if (!res.ok) {
        const text = await res.text();
        results.push({
          tenant_id: tenantId,
          vendor,
          status: "error",
          cents,
          message: `stripe ${res.status}: ${text.slice(0, 200)}`,
        });
        continue;
      }
      const json = (await res.json()) as { id?: string };
      results.push({
        tenant_id: tenantId,
        vendor,
        status: "ok",
        cents,
        usage_record_id: json.id,
      });
    } catch (err) {
      results.push({
        tenant_id: tenantId,
        vendor,
        status: "error",
        cents,
        message: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return {
    tenant_id: tenantId,
    month_start: monthStart.toISOString(),
    month_end: monthEnd.toISOString(),
    results,
  };
}

function firstOfCurrentMonth(now: Date = new Date()): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}
