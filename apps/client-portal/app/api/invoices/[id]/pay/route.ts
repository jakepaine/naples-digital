import { NextResponse } from "next/server";
import { markInvoicePaid } from "@naples/db";
import { getRequestTenantId } from "@naples/db/next";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface Body { method?: string }

export async function POST(req: Request, { params }: { params: { id: string } }) {
  let body: Body = {};
  try { body = await req.json(); } catch {}
  const tid = await getRequestTenantId(req);
  const ok = await markInvoicePaid(tid, params.id, body.method ?? "card");
  return NextResponse.json({ ok });
}
