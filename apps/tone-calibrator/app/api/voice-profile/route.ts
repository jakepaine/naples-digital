// GET    /api/voice-profile             current profile
// POST   /api/voice-profile/calibrate    calibrate from samples
// PATCH  /api/voice-profile              toggle enabled

import { NextResponse } from "next/server";
import { getServerTenant } from "@naples/db/next";
import { extractVoiceProfile } from "@naples/outreach";
import {
  getVoiceProfile,
  saveVoiceProfile,
  setEnabled,
} from "@/lib/persist";

export const dynamic = "force-dynamic";
export const maxDuration = 90;

export async function GET() {
  const tenant = await getServerTenant({ fallbackSlug: "naplesdigital" });
  const profile = await getVoiceProfile(tenant.id);
  return NextResponse.json({ profile });
}

export async function PATCH(req: Request) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }
  if (typeof body?.enabled !== "boolean") {
    return NextResponse.json({ error: "enabled (boolean) required" }, { status: 400 });
  }
  const tenant = await getServerTenant({ fallbackSlug: "naplesdigital" });
  await setEnabled({ tenantId: tenant.id, enabled: body.enabled });
  return NextResponse.json({ ok: true, enabled: body.enabled });
}
