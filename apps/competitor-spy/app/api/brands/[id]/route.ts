import { NextResponse } from "next/server";
import { getServerTenant } from "@naples/db/next";
import { deleteBrand } from "@/lib/persist";

export const dynamic = "force-dynamic";

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const tenant = await getServerTenant({ fallbackSlug: "naplesdigital" });
  await deleteBrand(tenant.id, params.id);
  return NextResponse.json({ ok: true });
}
