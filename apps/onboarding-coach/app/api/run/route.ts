// GET  /api/run         current active/paused run for the tenant
// POST /api/run         start a new run (or 409 if one is already active)
// PATCH /api/run        update day or status

import { NextResponse } from "next/server";
import { getServerTenant } from "@naples/db/next";
import {
  getActiveRun,
  startRun,
  setRunDay,
  setRunStatus,
  type RunStatus,
} from "@/lib/persist";

export const dynamic = "force-dynamic";

export async function GET() {
  const tenant = await getServerTenant({ fallbackSlug: "naplesdigital" });
  const run = await getActiveRun(tenant.id);
  return NextResponse.json({ run });
}

export async function POST(req: Request) {
  const tenant = await getServerTenant({ fallbackSlug: "naplesdigital" });
  const existing = await getActiveRun(tenant.id);
  if (existing) {
    return NextResponse.json(
      { error: "active run already exists", run: existing },
      { status: 409 },
    );
  }
  let body: any = {};
  try {
    body = await req.json();
  } catch {
    /* allow empty body */
  }
  try {
    const run = await startRun({
      tenantId: tenant.id,
      timezone:
        typeof body?.timezone === "string" ? body.timezone : undefined,
    });
    return NextResponse.json({ run }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const tenant = await getServerTenant({ fallbackSlug: "naplesdigital" });
  const existing = await getActiveRun(tenant.id);
  if (!existing) {
    return NextResponse.json({ error: "no active run" }, { status: 404 });
  }
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }
  if (typeof body?.day === "number") {
    await setRunDay({
      tenantId: tenant.id,
      runId: existing.id,
      day: body.day,
    });
  }
  if (typeof body?.status === "string") {
    const allowed: RunStatus[] = ["active", "paused", "completed", "abandoned"];
    if (!(allowed as string[]).includes(body.status)) {
      return NextResponse.json(
        { error: "invalid status" },
        { status: 400 },
      );
    }
    await setRunStatus({
      tenantId: tenant.id,
      runId: existing.id,
      status: body.status as RunStatus,
    });
  }
  return NextResponse.json({ ok: true });
}
