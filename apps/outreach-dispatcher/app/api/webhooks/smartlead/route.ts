import { NextResponse } from "next/server";
import { createSmartleadVendor } from "@naples/outreach/smartlead";
import {
  recordEmailEvent, getSequenceByExternalId, updateSequenceState,
  updateLeadStage,
} from "@naples/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const url = new URL(req.url);
  const tenantSlug = url.searchParams.get("tenant");
  if (!tenantSlug) return NextResponse.json({ error: "tenant query param required" }, { status: 400 });

  const rawBody = await req.text();
  const vendor = createSmartleadVendor({ apiKey: "" });
  const parsed = await vendor.parseWebhook(req.headers, rawBody);
  if (!parsed.ok) return NextResponse.json({ ok: false, error: parsed.error }, { status: 200 });

  for (const event of parsed.events) {
    if (event.externalSendId) {
      await recordEmailEvent({
        externalSendId: event.externalSendId,
        kind: event.kind === "unsubscribed" ? "bounced" : event.kind,
        ts: event.ts,
        replyBody: event.reply?.body,
      });
    }
    if (event.externalLeadId) {
      const seq = await getSequenceByExternalId(event.externalLeadId);
      if (seq) {
        if (event.kind === "replied") {
          await updateSequenceState(seq.tenant_id, seq.id, "replied");
          await updateLeadStage(seq.tenant_id, seq.lead_id, "Contacted", 0);
        } else if (event.kind === "bounced") {
          await updateSequenceState(seq.tenant_id, seq.id, "bounced");
        }
      }
    }
  }

  return NextResponse.json({ ok: true, processed: parsed.events.length });
}
