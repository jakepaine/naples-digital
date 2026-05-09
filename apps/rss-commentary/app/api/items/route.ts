import { NextResponse } from "next/server";
import { getServerTenant } from "@naples/db/next";
import { listItems } from "@/lib/persist";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const tenant = await getServerTenant({ fallbackSlug: "naplesdigital" });
  const url = new URL(req.url);
  const status = url.searchParams.get("status") as any;
  const feedId = url.searchParams.get("feed") ?? undefined;
  try {
    const items = await listItems(tenant.id, {
      feedId,
      status: status || undefined,
    });
    return NextResponse.json({ items });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
