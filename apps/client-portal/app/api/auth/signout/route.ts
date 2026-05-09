import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-auth";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const sb = await createServerSupabase();
    await sb.auth.signOut();
  } catch {
    /* fall through */
  }
  return NextResponse.redirect(new URL("/login", req.url));
}
