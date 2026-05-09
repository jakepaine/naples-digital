// POST /api/escalate
// Fires escalation Slack pings for any breached items that haven't
// been alerted yet. Idempotent — sla_breach_alerted_at is the dedupe
// flag. Designed to be called by a cron tick (every 1-2 minutes) or
// manually from the dashboard's "Escalate breaches" button.

import { NextResponse } from "next/server";
import { getServerTenant } from "@naples/db/next";
import { escalateBreaches } from "@/lib/persist";

export const dynamic = "force-dynamic";

export async function POST() {
  const tenant = await getServerTenant({ fallbackSlug: "naplesdigital" });
  try {
    const result = await escalateBreaches({
      tenantId: tenant.id,
      tenantSlug: tenant.slug,
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
