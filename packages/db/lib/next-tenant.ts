// Next.js-specific tenant resolution. Server-only.
// Apps that aren't on Next.js (render-worker, outreach-dispatcher) should not import this.
import { headers, cookies } from "next/headers";
import { resolveTenantFromRequest, type Tenant, DEFAULT_TENANT_SLUG, getTenantBySlug, getDefaultTenant } from "./tenant";

export async function getServerTenant(opts?: { fallbackSlug?: string }): Promise<Tenant> {
  // headers/cookies are sync in Next 14, async in Next 15. Awaiting handles both.
  const h = await Promise.resolve(headers());
  let c: Awaited<ReturnType<typeof cookies>> | null = null;
  try { c = await Promise.resolve(cookies()); } catch { /* not in request scope */ }
  const host = h.get("host");
  const proto = h.get("x-forwarded-proto") || "http";
  const path = h.get("x-invoke-path") || "/";
  const url = host ? `${proto}://${host}${path}` : undefined;
  const tenant = await resolveTenantFromRequest({
    url,
    host,
    headers: h,
    cookies: c ? { get: (name: string) => c!.get(name) ?? undefined } : undefined,
  });
  if (!tenant && opts?.fallbackSlug) {
    return (await getTenantBySlug(opts.fallbackSlug)) ?? (await getDefaultTenant());
  }
  return tenant;
}

export async function getServerTenantId(opts?: { fallbackSlug?: string }): Promise<string> {
  const t = await getServerTenant(opts);
  return t.id;
}

export { DEFAULT_TENANT_SLUG };

// For API routes that get a Request object directly
export async function getRequestTenant(req: Request): Promise<Tenant> {
  return resolveTenantFromRequest({
    url: req.url,
    headers: req.headers,
  });
}

export async function getRequestTenantId(req: Request): Promise<string> {
  const t = await getRequestTenant(req);
  return t.id;
}
