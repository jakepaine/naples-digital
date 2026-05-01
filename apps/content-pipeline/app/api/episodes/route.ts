import { NextResponse } from "next/server";
import { createEpisode } from "@naples/db";
import type { Episode } from "@naples/mock-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface Body {
  show: Episode["show"];
  title: string;
  guest: string;
  guestTitle?: string;
  recordDate?: string;
}

export async function POST(req: Request) {
  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.show || !body.title || !body.guest) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // record_date is a DATE column — Postgres rejects "TBD". Default to today
  // when caller doesn't supply a date.
  const recordDate = body.recordDate && /^\d{4}-\d{2}-\d{2}$/.test(body.recordDate)
    ? body.recordDate
    : new Date().toISOString().slice(0, 10);

  const created = await createEpisode({
    show: body.show,
    title: body.title,
    guest: body.guest,
    guestTitle: body.guestTitle ?? "",
    recordDate,
    status: "Scheduled",
    clipsCut: 0,
    clipsPosted: 0,
    platforms: [],
  });

  if (!created) {
    return NextResponse.json({ ok: true, episode: null, persisted: false });
  }
  return NextResponse.json({ ok: true, episode: created, persisted: true });
}
