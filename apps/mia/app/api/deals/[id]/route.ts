import { NextResponse } from "next/server";
import { updateDealStatus, type ReDealStatus } from "@naples/db";
import { getMiaTenantId } from "@/lib/tenant";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const tenantId = await getMiaTenantId();
  const body = await req.json().catch(() => ({}));
  if (!body?.status) return NextResponse.json({ error: "status required" }, { status: 400 });
  const ok = await updateDealStatus(tenantId, params.id, body.status as ReDealStatus);
  if (!ok) return NextResponse.json({ error: "update failed" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
