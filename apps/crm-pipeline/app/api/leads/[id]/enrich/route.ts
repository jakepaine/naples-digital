import { NextResponse } from "next/server";
import {
  getLeadById, listLeadEmails, recordLeadEnrichment, setLeadEnrichmentStatus, setLeadDomain,
} from "@naples/db";
import { getRequestTenantId } from "@naples/db/next";
import { getEnrichmentVendorForTenant } from "@naples/enrichment";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const tid = await getRequestTenantId(req);
  const lead = await getLeadById(tid, params.id);
  if (!lead) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const vendor = await getEnrichmentVendorForTenant(tid);
  if (!vendor) {
    return NextResponse.json({ error: "No enrichment vendor configured for this tenant" }, { status: 400 });
  }

  await setLeadEnrichmentStatus(tid, params.id, "pending");

  const emails = await listLeadEmails(tid, params.id);
  const primary = emails.find(e => e.primary_address) ?? emails[0];
  if (!primary) {
    await setLeadEnrichmentStatus(tid, params.id, "failed");
    return NextResponse.json({ error: "Lead has no email to enrich" }, { status: 400 });
  }

  try {
    const result = await vendor.lookupByEmail(primary.email);
    if (!result) {
      await setLeadEnrichmentStatus(tid, params.id, "failed");
      return NextResponse.json({ error: "No match found", source: vendor.source });
    }
    if (result.domain) await setLeadDomain(tid, params.id, result.domain);
    await recordLeadEnrichment(tid, params.id, vendor.source, result.raw);
    await setLeadEnrichmentStatus(tid, params.id, "enriched");
    return NextResponse.json({ enrichment: result, source: vendor.source });
  } catch (e) {
    await setLeadEnrichmentStatus(tid, params.id, "failed");
    return NextResponse.json({ error: e instanceof Error ? e.message : "Enrichment failed" }, { status: 500 });
  }
}
