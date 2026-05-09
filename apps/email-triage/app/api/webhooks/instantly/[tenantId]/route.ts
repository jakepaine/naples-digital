// Per-tenant Instantly cold-email reply webhook.
//
// URL pattern matches the Stripe per-tenant webhook design:
//   POST /api/webhooks/instantly/<tenant_id>
// Each tenant configures their Instantly Webhooks → Reply Received event
// to POST to their unique URL. Per-tenant URL means we can identify the
// tenant before parsing the body (mirroring the chicken-and-egg signature
// fix from the lead-won-invoice Stripe webhook).
//
// Auth: Instantly signs payloads via an HMAC header. We support an
// optional INSTANTLY_WEBHOOK_SHARED_SECRET (platform-wide env) for now —
// per-tenant webhook secrets can move into tenant_integrations.config
// in a follow-up once Instantly's signing scheme is documented stably.
//
// Subscribed events:
//   - reply_received          (canonical reply)
//   - email_bounced           (treated as bounce intent)
//   - email_unsubscribed      (treated as unsubscribe intent)
//
// Implementation note: we ALWAYS run the intent classifier on the body
// regardless of event type so that bounces masquerading as replies (or
// vice versa) get reclassified correctly.

import { NextResponse } from "next/server";
import crypto from "crypto";
import { getTenantById } from "@naples/db";
import {
  processInstantlyReply,
  type InstantlyReplyEvent,
} from "@/lib/instantly-handler";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(
  req: Request,
  ctx: { params: { tenantId: string } },
) {
  const tenantId = ctx.params.tenantId;
  if (!isUuid(tenantId)) {
    return NextResponse.json({ error: "invalid tenant id" }, { status: 400 });
  }
  const tenant = await getTenantById(tenantId);
  if (!tenant) {
    return NextResponse.json({ error: "tenant not found" }, { status: 404 });
  }

  const rawBody = await req.text();

  // Optional HMAC verification — only enforced if a secret is set.
  // Instantly's docs recommend HMAC-SHA256 of the raw body with the
  // shared secret; header name is "Instantly-Signature".
  const expected = process.env.INSTANTLY_WEBHOOK_SHARED_SECRET;
  if (expected) {
    const sig = req.headers.get("instantly-signature") ?? req.headers.get("x-instantly-signature");
    if (!sig) {
      return NextResponse.json({ error: "missing signature" }, { status: 401 });
    }
    const computed = crypto
      .createHmac("sha256", expected)
      .update(rawBody)
      .digest("hex");
    if (!safeEq(sig.replace(/^sha256=/, ""), computed)) {
      return NextResponse.json({ error: "invalid signature" }, { status: 401 });
    }
  }

  let payload: InstantlyReplyEvent;
  try {
    payload = JSON.parse(rawBody) as InstantlyReplyEvent;
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }

  const result = await processInstantlyReply({
    tenantId: tenant.id,
    tenantSlug: tenant.slug,
    payload,
  });

  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.error ?? "process_failed" },
      { status: 500 },
    );
  }
  return NextResponse.json(result);
}

function isUuid(s: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
}

function safeEq(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
  } catch {
    return false;
  }
}
