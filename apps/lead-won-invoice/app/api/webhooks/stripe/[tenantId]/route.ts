import { NextResponse } from "next/server";
import Stripe from "stripe";
import {
  getTenantStripe,
  getTenantWebhookSecret,
  TenantStripeMissingError,
} from "@/lib/stripe-client";
import { appendWebhookEvent, markPaid } from "@/lib/persist-invoice";
import { kickOffOnboardingTasks } from "@/lib/onboarding";

export const dynamic = "force-dynamic";

// POST /api/webhooks/stripe/<tenantId>
//
// Per-tenant Stripe webhook endpoint. Each tenant configures their Stripe
// dashboard to send events to their own URL with their own Signing Secret.
// We fetch their secret from Vault (tenant_integrations.config.webhook_secret)
// and verify the signature using the Stripe SDK's constructEvent.
//
// If verification fails (no secret configured, signature mismatch), we 401
// to discourage replay attacks. Stripe will mark the endpoint as failing
// and retry per their backoff schedule until the secret is configured.
//
// MVP event coverage:
//   - invoice.paid → mark invoice paid + kick off onboarding tasks
//   - all other invoice.* events → log to webhook_event_log
export async function POST(
  req: Request,
  { params }: { params: { tenantId: string } },
) {
  const sig = req.headers.get("stripe-signature");
  const rawBody = await req.text();
  const tenantId = params.tenantId;

  if (!sig) {
    return NextResponse.json(
      { error: "missing stripe-signature header" },
      { status: 400 },
    );
  }

  // Look up tenant's webhook secret. If missing, refuse — we don't want
  // unauthenticated webhook calls.
  let webhookSecret: string | null;
  let stripe: Stripe;
  try {
    webhookSecret = await getTenantWebhookSecret(tenantId);
    stripe = await getTenantStripe(tenantId);
  } catch (e) {
    if (e instanceof TenantStripeMissingError) {
      return NextResponse.json(
        { error: "tenant has no stripe integration" },
        { status: 404 },
      );
    }
    return NextResponse.json(
      { error: (e as Error).message },
      { status: 500 },
    );
  }

  if (!webhookSecret) {
    return NextResponse.json(
      {
        error: "tenant has no webhook_secret configured",
        message:
          "Visit /integrations/stripe and paste your Stripe Webhook Signing Secret.",
      },
      { status: 401 },
    );
  }

  // Verify signature
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (e) {
    return NextResponse.json(
      { error: "signature verification failed", message: (e as Error).message },
      { status: 401 },
    );
  }

  const obj: any = event.data?.object;
  const stripeInvoiceId: string | undefined = obj?.id;

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
      paidAt: new Date(
        ((obj?.status_transitions?.paid_at ?? event.created) as number) * 1000,
      ),
    });
    if (updated && updated.lead_id) {
      try {
        await kickOffOnboardingTasks({
          tenantId,
          invoiceId: updated.id,
          leadId: updated.lead_id,
          assigneeEmail: updated.client_email,
        });
      } catch (err) {
        console.error("onboarding kickoff failed:", (err as Error).message);
      }
    }
  }

  return NextResponse.json({ received: true });
}
