import { NextResponse } from "next/server";
import Stripe from "stripe";
import { appendWebhookEvent, markPaid } from "@/lib/persist-invoice";
import { kickOffOnboardingTasks } from "@/lib/onboarding";

export const dynamic = "force-dynamic";

// Stripe webhook handler. Each tenant configures their own webhook in Stripe
// pointing at this URL with their own Webhook Signing Secret. We verify the
// signature using a per-tenant secret stored alongside the Stripe key in
// tenant_integrations.config.webhook_secret.
//
// MVP behavior: handle invoice.paid → mark invoice paid + kick off onboarding.
// Other events (invoice.payment_failed, invoice.voided, etc.) get logged only.
//
// Note: signature verification is done with the webhook secret carried inside
// the Stripe event's metadata.naples_tenant_id lookup. For multi-tenant safety,
// each tenant's webhook secret must be set (not yet wired — TODO).
export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature");
  const rawBody = await req.text();

  // For now, parse without signature verification (single-tenant test).
  // TODO: per-tenant signature verification once webhook secret UI lands.
  let event: Stripe.Event;
  try {
    event = JSON.parse(rawBody) as Stripe.Event;
  } catch {
    return NextResponse.json({ error: "bad payload" }, { status: 400 });
  }

  if (!event?.type || !event?.id) {
    return NextResponse.json({ error: "not a stripe event" }, { status: 400 });
  }

  const obj: any = event.data?.object;
  const stripeInvoiceId: string | undefined = obj?.id;

  // Always log the event against the invoice if we can find it
  if (stripeInvoiceId && obj?.object === "invoice") {
    try {
      await appendWebhookEvent({
        stripeInvoiceId,
        event: { type: event.type, id: event.id, created: event.created },
      });
    } catch {
      /* swallow log failures so Stripe still gets a 200 */
    }
  }

  if (event.type === "invoice.paid" && stripeInvoiceId) {
    const updated = await markPaid({
      stripeInvoiceId,
      paidAt: new Date(((obj?.status_transitions?.paid_at ?? event.created) as number) * 1000),
    });
    if (updated && updated.lead_id) {
      try {
        await kickOffOnboardingTasks({
          tenantId: (updated as any).tenant_id,
          invoiceId: updated.id,
          leadId: updated.lead_id,
          assigneeEmail: updated.client_email,
        });
      } catch (err) {
        console.error("onboarding kickoff failed:", (err as Error).message);
      }
    }
  }

  void sig; // signature verification TBD per the comment above
  return NextResponse.json({ received: true });
}
