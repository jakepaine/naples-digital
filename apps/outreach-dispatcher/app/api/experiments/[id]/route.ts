// GET   /api/experiments/[id]   — single experiment + variants + summaries
// PATCH /api/experiments/[id]   — update status / hypothesis / notes / winner_variant_id

import { NextResponse } from "next/server";
import { createServerClient, hasSupabase } from "@naples/db";
import { getServerTenant } from "@naples/db/next";
import { summarizeVariant, type SequenceVariant } from "@naples/outreach/experiment";

export const dynamic = "force-dynamic";

const ALLOWED_STATUSES = ["draft", "running", "paused", "concluded"] as const;

export async function GET(
  _req: Request,
  ctx: { params: { id: string } },
) {
  if (!hasSupabase()) return NextResponse.json({ error: "Supabase required" }, { status: 500 });
  const tenant = await getServerTenant({ fallbackSlug: "naplesdigital" });
  const sb = createServerClient() as any;

  const { data: exp } = await sb
    .from("outreach_experiments")
    .select("*")
    .eq("id", ctx.params.id)
    .eq("tenant_id", tenant.id)
    .maybeSingle();
  if (!exp) return NextResponse.json({ error: "not found" }, { status: 404 });

  const { data: variants } = await sb
    .from("outreach_sequence_variants")
    .select("*")
    .eq("experiment_id", exp.id)
    .order("name");

  const summaries = ((variants ?? []) as SequenceVariant[]).map(summarizeVariant);
  return NextResponse.json({ experiment: exp, variants: variants ?? [], summaries });
}

export async function PATCH(
  req: Request,
  ctx: { params: { id: string } },
) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }
  if (!hasSupabase()) return NextResponse.json({ error: "Supabase required" }, { status: 500 });

  const tenant = await getServerTenant({ fallbackSlug: "naplesdigital" });
  const sb = createServerClient() as any;

  const patch: Record<string, unknown> = {};
  if (body?.status) {
    if (!ALLOWED_STATUSES.includes(body.status)) {
      return NextResponse.json({ error: "invalid status" }, { status: 400 });
    }
    patch.status = body.status;
  }
  if (typeof body?.hypothesis === "string") patch.hypothesis = body.hypothesis;
  if (typeof body?.notes === "string") patch.notes = body.notes;
  if (typeof body?.winner_variant_id === "string") {
    patch.winner_variant_id = body.winner_variant_id;
    patch.winner_decided_at = new Date().toISOString();
    patch.status = "concluded";
  }

  const { data, error } = await sb
    .from("outreach_experiments")
    .update(patch)
    .eq("id", ctx.params.id)
    .eq("tenant_id", tenant.id)
    .select()
    .single();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ experiment: data });
}
