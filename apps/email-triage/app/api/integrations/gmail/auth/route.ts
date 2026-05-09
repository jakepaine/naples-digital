import { NextResponse } from "next/server";
import { getServerTenant } from "@naples/db/next";
import { getAuthUrl, GmailOAuthNotConfiguredError } from "@/lib/gmail-oauth";

export const dynamic = "force-dynamic";

// GET /api/integrations/gmail/auth → 302 to Google's consent screen.
export async function GET() {
  try {
    const tenant = await getServerTenant({ fallbackSlug: "naplesdigital" });
    const url = getAuthUrl({ tenantId: tenant.id });
    return NextResponse.redirect(url);
  } catch (e) {
    if (e instanceof GmailOAuthNotConfiguredError) {
      return NextResponse.json(
        {
          error: "gmail_oauth_not_configured",
          message: e.message,
        },
        { status: 503 },
      );
    }
    return NextResponse.json(
      { error: (e as Error).message },
      { status: 500 },
    );
  }
}
