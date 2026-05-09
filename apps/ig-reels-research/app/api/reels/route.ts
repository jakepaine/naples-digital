import { NextResponse } from "next/server";
import { getServerTenant } from "@naples/db/next";
import { listReels } from "@/lib/persist";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const tenant = await getServerTenant({ fallbackSlug: "naplesdigital" });
  const url = new URL(req.url);
  const creatorId = url.searchParams.get("creator") ?? undefined;
  try {
    const reels = await listReels(tenant.id, { creatorId });
    return NextResponse.json({ reels });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
