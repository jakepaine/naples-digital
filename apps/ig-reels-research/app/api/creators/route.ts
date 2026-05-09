import { NextResponse } from "next/server";
import { getServerTenant } from "@naples/db/next";
import { listCreators, createCreator } from "@/lib/persist";

export const dynamic = "force-dynamic";

export async function GET() {
  const tenant = await getServerTenant({ fallbackSlug: "naplesdigital" });
  try {
    const creators = await listCreators(tenant.id);
    return NextResponse.json({ creators });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }
  const handle: string = String(body?.handle ?? "").trim();
  if (!handle) {
    return NextResponse.json({ error: "handle required" }, { status: 400 });
  }
  const tenant = await getServerTenant({ fallbackSlug: "naplesdigital" });
  try {
    const creator = await createCreator({
      tenantId: tenant.id,
      handle,
      displayName: typeof body?.display_name === "string" ? body.display_name : null,
      niche: typeof body?.niche === "string" ? body.niche : null,
      notes: typeof body?.notes === "string" ? body.notes : null,
    });
    return NextResponse.json({ creator }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
