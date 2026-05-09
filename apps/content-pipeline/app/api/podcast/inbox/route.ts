// GET /api/podcast/inbox  — list inbox items for the tenant
//   Query: ?status=pending|promoted|skipped|failed&limit=50

import { NextResponse } from "next/server";
import { createServerClient, hasSupabase } from "@naples/db";
import { getServerTenant } from "@naples/db/next";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!hasSupabase()) return NextResponse.json({ items: [] });
  const tenant = await getServerTenant({ fallbackSlug: "naplesdigital" });
  const sb = createServerClient() as any;

  const url = new URL(req.url);
  const status = url.searchParams.get("status");
  const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "50", 10) || 50, 200);

  let query = sb
    .from("podcast_episode_inbox")
    .select("*, feed:podcast_feeds(id, name, feed_url)")
    .eq("tenant_id", tenant.id);
  if (status) query = query.eq("status", status);
  query = query.order("ingested_at", { ascending: false }).limit(limit);

  const { data } = await query;
  return NextResponse.json({ items: data ?? [] });
}
