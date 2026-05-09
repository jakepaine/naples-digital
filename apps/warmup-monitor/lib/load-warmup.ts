// Resolves the tenant's vendor and pulls warmup status. Falls through
// to a synthetic Instantly stub when no vendor is configured so the
// dashboard renders something useful even on a fresh tenant.

import { getOutreachVendorForTenant } from "@naples/outreach";
import type { AccountWarmupSummary } from "@naples/outreach";

export async function loadWarmupForTenant(
  tenantId: string,
): Promise<AccountWarmupSummary> {
  const vendor = await getOutreachVendorForTenant(tenantId);
  if (vendor && typeof vendor.getAccountWarmup === "function") {
    return vendor.getAccountWarmup();
  }
  // No vendor configured — return synthetic Instantly stub so the
  // dashboard shows the shape of what's coming.
  return {
    vendor: "instantly",
    is_stub: true,
    total_mailboxes: 0,
    warming_mailboxes: 0,
    fully_warmed_mailboxes: 0,
    average_score: 0,
    mailboxes: [],
  };
}
