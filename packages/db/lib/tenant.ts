import { createServerClient, hasSupabase } from "./server";

export type TenantBrand = {
  logo_url?: string;
  primary_color?: string;
  font_display?: string;
  font_body?: string;
  caption_style?: string;
};

export type Tenant = {
  id: string;
  slug: string;
  name: string;
  brand: TenantBrand;
  plan: "starter" | "pro" | "agency";
  status: "active" | "paused" | "churned";
  created_at: string;
  updated_at: string;
};

export const DEFAULT_TENANT_SLUG = "239live";

const FALLBACK_TENANT: Tenant = {
  id: "00000000-0000-0000-0000-000000000000",
  slug: DEFAULT_TENANT_SLUG,
  name: "239 Live",
  brand: {
    primary_color: "#E8192C",
    font_display: "Bebas Neue",
    font_body: "Inter",
    caption_style: "broadcast",
  },
  plan: "agency",
  status: "active",
  created_at: new Date(0).toISOString(),
  updated_at: new Date(0).toISOString(),
};

let cachedTenants: Map<string, Tenant> | null = null;
let cacheLoadedAt = 0;
const CACHE_TTL_MS = 60_000;

async function loadTenants(): Promise<Map<string, Tenant>> {
  const now = Date.now();
  if (cachedTenants && now - cacheLoadedAt < CACHE_TTL_MS) return cachedTenants;
  if (!hasSupabase()) {
    const m = new Map<string, Tenant>();
    m.set(FALLBACK_TENANT.slug, FALLBACK_TENANT);
    m.set(FALLBACK_TENANT.id, FALLBACK_TENANT);
    cachedTenants = m;
    cacheLoadedAt = now;
    return m;
  }
  const sb = createServerClient();
  const { data } = await sb.from("tenants").select("*");
  const m = new Map<string, Tenant>();
  if (data) {
    for (const row of data as Tenant[]) {
      m.set(row.slug, row);
      m.set(row.id, row);
    }
  }
  if (m.size === 0) {
    m.set(FALLBACK_TENANT.slug, FALLBACK_TENANT);
    m.set(FALLBACK_TENANT.id, FALLBACK_TENANT);
  }
  cachedTenants = m;
  cacheLoadedAt = now;
  return m;
}

export function invalidateTenantCache(): void {
  cachedTenants = null;
  cacheLoadedAt = 0;
}

export async function getTenantBySlug(slug: string): Promise<Tenant | null> {
  const m = await loadTenants();
  return m.get(slug) ?? null;
}

export async function getTenantById(id: string): Promise<Tenant | null> {
  const m = await loadTenants();
  return m.get(id) ?? null;
}

export async function listTenants(): Promise<Tenant[]> {
  const m = await loadTenants();
  const seen = new Set<string>();
  const out: Tenant[] = [];
  for (const t of m.values()) {
    if (seen.has(t.id)) continue;
    seen.add(t.id);
    out.push(t);
  }
  return out.sort((a, b) => a.created_at.localeCompare(b.created_at));
}

export async function getDefaultTenant(): Promise<Tenant> {
  const t = await getTenantBySlug(DEFAULT_TENANT_SLUG);
  return t ?? FALLBACK_TENANT;
}

// ============================================================
// Tenant resolution from a request
// ============================================================
// Resolution order (most specific wins):
//   1. Explicit ?tenant=<slug> query
//   2. Path /t/<slug>/...
//   3. Subdomain <slug>.naplesdigital.app (or any *.naplesdigital.app)
//   4. X-Tenant-Slug header (server-to-server)
//   5. Cookie tenant_slug
//   6. DEFAULT_TENANT_SLUG fallback
// ============================================================

const PLATFORM_HOSTS = new Set([
  "naplesdigital.app",
  "naplesdigital.com",
  "239.live",
  "localhost",
]);

function slugFromHost(host: string | null | undefined): string | null {
  if (!host) return null;
  const h = host.toLowerCase().split(":")[0];
  if (!h) return null;
  for (const platform of PLATFORM_HOSTS) {
    if (h === platform) return null;
    if (h.endsWith("." + platform)) {
      const sub = h.slice(0, -("." + platform).length);
      if (sub && sub !== "www" && sub !== "admin") return sub;
    }
  }
  // Railway preview domains: <service>-production.up.railway.app — never tenant slugs
  if (h.endsWith(".up.railway.app")) return null;
  if (h === "127.0.0.1") return null;
  return null;
}

function slugFromPath(pathname: string | null | undefined): string | null {
  if (!pathname) return null;
  const m = pathname.match(/^\/t\/([a-z0-9-]+)(\/|$)/i);
  return m && m[1] ? m[1] : null;
}

export type TenantRequest = {
  url?: string | URL;
  host?: string | null;
  headers?: Headers | Record<string, string | undefined>;
  cookies?: { get?: (name: string) => { value: string } | undefined };
};

function headerLookup(headers: TenantRequest["headers"], name: string): string | null {
  if (!headers) return null;
  if (headers instanceof Headers) return headers.get(name);
  const lc = name.toLowerCase();
  for (const [k, v] of Object.entries(headers)) {
    if (k.toLowerCase() === lc && typeof v === "string") return v;
  }
  return null;
}

export async function resolveTenantFromRequest(req: TenantRequest): Promise<Tenant> {
  const url = req.url instanceof URL ? req.url : req.url ? new URL(req.url) : null;
  const slugFromQuery = url?.searchParams.get("tenant");
  const slugPath = slugFromPath(url?.pathname);
  const host = req.host ?? headerLookup(req.headers, "host");
  const slugSub = slugFromHost(host);
  const slugHeader = headerLookup(req.headers, "x-tenant-slug");
  const slugCookie = req.cookies?.get?.("tenant_slug")?.value ?? null;

  const slug = slugFromQuery || slugPath || slugSub || slugHeader || slugCookie || DEFAULT_TENANT_SLUG;
  const t = await getTenantBySlug(slug);
  if (t) return t;
  return await getDefaultTenant();
}

// Lightweight sync-ish version when caller already has the slug
export async function resolveTenantBySlugOrDefault(slug: string | null | undefined): Promise<Tenant> {
  if (slug) {
    const t = await getTenantBySlug(slug);
    if (t) return t;
  }
  return await getDefaultTenant();
}

// ============================================================
// Tenant integration accessors
// ============================================================
export type TenantIntegrationKind =
  | "instantly" | "smartlead" | "apollo" | "clay"
  | "assemblyai" | "opusclip" | "stripe" | "resend" | "buffer" | "publer";

export type TenantIntegration = {
  id: string;
  tenant_id: string;
  kind: TenantIntegrationKind;
  config: Record<string, unknown>;
  secret_ref: string | null;
  status: "pending" | "verified" | "failed" | "disabled";
  last_verified_at: string | null;
  created_at: string;
  updated_at: string;
};

export async function getTenantIntegration(
  tenantId: string,
  kind: TenantIntegrationKind
): Promise<TenantIntegration | null> {
  if (!hasSupabase()) return null;
  const sb = createServerClient();
  const { data } = await sb
    .from("tenant_integrations")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("kind", kind)
    .maybeSingle();
  return (data as TenantIntegration | null) ?? null;
}

export async function listTenantIntegrations(tenantId: string): Promise<TenantIntegration[]> {
  if (!hasSupabase()) return [];
  const sb = createServerClient();
  const { data } = await sb
    .from("tenant_integrations")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("kind", { ascending: true });
  return (data as TenantIntegration[] | null) ?? [];
}

export async function upsertTenantIntegration(input: {
  tenant_id: string;
  kind: TenantIntegrationKind;
  config?: Record<string, unknown>;
  secret_ref?: string | null;
  status?: TenantIntegration["status"];
}): Promise<TenantIntegration | null> {
  if (!hasSupabase()) return null;
  const sb = createServerClient();
  const { data, error } = await sb
    .from("tenant_integrations")
    .upsert({
      tenant_id: input.tenant_id,
      kind: input.kind,
      config: (input.config ?? {}) as never,
      secret_ref: input.secret_ref ?? null,
      status: input.status ?? "pending",
    }, { onConflict: "tenant_id,kind" })
    .select("*")
    .single();
  if (error) return null;
  return (data as TenantIntegration) ?? null;
}

// ============================================================
// Per-tenant secrets via Supabase Vault.
// Backed by the SECURITY DEFINER functions in migration 0007.
// Service-role only — these wrap RPC calls that decrypt vault values.
// ============================================================

export async function setTenantSecret(
  tenantId: string,
  kind: TenantIntegrationKind,
  secret: string,
  config: Record<string, unknown> = {}
): Promise<{ id: string; status: string; last_verified_at: string | null } | null> {
  if (!hasSupabase()) return null;
  const sb = createServerClient();
  const { data, error } = await sb.rpc("set_tenant_secret", {
    p_tenant_id: tenantId,
    p_kind: kind,
    p_secret: secret,
    p_config: config as never,
  });
  if (error || !data || !Array.isArray(data) || data.length === 0) return null;
  const row = data[0] as { out_id: string; out_status: string; out_last_verified_at: string | null };
  return { id: row.out_id, status: row.out_status, last_verified_at: row.out_last_verified_at };
}

export async function getTenantSecret(
  tenantId: string,
  kind: TenantIntegrationKind
): Promise<{ secret: string; config: Record<string, unknown>; status: string; last_verified_at: string | null } | null> {
  if (!hasSupabase()) return null;
  const sb = createServerClient();
  const { data, error } = await sb.rpc("get_tenant_secret", {
    p_tenant_id: tenantId,
    p_kind: kind,
  });
  if (error || !data || !Array.isArray(data) || data.length === 0) return null;
  const row = data[0] as { out_secret: string; out_config: Record<string, unknown>; out_status: string; out_last_verified_at: string | null };
  return {
    secret: row.out_secret,
    config: row.out_config ?? {},
    status: row.out_status,
    last_verified_at: row.out_last_verified_at,
  };
}

export async function deleteTenantSecret(
  tenantId: string,
  kind: TenantIntegrationKind
): Promise<boolean> {
  if (!hasSupabase()) return false;
  const sb = createServerClient();
  const { data, error } = await sb.rpc("delete_tenant_secret", {
    p_tenant_id: tenantId,
    p_kind: kind,
  });
  return !error && data === true;
}

export async function createTenant(input: {
  slug: string;
  name: string;
  brand?: TenantBrand;
  plan?: Tenant["plan"];
}): Promise<Tenant | null> {
  if (!hasSupabase()) return null;
  const sb = createServerClient();
  const { data, error } = await sb
    .from("tenants")
    .insert({
      slug: input.slug,
      name: input.name,
      brand: input.brand ?? {},
      plan: input.plan ?? "starter",
      status: "active",
    })
    .select("*")
    .single();
  if (error) return null;
  invalidateTenantCache();
  return (data as Tenant) ?? null;
}
