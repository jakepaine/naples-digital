// POST /api/experiments/[id]/push  — push N leads through the experiment
//   Body: {
//     leads: [{ email, name, company?, variables? }],
//     campaignId?: string  // vendor-side campaign, optional
//   }
// Returns per-lead: { email, ok, variantId?, vendorExternalId?, reason? }
//
// Each lead gets a weighted-random variant. Stub-mode-by-default applies:
// when no Instantly/Smartlead key is configured, the vendor returns
// synthetic external IDs and the assignment is still recorded — useful
// for testing the experiment shape end-to-end.

import { NextResponse } from "next/server";
import { createServerClient, hasSupabase } from "@naples/db";
import { getServerTenant } from "@naples/db/next";
import { getOutreachVendorForTenant } from "@naples/outreach";
import { pushLeadIntoExperiment } from "@naples/outreach/experiment";
import { createInstantlyVendor } from "@naples/outreach/instantly";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function POST(
  req: Request,
  ctx: { params: { id: string } },
) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }
  const leads = Array.isArray(body?.leads) ? body.leads : [];
  if (leads.length === 0) {
    return NextResponse.json({ error: "leads array required" }, { status: 400 });
  }
  if (leads.length > 500) {
    return NextResponse.json({ error: "max 500 leads per push" }, { status: 400 });
  }

  if (!hasSupabase()) return NextResponse.json({ error: "Supabase required" }, { status: 500 });
  const tenant = await getServerTenant({ fallbackSlug: "naplesdigital" });
  const supabase = createServerClient();

  // Resolve a vendor — fall back to a stub instantly vendor with empty
  // key so pushSequence returns synthetic external IDs (instead of
  // throwing) when nothing is configured.
  const vendor =
    (await getOutreachVendorForTenant(tenant.id)) ??
    createInstantlyVendor({ apiKey: "", config: {} });

  const results: unknown[] = [];
  for (const lead of leads) {
    const email = String(lead?.email ?? "").trim();
    if (!email || !email.includes("@")) {
      results.push({ email: lead?.email ?? "", ok: false, reason: "invalid_email" });
      continue;
    }
    const name = String(lead?.name ?? "").trim() || email.split("@")[0];
    const result = await pushLeadIntoExperiment({
      supabase,
      vendor,
      tenantId: tenant.id,
      experimentId: ctx.params.id,
      lead: {
        email,
        name,
        company: lead?.company,
        variables: lead?.variables,
      },
      campaignId: body?.campaignId,
    });
    results.push({ email, ...result });
  }

  return NextResponse.json({ results, count: results.length });
}
