import Link from "next/link";
import { getServerTenant } from "@naples/db/next";

export const dynamic = "force-dynamic";

export default async function FormsIntegrationPage() {
  const tenant = await getServerTenant({ fallbackSlug: "naplesdigital" });
  const baseUrl =
    process.env.NEXT_PUBLIC_CRM_PIPELINE_URL ??
    process.env.NEXT_PUBLIC_BASE_URL ??
    "<this app URL>";
  const tokenSet = !!process.env.INBOUND_FORM_TOKEN;
  const token = tokenSet ? "<INBOUND_FORM_TOKEN>" : null;
  const webhookUrl = tokenSet
    ? `${baseUrl}/api/inbound-form?tenant=${tenant.slug}&token=${token}`
    : `${baseUrl}/api/inbound-form?tenant=${tenant.slug}`;

  return (
    <div className="mx-auto max-w-2xl p-8 space-y-6">
      <header>
        <Link href="/" className="text-sm text-gray-500 hover:underline">
          ← Back to pipeline
        </Link>
        <h1 className="text-3xl font-bold mt-3">Form intake → CRM</h1>
        <p className="text-sm text-gray-500 mt-2">
          Tenant: <span className="font-mono">{tenant.slug}</span> · Point any
          form vendor (Typeform, Tally, Webflow, generic webhook) at the URL
          below. New responses become lead rows.
        </p>
      </header>

      <section className="space-y-3">
        <div className="font-semibold text-sm">Your webhook URL</div>
        <pre className="rounded border border-gray-200 bg-gray-50 p-3 text-xs font-mono break-all">
          {webhookUrl}
        </pre>
        {!tokenSet && (
          <div className="rounded border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            <span className="font-semibold">No abuse protection.</span> Set{" "}
            <span className="font-mono">INBOUND_FORM_TOKEN</span> in Doppler to
            require a query token on incoming requests.
          </div>
        )}
      </section>

      <section className="rounded border border-gray-200 bg-gray-50 p-4 text-sm space-y-2">
        <div className="font-semibold">Typeform setup</div>
        <ol className="list-decimal pl-5 space-y-1">
          <li>
            In Typeform: Connect → Webhooks → Add a webhook → paste the URL
            above.
          </li>
          <li>
            Field refs map to lead fields:{" "}
            <span className="font-mono">name</span>,{" "}
            <span className="font-mono">email</span>,{" "}
            <span className="font-mono">type</span>,{" "}
            <span className="font-mono">goal</span>,{" "}
            <span className="font-mono">value</span>.
          </li>
          <li>
            Optional: add a Hidden Field{" "}
            <span className="font-mono">tenant_slug</span> if you want one
            Typeform pointed at multiple tenants.
          </li>
        </ol>
      </section>

      <section className="rounded border border-gray-200 bg-gray-50 p-4 text-sm space-y-2">
        <div className="font-semibold">Generic webhook</div>
        <pre className="text-xs font-mono whitespace-pre-wrap">{`POST ${webhookUrl}
Content-Type: application/json

{
  "name": "Sarah Liu",
  "email": "sarah@example.com",
  "type": "Bookkeeping",
  "goal": "Streamline client onboarding",
  "value": 3500,
  "source": "Webflow form"
}`}</pre>
      </section>
    </div>
  );
}
