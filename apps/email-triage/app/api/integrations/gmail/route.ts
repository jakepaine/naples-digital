import { NextResponse } from "next/server";
import { getServerTenant } from "@naples/db/next";
import { createServerClient, hasSupabase } from "@naples/db";

export const dynamic = "force-dynamic";

// GET /api/integrations/gmail → connection status (no secret exposed)
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
    .eq("kind", "gmail")
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({
    configured: !!data,
    status: (data as any)?.status ?? null,
    email_address: (data as any)?.config?.email_address ?? null,
    last_verified_at: (data as any)?.last_verified_at ?? null,
    oauth_app_configured: !!(
      process.env.GMAIL_CLIENT_ID &&
      process.env.GMAIL_CLIENT_SECRET &&
      process.env.GMAIL_REDIRECT_URI
    ),
  });
}

// DELETE /api/integrations/gmail → disconnect
export async function DELETE() {
  if (!hasSupabase()) {
    return NextResponse.json({ error: "no_supabase" }, { status: 500 });
  }
  const tenant = await getServerTenant({ fallbackSlug: "naplesdigital" });
  const sb = createServerClient();
  const { error } = await sb.rpc("delete_tenant_secret", {
    p_tenant_id: tenant.id,
    p_kind: "gmail",
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
