import { NextResponse } from "next/server";
import { getServerTenant } from "@naples/db/next";
import { listSlaQueue } from "@/lib/persist";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const tenant = await getServerTenant({ fallbackSlug: "naplesdigital" });
  const url = new URL(req.url);
  const hoursBack = Number(url.searchParams.get("hours")) || 48;
  try {
    const items = await listSlaQueue({
      tenantId: tenant.id,
      hoursBack: Math.max(1, Math.min(168, hoursBack)),
    });
    return NextResponse.json({ items });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
