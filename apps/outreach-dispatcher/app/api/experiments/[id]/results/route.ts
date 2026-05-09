// GET /api/experiments/[id]/results  — variant rates + winner suggestion

import { NextResponse } from "next/server";
import { createServerClient, hasSupabase } from "@naples/db";
import { getServerTenant } from "@naples/db/next";
import { summarizeVariant, type SequenceVariant } from "@naples/outreach/experiment";

export const dynamic = "force-dynamic";

const MIN_SAMPLE_PER_VARIANT = 30;
const MIN_DELTA_PCT = 0.02;

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
    .eq("experiment_id", exp.id);
  const summaries = ((variants ?? []) as SequenceVariant[]).map(summarizeVariant);

  // Winner suggestion: highest positive_reply_rate, requires
  // MIN_SAMPLE_PER_VARIANT pushed AND delta vs runner-up > MIN_DELTA_PCT.
  // Otherwise null — operator decides.
  let suggestion: { variantId: string; reason: string } | null = null;
  const eligible = summaries.filter((s) => s.pushed >= MIN_SAMPLE_PER_VARIANT);
  if (eligible.length >= 2) {
    eligible.sort((a, b) => b.positive_reply_rate - a.positive_reply_rate);
    const [first, second] = eligible;
    const delta = first.positive_reply_rate - second.positive_reply_rate;
    if (delta > MIN_DELTA_PCT) {
      suggestion = {
        variantId: first.id,
        reason: `${first.name} positive reply rate ${(first.positive_reply_rate * 100).toFixed(1)}% beats ${second.name} (${(second.positive_reply_rate * 100).toFixed(1)}%) by ${(delta * 100).toFixed(1)} pts after ${first.pushed} + ${second.pushed} pushes.`,
      };
    }
  }

  return NextResponse.json({
    experiment: exp,
    summaries,
    suggestion,
    sample_thresholds: {
      min_per_variant: MIN_SAMPLE_PER_VARIANT,
      min_delta: MIN_DELTA_PCT,
    },
  });
}
