import { NextResponse } from "next/server";
import {
  exchangeCode,
  persistGmailTokens,
  GmailOAuthNotConfiguredError,
} from "@/lib/gmail-oauth";

export const dynamic = "force-dynamic";

// GET /api/integrations/gmail/callback?code=...&state=<tenant_id>
// Google redirects here after the user grants consent.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state"); // tenant_id
  const errorParam = url.searchParams.get("error");

  if (errorParam) {
    return NextResponse.redirect(
      new URL(`/integrations/gmail?error=${encodeURIComponent(errorParam)}`, req.url),
    );
  }
  if (!code || !state) {
    return NextResponse.redirect(
      new URL("/integrations/gmail?error=missing_code", req.url),
    );
  }

  try {
    const tokens = await exchangeCode(code);
    await persistGmailTokens({ tenantId: state, tokens });
    return NextResponse.redirect(
      new URL(
        `/integrations/gmail?connected=${encodeURIComponent(tokens.email_address)}`,
        req.url,
      ),
    );
  } catch (e) {
    const code =
      e instanceof GmailOAuthNotConfiguredError
        ? "gmail_oauth_not_configured"
        : "exchange_failed";
    return NextResponse.redirect(
      new URL(
        `/integrations/gmail?error=${encodeURIComponent(code)}&message=${encodeURIComponent((e as Error).message)}`,
        req.url,
      ),
    );
  }
}
