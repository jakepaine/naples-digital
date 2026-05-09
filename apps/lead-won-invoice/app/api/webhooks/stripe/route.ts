import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Legacy single-tenant webhook URL — kept so existing Stripe configurations
// fail loudly with a clear migration message rather than silently breaking.
//
// Real handler is now /api/webhooks/stripe/<tenantId>. Tenant identifies
// themselves via the URL path so we can fetch their per-tenant Webhook
// Signing Secret from Vault and verify the request signature.
export async function POST() {
  return NextResponse.json(
    {
      error: "deprecated_endpoint",
      message:
        "This webhook URL no longer accepts events. Update your Stripe webhook to /api/webhooks/stripe/<your-tenant-id>. Visit /integrations/stripe for the exact URL.",
    },
    { status: 410 },
  );
}
