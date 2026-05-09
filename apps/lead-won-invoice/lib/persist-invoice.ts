import { createServerClient } from "@naples/db";
import { totalCentsOf } from "./format";
import type { DraftInvoice } from "./draft-invoice";
import type { WonLead, InvoiceRow } from "./won-leads";

// Insert a fresh draft invoice row from a Claude-drafted payload.
// Idempotent on (tenant_id, lead_id) for not-yet-finalized drafts: if a draft
// already exists for this lead, replace it.
export async function persistDraftInvoice(args: {
  tenantId: string;
  lead: WonLead;
  draft: DraftInvoice;
  number?: string;
}): Promise<InvoiceRow> {
  if (!args.lead.primary_email) {
    throw new Error(
      "Lead has no primary_email — cannot draft invoice (Stripe requires a recipient).",
    );
  }
  const sb = createServerClient();
  const subtotalCents = totalCentsOf(args.draft.lineItems);
  const totalCents = subtotalCents; // tax = 0 by default

  // If a non-finalized draft exists for this lead, refresh it. Otherwise insert.
  const { data: existing } = await sb
    .from("invoices")
    .select("id, approval_status")
    .eq("tenant_id", args.tenantId)
    .eq("lead_id", args.lead.id)
    .in("approval_status", ["draft", "rejected"])
    .order("created_at", { ascending: false })
    .limit(1);

  const row = {
    tenant_id: args.tenantId,
    lead_id: args.lead.id,
    client_name: args.lead.ai_angle?.headline ?? args.lead.name ?? "Client",
    client_email: args.lead.primary_email,
    description: args.draft.description,
    line_items: args.draft.lineItems as any,
    subtotal: subtotalCents / 100,
    tax: 0,
    total: totalCents / 100,
    status: "open",
    approval_status: "draft",
    auto_generated: true,
    number: args.number ?? `INV-${Date.now().toString(36).toUpperCase()}`,
  };

  if (existing && existing.length > 0) {
    const { data, error } = await sb
      .from("invoices")
      .update(row)
      .eq("id", existing[0].id)
      .select("*")
      .single();
    if (error) throw new Error(`invoice update: ${error.message}`);
    return data as any;
  }

  const { data, error } = await sb
    .from("invoices")
    .insert(row)
    .select("*")
    .single();
  if (error) throw new Error(`invoice insert: ${error.message}`);
  return data as any;
}

export async function getInvoiceById(id: string): Promise<InvoiceRow | null> {
  const sb = createServerClient();
  const { data, error } = await sb
    .from("invoices")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`invoice fetch: ${error.message}`);
  return (data as any) ?? null;
}

export async function markRejected(id: string): Promise<void> {
  const sb = createServerClient();
  const { error } = await sb
    .from("invoices")
    .update({ approval_status: "rejected" })
    .eq("id", id);
  if (error) throw new Error(`reject: ${error.message}`);
}

export async function markSent(args: {
  id: string;
  stripeInvoiceId: string;
  stripeHostedUrl: string;
}): Promise<void> {
  const sb = createServerClient();
  const { error } = await sb
    .from("invoices")
    .update({
      approval_status: "sent",
      stripe_invoice_id: args.stripeInvoiceId,
      stripe_hosted_invoice_url: args.stripeHostedUrl,
      sent_at: new Date().toISOString(),
    })
    .eq("id", args.id);
  if (error) throw new Error(`mark sent: ${error.message}`);
}

export async function markApproved(id: string): Promise<void> {
  const sb = createServerClient();
  const { error } = await sb
    .from("invoices")
    .update({
      approval_status: "approved",
      approved_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) throw new Error(`approve: ${error.message}`);
}

export async function appendWebhookEvent(args: {
  stripeInvoiceId: string;
  event: { type: string; id: string; created: number };
}): Promise<InvoiceRow | null> {
  const sb = createServerClient();
  const { data: row, error } = await sb
    .from("invoices")
    .select("id, webhook_event_log")
    .eq("stripe_invoice_id", args.stripeInvoiceId)
    .maybeSingle();
  if (error) throw new Error(`webhook lookup: ${error.message}`);
  if (!row) return null;
  const log = Array.isArray((row as any).webhook_event_log)
    ? (row as any).webhook_event_log
    : [];
  log.push({
    type: args.event.type,
    stripe_event_id: args.event.id,
    received_at: new Date().toISOString(),
  });
  const { data: updated, error: updErr } = await sb
    .from("invoices")
    .update({ webhook_event_log: log })
    .eq("id", (row as any).id)
    .select("*")
    .single();
  if (updErr) throw new Error(`webhook log: ${updErr.message}`);
  return updated as any;
}

export async function markPaid(args: {
  stripeInvoiceId: string;
  paidAt: Date;
}): Promise<InvoiceRow | null> {
  const sb = createServerClient();
  const { data, error } = await sb
    .from("invoices")
    .update({
      approval_status: "paid",
      status: "paid",
      paid_at: args.paidAt.toISOString(),
    })
    .eq("stripe_invoice_id", args.stripeInvoiceId)
    .select("*")
    .maybeSingle();
  if (error) throw new Error(`mark paid: ${error.message}`);
  return (data as any) ?? null;
}

