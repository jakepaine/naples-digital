import Stripe from "stripe";
import { createServerClient, hasSupabase } from "@naples/db";

export class TenantStripeMissingError extends Error {
  constructor(tenantId: string) {
    super(`Tenant ${tenantId} has no Stripe integration configured.`);
    this.name = "TenantStripeMissingError";
  }
}

// Returns a Stripe SDK client scoped to the tenant's Stripe Secret Key
// (decrypted from Supabase Vault on demand). Caches per-tenant for the
// lifetime of the Node process — invalidated only on cold start.
const cache = new Map<string, Stripe>();

export async function getTenantStripe(tenantId: string): Promise<Stripe> {
  const hit = cache.get(tenantId);
  if (hit) return hit;

  if (!hasSupabase()) {
    throw new Error(
      "Supabase not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
    );
  }

  const sb = createServerClient();
  const { data, error } = await sb.rpc("get_tenant_secret", {
    p_tenant_id: tenantId,
    p_kind: "stripe",
  });
  if (error) throw new Error(`get_tenant_secret failed: ${error.message}`);
  const row = (data ?? [])[0] as
    | { out_secret: string; out_status: string }
    | undefined;
  if (!row || !row.out_secret) throw new TenantStripeMissingError(tenantId);

  const client = new Stripe(row.out_secret, { apiVersion: "2025-02-24.acacia" });
  cache.set(tenantId, client);
  return client;
}

export function invalidateTenantStripe(tenantId: string): void {
  cache.delete(tenantId);
}
