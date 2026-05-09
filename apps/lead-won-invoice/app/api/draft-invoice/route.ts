import { NextResponse } from "next/server";
import { getServerTenant } from "@naples/db/next";
import { fetchWonLeadsForTenant } from "@/lib/won-leads";
import { draftInvoiceFromLead } from "@/lib/draft-invoice";
import { persistDraftInvoice } from "@/lib/persist-invoice";
import { hasSupabase } from "@naples/db";

export const dynamic = "force-dynamic";

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
  const won = await fetchWonLeadsForTenant(tenant.id);
  const target = won.find((w) => w.lead.id === body.leadId);
  if (!target) {
    return NextResponse.json({ error: "lead not found or not won" }, { status: 404 });
  }

  const draft = await draftInvoiceFromLead(target.lead);

  // No Supabase → preview-only. Return the draft without persistence.
  if (!hasSupabase()) {
    return NextResponse.json({
      preview: true,
      lead: target.lead,
      draft,
    });
  }

  const invoice = await persistDraftInvoice({
    tenantId: tenant.id,
    lead: target.lead,
    draft,
  });
  return NextResponse.json({ lead: target.lead, invoice });
}
