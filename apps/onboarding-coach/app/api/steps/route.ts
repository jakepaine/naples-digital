// POST   /api/steps     mark a step complete (or unmark via DELETE-equivalent)
// GET    /api/steps     list completions for the active run

import { NextResponse } from "next/server";
import { getServerTenant } from "@naples/db/next";
import {
  getActiveRun,
  listCompletions,
  markStepComplete,
  markStepIncomplete,
} from "@/lib/persist";
import { getStep } from "@/lib/playbook";

export const dynamic = "force-dynamic";

export async function GET() {
  const tenant = await getServerTenant({ fallbackSlug: "naplesdigital" });
  const run = await getActiveRun(tenant.id);
  if (!run) return NextResponse.json({ completions: [] });
  const completions = await listCompletions({
    tenantId: tenant.id,
    runId: run.id,
  });
  return NextResponse.json({ completions });
}

export async function POST(req: Request) {
  const tenant = await getServerTenant({ fallbackSlug: "naplesdigital" });
  const run = await getActiveRun(tenant.id);
  if (!run) {
    return NextResponse.json(
      { error: "no active run — start onboarding first" },
      { status: 400 },
    );
  }
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }
  const stepKey: string | undefined = body?.step_key;
  if (!stepKey) {
    return NextResponse.json({ error: "step_key required" }, { status: 400 });
  }
  const step = getStep(stepKey);
  if (!step) {
    return NextResponse.json(
      { error: `unknown step ${stepKey}` },
      { status: 404 },
    );
  }
  const day = parseInt(stepKey.match(/day-(\d+)/)?.[1] ?? "0", 10);
  if (!day) {
    return NextResponse.json(
      { error: `cannot derive day from ${stepKey}` },
      { status: 400 },
    );
  }

  // Unmark.
  if (body?.action === "unmark") {
    await markStepIncomplete({
      tenantId: tenant.id,
      runId: run.id,
      stepKey,
    });
    return NextResponse.json({ ok: true, unmarked: true });
  }

  // Mark complete.
  const result = await markStepComplete({
    tenantId: tenant.id,
    runId: run.id,
    stepKey,
    day,
    notes: typeof body?.notes === "string" ? body.notes : undefined,
    artifactSummary:
      typeof body?.artifact_summary === "string"
        ? body.artifact_summary
        : undefined,
    artifactLink:
      typeof body?.artifact_link === "string" ? body.artifact_link : undefined,
  });
  return NextResponse.json({
    ok: true,
    duplicate: result.duplicate,
    completion: result.row,
  });
}
