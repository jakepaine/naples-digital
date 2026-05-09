import { NextResponse } from "next/server";
import { createLead, addLeadEmail, getTenantBySlug, getDefaultTenant } from "@naples/db";
import { parseFormPayload } from "@/lib/parse-form";
import { notifySlackInboundLead } from "@/lib/notify-slack";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/inbound-form?tenant=<slug>
//
// Accepts a Typeform form_response webhook OR a generic flat
// { name, email, type?, goal?, value?, source? } object. Looks up the tenant
// by slug from ?tenant= (or body.tenant_slug, or Typeform's hidden.tenant_slug),
// creates a lead, optionally fires Slack alert.
//
// To prevent abuse, set INBOUND_FORM_TOKEN in env. Callers must include
// ?token=<value> matching it. If unset, requests are accepted without auth
// (dev/early-stage default).
export async function POST(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token");
  const expected = process.env.INBOUND_FORM_TOKEN;
  if (expected && token !== expected) {
    return NextResponse.json({ error: "invalid token" }, { status: 401 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }

  const tenantSlug =
    url.searchParams.get("tenant") ??
    body?.tenant_slug ??
    body?.form_response?.hidden?.tenant_slug;

  const tenant = tenantSlug
    ? (await getTenantBySlug(tenantSlug)) ?? (await getDefaultTenant())
    : await getDefaultTenant();

  const parsed = parseFormPayload(body);
  if (!parsed) {
    return NextResponse.json(
      { error: "could not extract a lead from payload" },
      { status: 422 },
    );
  }

  const lead = await createLead(tenant.id, {
    name: parsed.name,
    type: parsed.type ?? "Inbound",
    goal: parsed.goal ?? "Unknown",
    value: parsed.value ?? 0,
    source: parsed.source ?? "form",
  });

  if (!lead) {
    return NextResponse.json({ error: "create failed" }, { status: 500 });
  }

  if (parsed.email) {
    await addLeadEmail(tenant.id, lead.id, parsed.email, true);
  }

  // Fire-and-forget Slack alert
  await notifySlackInboundLead({
    tenantSlug: tenant.slug,
    lead: {
      id: lead.id,
      name: parsed.name,
      email: parsed.email,
      type: parsed.type,
      goal: parsed.goal,
      value: parsed.value,
      source: parsed.source,
    },
  });

  return NextResponse.json({
    ok: true,
    tenant: { id: tenant.id, slug: tenant.slug },
    lead: { id: lead.id },
  });
}
