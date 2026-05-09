// POST /api/podcast/inbox/[id]/skip  — operator dismisses an inbox item

import { NextResponse } from "next/server";
import { createServerClient, hasSupabase } from "@naples/db";
import { getServerTenant } from "@naples/db/next";

export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  ctx: { params: { id: string } },
) {
  if (!hasSupabase()) return NextResponse.json({ error: "Supabase required" }, { status: 500 });
  let body: any = {};
  try {
    body = await req.json();
  } catch {}

  const tenant = await getServerTenant({ fallbackSlug: "naplesdigital" });
  const sb = createServerClient() as any;
  const { error } = await sb
    .from("podcast_episode_inbox")
    .update({ status: "skipped", notes: body?.notes ?? null })
    .eq("id", ctx.params.id)
    .eq("tenant_id", tenant.id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
