import { NextResponse } from "next/server";
import { getNaplesStripe } from "@/lib/billing";
import { createServerClient, hasSupabase } from "@naples/db";

export const dynamic = "force-dynamic";

// POST /api/billing/portal
//   body: { tenantId: string } OR { customerId: string }
//   → returns { url } pointing at Stripe's hosted Customer Portal where
//     the user can update card / cancel / upgrade.
export async function POST(req: Request) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }

  let customerId: string | null = body?.customerId ?? null;
  if (!customerId && body?.tenantId) {
    if (!hasSupabase()) {
      return NextResponse.json({ error: "no_supabase" }, { status: 500 });
    }
    const sb = createServerClient();
    const { data } = await sb
      .from("tenants")
      .select("stripe_customer_id")
      .eq("id", body.tenantId)
      .maybeSingle();
    customerId = (data as any)?.stripe_customer_id ?? null;
  }
  if (!customerId) {
    return NextResponse.json(
      { error: "no stripe_customer_id for tenant" },
      { status: 404 },
    );
  }

  const stripe = getNaplesStripe();
  const origin = new URL(req.url).origin;
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${origin}/`,
  });
  return NextResponse.json({ url: session.url });
}
