import { NextResponse } from "next/server";
import { getServerTenant } from "@naples/db/next";
import { pollFeed } from "@/lib/persist";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(
  _req: Request,
  ctx: { params: { id: string } },
) {
  const tenant = await getServerTenant({ fallbackSlug: "naplesdigital" });
  const result = await pollFeed({ tenantId: tenant.id, feedId: ctx.params.id });
  return NextResponse.json(result);
}
