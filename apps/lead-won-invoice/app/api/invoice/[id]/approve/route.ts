import { NextResponse } from "next/server";
import { getServerTenant } from "@naples/db/next";
import { markApproved, getInvoiceById } from "@/lib/persist-invoice";
import { finalizeViaStripe } from "@/lib/finalize-stripe";
import { TenantStripeMissingError } from "@/lib/stripe-client";

export const dynamic = "force-dynamic";

export async function POST(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const tenant = await getServerTenant({ fallbackSlug: "naplesdigital" });
  const inv = await getInvoiceById(params.id);
  if (!inv) {
    return NextResponse.json({ error: "invoice not found" }, { status: 404 });
  }

  // Mark approved first (auditable even if Stripe fails downstream).
  await markApproved(params.id);

  try {
    const result = await finalizeViaStripe({
      tenantId: tenant.id,
      invoiceId: params.id,
    });
    return NextResponse.json({
      ok: true,
      stripeInvoiceId: result.stripeInvoiceId,
      hostedUrl: result.hostedUrl,
    });
  } catch (err) {
    if (err instanceof TenantStripeMissingError) {
      return NextResponse.json(
        {
          ok: false,
          approved: true,
          reason: "stripe_not_configured",
          message:
            "Invoice approved but tenant has no Stripe key. Add one at /integrations/stripe.",
        },
        { status: 409 },
      );
    }
    return NextResponse.json(
      { ok: false, approved: true, error: (err as Error).message },
      { status: 502 },
    );
  }
}
