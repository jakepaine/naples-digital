import { NextResponse } from "next/server";
import { createServerClient, hasSupabase } from "@naples/db";
import { getServerTenant } from "@naples/db/next";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  if (!hasSupabase()) return NextResponse.json({ templates: [] });
  const tenant = await getServerTenant({ fallbackSlug: "naplesdigital" });
  const sb = createServerClient();
  const { data, error } = await sb
    .from("lead_email_templates")
    .select("*")
    .eq("tenant_id", tenant.id)
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ templates: data ?? [] });
}

export async function POST(req: Request) {
  if (!hasSupabase()) {
    return NextResponse.json({ error: "no_supabase" }, { status: 500 });
  }
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }
  if (!body?.name || !body?.to_stage || !body?.subject || !body?.body_template) {
    return NextResponse.json(
      { error: "name, to_stage, subject, body_template required" },
      { status: 400 },
    );
  }
  const tenant = await getServerTenant({ fallbackSlug: "naplesdigital" });
  const sb = createServerClient();
  const { data, error } = await sb
    .from("lead_email_templates")
    .insert({
      tenant_id: tenant.id,
      name: body.name,
      from_stage: body.from_stage ?? null,
      to_stage: body.to_stage,
      subject: body.subject,
      body_template: body.body_template,
      enabled: body.enabled !== false,
    })
    .select("*")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ template: data });
}
