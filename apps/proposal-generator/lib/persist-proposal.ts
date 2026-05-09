import { createServerClient, hasSupabase } from "@naples/db";
import type { ProposalDraft, LeadContext } from "./draft-proposal";

export interface ProposalRow {
  id: string;
  tenant_id: string;
  lead_id: string | null;
  title: string;
  client_name: string | null;
  client_email: string | null;
  intro: string | null;
  scope_items: string[];
  deliverables: { title: string; description: string }[];
  pricing: { line_item: string; amount_cents: number }[];
  timeline_weeks: number | null;
  notes: string | null;
  status: string;
  public_token: string | null;
  approved_at: string | null;
  sent_at: string | null;
  responded_at: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

function genToken(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(18)))
    .map((b) => b.toString(36).padStart(2, "0"))
    .join("")
    .slice(0, 24);
}

export async function listProposals(tenantId: string): Promise<ProposalRow[]> {
  if (!hasSupabase()) return [];
  const sb = createServerClient();
  const { data, error } = await sb
    .from("proposals")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw new Error(`proposals fetch: ${error.message}`);
  return (data ?? []) as any;
}

export async function getProposalById(
  tenantId: string,
  id: string,
): Promise<ProposalRow | null> {
  if (!hasSupabase()) return null;
  const sb = createServerClient();
  const { data, error } = await sb
    .from("proposals")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`proposal fetch: ${error.message}`);
  return (data as any) ?? null;
}

export async function getProposalByToken(
  token: string,
): Promise<ProposalRow | null> {
  if (!hasSupabase()) return null;
  const sb = createServerClient();
  const { data, error } = await sb
    .from("proposals")
    .select("*")
    .eq("public_token", token)
    .maybeSingle();
  if (error) throw new Error(`proposal fetch: ${error.message}`);
  return (data as any) ?? null;
}

export async function createProposalFromDraft(args: {
  tenantId: string;
  leadId: string | null;
  lead: LeadContext;
  draft: ProposalDraft;
}): Promise<ProposalRow> {
  if (!hasSupabase()) throw new Error("Supabase required.");
  const sb = createServerClient();
  const { data, error } = await sb
    .from("proposals")
    .insert({
      tenant_id: args.tenantId,
      lead_id: args.leadId,
      title: args.draft.title,
      client_name: args.lead.ai_angle?.headline ?? args.lead.name ?? "Client",
      client_email: args.lead.primary_email,
      intro: args.draft.intro,
      scope_items: args.draft.scope_items as any,
      deliverables: args.draft.deliverables as any,
      pricing: args.draft.pricing as any,
      timeline_weeks: args.draft.timeline_weeks,
      notes: args.draft.notes,
      status: "draft",
    })
    .select("*")
    .single();
  if (error) throw new Error(`proposal insert: ${error.message}`);
  return data as any;
}

export async function updateProposal(args: {
  tenantId: string;
  id: string;
  patch: Partial<ProposalRow>;
}): Promise<ProposalRow> {
  if (!hasSupabase()) throw new Error("Supabase required.");
  const sb = createServerClient();
  const allowed: any = {};
  for (const k of [
    "title",
    "client_name",
    "client_email",
    "intro",
    "scope_items",
    "deliverables",
    "pricing",
    "timeline_weeks",
    "notes",
  ]) {
    if (k in args.patch) allowed[k] = (args.patch as any)[k];
  }
  const { data, error } = await sb
    .from("proposals")
    .update(allowed)
    .eq("id", args.id)
    .eq("tenant_id", args.tenantId)
    .select("*")
    .single();
  if (error) throw new Error(`proposal update: ${error.message}`);
  return data as any;
}

export async function approveAndIssueToken(args: {
  tenantId: string;
  id: string;
  expiresInDays?: number;
}): Promise<ProposalRow> {
  if (!hasSupabase()) throw new Error("Supabase required.");
  const sb = createServerClient();
  const token = genToken();
  const expiresAt = args.expiresInDays
    ? new Date(Date.now() + args.expiresInDays * 24 * 3600 * 1000).toISOString()
    : null;
  const { data, error } = await sb
    .from("proposals")
    .update({
      status: "approved",
      approved_at: new Date().toISOString(),
      public_token: token,
      expires_at: expiresAt,
    })
    .eq("id", args.id)
    .eq("tenant_id", args.tenantId)
    .select("*")
    .single();
  if (error) throw new Error(`proposal approve: ${error.message}`);
  return data as any;
}

export async function markSent(args: {
  tenantId: string;
  id: string;
}): Promise<ProposalRow> {
  if (!hasSupabase()) throw new Error("Supabase required.");
  const sb = createServerClient();
  const { data, error } = await sb
    .from("proposals")
    .update({
      status: "sent",
      sent_at: new Date().toISOString(),
    })
    .eq("id", args.id)
    .eq("tenant_id", args.tenantId)
    .select("*")
    .single();
  if (error) throw new Error(`proposal mark sent: ${error.message}`);
  return data as any;
}

export async function recordResponse(args: {
  publicToken: string;
  status: "accepted" | "rejected";
}): Promise<ProposalRow | null> {
  if (!hasSupabase()) return null;
  const sb = createServerClient();
  const { data, error } = await sb
    .from("proposals")
    .update({
      status: args.status,
      responded_at: new Date().toISOString(),
    })
    .eq("public_token", args.publicToken)
    .select("*")
    .maybeSingle();
  if (error) throw new Error(`proposal respond: ${error.message}`);
  return (data as any) ?? null;
}

export async function fetchLeadContext(
  tenantId: string,
  leadId: string,
): Promise<LeadContext | null> {
  if (!hasSupabase()) return null;
  const sb = createServerClient();
  const { data } = await sb
    .from("leads")
    .select("name, primary_email, domain, type, goal, value, source, ai_angle")
    .eq("tenant_id", tenantId)
    .eq("id", leadId)
    .maybeSingle();
  return (data as any) ?? null;
}

export async function listLeadsForTenant(
  tenantId: string,
): Promise<{ id: string; name: string; primary_email: string | null; stage: string }[]> {
  if (!hasSupabase()) return [];
  const sb = createServerClient();
  const { data, error } = await sb
    .from("leads")
    .select("id, name, primary_email, stage")
    .eq("tenant_id", tenantId)
    .order("updated_at", { ascending: false })
    .limit(100);
  if (error) throw new Error(`leads fetch: ${error.message}`);
  return (data ?? []) as any;
}
