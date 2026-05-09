import { NextResponse } from "next/server";
import { getServerTenant } from "@naples/db/next";
import { markResponded } from "@/lib/persist";

export const dynamic = "force-dynamic";

export async function POST(
  _req: Request,
  ctx: { params: { id: string } },
) {
  const tenant = await getServerTenant({ fallbackSlug: "naplesdigital" });
  const result = await markResponded({
    tenantId: tenant.id,
    id: ctx.params.id,
  });
  if (!result.ok) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true, item: result.row });
}
