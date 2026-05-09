import { NextResponse } from "next/server";
import {
  getNaplesStripe,
  priceIdForTier,
  BillingNotConfiguredError,
} from "@/lib/billing";
import type { Tier } from "@naples/db";

export const dynamic = "force-dynamic";

// POST /api/billing/checkout
//   body: { tier: 'starter'|'growth'|'premium'|'design_partner', email?: string }
//   → returns { url } pointing at the Stripe Checkout session.
export async function POST(req: Request) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }
  const tier = body?.tier as Tier | undefined;
  if (!tier) {
    return NextResponse.json({ error: "tier required" }, { status: 400 });
  }
  const priceId = priceIdForTier(tier);
  if (!priceId) {
    return NextResponse.json(
      {
        error: "tier_not_self_serve",
        message: `${tier} is not self-serve. Contact sales.`,
      },
      { status: 400 },
    );
  }

  let stripe;
  try {
    stripe = getNaplesStripe();
  } catch (e) {
    if (e instanceof BillingNotConfiguredError) {
      return NextResponse.json(
        { error: "billing_not_configured", message: e.message },
        { status: 503 },
      );
    }
    throw e;
  }

  const origin = new URL(req.url).origin;
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    customer_email: typeof body.email === "string" ? body.email : undefined,
    success_url: `${origin}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/pricing`,
    metadata: { naples_tier: tier },
    subscription_data: { metadata: { naples_tier: tier } },
    billing_address_collection: "auto",
    allow_promotion_codes: true,
  });

  return NextResponse.json({ url: session.url, sessionId: session.id });
}
