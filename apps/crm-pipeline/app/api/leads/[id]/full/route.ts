import { NextResponse } from "next/server";
import {
  getLeadById, listLeadEmails, listSequencesForLead, listSendsForLead, getLatestEnrichment,
} from "@naples/db";
import { getRequestTenantId } from "@naples/db/next";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const tid = await getRequestTenantId(req);
  const lead = await getLeadById(tid, params.id);
  if (!lead) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const [emails, sequences, sends, enrichment] = await Promise.all([
    listLeadEmails(tid, params.id),
    listSequencesForLead(tid, params.id),
    listSendsForLead(tid, params.id),
    getLatestEnrichment(tid, params.id),
  ]);

  return NextResponse.json({ lead, emails, sequences, sends, enrichment });
}
