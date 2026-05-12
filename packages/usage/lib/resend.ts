import { getTenantSecret } from "@naples/db";
import type { UsageAdapter, UsageSnapshot, UsageWindow } from "./types";
import { RESEND_RATE_USD_PER_EMAIL } from "./pricing";

// Resend usage adapter. Each tenant gets its own Resend API key issued
// during setup (Resend's pricing is volume-based and the org plan
// supports multiple API keys cleanly). The adapter calls /emails with
// the tenant key, counts rows in the window, multiplies by the rate.
//
// Returns null if the tenant has no Resend key wired up — in that case
// they're not using Resend so nothing to attribute.

const RESEND_API_BASE = "https://api.resend.com";

type ResendEmailRow = {
  id: string;
  created_at: string;
  to: string[];
  from: string;
  subject: string;
};

type ResendEmailsList = {
  object: "list";
  data: ResendEmailRow[];
};

export function createResendAdapter(): UsageAdapter {
  return {
    vendor: "resend",
    async fetchUsage(tenantId, window): Promise<UsageSnapshot | null> {
      const tenantSecret = await getTenantSecret(tenantId, "resend");
      if (!tenantSecret?.secret) return null;

      // Resend's list-emails endpoint returns recent emails. There is no
      // server-side date filter as of 2026-05 so we pull then filter
      // client-side. Acceptable for daily snapshots; revisit if a tenant
      // sends 5k+/day.
      const res = await fetch(`${RESEND_API_BASE}/emails`, {
        headers: {
          Authorization: `Bearer ${tenantSecret.secret}`,
        },
      });
      if (!res.ok) return null;
      const json = (await res.json()) as ResendEmailsList;
      const inWindow = (json.data ?? []).filter((e) => {
        const t = new Date(e.created_at);
        return t >= window.start && t < window.end;
      });
      const count = inWindow.length;
      const cost = count * RESEND_RATE_USD_PER_EMAIL;
      return {
        tenant_id: tenantId,
        vendor: "resend",
        period_start: window.start.toISOString(),
        period_end: window.end.toISOString(),
        units: count,
        unit_label: "emails",
        cost_usd: Math.round(cost * 10000) / 10000,
        raw_payload: { email_count: count },
      };
    },
  };
}
