import { createApolloVendor } from "./lib/apollo";
import { createClayVendor } from "./lib/clay";
import type { EnrichmentVendor } from "./lib/types";
import { getTenantIntegration } from "@naples/db";

export * from "./lib/types";
export { createApolloVendor, createClayVendor };

// Get the tenant's configured enrichment vendor. Returns Apollo by default
// (most agencies use it), Clay as fallback.
export async function getEnrichmentVendorForTenant(tenantId: string): Promise<EnrichmentVendor | null> {
  const apollo = await getTenantIntegration(tenantId, "apollo");
  if (apollo?.secret_ref && apollo.status !== "disabled") {
    return createApolloVendor({ apiKey: apollo.secret_ref });
  }
  const clay = await getTenantIntegration(tenantId, "clay");
  if (clay?.secret_ref && clay.status !== "disabled") {
    const webhook = (clay.config?.webhook_url as string | undefined);
    return createClayVendor({ apiKey: clay.secret_ref, webhookUrl: webhook });
  }
  // Platform-default Apollo key (Starter tier)
  const platformKey = process.env.APOLLO_API_KEY_PLATFORM_DEFAULT;
  if (platformKey) {
    return createApolloVendor({ apiKey: platformKey });
  }
  return null;
}
