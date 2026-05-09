// POST /api/voice-profile/calibrate
// Body: { samples: string[] }
// Runs the Claude voice-fingerprint extraction and saves the result.

import { NextResponse } from "next/server";
import { getServerTenant } from "@naples/db/next";
import { extractVoiceProfile } from "@naples/outreach";
import { saveVoiceProfile } from "@/lib/persist";

export const dynamic = "force-dynamic";
export const maxDuration = 90;

export async function POST(req: Request) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }
  const samples: unknown = body?.samples;
  if (!Array.isArray(samples) || samples.length === 0) {
    return NextResponse.json(
      { error: "samples (string[]) required" },
      { status: 400 },
    );
  }
  const cleaned = (samples as unknown[])
    .filter((s): s is string => typeof s === "string")
    .map((s) => s.trim())
    .filter((s) => s.length >= 30);
  if (cleaned.length === 0) {
    return NextResponse.json(
      { error: "no usable samples (each must be ≥ 30 chars)" },
      { status: 400 },
    );
  }

  const tenant = await getServerTenant({ fallbackSlug: "naplesdigital" });

  const extraction = await extractVoiceProfile({ samples: cleaned });
  try {
    const profile = await saveVoiceProfile({
      tenantId: tenant.id,
      samples: cleaned,
      fingerprint: extraction.fingerprint,
      voice_summary: extraction.voice_summary,
      quality_flags: extraction.quality_flags,
    });
    return NextResponse.json({
      ok: true,
      profile,
      stub: extraction.quality_flags.includes("deterministic_fallback"),
    });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
