import { NextResponse } from "next/server";
import { getServerTenant } from "@naples/db/next";
import { loadWarmupForTenant } from "@/lib/load-warmup";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function GET() {
  const tenant = await getServerTenant({ fallbackSlug: "naplesdigital" });
  try {
    const summary = await loadWarmupForTenant(tenant.id);
    return NextResponse.json({ ok: true, summary });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
