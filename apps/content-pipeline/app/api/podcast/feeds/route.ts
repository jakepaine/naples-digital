// GET  /api/podcast/feeds   — list tenant's podcast feeds
// POST /api/podcast/feeds   — add a feed
//   Body: { feed_url, name?, default_show?, poll_interval_minutes?, auto_promote? }

import { NextResponse } from "next/server";
import { createServerClient, hasSupabase } from "@naples/db";
import { getServerTenant } from "@naples/db/next";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!hasSupabase()) return NextResponse.json({ feeds: [] });
  const tenant = await getServerTenant({ fallbackSlug: "naplesdigital" });
  const sb = createServerClient() as any;
  const { data } = await sb
    .from("podcast_feeds")
    .select("*")
    .eq("tenant_id", tenant.id)
    .order("created_at", { ascending: false });
  return NextResponse.json({ feeds: data ?? [] });
}

export async function POST(req: Request) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }
  const url = String(body?.feed_url ?? "").trim();
  if (!url || !/^https?:\/\//i.test(url)) {
    return NextResponse.json({ error: "feed_url must be http(s) URL" }, { status: 400 });
  }
  if (!hasSupabase()) return NextResponse.json({ error: "Supabase required" }, { status: 500 });

  const tenant = await getServerTenant({ fallbackSlug: "naplesdigital" });
  const sb = createServerClient() as any;
  const { data, error } = await sb
    .from("podcast_feeds")
    .insert({
      tenant_id: tenant.id,
      feed_url: url,
      name: body?.name ?? null,
      default_show: body?.default_show ?? null,
      poll_interval_minutes: typeof body?.poll_interval_minutes === "number" ? body.poll_interval_minutes : 60,
      auto_promote: !!body?.auto_promote,
    })
    .select()
    .single();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ feed: data }, { status: 201 });
}
