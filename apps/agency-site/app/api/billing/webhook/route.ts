import { NextResponse } from "next/server";
import Stripe from "stripe";
import {
  getNaplesStripe,
  getWebhookSecret,
  tierForPriceId,
} from "@/lib/billing";
import { createServerClient, hasSupabase, modulesForTier } from "@naples/db";
import type { Tier } from "@naples/db";

export const dynamic = "force-dynamic";

// POST /api/billing/webhook
// Stripe webhook for the Naples Digital subscription billing flow.
// Handles:
//   - checkout.session.completed → provision tenant row (idempotent)
//   - customer.subscription.created/updated → mirror tier + status
//   - customer.subscription.deleted → mark canceled, downgrade tier
//   - invoice.paid / invoice.payment_failed → update billing_status
export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature");
  if (!sig) return NextResponse.json({ error: "missing signature" }, { status: 400 });
  const rawBody = await req.text();

  let stripe: Stripe;
  let secret: string;
  try {
    stripe = getNaplesStripe();
    secret = getWebhookSecret();
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 503 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, secret);
  } catch (e) {
    return NextResponse.json(
      { error: "signature verification failed", message: (e as Error).message },
      { status: 401 },
    );
  }

  if (!hasSupabase()) {
    return NextResponse.json({ received: true, persisted: false });
  }
  const sb = createServerClient();

  // Audit row first
  // Audit row first — duplicate stripe_event_id is fine (UNIQUE constraint).
  try {
    await sb.from("naples_billing_events").insert({
      stripe_event_id: event.id,
      stripe_event_type: event.type,
      stripe_customer_id: (event.data?.object as any)?.customer ?? null,
      stripe_subscription_id:
        (event.data?.object as any)?.subscription ??
        (event.data?.object as any)?.id ?? null,
      amount_cents: (event.data?.object as any)?.amount_total ?? null,
      payload: event as any,
    });
  } catch {
    /* duplicate event id ok */
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const tier = (session.metadata?.naples_tier as Tier | undefined) ?? null;
      const customerId =
        typeof session.customer === "string" ? session.customer : null;
      const subscriptionId =
        typeof session.subscription === "string" ? session.subscription : null;
      const email = session.customer_details?.email ?? session.customer_email ?? null;

      if (customerId && tier) {
        await provisionTenant({ sb, email, customerId, subscriptionId, tier, stripe });
      }
      break;
    }
    case "customer.subscription.created":
    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription;
      const customerId = typeof sub.customer === "string" ? sub.customer : "";
      const priceId = sub.items?.data?.[0]?.price?.id ?? null;
      const tier = tierForPriceId(priceId);

      const update: any = {
        stripe_subscription_id: sub.id,
        stripe_price_id: priceId,
        billing_status: sub.status,
        current_period_end: new Date(
          (sub as any).current_period_end * 1000,
        ).toISOString(),
        cancel_at_period_end: sub.cancel_at_period_end,
      };
      if (tier) {
        update.tier = tier;
        update.enabled_modules = modulesForTier(tier);
      }
      await sb
        .from("tenants")
        .update(update)
        .eq("stripe_customer_id", customerId);
      break;
    }
    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const customerId = typeof sub.customer === "string" ? sub.customer : "";
      await sb
        .from("tenants")
        .update({
          billing_status: "canceled",
          cancel_at_period_end: false,
          status: "paused",
        })
        .eq("stripe_customer_id", customerId);
      break;
    }
    case "invoice.paid":
    case "invoice.payment_failed": {
      const inv = event.data.object as Stripe.Invoice;
      const customerId = typeof inv.customer === "string" ? inv.customer : "";
      const next =
        event.type === "invoice.paid"
          ? "active"
          : (inv as any).status === "uncollectible"
            ? "unpaid"
            : "past_due";
      await sb
        .from("tenants")
        .update({ billing_status: next })
        .eq("stripe_customer_id", customerId);
      break;
    }
  }

  return NextResponse.json({ received: true });
}

async function provisionTenant(args: {
  sb: ReturnType<typeof createServerClient>;
  email: string | null;
  customerId: string;
  subscriptionId: string | null;
  tier: Tier;
  stripe: Stripe;
}): Promise<void> {
  // Idempotency: if a tenant with this stripe_customer_id already exists, no-op.
  const { data: existing } = await args.sb
    .from("tenants")
    .select("id")
    .eq("stripe_customer_id", args.customerId)
    .maybeSingle();
  if (existing) return;

  // Derive a slug from the billing email (best-effort, may need manual rename).
  const slug = (args.email ?? `tenant-${args.customerId.slice(0, 8)}`)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 32);
  const name =
    (args.email?.split("@")[1]?.split(".")[0] ?? "New Tenant").replace(
      /^./,
      (c: string) => c.toUpperCase(),
    );

  const { error } = await args.sb.from("tenants").insert({
    slug,
    name,
    billing_email: args.email,
    stripe_customer_id: args.customerId,
    stripe_subscription_id: args.subscriptionId,
    tier: args.tier,
    enabled_modules: modulesForTier(args.tier),
    billing_status: "active",
    plan: "agency",
    status: "active",
  });
  if (error) {
    console.error("tenant provision failed:", error.message);
  }
}
