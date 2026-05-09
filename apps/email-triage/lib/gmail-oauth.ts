import { google } from "googleapis";
import { createServerClient, hasSupabase } from "@naples/db";

// Per-app OAuth scopes. Read + modify (label/archive) so we can apply category
// labels and archive noise without leaving Gmail. We do NOT request send scope —
// auto-replies (next commit) will use the readonly+modify scope to mark a draft;
// when send is needed we'll re-prompt.
export const GMAIL_SCOPES = [
  "https://www.googleapis.com/auth/gmail.modify",
  "openid",
  "email",
  "profile",
];

export class GmailOAuthNotConfiguredError extends Error {
  constructor() {
    super(
      "GMAIL_CLIENT_ID / GMAIL_CLIENT_SECRET / GMAIL_REDIRECT_URI not set in env. Configure your Google Cloud OAuth app and add the keys to Doppler.",
    );
    this.name = "GmailOAuthNotConfiguredError";
  }
}

export interface OAuthEnv {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

export function readOAuthEnv(): OAuthEnv {
  const clientId = process.env.GMAIL_CLIENT_ID;
  const clientSecret = process.env.GMAIL_CLIENT_SECRET;
  const redirectUri = process.env.GMAIL_REDIRECT_URI;
  if (!clientId || !clientSecret || !redirectUri) {
    throw new GmailOAuthNotConfiguredError();
  }
  return { clientId, clientSecret, redirectUri };
}

export function makeOAuthClient(env: OAuthEnv = readOAuthEnv()) {
  return new google.auth.OAuth2(env.clientId, env.clientSecret, env.redirectUri);
}

// Builds the URL we redirect the tenant to. `state` carries the tenant_id so
// the callback can write to the right Vault entry.
export function getAuthUrl(args: { tenantId: string; state?: string }): string {
  const oauth = makeOAuthClient();
  return oauth.generateAuthUrl({
    access_type: "offline", // ensures we get a refresh_token
    prompt: "consent", // forces refresh_token even on re-grants
    scope: GMAIL_SCOPES,
    state: args.state ?? args.tenantId,
  });
}

export interface ExchangedTokens {
  refresh_token: string;
  access_token: string;
  expiry_date: number;
  email_address: string;
}

// Exchange OAuth code → tokens, then look up the user's email via the
// userinfo endpoint so we can store it in tenant_integrations.config.
export async function exchangeCode(code: string): Promise<ExchangedTokens> {
  const oauth = makeOAuthClient();
  const { tokens } = await oauth.getToken(code);
  if (!tokens.refresh_token) {
    throw new Error(
      "Google did not return a refresh_token. Ensure prompt=consent on the auth URL and the user accepted offline access.",
    );
  }
  oauth.setCredentials(tokens);
  const oauth2 = google.oauth2({ version: "v2", auth: oauth });
  const userinfo = await oauth2.userinfo.get();
  return {
    refresh_token: tokens.refresh_token,
    access_token: tokens.access_token ?? "",
    expiry_date: tokens.expiry_date ?? Date.now() + 3600 * 1000,
    email_address: userinfo.data.email ?? "unknown",
  };
}

// Persist tokens to Vault (refresh_token only — access_token is short-lived
// and re-derived from refresh on every Gmail call). Email + expiry land in
// tenant_integrations.config for visibility.
export async function persistGmailTokens(args: {
  tenantId: string;
  tokens: ExchangedTokens;
}): Promise<void> {
  if (!hasSupabase()) {
    throw new Error("Supabase required to persist Gmail tokens.");
  }
  const sb = createServerClient();
  const { error } = await sb.rpc("set_tenant_secret", {
    p_tenant_id: args.tenantId,
    p_kind: "gmail",
    p_secret: args.tokens.refresh_token,
    p_config: {
      email_address: args.tokens.email_address,
      expiry_date: args.tokens.expiry_date,
      scopes: GMAIL_SCOPES,
    },
  });
  if (error) throw new Error(`set_tenant_secret(gmail): ${error.message}`);
}
