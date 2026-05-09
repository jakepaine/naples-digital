import { NextResponse } from "next/server";
import { markRejected, getInvoiceById } from "@/lib/persist-invoice";

export const dynamic = "force-dynamic";

export async function POST(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const inv = await getInvoiceById(params.id);
  if (!inv) {
    return NextResponse.json({ error: "invoice not found" }, { status: 404 });
  }
  await markRejected(params.id);
  return NextResponse.json({ ok: true });
}
