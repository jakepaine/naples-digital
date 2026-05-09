// Reads positive cold-email replies and computes SLA state for each.
// Stamps sla_responded_at when an operator marks a reply handled.
// Stamps sla_breach_alerted_at when an escalation Slack ping fires.
//
// Source of truth: cold_email_replies (intent='interested' OR 'more_info').

import { createServerClient, hasSupabase, notifyTenantSlack } from "@naples/db";

export type ReplyIntent =
  | "interested"
  | "more_info"
  | "not_interested"
  | "ooo"
  | "bounce"
  | "unsubscribe"
  | "unknown";

export interface SlaReplyRow {
  id: string;
  tenant_id: string;
  campaign_name: string | null;
  lead_email: string | null;
  lead_name: string | null;
  reply_subject: string | null;
  reply_body: string | null;
  intent: ReplyIntent;
  intent_confidence: number | null;
  intent_reason: string | null;
  received_at: string;
  sla_target_seconds: number;
  sla_responded_at: string | null;
  sla_breach_alerted_at: string | null;
  crm_stage_advanced: boolean;
}

export type SlaStatus = "pending" | "responded" | "breached";

export interface SlaItem extends SlaReplyRow {
  status: SlaStatus;
  seconds_elapsed: number;
  seconds_remaining: number;
  breach_at: string;
}

export async function listSlaQueue(args: {
  tenantId: string;
  hoursBack?: number;
}): Promise<SlaItem[]> {
  if (!hasSupabase()) return [];
  const sb = createServerClient() as any;
  const since = new Date(
    Date.now() - (args.hoursBack ?? 48) * 3600 * 1000,
  ).toISOString();

  const { data, error } = await sb
    .from("cold_email_replies")
    .select(
      "id, tenant_id, campaign_name, lead_email, lead_name, reply_subject, reply_body, intent, intent_confidence, intent_reason, received_at, sla_target_seconds, sla_responded_at, sla_breach_alerted_at, crm_stage_advanced",
    )
    .eq("tenant_id", args.tenantId)
    .in("intent", ["interested", "more_info"])
    .gte("received_at", since)
    .order("received_at", { ascending: false })
    .limit(200);
  if (error) throw new Error(`sla queue fetch: ${error.message}`);

  const now = Date.now();
  return ((data ?? []) as SlaReplyRow[]).map((row) => decorate(row, now));
}

export async function markResponded(args: {
  tenantId: string;
  id: string;
}): Promise<{ ok: boolean; row: SlaItem | null }> {
  if (!hasSupabase()) return { ok: false, row: null };
  const sb = createServerClient() as any;
  const { data, error } = await sb
    .from("cold_email_replies")
    .update({ sla_responded_at: new Date().toISOString() })
    .eq("tenant_id", args.tenantId)
    .eq("id", args.id)
    .select("*")
    .single();
  if (error || !data) return { ok: false, row: null };
  return { ok: true, row: decorate(data as SlaReplyRow, Date.now()) };
}

/**
 * Fire escalation Slack pings for any item past breach without an
 * existing breach alert. Idempotent — sla_breach_alerted_at acts as
 * the dedupe flag.
 */
export async function escalateBreaches(args: {
  tenantId: string;
  tenantSlug: string;
}): Promise<{ alerted: number }> {
  if (!hasSupabase()) return { alerted: 0 };
  const sb = createServerClient() as any;

  const queue = await listSlaQueue({ tenantId: args.tenantId, hoursBack: 24 });
  const breaches = queue.filter(
    (r) => r.status === "breached" && !r.sla_breach_alerted_at,
  );

  let alerted = 0;
  for (const item of breaches) {
    const text = [
      `⏰ *SLA breach* — tenant \`${args.tenantSlug}\``,
      `*From:* ${item.lead_name ?? "(no name)"} <${item.lead_email ?? "(no email)"}>`,
      item.campaign_name && `*Campaign:* ${item.campaign_name}`,
      item.reply_subject && `*Subject:* ${item.reply_subject}`,
      `Reply received ${minutesAgo(item.received_at)} min ago — past the ${item.sla_target_seconds}s SLA window.`,
      `_Saraev's 400% conversion threshold has elapsed. Reply now anyway — late beats never._`,
    ]
      .filter(Boolean)
      .join("\n");

    const ok = await notifyTenantSlack({
      tenantId: args.tenantId,
      text,
      opts: { envFallback: "SLACK_WEBHOOK_SLA_BREACH" },
    });
    if (ok) alerted++;

    await sb
      .from("cold_email_replies")
      .update({ sla_breach_alerted_at: new Date().toISOString() })
      .eq("id", item.id);
  }
  return { alerted };
}

function decorate(row: SlaReplyRow, now: number): SlaItem {
  const receivedMs = new Date(row.received_at).getTime();
  const targetMs = row.sla_target_seconds * 1000;
  const breachMs = receivedMs + targetMs;
  const elapsedSec = Math.max(0, Math.floor((now - receivedMs) / 1000));
  const remainingSec = Math.floor((breachMs - now) / 1000);

  let status: SlaStatus = "pending";
  if (row.sla_responded_at) status = "responded";
  else if (now > breachMs) status = "breached";

  return {
    ...row,
    status,
    seconds_elapsed: elapsedSec,
    seconds_remaining: remainingSec,
    breach_at: new Date(breachMs).toISOString(),
  };
}

function minutesAgo(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
}
