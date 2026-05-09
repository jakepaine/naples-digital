// GET  /api/experiments        — list tenant's experiments
// POST /api/experiments        — create a draft experiment
//   Body: { name, hypothesis?, notes?, variants?: [{ name, sequence, traffic_weight? }] }

import { NextResponse } from "next/server";
import { createServerClient, hasSupabase } from "@naples/db";
import { getServerTenant } from "@naples/db/next";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!hasSupabase()) return NextResponse.json({ experiments: [] });
  const tenant = await getServerTenant({ fallbackSlug: "naplesdigital" });
  const sb = createServerClient() as any;
  const { data: experiments } = await sb
    .from("outreach_experiments")
    .select("*, variants:outreach_sequence_variants(*)")
    .eq("tenant_id", tenant.id)
    .order("created_at", { ascending: false });
  return NextResponse.json({ experiments: experiments ?? [] });
}

export async function POST(req: Request) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }
  const name = String(body?.name ?? "").trim();
  if (!name) return NextResponse.json({ error: "name required" }, { status: 400 });

  const tenant = await getServerTenant({ fallbackSlug: "naplesdigital" });
  if (!hasSupabase()) {
    return NextResponse.json({ error: "Supabase required" }, { status: 500 });
  }
  const sb = createServerClient() as any;

  const { data: exp, error } = await sb
    .from("outreach_experiments")
    .insert({
      tenant_id: tenant.id,
      name,
      hypothesis: body?.hypothesis ?? null,
      notes: body?.notes ?? null,
      status: "draft",
    })
    .select()
    .single();
  if (error) {
    return NextResponse.json(
      { error: `create experiment: ${error.message}` },
      { status: 500 },
    );
  }

  // Optionally seed variants in the same call.
  const variants = Array.isArray(body?.variants) ? body.variants : [];
  const insertedVariants: unknown[] = [];
  for (const v of variants) {
    const seq = Array.isArray(v?.sequence) ? v.sequence : [];
    const { data: variant } = await sb
      .from("outreach_sequence_variants")
      .insert({
        experiment_id: exp.id,
        tenant_id: tenant.id,
        name: String(v?.name ?? `variant-${insertedVariants.length + 1}`),
        sequence: seq,
        traffic_weight: typeof v?.traffic_weight === "number" ? v.traffic_weight : 50,
        notes: v?.notes ?? null,
      })
      .select()
      .single();
    if (variant) insertedVariants.push(variant);
  }

  return NextResponse.json({ experiment: exp, variants: insertedVariants }, { status: 201 });
}
