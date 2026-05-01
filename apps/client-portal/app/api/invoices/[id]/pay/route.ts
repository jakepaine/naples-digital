import { NextResponse } from "next/server";
import { markInvoicePaid } from "@naples/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface Body { method?: string }

export async function POST(req: Request, { params }: { params: { id: string } }) {
  let body: Body = {};
  try { body = await req.json(); } catch {}
  const ok = await markInvoicePaid(params.id, body.method ?? "card");
  return NextResponse.json({ ok });
}
