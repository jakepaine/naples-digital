import Link from "next/link";
import { StripeIntegrationForm } from "./StripeIntegrationForm";
import { getServerTenant } from "@naples/db/next";
import { createServerClient, hasSupabase } from "@naples/db";

export const dynamic = "force-dynamic";

export default async function StripeIntegrationPage() {
  const tenant = await getServerTenant({ fallbackSlug: "naplesdigital" });
  let initialState: {
    configured: boolean;
    status: string | null;
    last_verified_at: string | null;
    has_webhook_secret: boolean;
  } = {
    configured: false,
    status: null,
    last_verified_at: null,
    has_webhook_secret: false,
  };

  if (hasSupabase()) {
    const sb = createServerClient();
    const { data } = await sb
      .from("tenant_integrations")
      .select("status, config, last_verified_at")
      .eq("tenant_id", tenant.id)
      .eq("kind", "stripe")
      .maybeSingle();
    initialState = {
      configured: !!data,
      status: (data as any)?.status ?? null,
      last_verified_at: (data as any)?.last_verified_at ?? null,
      has_webhook_secret: !!(data as any)?.config?.webhook_secret,
    };
  }

  return (
    <div className="mx-auto max-w-2xl p-8 space-y-6">
      <header>
        <Link href="/" className="text-sm text-gray-500 hover:underline">
          ← Back to leads
        </Link>
        <h1 className="text-3xl font-bold mt-3">Stripe integration</h1>
        <p className="text-sm text-gray-500 mt-2">
          Tenant: <span className="font-mono">{tenant.slug}</span> · Stored
          encrypted in Supabase Vault. We never log your secret.
        </p>
      </header>

      <StripeIntegrationForm initialState={initialState} />

      <div className="rounded border border-gray-200 bg-gray-50 p-4 text-sm space-y-2">
        <div className="font-semibold">How to get your keys:</div>
        <ol className="list-decimal pl-5 space-y-1">
          <li>
            Go to{" "}
            <a
              className="text-blue-700 underline"
              href="https://dashboard.stripe.com/apikeys"
              target="_blank"
              rel="noreferrer"
            >
              Stripe Dashboard → Developers → API keys
            </a>
            . Copy your <span className="font-mono">Secret key</span> (starts
            with <span className="font-mono">sk_live_</span> or{" "}
            <span className="font-mono">sk_test_</span>).
          </li>
          <li>
            For the webhook secret: go to{" "}
            <a
              className="text-blue-700 underline"
              href="https://dashboard.stripe.com/webhooks"
              target="_blank"
              rel="noreferrer"
            >
              Webhooks
            </a>{" "}
            → Add endpoint, paste your unique tenant URL:
            <pre className="mt-2 rounded border border-gray-300 bg-white p-2 text-xs font-mono break-all">
              {`${process.env.NEXT_PUBLIC_LEAD_WON_INVOICE_URL ?? "<this-app-url>"}/api/webhooks/stripe/${tenant.id}`}
            </pre>
            Subscribe to <span className="font-mono">invoice.paid</span>, then
            copy the <span className="font-mono">Signing secret</span> (starts
            with <span className="font-mono">whsec_</span>) and paste it
            into the form above.
          </li>
          <li>
            Webhook signature is verified per-tenant — calls without a valid
            signature are rejected with 401.
          </li>
        </ol>
      </div>
    </div>
  );
}
