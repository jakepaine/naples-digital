import { NextResponse } from "next/server";
import { getServerTenant } from "@naples/db/next";
import { listBrands, createBrand } from "@/lib/persist";

export const dynamic = "force-dynamic";

export async function GET() {
  const tenant = await getServerTenant({ fallbackSlug: "naplesdigital" });
  const brands = await listBrands(tenant.id);
  return NextResponse.json({ brands });
}

export async function POST(req: Request) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }
  if (!body?.name) {
    return NextResponse.json({ error: "name required" }, { status: 400 });
  }
  const tenant = await getServerTenant({ fallbackSlug: "naplesdigital" });
  try {
    const brand = await createBrand({
      tenantId: tenant.id,
      name: body.name,
      fbPageId: body.fb_page_id,
      notes: body.notes,
    });
    return NextResponse.json({ brand });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
