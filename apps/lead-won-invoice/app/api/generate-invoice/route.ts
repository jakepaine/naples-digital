import { NextResponse } from "next/server";
import { MOCK_LEADS } from "@/lib/mock-leads";
import { generateInvoice } from "@/lib/generate-invoice";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }
  const lead = MOCK_LEADS.find((l) => l.id === body.leadId);
  if (!lead)
    return NextResponse.json({ error: "unknown leadId" }, { status: 404 });
  return NextResponse.json({ lead, invoice: generateInvoice(lead) });
}
