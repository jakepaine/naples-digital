import { NextResponse } from "next/server";
import { updateLeadStage } from "@naples/db";
import type { LeadStage } from "@naples/mock-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID_STAGES: LeadStage[] = [
  "Lead Captured", "Contacted", "Meeting Booked", "Proposal Sent", "Client Won",
];

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  let body: { stage?: string; days_in_stage?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.stage || !VALID_STAGES.includes(body.stage as LeadStage)) {
    return NextResponse.json({ error: "Invalid stage" }, { status: 400 });
  }

  const ok = await updateLeadStage(params.id, body.stage as LeadStage, body.days_in_stage ?? 0);
  return NextResponse.json({ ok });
}
