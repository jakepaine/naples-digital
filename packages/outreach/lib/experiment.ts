// Sequence A/B testing helpers — variant picking + outcome recording.
//
// Apps that push leads via outreach should call `pushLeadIntoExperiment`
// instead of vendor.pushSequence directly when an experiment_id is set.
// That way each lead gets a weighted-random variant, the assignment is
// stamped, and the existing webhook flow can attribute outcomes.

import type { SupabaseClient } from "@supabase/supabase-js";
import type { OutreachVendor, SequenceEmail, VendorKind } from "./types";

export type SequenceVariant = {
  id: string;
  experiment_id: string;
  tenant_id: string;
  name: string;
  sequence: SequenceEmail[];
  traffic_weight: number;
  pushed_count: number;
  opened_count: number;
  replied_count: number;
  positive_reply_count: number;
  bounced_count: number;
  unsubscribed_count: number;
};

export type Experiment = {
  id: string;
  tenant_id: string;
  name: string;
  status: "draft" | "running" | "paused" | "concluded";
  hypothesis: string | null;
  notes: string | null;
  winner_variant_id: string | null;
  winner_decided_at: string | null;
};

/** Weighted-random variant pick. Variants with traffic_weight=0 are
 *  excluded entirely. If all weights are 0, returns null. */
export function pickVariant(variants: SequenceVariant[]): SequenceVariant | null {
  const eligible = variants.filter((v) => v.traffic_weight > 0);
  if (eligible.length === 0) return null;
  const total = eligible.reduce((acc, v) => acc + v.traffic_weight, 0);
  let r = Math.random() * total;
  for (const v of eligible) {
    r -= v.traffic_weight;
    if (r <= 0) return v;
  }
  return eligible[eligible.length - 1];
}

export type PushIntoExperimentInput = {
  supabase: SupabaseClient;
  vendor: OutreachVendor;
  tenantId: string;
  experimentId: string;
  lead: {
    email: string;
    name: string;
    company?: string;
    variables?: Record<string, string>;
  };
  campaignId?: string;
};

export type PushIntoExperimentResult =
  | { ok: true; variantId: string; variantName: string; vendorExternalId: string }
  | { ok: false; reason: "no_variants" | "experiment_not_running" | "already_pushed" | "vendor_failed"; detail?: string };

/** Push a single lead into an experiment: pick variant → vendor.pushSequence
 *  → stamp assignment row → bump variant.pushed_count. Idempotent on
 *  (experiment_id, lead_email). */
export async function pushLeadIntoExperiment(
  input: PushIntoExperimentInput,
): Promise<PushIntoExperimentResult> {
  const { supabase, vendor, tenantId, experimentId, lead, campaignId } = input;
  const sb = supabase as any;

  // Verify experiment is running.
  const { data: exp } = await sb
    .from("outreach_experiments")
    .select("id, status")
    .eq("id", experimentId)
    .eq("tenant_id", tenantId)
    .maybeSingle();
  if (!exp || exp.status !== "running") {
    return { ok: false, reason: "experiment_not_running" };
  }

  // Idempotency: if this lead already assigned, no-op.
  const { data: existing } = await sb
    .from("outreach_lead_assignments")
    .select("id, variant_id")
    .eq("experiment_id", experimentId)
    .eq("lead_email", lead.email)
    .maybeSingle();
  if (existing) {
    return { ok: false, reason: "already_pushed", detail: existing.variant_id };
  }

  // Load variants for the experiment.
  const { data: variants } = await sb
    .from("outreach_sequence_variants")
    .select("*")
    .eq("experiment_id", experimentId)
    .eq("tenant_id", tenantId);
  const picked = pickVariant((variants ?? []) as SequenceVariant[]);
  if (!picked) {
    return { ok: false, reason: "no_variants" };
  }

  // Push to vendor.
  let vendorRes;
  try {
    vendorRes = await vendor.pushSequence({
      leadEmail: lead.email,
      leadName: lead.name,
      leadCompany: lead.company,
      emails: picked.sequence,
      campaignId,
      variables: lead.variables,
    });
  } catch (err) {
    return { ok: false, reason: "vendor_failed", detail: (err as Error).message };
  }

  // Stamp assignment + bump pushed_count atomically-ish.
  await sb.from("outreach_lead_assignments").insert({
    experiment_id: experimentId,
    variant_id: picked.id,
    tenant_id: tenantId,
    lead_email: lead.email,
    lead_name: lead.name,
    vendor_external_id: vendorRes.externalId,
    vendor_kind: vendor.kind,
  });
  await sb
    .from("outreach_sequence_variants")
    .update({ pushed_count: picked.pushed_count + 1 })
    .eq("id", picked.id);

  return {
    ok: true,
    variantId: picked.id,
    variantName: picked.name,
    vendorExternalId: vendorRes.externalId,
  };
}

export type WebhookOutcome = {
  kind: "opened" | "replied" | "bounced" | "unsubscribed";
  /** Match by either lead email or vendor external id — at least one required. */
  leadEmail?: string;
  vendorExternalId?: string;
  intent?: "interested" | "more_info" | "not_interested" | "ooo" | "bounce" | "unsubscribe" | "unknown";
  raw?: Record<string, unknown>;
};

/** Webhook handlers call this for every classified event so any matching
 *  active assignment gets stamped. Forward-only — first event of each kind
 *  wins. Variant counters bumped for each first-time event. */
export async function recordAssignmentOutcome(args: {
  supabase: SupabaseClient;
  tenantId: string;
  outcome: WebhookOutcome;
}): Promise<{ updatedAssignmentIds: string[] }> {
  const { supabase, tenantId, outcome } = args;
  const sb = supabase as any;
  if (!outcome.leadEmail && !outcome.vendorExternalId) {
    return { updatedAssignmentIds: [] };
  }

  // Find matching assignments by email OR external id.
  let query = sb
    .from("outreach_lead_assignments")
    .select("id, variant_id, first_open_at, reply_at, bounced_at, unsubscribed_at")
    .eq("tenant_id", tenantId);
  if (outcome.vendorExternalId) {
    query = query.eq("vendor_external_id", outcome.vendorExternalId);
  } else if (outcome.leadEmail) {
    query = query.ilike("lead_email", outcome.leadEmail);
  }
  const { data: assignments } = await query;
  const rows = (assignments ?? []) as Array<{
    id: string;
    variant_id: string;
    first_open_at: string | null;
    reply_at: string | null;
    bounced_at: string | null;
    unsubscribed_at: string | null;
  }>;

  const updatedIds: string[] = [];
  for (const row of rows) {
    const patch: Record<string, unknown> = { raw: outcome.raw ?? {} };
    let counterCol: string | null = null;
    let positiveBump = false;
    const now = new Date().toISOString();

    if (outcome.kind === "opened" && !row.first_open_at) {
      patch.first_open_at = now;
      counterCol = "opened_count";
    } else if (outcome.kind === "replied" && !row.reply_at) {
      patch.reply_at = now;
      patch.reply_intent = outcome.intent ?? "unknown";
      counterCol = "replied_count";
      if (outcome.intent === "interested" || outcome.intent === "more_info") {
        positiveBump = true;
      }
    } else if (outcome.kind === "bounced" && !row.bounced_at) {
      patch.bounced_at = now;
      counterCol = "bounced_count";
    } else if (outcome.kind === "unsubscribed" && !row.unsubscribed_at) {
      patch.unsubscribed_at = now;
      counterCol = "unsubscribed_count";
    } else {
      continue; // Already recorded this event kind.
    }

    await sb.from("outreach_lead_assignments").update(patch).eq("id", row.id);
    updatedIds.push(row.id);

    if (counterCol) {
      // Bump the variant counter via raw RPC-style update — safe because
      // pushed_count has a UNIQUE constraint on (experiment_id, name).
      const { data: variant } = await sb
        .from("outreach_sequence_variants")
        .select(`id, ${counterCol}, positive_reply_count`)
        .eq("id", row.variant_id)
        .maybeSingle();
      if (variant) {
        const update: Record<string, unknown> = {
          [counterCol]: ((variant as any)[counterCol] ?? 0) + 1,
        };
        if (positiveBump) {
          update.positive_reply_count = (variant.positive_reply_count ?? 0) + 1;
        }
        await sb.from("outreach_sequence_variants").update(update).eq("id", row.variant_id);
      }
    }
  }
  return { updatedAssignmentIds: updatedIds };
}

/** Variant-level summary for dashboards.
 *  Does NOT compute statistical significance — leaving that to the
 *  operator's judgment + sample-size guard rails surfaced in the UI. */
export type VariantSummary = {
  id: string;
  name: string;
  traffic_weight: number;
  pushed: number;
  opened: number;
  replied: number;
  positive_replies: number;
  bounced: number;
  unsubscribed: number;
  open_rate: number; // 0-1
  reply_rate: number;
  positive_reply_rate: number;
  bounce_rate: number;
  unsubscribe_rate: number;
};

export function summarizeVariant(v: SequenceVariant): VariantSummary {
  const denom = Math.max(v.pushed_count, 1);
  return {
    id: v.id,
    name: v.name,
    traffic_weight: v.traffic_weight,
    pushed: v.pushed_count,
    opened: v.opened_count,
    replied: v.replied_count,
    positive_replies: v.positive_reply_count,
    bounced: v.bounced_count,
    unsubscribed: v.unsubscribed_count,
    open_rate: v.opened_count / denom,
    reply_rate: v.replied_count / denom,
    positive_reply_rate: v.positive_reply_count / denom,
    bounce_rate: v.bounced_count / denom,
    unsubscribe_rate: v.unsubscribed_count / denom,
  };
}
