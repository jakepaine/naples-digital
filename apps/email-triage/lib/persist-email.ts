import { createServerClient, hasSupabase } from "@naples/db";
import { classifyEmail, type ClassifyResult } from "./classify";
import type { EmailRow } from "./inbox-query";

export interface InboundEmail {
  source?: string; // 'gmail' | 'imap' | 'demo'
  source_message_id?: string | null;
  source_thread_id?: string | null;
  from_email: string;
  from_name?: string | null;
  to_email?: string | null;
  subject: string;
  received_at: string;
  preview?: string | null;
  body_text?: string | null;
  body_html?: string | null;
}

// Idempotent on (tenant_id, source, source_message_id) — re-ingesting the
// same Gmail message returns the existing row (already classified) instead
// of re-running the LLM.
export async function ingestAndClassify(args: {
  tenantId: string;
  inbound: InboundEmail;
}): Promise<EmailRow> {
  if (!hasSupabase()) {
    throw new Error("ingestAndClassify requires Supabase to be configured.");
  }
  const sb = createServerClient();
  const source = args.inbound.source ?? "gmail";
  const messageId = args.inbound.source_message_id ?? null;

  // Idempotency check
  if (messageId) {
    const { data: existing } = await sb
      .from("emails")
      .select("*")
      .eq("tenant_id", args.tenantId)
      .eq("source", source)
      .eq("source_message_id", messageId)
      .maybeSingle();
    if (existing) return existing as any;
  }

  const preview =
    args.inbound.preview ??
    (args.inbound.body_text ?? "").slice(0, 280) ??
    null;

  const insertRow = {
    tenant_id: args.tenantId,
    source,
    source_message_id: messageId,
    source_thread_id: args.inbound.source_thread_id ?? null,
    from_email: args.inbound.from_email,
    from_name: args.inbound.from_name ?? null,
    to_email: args.inbound.to_email ?? null,
    subject: args.inbound.subject,
    received_at: args.inbound.received_at,
    preview,
    body_text: args.inbound.body_text ?? null,
    body_html: args.inbound.body_html ?? null,
  };

  const { data: inserted, error: insErr } = await sb
    .from("emails")
    .insert(insertRow)
    .select("*")
    .single();
  if (insErr) throw new Error(`email insert: ${insErr.message}`);

  // Classify + persist back. Failures are tolerated — leave classified_at
  // null and the next sync pass can retry.
  let classified: ClassifyResult | null = null;
  try {
    classified = await classifyEmail({
      subject: inserted.subject,
      preview: inserted.preview,
      from_email: inserted.from_email,
      from_name: inserted.from_name,
      body_text: inserted.body_text,
    });
  } catch (e) {
    console.error("classify failed for email", inserted.id, (e as Error).message);
  }

  if (!classified) return inserted as any;

  const { data: updated, error: updErr } = await sb
    .from("emails")
    .update({
      category: classified.category,
      score: classified.score,
      reason: classified.reason,
      classified_at: new Date().toISOString(),
    })
    .eq("id", inserted.id)
    .select("*")
    .single();
  if (updErr) throw new Error(`email update: ${updErr.message}`);

  // Audit log of the AI classification
  await sb.from("email_classifications").insert({
    email_id: inserted.id,
    tenant_id: args.tenantId,
    category: classified.category,
    score: classified.score,
    reason: classified.reason,
    source: "ai",
  });

  return updated as any;
}

// Manual re-categorization: writes new triage state on the email + audit row.
export async function recategorizeEmail(args: {
  emailId: string;
  tenantId: string;
  category: string;
  reason?: string;
  actor?: string | null;
}): Promise<EmailRow> {
  if (!hasSupabase()) {
    throw new Error("recategorizeEmail requires Supabase to be configured.");
  }
  const sb = createServerClient();
  const { data: updated, error } = await sb
    .from("emails")
    .update({
      category: args.category,
      reason: args.reason ?? null,
      classified_at: new Date().toISOString(),
    })
    .eq("id", args.emailId)
    .eq("tenant_id", args.tenantId)
    .select("*")
    .single();
  if (error) throw new Error(`recategorize: ${error.message}`);

  await sb.from("email_classifications").insert({
    email_id: args.emailId,
    tenant_id: args.tenantId,
    category: args.category,
    reason: args.reason ?? null,
    source: "manual",
    actor: args.actor ?? null,
  });

  return updated as any;
}

export async function archiveEmail(args: {
  emailId: string;
  tenantId: string;
}): Promise<void> {
  if (!hasSupabase()) {
    throw new Error("archiveEmail requires Supabase to be configured.");
  }
  const sb = createServerClient();
  const { error } = await sb
    .from("emails")
    .update({ archived: true, archived_at: new Date().toISOString() })
    .eq("id", args.emailId)
    .eq("tenant_id", args.tenantId);
  if (error) throw new Error(`archive: ${error.message}`);
}
