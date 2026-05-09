import { NextResponse } from "next/server";
import { getServerTenant } from "@naples/db/next";
import { createServerClient, hasSupabase } from "@naples/db";
import { invalidateTenantStripe } from "@/lib/stripe-client";

export const dynamic = "force-dynamic";

// Save (or rotate) the tenant's Stripe Secret Key. Stored encrypted in
// Supabase Vault via the set_tenant_secret RPC (kind='stripe').
// Body: { secret: "sk_live_..." | "sk_test_...", webhook_secret?: "whsec_..." }
export async function POST(req: Request) {
  if (!hasSupabase()) {
    return NextResponse.json({ error: "supabase not configured" }, { status: 500 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }
  const secret: string | undefined = body?.secret;
  const webhookSecret: string | undefined = body?.webhook_secret;
  if (!secret || typeof secret !== "string" || secret.length < 20) {
    return NextResponse.json({ error: "secret required" }, { status: 400 });
  }
  if (!secret.startsWith("sk_live_") && !secret.startsWith("sk_test_")) {
    return NextResponse.json(
      { error: "secret must start with sk_live_ or sk_test_" },
      { status: 400 },
    );
  }

  const tenant = await getServerTenant({ fallbackSlug: "naplesdigital" });
  const sb = createServerClient();

  const config: Record<string, any> = {};
  if (webhookSecret) config.webhook_secret = webhookSecret;

  const { error } = await sb.rpc("set_tenant_secret", {
    p_tenant_id: tenant.id,
    p_kind: "stripe",
    p_secret: secret,
    p_config: config,
  });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  invalidateTenantStripe(tenant.id);
  return NextResponse.json({
    ok: true,
    tenant: { id: tenant.id, slug: tenant.slug },
    mode: secret.startsWith("sk_live_") ? "live" : "test",
  });
}

// Returns the current connection status (does not return the secret itself).
export async function GET() {
  if (!hasSupabase()) {
    return NextResponse.json({ configured: false, reason: "no_supabase" });
  }
  const tenant = await getServerTenant({ fallbackSlug: "naplesdigital" });
  const sb = createServerClient();
  const { data, error } = await sb
    .from("tenant_integrations")
    .select("status, config, last_verified_at, updated_at")
    .eq("tenant_id", tenant.id)
    .eq("kind", "stripe")
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({
    configured: !!data,
    status: (data as any)?.status ?? null,
    last_verified_at: (data as any)?.last_verified_at ?? null,
    updated_at: (data as any)?.updated_at ?? null,
    has_webhook_secret: !!(data as any)?.config?.webhook_secret,
  });
}
