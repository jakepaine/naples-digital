import { NextResponse } from "next/server";
import { createTenant, listTenants } from "@naples/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const tenants = await listTenants();
  return NextResponse.json({ tenants });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body?.slug || !body?.name) {
    return NextResponse.json({ error: "name and slug required" }, { status: 400 });
  }
  if (!/^[a-z0-9][a-z0-9-]*$/.test(body.slug)) {
    return NextResponse.json({ error: "slug must be lowercase alphanumeric + dashes" }, { status: 400 });
  }
  const t = await createTenant({
    slug: body.slug,
    name: body.name,
    brand: body.brand,
    plan: body.plan ?? "starter",
  });
  if (!t) return NextResponse.json({ error: "Failed to create — slug may already exist" }, { status: 409 });
  return NextResponse.json({ tenant: t });
}
