// Generic per-vendor key save endpoint. The 4 enrichment sources all
// share the same shape: paste API key → encrypt to Vault under
// kind=<vendor> → set tenant_integrations.status='verified'.
//
// Body: { secret: string, [extra-fields]: string }
// Returns: { ok: true, vendor, mode? }

import { NextResponse } from "next/server";
import { getServerTenant } from "@naples/db/next";
import { createServerClient, hasSupabase } from "@naples/db";
import { ALL_SOURCE_KEYS, SOURCE_VAULT_KIND } from "@/lib/sources";

export const dynamic = "force-dynamic";

const ALLOWED_VENDORS = new Set<string>(
  ALL_SOURCE_KEYS.map((k) => SOURCE_VAULT_KIND[k]),
);

export async function POST(
  req: Request,
  ctx: { params: { vendor: string } },
) {
  const vendor = ctx.params.vendor.toLowerCase();
  if (!ALLOWED_VENDORS.has(vendor)) {
    return NextResponse.json(
      { error: `vendor ${vendor} not allowed for this module` },
      { status: 400 },
    );
  }
  if (!hasSupabase()) {
    return NextResponse.json(
      { error: "supabase not configured" },
      { status: 500 },
    );
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }
  const secret: string | undefined = body?.secret;
  if (!secret || typeof secret !== "string" || secret.length < 8) {
    return NextResponse.json({ error: "secret required" }, { status: 400 });
  }

  const tenant = await getServerTenant({ fallbackSlug: "naplesdigital" });
  const sb = createServerClient();

  const config: Record<string, unknown> = {};
  // Pass through any extra fields (e.g. account_id) the form supplies.
  for (const [k, v] of Object.entries(body ?? {})) {
    if (k === "secret") continue;
    if (typeof v === "string" && v.length > 0) config[k] = v;
  }

  const { error } = await sb.rpc("set_tenant_secret", {
    p_tenant_id: tenant.id,
    p_kind: vendor,
    p_secret: secret,
    p_config: config as never,
  });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    vendor,
    tenant: { id: tenant.id, slug: tenant.slug },
  });
}

export async function GET(
  _req: Request,
  ctx: { params: { vendor: string } },
) {
  const vendor = ctx.params.vendor.toLowerCase();
  if (!ALLOWED_VENDORS.has(vendor)) {
    return NextResponse.json({ error: "unknown vendor" }, { status: 400 });
  }
  if (!hasSupabase()) {
    return NextResponse.json({ configured: false, reason: "no_supabase" });
  }
  const tenant = await getServerTenant({ fallbackSlug: "naplesdigital" });
  const sb = createServerClient();
  const { data } = await sb
    .from("tenant_integrations")
    .select("status, config, last_verified_at, updated_at")
    .eq("tenant_id", tenant.id)
    .eq("kind", vendor)
    .maybeSingle();
  return NextResponse.json({
    configured: !!data,
    vendor,
    status: (data as any)?.status ?? null,
    last_verified_at: (data as any)?.last_verified_at ?? null,
  });
}
