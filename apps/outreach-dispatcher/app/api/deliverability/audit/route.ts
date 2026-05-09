// POST /api/deliverability/audit
// Body: { domain: string, additionalDkimSelectors?: string[] }
// Runs SPF/DKIM/DMARC/MX DNS checks on the domain, scores it, persists
// the result to deliverability_audits, and returns the scorecard.
//
// Idempotency: not enforced — repeat runs ARE the point (DNS changes
// over time and the tenant wants the history to see remediation).

import { NextResponse } from "next/server";
import {
  auditDomainDeliverability,
  type DeliverabilityAudit,
} from "@naples/outreach/deliverability";
import { createServerClient, hasSupabase } from "@naples/db";
import { getServerTenant } from "@naples/db/next";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: Request) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }
  const domain: string | undefined = body?.domain;
  if (!domain || typeof domain !== "string" || domain.length < 3) {
    return NextResponse.json({ error: "domain required" }, { status: 400 });
  }
  const additional = Array.isArray(body?.additionalDkimSelectors)
    ? (body.additionalDkimSelectors as string[]).filter(
        (s) => typeof s === "string" && s.length > 0,
      )
    : undefined;

  const tenant = await getServerTenant({ fallbackSlug: "naplesdigital" });

  let audit: DeliverabilityAudit;
  try {
    audit = await auditDomainDeliverability(domain, {
      additionalDkimSelectors: additional,
    });
  } catch (e) {
    return NextResponse.json(
      { error: `audit failed: ${(e as Error).message}` },
      { status: 500 },
    );
  }

  if (hasSupabase()) {
    const sb = createServerClient() as any;
    await sb.from("deliverability_audits").insert({
      tenant_id: tenant.id,
      domain: audit.domain,
      spf_present: audit.spf_present,
      spf_record: audit.spf_record,
      spf_includes: audit.spf_includes,
      dkim_selectors_checked: audit.dkim_selectors_checked,
      dkim_selectors_passing: audit.dkim_selectors_passing,
      dmarc_present: audit.dmarc_present,
      dmarc_record: audit.dmarc_record,
      dmarc_policy: audit.dmarc_policy,
      dmarc_pct: audit.dmarc_pct,
      mx_records: audit.mx_records,
      list_unsubscribe_compliant: false,
      score: audit.score,
      risk_flags: audit.risk_flags,
      notes: null,
    });
  }

  return NextResponse.json({ ok: true, audit });
}

export async function GET() {
  if (!hasSupabase()) return NextResponse.json({ audits: [] });
  const tenant = await getServerTenant({ fallbackSlug: "naplesdigital" });
  const sb = createServerClient() as any;
  const { data } = await sb
    .from("deliverability_audits")
    .select("*")
    .eq("tenant_id", tenant.id)
    .order("created_at", { ascending: false })
    .limit(50);
  return NextResponse.json({ audits: (data ?? []) });
}
