// POST /api/podcast/inbox/[id]/promote  — promote an inbox item to an
// active episodes row. The existing episodes pipeline (transcribe →
// clip-pick → render) takes over from there.
//
// Body (optional overrides): { show?, title?, guest?, guestTitle? }

import { NextResponse } from "next/server";
import { createServerClient, hasSupabase, createEpisode } from "@naples/db";
import { getServerTenant } from "@naples/db/next";

export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  ctx: { params: { id: string } },
) {
  if (!hasSupabase()) return NextResponse.json({ error: "Supabase required" }, { status: 500 });
  const tenant = await getServerTenant({ fallbackSlug: "naplesdigital" });
  const sb = createServerClient() as any;

  let body: any = {};
  try {
    body = await req.json();
  } catch {}

  const { data: inbox } = await sb
    .from("podcast_episode_inbox")
    .select("*, feed:podcast_feeds(id, default_show, name)")
    .eq("id", ctx.params.id)
    .eq("tenant_id", tenant.id)
    .maybeSingle();
  if (!inbox) return NextResponse.json({ error: "inbox item not found" }, { status: 404 });
  if (inbox.status === "promoted" && inbox.episode_id) {
    return NextResponse.json({ ok: true, already: true, episode_id: inbox.episode_id });
  }
  if (!inbox.audio_url) {
    return NextResponse.json(
      { error: "inbox item has no audio_url — cannot promote" },
      { status: 400 },
    );
  }

  const show = body?.show ?? inbox.feed?.default_show ?? "podcast";
  const title = body?.title ?? inbox.title ?? "Untitled episode";
  const guest = body?.guest ?? "Unknown";
  const recordDate = inbox.published_at?.slice(0, 10) ?? new Date().toISOString().slice(0, 10);

  const created = await createEpisode(tenant.id, {
    show,
    title,
    guest,
    guestTitle: body?.guestTitle ?? "",
    recordDate,
  } as any);

  // Stamp the audio URL on the episode (createEpisode doesn't accept it
  // as a first-class arg; episodes table has raw_video_url column).
  await sb
    .from("episodes")
    .update({ raw_video_url: inbox.audio_url })
    .eq("id", (created as { id: string }).id)
    .eq("tenant_id", tenant.id);

  await sb
    .from("podcast_episode_inbox")
    .update({
      status: "promoted",
      episode_id: (created as { id: string }).id,
      promoted_at: new Date().toISOString(),
    })
    .eq("id", inbox.id);

  return NextResponse.json({ ok: true, episode: created });
}
