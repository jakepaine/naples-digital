import { NextResponse } from "next/server";
import { getServerTenant } from "@naples/db/next";
import { syncCreator } from "@/lib/persist";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function POST(
  _req: Request,
  ctx: { params: { id: string } },
) {
  const tenant = await getServerTenant({ fallbackSlug: "naplesdigital" });
  const result = await syncCreator({
    tenantId: tenant.id,
    creatorId: ctx.params.id,
  });
  return NextResponse.json({ ok: true, ...result });
}
