import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-auth";

export const dynamic = "force-dynamic";

// GET /auth/callback?code=...&next=/portal/foo
// Magic-link redirect target. Exchange the code for a session, then
// forward the user to wherever they were trying to go (?next=).
export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/me";

  if (!code) {
    return NextResponse.redirect(
      new URL("/login?error=missing_code", req.url),
    );
  }

  try {
    const sb = await createServerSupabase();
    const { error } = await sb.auth.exchangeCodeForSession(code);
    if (error) throw error;
  } catch {
    return NextResponse.redirect(
      new URL("/login?error=exchange_failed", req.url),
    );
  }

  return NextResponse.redirect(new URL(next, req.url));
}
