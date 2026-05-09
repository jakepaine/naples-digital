import { NextResponse } from "next/server";
import { createServerClient, hasSupabase } from "@naples/db";
import { getServerTenant } from "@naples/db/next";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  if (!hasSupabase()) return NextResponse.json({ error: "no_supabase" }, { status: 500 });
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }
  const tenant = await getServerTenant({ fallbackSlug: "naplesdigital" });
  const sb = createServerClient();
  const update: any = {};
  for (const k of ["name", "category", "subject", "body_template", "enabled"]) {
    if (k in body) update[k] = body[k];
  }
  const { data, error } = await sb
    .from("email_auto_reply_templates")
    .update(update)
    .eq("id", params.id)
    .eq("tenant_id", tenant.id)
    .select("*")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ template: data });
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } },
) {
  if (!hasSupabase()) return NextResponse.json({ error: "no_supabase" }, { status: 500 });
  const tenant = await getServerTenant({ fallbackSlug: "naplesdigital" });
  const sb = createServerClient();
  const { error } = await sb
    .from("email_auto_reply_templates")
    .delete()
    .eq("id", params.id)
    .eq("tenant_id", tenant.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
