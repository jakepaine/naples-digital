import { NextResponse } from "next/server";
import { getServerTenant } from "@naples/db/next";
import { ingestAndClassify } from "@/lib/persist-email";
import { DEMO_EMAILS } from "@/lib/inbox-query";
import { pullGmailInbox } from "@/lib/sync-gmail";
import { TenantGmailMissingError } from "@/lib/gmail-client";

export const dynamic = "force-dynamic";

// Sync trigger. Three modes:
//   - body.demo === true            → ingest the seeded demo inbox
//   - body.source === "gmail"       → pull from Gmail (requires OAuth)
//   - body.emails: InboundEmail[]   → ingest a batch passed inline
export async function POST(req: Request) {
  let body: any = {};
  try {
    body = await req.json();
  } catch {
    /* empty body OK */
  }

  const tenant = await getServerTenant({ fallbackSlug: "naplesdigital" });

  // Mode A — pull from Gmail
  if (body?.source === "gmail") {
    try {
      const result = await pullGmailInbox({
        tenantId: tenant.id,
        maxResults: body.maxResults ?? 25,
        query: body.query ?? "in:inbox newer_than:7d",
      });
      return NextResponse.json({
        ok: true,
        source: "gmail",
        tenant: { id: tenant.id, slug: tenant.slug },
        ...result,
      });
    } catch (e) {
      if (e instanceof TenantGmailMissingError) {
        return NextResponse.json(
          { error: "gmail_not_connected", message: e.message },
          { status: 412 },
        );
      }
      return NextResponse.json(
        { error: (e as Error).message },
        { status: 500 },
      );
    }
  }

  // Mode B — demo seed or inline ingest
  let inbounds: any[] = [];
  if (body?.demo === true) {
    inbounds = DEMO_EMAILS().map((e) => ({
      source: "demo",
      source_message_id: e.id,
      source_thread_id: null,
      from_email: e.from_email,
      from_name: e.from_name,
      to_email: e.to_email,
      subject: e.subject,
      received_at: e.received_at,
      preview: e.preview,
      body_text: e.body_text,
      body_html: e.body_html,
    }));
  } else if (Array.isArray(body?.emails)) {
    inbounds = body.emails;
  } else {
    return NextResponse.json(
      { error: "pass { demo: true }, { source: 'gmail' }, or { emails: [...] }" },
      { status: 400 },
    );
  }

  const results: { id: string; category: string | null }[] = [];
  for (const inbound of inbounds) {
    try {
      const row = await ingestAndClassify({ tenantId: tenant.id, inbound });
      results.push({ id: row.id, category: row.category });
    } catch (e) {
      console.error("ingest failed:", (e as Error).message);
    }
  }

  return NextResponse.json({
    ok: true,
    tenant: { id: tenant.id, slug: tenant.slug },
    ingested: results.length,
    results,
  });
}
