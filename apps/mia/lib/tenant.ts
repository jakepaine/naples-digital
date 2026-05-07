// MIA app is single-tenant by design — every page operates on the MIA tenant.
// (Other Naples Digital apps like backlog/dashboard are multi-tenant; this one
// has its own subdomain/identity for MIA users.)
import { getTenantBySlug } from "@naples/db/tenant";

const MIA_SLUG = "mia";

export async function getMiaTenantId(): Promise<string> {
  const t = await getTenantBySlug(MIA_SLUG);
  if (!t) throw new Error("MIA tenant not found in tenants table");
  return t.id;
}
