// Reply Intelligence orchestrator. Called by the per-tenant Instantly
// webhook route. Idempotent on (tenant_id, source, source_event_id).
//
// Steps:
//   1. Normalize the incoming payload into our internal shape.
//   2. Persist a cold_email_replies row (or skip if event already seen).
//   3. Classify intent (deterministic short-circuit + Claude fallback).
//   4. Drive downstream actions per intent:
//        interested / more_info → Slack ping + advance CRM stage
//        bounce                 → mark removed_from_campaign (Instantly
//                                 dedupes natively, but we record it)
//        unsubscribe            → mark removed_from_campaign
//        ooo / not_interested   → log only
//   5. Stamp processed_at + the action flags.
//
// CRM advance writes directly to public.leads (matched by lower(primary_email)
// on this tenant) — no HTTP hop to crm-pipeline. Stage transitions only
// move FORWARD: Lead Captured / Contacted → Meeting Booked. Never demote.

import { createServerClient, hasSupabase, notifyTenantSlack } from "@naples/db";
import {
  classifyReplyIntent,
  type ReplyIntent,
  type ReplyIntentResult,
} from "./reply-intent";

export interface InstantlyReplyEvent {
  /** Instantly's webhook payload — partial — varies by event_type. */
  event_type?: string;
  campaign_id?: string;
  campaign_name?: string;
  lead_email?: string;
  lead_first_name?: string;
  lead_last_name?: string;
  reply_subject?: string;
  reply_text_snippet?: string;
  reply_text?: string;
  reply_html?: string;
  timestamp?: string;
  // Webhook-side identifier — Instantly puts this in different fields
  // depending on event type, so handler tries multiple.
  id?: string;
  event_id?: string;
}

export interface ProcessReplyResult {
  ok: boolean;
  reply_id: string | null;
  intent: ReplyIntent;
  intent_confidence: number;
  duplicate: boolean;
  slack_alerted: boolean;
  crm_stage_advanced: boolean;
  removed_from_campaign: boolean;
  error?: string;
}

const ADVANCEABLE_FROM_STAGES = new Set(["Lead Captured", "Contacted"]);
const TARGET_STAGE = "Meeting Booked";

export async function processInstantlyReply(args: {
  tenantId: string;
  tenantSlug: string;
  payload: InstantlyReplyEvent;
}): Promise<ProcessReplyResult> {
  if (!hasSupabase()) {
    return {
      ok: false,
      reply_id: null,
      intent: "unknown",
      intent_confidence: 0,
      duplicate: false,
      slack_alerted: false,
      crm_stage_advanced: false,
      removed_from_campaign: false,
      error: "no_supabase",
    };
  }
  const sb = createServerClient() as any;

  const sourceEventId = args.payload.id ?? args.payload.event_id ?? null;
  const replySubject = args.payload.reply_subject ?? null;
  const replyBody =
    args.payload.reply_text ??
    args.payload.reply_text_snippet ??
    stripHtml(args.payload.reply_html ?? "") ??
    null;
  const leadEmail = args.payload.lead_email
    ? args.payload.lead_email.trim().toLowerCase()
    : null;
  const leadName = [
    args.payload.lead_first_name,
    args.payload.lead_last_name,
  ]
    .filter(Boolean)
    .join(" ")
    .trim() || null;

  // Idempotency check — if Instantly retries the webhook we don't want
  // to double-fire Slack / re-advance CRM.
  if (sourceEventId) {
    const { data: existing } = await sb
      .from("cold_email_replies")
      .select("*")
      .eq("tenant_id", args.tenantId)
      .eq("source", "instantly")
      .eq("source_event_id", sourceEventId)
      .maybeSingle();
    if (existing) {
      const e = existing as any;
      return {
        ok: true,
        reply_id: e.id,
        intent: e.intent,
        intent_confidence: e.intent_confidence ?? 0,
        duplicate: true,
        slack_alerted: !!e.slack_alerted,
        crm_stage_advanced: !!e.crm_stage_advanced,
        removed_from_campaign: !!e.removed_from_campaign,
      };
    }
  }

  // Classify intent.
  const result: ReplyIntentResult = await classifyReplyIntent({
    subject: replySubject,
    body: replyBody,
    fromEmail: leadEmail,
  });

  // Insert audit row before downstream actions so a failure mid-flight
  // still leaves a trail.
  const { data: inserted, error: insErr } = await sb
    .from("cold_email_replies")
    .insert({
      tenant_id: args.tenantId,
      source: "instantly",
      source_event_id: sourceEventId,
      campaign_id: args.payload.campaign_id ?? null,
      campaign_name: args.payload.campaign_name ?? null,
      lead_email: leadEmail,
      lead_name: leadName,
      reply_subject: replySubject,
      reply_body: replyBody?.slice(0, 8000) ?? null,
      intent: result.intent,
      intent_confidence: result.confidence,
      intent_reason: result.reason,
      raw: args.payload,
      received_at: args.payload.timestamp ?? new Date().toISOString(),
    })
    .select("id")
    .single();
  if (insErr || !inserted) {
    return {
      ok: false,
      reply_id: null,
      intent: result.intent,
      intent_confidence: result.confidence,
      duplicate: false,
      slack_alerted: false,
      crm_stage_advanced: false,
      removed_from_campaign: false,
      error: insErr?.message ?? "insert_failed",
    };
  }
  const replyId = (inserted as any).id as string;

  let slackAlerted = false;
  let crmAdvanced = false;
  let crmFromStage: string | null = null;
  let crmLeadId: string | null = null;
  let removedFromCampaign = false;

  // Positive intent → Slack + CRM advance.
  if (result.intent === "interested" || result.intent === "more_info") {
    slackAlerted = await fireSlackForPositiveReply({
      tenantId: args.tenantId,
      tenantSlug: args.tenantSlug,
      intent: result.intent,
      confidence: result.confidence,
      reason: result.reason,
      leadEmail,
      leadName,
      campaignName: args.payload.campaign_name ?? null,
      replySubject,
      replyPreview: replyBody?.slice(0, 280) ?? null,
    });
    if (leadEmail) {
      const advance = await advanceCrmStage({
        tenantId: args.tenantId,
        leadEmail,
      });
      crmAdvanced = advance.advanced;
      crmFromStage = advance.fromStage;
      crmLeadId = advance.leadId;
    }
  } else if (result.intent === "bounce" || result.intent === "unsubscribe") {
    // Mark removed_from_campaign for the audit trail. The actual
    // Instantly-side removal happens via Instantly's own machinery
    // (their "Remove on Reply" rule + bounce handling) — Naples records
    // the fact for the tenant's view. Future: call Instantly API to
    // force-remove if tenant hasn't enabled the platform-side rule.
    removedFromCampaign = true;
  }

  await sb
    .from("cold_email_replies")
    .update({
      slack_alerted: slackAlerted,
      crm_stage_advanced: crmAdvanced,
      crm_lead_id: crmLeadId,
      crm_from_stage: crmFromStage,
      crm_to_stage: crmAdvanced ? TARGET_STAGE : null,
      removed_from_campaign: removedFromCampaign,
      removed_from_campaign_at: removedFromCampaign ? new Date().toISOString() : null,
      processed_at: new Date().toISOString(),
    })
    .eq("id", replyId);

  return {
    ok: true,
    reply_id: replyId,
    intent: result.intent,
    intent_confidence: result.confidence,
    duplicate: false,
    slack_alerted: slackAlerted,
    crm_stage_advanced: crmAdvanced,
    removed_from_campaign: removedFromCampaign,
  };
}

async function fireSlackForPositiveReply(args: {
  tenantId: string;
  tenantSlug: string;
  intent: ReplyIntent;
  confidence: number;
  reason: string;
  leadEmail: string | null;
  leadName: string | null;
  campaignName: string | null;
  replySubject: string | null;
  replyPreview: string | null;
}): Promise<boolean> {
  const emoji = args.intent === "interested" ? "🟢" : "🟡";
  const intentLabel = args.intent === "interested" ? "INTERESTED" : "More info";
  const lines = [
    `${emoji} *Cold-email reply: ${intentLabel}* (confidence ${args.confidence}) — tenant \`${args.tenantSlug}\``,
    `*From:* ${args.leadName ?? "(no name)"} <${args.leadEmail ?? "(no email)"}>`,
    args.campaignName && `*Campaign:* ${args.campaignName}`,
    args.replySubject && `*Subject:* ${args.replySubject}`,
    args.replyPreview && `*Preview:* ${args.replyPreview}`,
    args.reason && `_AI reason:_ ${args.reason}`,
    `_Speed-to-lead window: 5 minutes._`,
  ]
    .filter(Boolean)
    .join("\n");
  return await notifyTenantSlack({
    tenantId: args.tenantId,
    text: lines,
    opts: { envFallback: "SLACK_WEBHOOK_HIGH_PRIORITY_REPLY" },
  });
}

async function advanceCrmStage(args: {
  tenantId: string;
  leadEmail: string;
}): Promise<{
  advanced: boolean;
  leadId: string | null;
  fromStage: string | null;
}> {
  if (!hasSupabase()) return { advanced: false, leadId: null, fromStage: null };
  const sb = createServerClient() as any;
  const { data: lead } = await sb
    .from("leads")
    .select("id, stage")
    .eq("tenant_id", args.tenantId)
    .ilike("primary_email", args.leadEmail)
    .maybeSingle();
  if (!lead) return { advanced: false, leadId: null, fromStage: null };
  const fromStage = (lead as any).stage as string;
  if (!ADVANCEABLE_FROM_STAGES.has(fromStage)) {
    // Already past Meeting Booked — don't demote. Still log the lead id
    // so the audit row points at the right CRM record.
    return { advanced: false, leadId: (lead as any).id, fromStage };
  }
  const { error } = await sb
    .from("leads")
    .update({ stage: TARGET_STAGE, days_in_stage: 0 })
    .eq("id", (lead as any).id);
  if (error) return { advanced: false, leadId: (lead as any).id, fromStage };
  return { advanced: true, leadId: (lead as any).id, fromStage };
}

function stripHtml(html: string): string | null {
  if (!html) return null;
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim() || null;
}
