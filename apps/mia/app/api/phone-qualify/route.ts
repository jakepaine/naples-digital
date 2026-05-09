// POST /api/phone-qualify
// Body: { owner_name, owner_phone, property_address?, property_id? }
// Fires a Bland.ai outbound call, persists a mia_phone_qualifications row.
//
// GET /api/phone-qualify
// Lists recent qualifications for the active tenant.

import { NextResponse } from "next/server";
import { getServerTenant } from "@naples/db/next";
import { getTenantSecret } from "@naples/db";
import { kickoffBlandCall } from "@/lib/bland";
import { createQualification, listQualifications } from "@/lib/phone-qualifications";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET() {
  const tenant = await getServerTenant({ fallbackSlug: "mia" });
  try {
    const items = await listQualifications(tenant.id);
    return NextResponse.json({ items });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }
  const ownerName: string = String(body?.owner_name ?? "").trim();
  const ownerPhone: string = String(body?.owner_phone ?? "").trim();
  if (!ownerName || !ownerPhone) {
    return NextResponse.json(
      { error: "owner_name and owner_phone required" },
      { status: 400 },
    );
  }
  // Light phone validation — accept E.164 (+1...) or 10/11-digit US.
  const digits = ownerPhone.replace(/[^\d]/g, "");
  if (digits.length < 10 || digits.length > 15) {
    return NextResponse.json(
      { error: "owner_phone looks invalid" },
      { status: 400 },
    );
  }

  const tenant = await getServerTenant({ fallbackSlug: "mia" });

  // Per-tenant Bland API key (Vault).
  let apiKey: string | null = null;
  try {
    const sec = await getTenantSecret(tenant.id, "bland");
    if (sec?.secret) apiKey = sec.secret;
  } catch {
    /* fall through to stub */
  }

  const kickoff = await kickoffBlandCall({
    apiKey,
    voice:
      typeof body?.voice === "string" ? body.voice : process.env.BLAND_DEFAULT_VOICE,
    webhookUrl: process.env.MIA_BLAND_WEBHOOK_URL,
    input: {
      phone: ownerPhone,
      ownerName,
      propertyAddress:
        typeof body?.property_address === "string" ? body.property_address : null,
      script:
        typeof body?.script === "string" ? body.script : undefined,
    },
  });

  try {
    const row = await createQualification({
      tenantId: tenant.id,
      ownerName,
      ownerPhone,
      propertyAddress:
        typeof body?.property_address === "string" ? body.property_address : null,
      propertyId:
        typeof body?.property_id === "string" ? body.property_id : null,
      blandCallId: kickoff.call_id,
      callStatus: "queued",
    });
    return NextResponse.json({
      ok: true,
      stub: kickoff.is_stub,
      qualification: row,
    });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
