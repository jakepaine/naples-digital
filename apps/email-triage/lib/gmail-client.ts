import { google, gmail_v1 } from "googleapis";
import { createServerClient, hasSupabase } from "@naples/db";
import { makeOAuthClient } from "./gmail-oauth";

export class TenantGmailMissingError extends Error {
  constructor(tenantId: string) {
    super(`Tenant ${tenantId} has no Gmail integration. Visit /integrations/gmail to connect.`);
    this.name = "TenantGmailMissingError";
  }
}

// Per-tenant Gmail SDK. Uses the refresh_token from Vault to mint a fresh
// access_token on each request (googleapis handles refresh internally as
// long as we set credentials with refresh_token).
//
// Note: this returns a brand-new client per call. The OAuth2 client caches
// the access_token in-memory, so cold starts pay one extra round-trip to
// Google. Acceptable for now; can add a per-tenant cache layer later.
export async function getTenantGmailClient(
  tenantId: string,
): Promise<gmail_v1.Gmail> {
  if (!hasSupabase()) {
    throw new Error("Supabase required to load Gmail credentials.");
  }
  const sb = createServerClient();
  const { data, error } = await sb.rpc("get_tenant_secret", {
    p_tenant_id: tenantId,
    p_kind: "gmail",
  });
  if (error) throw new Error(`get_tenant_secret: ${error.message}`);
  const row = (data ?? [])[0] as
    | { out_secret: string; out_config: any }
    | undefined;
  if (!row?.out_secret) throw new TenantGmailMissingError(tenantId);

  const oauth = makeOAuthClient();
  oauth.setCredentials({ refresh_token: row.out_secret });
  return google.gmail({ version: "v1", auth: oauth });
}
