import { NextResponse } from "next/server";
import { getServerTenant } from "@naples/db/next";
import { ingestAndClassify } from "@/lib/persist-email";
import { DEMO_EMAILS } from "@/lib/inbox-query";

export const dynamic = "force-dynamic";

// Sync trigger. Two modes:
//   - body.demo === true       → ingest the seeded demo inbox (use without
//                                 Gmail OAuth; great for screenshots / Kevin demo)
//   - body.emails: InboundEmail[]  → ingest a batch passed inline
//
// Real Gmail OAuth pull lands in a follow-up commit; this endpoint will then
// also accept body.source='gmail' and pull recent unread mail itself.
export async function POST(req: Request) {
  let body: any = {};
  try {
    body = await req.json();
  } catch {
    /* empty body OK */
  }

  const tenant = await getServerTenant({ fallbackSlug: "naplesdigital" });

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
      { error: "pass { demo: true } or { emails: [...] }" },
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
