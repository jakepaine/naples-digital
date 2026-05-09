import Link from "next/link";
import { createServerClient, hasSupabase } from "@naples/db";
import { getServerTenant } from "@naples/db/next";
import { TemplatesList } from "./TemplatesList";

export const dynamic = "force-dynamic";

export default async function AutoReplyPage() {
  const tenant = await getServerTenant({ fallbackSlug: "naplesdigital" });
  let initial: any[] = [];
  if (hasSupabase()) {
    const sb = createServerClient();
    const { data } = await sb
      .from("email_auto_reply_templates")
      .select("*")
      .eq("tenant_id", tenant.id)
      .order("created_at", { ascending: false });
    initial = data ?? [];
  }
  return (
    <div className="mx-auto max-w-3xl p-8 space-y-6">
      <header>
        <Link href="/" className="text-sm text-gray-500 hover:underline">
          ← Back to inbox
        </Link>
        <h1 className="text-3xl font-bold mt-3">Auto-reply templates</h1>
        <p className="text-sm text-gray-500 mt-2">
          Tenant: <span className="font-mono">{tenant.slug}</span> · Per-category
          auto-replies fire via Resend when a matching email is classified.
          Variables:{" "}
          <span className="font-mono">{`{{from_name}}`}</span>,{" "}
          <span className="font-mono">{`{{from_email}}`}</span>,{" "}
          <span className="font-mono">{`{{subject}}`}</span>,{" "}
          <span className="font-mono">{`{{preview}}`}</span>,{" "}
          <span className="font-mono">{`{{tenant_name}}`}</span>.
        </p>
      </header>
      <TemplatesList initial={initial} />
    </div>
  );
}
