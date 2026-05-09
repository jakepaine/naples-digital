// POST /api/phone-qualify/[id]/poll
// Pulls latest call status from Bland, runs the analysis prompt on
// the transcript when the call is completed, and updates the row.
// Idempotent — calling on a completed row re-runs analysis only if
// transcript changed.

import { NextResponse } from "next/server";
import { getServerTenant } from "@naples/db/next";
import { getTenantSecret } from "@naples/db";
import {
  pollBlandCall,
  analyzeQualification,
} from "@/lib/bland";
import {
  getQualification,
  updateQualification,
} from "@/lib/phone-qualifications";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(
  _req: Request,
  ctx: { params: { id: string } },
) {
  const tenant = await getServerTenant({ fallbackSlug: "mia" });
  const row = await getQualification(tenant.id, ctx.params.id);
  if (!row)
    return NextResponse.json({ error: "not found" }, { status: 404 });
  if (!row.bland_call_id) {
    return NextResponse.json(
      { error: "no bland_call_id on row" },
      { status: 400 },
    );
  }

  let apiKey: string | null = null;
  try {
    const sec = await getTenantSecret(tenant.id, "bland");
    if (sec?.secret) apiKey = sec.secret;
  } catch {
    /* fall through */
  }

  const poll = await pollBlandCall({
    apiKey,
    call_id: row.bland_call_id,
  });

  const patch: Parameters<typeof updateQualification>[0]["patch"] = {
    call_status: poll.status,
    raw: poll.raw,
  };
  if (poll.duration_seconds !== undefined)
    patch.call_duration_seconds = poll.duration_seconds;
  if (poll.transcript) patch.transcript = poll.transcript;
  if (poll.summary) patch.summary = poll.summary;

  // Stamp ended_at when status terminal.
  const isTerminal =
    poll.status === "completed" ||
    poll.status === "failed" ||
    poll.status === "no_answer" ||
    poll.status === "voicemail";
  if (isTerminal) patch.call_ended_at = new Date().toISOString();

  // If we have a fresh transcript and don't yet have an analysis,
  // run it.
  let analysis: any = null;
  const transcriptChanged =
    poll.transcript && poll.transcript !== row.transcript;
  if (poll.status === "completed" && transcriptChanged && poll.transcript) {
    analysis = await analyzeQualification(poll.transcript);
    patch.qualification_score = analysis.qualification_score;
    patch.is_correct_owner = analysis.is_correct_owner;
    patch.is_thinking_of_selling = analysis.is_thinking_of_selling;
    if (analysis.asking_price_range)
      patch.asking_price_range = analysis.asking_price_range;
    patch.recommended_followup = analysis.recommended_followup;
  }

  await updateQualification({
    tenantId: tenant.id,
    id: row.id,
    patch,
  });

  return NextResponse.json({
    ok: true,
    status: poll.status,
    analysis,
  });
}
