import { NextResponse } from "next/server";
import { getServerTenant } from "@naples/db/next";
import { markResponded } from "@/lib/persist";

export const dynamic = "force-dynamic";

export async function POST(
  _req: Request,
  ctx: { params: { id: string } },
) {
  try {
    const tenant = await getServerTenant({ fallbackSlug: "naplesdigital" });
    const result = await markResponded({
      tenantId: tenant.id,
      id: ctx.params.id,
    });
    if (!result.ok) {
      return NextResponse.json({ error: "not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true, item: result.row });
  } catch (err) {
    console.error("sla respond route failed:", (err as Error).message);
    return NextResponse.json(
      { error: (err as Error).message ?? "internal error" },
      { status: 500 },
    );
  }
}
