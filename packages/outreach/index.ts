import { createInstantlyVendor } from "./lib/instantly";
import { createSmartleadVendor } from "./lib/smartlead";
import type { OutreachVendor, VendorKind } from "./lib/types";
import { getTenantIntegration } from "@naples/db";

export * from "./lib/types";
export { createInstantlyVendor, createSmartleadVendor };

// Resolve a tenant's configured vendor. Returns null if not configured.
export async function getOutreachVendorForTenant(tenantId: string): Promise<OutreachVendor | null> {
  // Prefer instantly, fall back to smartlead
  const instantly = await getTenantIntegration(tenantId, "instantly");
  if (instantly?.secret_ref && instantly.status !== "disabled") {
    return createInstantlyVendor({
      apiKey: instantly.secret_ref,
      config: instantly.config,
    });
  }
  const smartlead = await getTenantIntegration(tenantId, "smartlead");
  if (smartlead?.secret_ref && smartlead.status !== "disabled") {
    return createSmartleadVendor({
      apiKey: smartlead.secret_ref,
      config: smartlead.config,
    });
  }
  return null;
}

export async function getOutreachVendorByKind(
  tenantId: string,
  kind: VendorKind
): Promise<OutreachVendor | null> {
  const integration = await getTenantIntegration(tenantId, kind);
  if (!integration?.secret_ref) return null;
  if (kind === "instantly") {
    return createInstantlyVendor({ apiKey: integration.secret_ref, config: integration.config });
  }
  return createSmartleadVendor({ apiKey: integration.secret_ref, config: integration.config });
}
