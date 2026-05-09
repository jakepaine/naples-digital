import { NextResponse } from "next/server";
import { getServerTenant } from "@naples/db/next";
import { generateForItem } from "@/lib/persist";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(
  _req: Request,
  ctx: { params: { id: string } },
) {
  const tenant = await getServerTenant({ fallbackSlug: "naplesdigital" });
  const result = await generateForItem({
    tenantId: tenant.id,
    itemId: ctx.params.id,
  });
  if (!result.ok) {
    return NextResponse.json(
      { error: result.error ?? "generate_failed" },
      { status: 500 },
    );
  }
  return NextResponse.json(result);
}
