// POST /api/experiments/[id]/variants  — add a variant to an experiment
//   Body: { name, sequence: SequenceEmail[], traffic_weight?, notes? }

import { NextResponse } from "next/server";
import { createServerClient, hasSupabase } from "@naples/db";
import { getServerTenant } from "@naples/db/next";

export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  ctx: { params: { id: string } },
) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }
  const name = String(body?.name ?? "").trim();
  if (!name) return NextResponse.json({ error: "name required" }, { status: 400 });
  const sequence = Array.isArray(body?.sequence) ? body.sequence : [];
  const weight = typeof body?.traffic_weight === "number" ? body.traffic_weight : 50;

  if (!hasSupabase()) return NextResponse.json({ error: "Supabase required" }, { status: 500 });
  const tenant = await getServerTenant({ fallbackSlug: "naplesdigital" });
  const sb = createServerClient() as any;

  // Confirm experiment belongs to tenant + still draft.
  const { data: exp } = await sb
    .from("outreach_experiments")
    .select("id, status")
    .eq("id", ctx.params.id)
    .eq("tenant_id", tenant.id)
    .maybeSingle();
  if (!exp) return NextResponse.json({ error: "experiment not found" }, { status: 404 });
  if (exp.status !== "draft") {
    return NextResponse.json(
      { error: `cannot add variant to ${exp.status} experiment` },
      { status: 400 },
    );
  }

  const { data: variant, error } = await sb
    .from("outreach_sequence_variants")
    .insert({
      experiment_id: ctx.params.id,
      tenant_id: tenant.id,
      name,
      sequence,
      traffic_weight: weight,
      notes: body?.notes ?? null,
    })
    .select()
    .single();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ variant }, { status: 201 });
}
