import Link from "next/link";
import { createServerClient, hasSupabase } from "@naples/db";
import { getServerTenant } from "@naples/db/next";
import { TemplatesList } from "./TemplatesList";

export const dynamic = "force-dynamic";

export default async function TemplatesPage() {
  const tenant = await getServerTenant({ fallbackSlug: "naplesdigital" });
  let initial: any[] = [];
  if (hasSupabase()) {
    const sb = createServerClient();
    const { data } = await sb
      .from("lead_email_templates")
      .select("*")
      .eq("tenant_id", tenant.id)
      .order("created_at", { ascending: false });
    initial = data ?? [];
  }
  return (
    <div className="mx-auto max-w-3xl p-8 space-y-6">
      <header>
        <Link href="/" className="text-sm text-gray-500 hover:underline">
          ← Back to pipeline
        </Link>
        <h1 className="text-3xl font-bold mt-3">Stage-change emails</h1>
        <p className="text-sm text-gray-500 mt-2">
          Tenant: <span className="font-mono">{tenant.slug}</span> · When a
          lead's stage transitions, matching templates fire automatically via
          Resend. Variables:{" "}
          <span className="font-mono">{`{{name}}`}</span>,{" "}
          <span className="font-mono">{`{{email}}`}</span>,{" "}
          <span className="font-mono">{`{{type}}`}</span>,{" "}
          <span className="font-mono">{`{{goal}}`}</span>,{" "}
          <span className="font-mono">{`{{value}}`}</span>,{" "}
          <span className="font-mono">{`{{tenant_name}}`}</span>.
        </p>
      </header>
      <TemplatesList initial={initial} />
    </div>
  );
}
