import { NextResponse } from "next/server";
import { getServerTenant } from "@naples/db/next";
import {
  listProposals,
  createProposalFromDraft,
  fetchLeadContext,
} from "@/lib/persist-proposal";
import { draftProposal } from "@/lib/draft-proposal";

export const dynamic = "force-dynamic";

export async function GET() {
  const tenant = await getServerTenant({ fallbackSlug: "naplesdigital" });
  const proposals = await listProposals(tenant.id);
  return NextResponse.json({ proposals });
}

// POST /api/proposals
//   body: { leadId: string }
//   → drafts via Claude, persists, returns the row
export async function POST(req: Request) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }
  if (!body?.leadId) {
    return NextResponse.json({ error: "leadId required" }, { status: 400 });
  }
  const tenant = await getServerTenant({ fallbackSlug: "naplesdigital" });
  const lead = await fetchLeadContext(tenant.id, body.leadId);
  if (!lead) {
    return NextResponse.json({ error: "lead not found" }, { status: 404 });
  }
  const draft = await draftProposal({ lead, tenantName: tenant.name });
  const proposal = await createProposalFromDraft({
    tenantId: tenant.id,
    leadId: body.leadId,
    lead,
    draft,
  });
  return NextResponse.json({ proposal });
}
