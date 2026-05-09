import { NextResponse } from "next/server";
import { getServerTenant } from "@naples/db/next";
import { deleteFeed } from "@/lib/persist";

export const dynamic = "force-dynamic";

export async function DELETE(
  _req: Request,
  ctx: { params: { id: string } },
) {
  const tenant = await getServerTenant({ fallbackSlug: "naplesdigital" });
  await deleteFeed({ tenantId: tenant.id, id: ctx.params.id });
  return NextResponse.json({ ok: true });
}
