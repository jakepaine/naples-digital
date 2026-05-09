import { NextResponse } from "next/server";
import { updateLeadStage, getLeadById } from "@naples/db";
import { getRequestTenant } from "@naples/db/next";
import type { LeadStage } from "@naples/mock-data";
import { sendStageChangeEmails } from "@/lib/send-stage-email";

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

  const tenant = await getRequestTenant(req);
  const tid = tenant.id;

  // Snapshot the prior stage BEFORE the update so we can pass from→to to the
  // template matcher.
  const prior = await getLeadById(tid, params.id);
  const fromStage = (prior?.stage as string | undefined) ?? null;
  const toStage = body.stage;

  const ok = await updateLeadStage(tid, params.id, toStage as LeadStage, body.days_in_stage ?? 0);

  // Fire stage-change templated emails (no-op when no template matches).
  // Best-effort — failures here don't fail the PATCH.
  let emailResult: any = null;
  if (ok && fromStage !== toStage) {
    try {
      emailResult = await sendStageChangeEmails({
        tenantId: tid,
        tenantName: tenant.name,
        leadId: params.id,
        fromStage,
        toStage,
      });
    } catch (e) {
      console.error("stage-change email failed:", (e as Error).message);
    }
  }

  return NextResponse.json({ ok, emails: emailResult });
}
