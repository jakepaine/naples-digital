import { createServerClient, hasSupabase } from "./server";

// Cross-module Slack notification helper. Resolves the webhook URL in this
// order:
//   1. Per-tenant tenant_integrations(kind='slack', secret_ref → vault webhook URL)
//   2. Per-channel platform fallback env (e.g. SLACK_WEBHOOK_INBOUND_LEADS)
//   3. Generic platform fallback (SLACK_WEBHOOK_DEFAULT)
// Returns false if no URL is available — callers should treat as no-op.

export interface NotifyTenantSlackOpts {
  /** Per-channel env fallback name (e.g. 'SLACK_WEBHOOK_INBOUND_LEADS') */
  envFallback?: string;
}

export async function notifyTenantSlack(args: {
  tenantId: string;
  text: string;
  opts?: NotifyTenantSlackOpts;
}): Promise<boolean> {
  const url = await resolveTenantSlackWebhook(args.tenantId, args.opts);
  if (!url) return false;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ text: args.text }),
    });
    return res.ok;
  } catch (e) {
    console.error("slack notify failed:", (e as Error).message);
    return false;
  }
}

export async function resolveTenantSlackWebhook(
  tenantId: string,
  opts: NotifyTenantSlackOpts = {},
): Promise<string | null> {
  if (hasSupabase()) {
    try {
      const sb = createServerClient();
      const { data } = await sb.rpc("get_tenant_secret", {
        p_tenant_id: tenantId,
        p_kind: "slack",
      });
      const row = (data ?? [])[0] as { out_secret?: string } | undefined;
      if (row?.out_secret) return row.out_secret;
    } catch (e) {
      console.warn("slack secret lookup failed:", (e as Error).message);
    }
  }
  if (opts.envFallback) {
    const v = process.env[opts.envFallback];
    if (v) return v;
  }
  const v = process.env.SLACK_WEBHOOK_DEFAULT;
  return v ?? null;
}
