import Link from "next/link";
import { GmailSettingsForm } from "./GmailSettingsForm";
import { getServerTenant } from "@naples/db/next";
import { createServerClient, hasSupabase } from "@naples/db";

export const dynamic = "force-dynamic";

export default async function GmailIntegrationPage({
  searchParams,
}: {
  searchParams: { connected?: string; error?: string; message?: string };
}) {
  const tenant = await getServerTenant({ fallbackSlug: "naplesdigital" });
  const oauthAppConfigured = !!(
    process.env.GMAIL_CLIENT_ID &&
    process.env.GMAIL_CLIENT_SECRET &&
    process.env.GMAIL_REDIRECT_URI
  );

  let connection: {
    configured: boolean;
    status: string | null;
    email_address: string | null;
    last_verified_at: string | null;
  } = {
    configured: false,
    status: null,
    email_address: null,
    last_verified_at: null,
  };

  if (hasSupabase()) {
    const sb = createServerClient();
    const { data } = await sb
      .from("tenant_integrations")
      .select("status, config, last_verified_at")
      .eq("tenant_id", tenant.id)
      .eq("kind", "gmail")
      .maybeSingle();
    if (data) {
      connection = {
        configured: true,
        status: (data as any).status,
        email_address: (data as any).config?.email_address ?? null,
        last_verified_at: (data as any).last_verified_at,
      };
    }
  }

  return (
    <div className="mx-auto max-w-2xl p-8 space-y-6">
      <header>
        <Link href="/" className="text-sm text-gray-500 hover:underline">
          ← Back to inbox
        </Link>
        <h1 className="text-3xl font-bold mt-3">Gmail integration</h1>
        <p className="text-sm text-gray-500 mt-2">
          Tenant: <span className="font-mono">{tenant.slug}</span> · Refresh
          token stored encrypted in Supabase Vault. We never see your password.
        </p>
      </header>

      {searchParams.connected && (
        <div className="rounded border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
          ✅ Connected{" "}
          <span className="font-mono">{searchParams.connected}</span>.
        </div>
      )}
      {searchParams.error && (
        <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-900">
          {searchParams.error === "gmail_oauth_not_configured" ? (
            <>
              <span className="font-semibold">OAuth app not configured.</span>{" "}
              Set <span className="font-mono">GMAIL_CLIENT_ID</span>,{" "}
              <span className="font-mono">GMAIL_CLIENT_SECRET</span>, and{" "}
              <span className="font-mono">GMAIL_REDIRECT_URI</span> in Doppler
              first.
            </>
          ) : (
            <>
              {searchParams.error}
              {searchParams.message && (
                <div className="text-xs opacity-80 mt-1">
                  {searchParams.message}
                </div>
              )}
            </>
          )}
        </div>
      )}

      <GmailSettingsForm
        oauthAppConfigured={oauthAppConfigured}
        connection={connection}
      />

      <div className="rounded border border-gray-200 bg-gray-50 p-4 text-sm space-y-2">
        <div className="font-semibold">First-time setup (Naples Digital owner):</div>
        <ol className="list-decimal pl-5 space-y-1">
          <li>
            <a
              href="https://console.cloud.google.com/apis/credentials"
              target="_blank"
              rel="noreferrer"
              className="text-blue-700 underline"
            >
              Google Cloud Console → Credentials
            </a>{" "}
            → Create OAuth 2.0 Client ID (type: Web application).
          </li>
          <li>
            Authorized redirect URI:{" "}
            <span className="font-mono">
              {process.env.GMAIL_REDIRECT_URI ??
                "<set NEXT_PUBLIC_BASE_URL>/api/integrations/gmail/callback"}
            </span>
          </li>
          <li>
            Add to Doppler (<span className="font-mono">naples-digital/prd</span>):{" "}
            <span className="font-mono">GMAIL_CLIENT_ID</span>,{" "}
            <span className="font-mono">GMAIL_CLIENT_SECRET</span>,{" "}
            <span className="font-mono">GMAIL_REDIRECT_URI</span>.
          </li>
          <li>
            Enable Gmail API in your Google Cloud project (APIs & Services →
            Library → Gmail API).
          </li>
          <li>
            For early-stage tenants, add their email as a test user under OAuth
            consent screen → Test users (no Google verification needed for first
            ~100 users).
          </li>
        </ol>
      </div>
    </div>
  );
}
