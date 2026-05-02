import { NextResponse } from "next/server";
import { createServerClient } from "@naples/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// admin-console is gated by ADMIN_PASSWORD middleware → all routes are
// privileged. Using service-role client to bypass RLS by design.

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const sb = createServerClient();
  const { data } = await sb.from("tenant_users")
    .select("*").eq("tenant_id", params.id).order("created_at");
  return NextResponse.json({ users: data ?? [] });
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json().catch(() => null) as { email?: string; role?: "owner" | "operator" | "viewer" } | null;
  if (!body?.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
    return NextResponse.json({ error: "valid email required" }, { status: 400 });
  }
  const sb = createServerClient();
  const { data, error } = await sb.from("tenant_users").insert({
    tenant_id: params.id,
    user_email: body.email.toLowerCase(),
    role: body.role ?? "operator",
  }).select("*").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 409 });
  return NextResponse.json({ user: data });
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const url = new URL(req.url);
  const userId = url.searchParams.get("userId");
  if (!userId) return NextResponse.json({ error: "userId query param required" }, { status: 400 });
  const sb = createServerClient();
  const { error } = await sb.from("tenant_users").delete()
    .eq("id", userId).eq("tenant_id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
