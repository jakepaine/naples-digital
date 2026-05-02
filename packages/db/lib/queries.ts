import type { Booking, Lead, LeadStage, Episode, Platform, RoadmapPhase, SocialPoint, Projection } from "@naples/mock-data";
import {
  MOCK_BOOKINGS, MOCK_LEADS, MOCK_EPISODES, MOCK_MRR, MOCK_PROJECTIONS,
  MOCK_SOCIAL_GROWTH, MOCK_ROADMAP, OUTREACH_STATS,
} from "@naples/mock-data";
import { createServerClient, hasSupabase } from "./server";
import type { Database } from "./types";

type LeadRow = Database["public"]["Tables"]["leads"]["Row"];
type EpisodeRow = Database["public"]["Tables"]["episodes"]["Row"];
type BookingRow = Database["public"]["Tables"]["bookings"]["Row"];

// ============================================================
// Mappers — DB row ↔ domain type from @naples/mock-data
// ============================================================

const rowToBooking = (r: BookingRow): Booking => ({
  id: r.id, client: r.client, package: r.package, date: r.date,
  time: r.time ?? undefined,
  revenue: Number(r.revenue), status: r.status as Booking["status"],
});
const rowToLead = (r: LeadRow): Lead & { ai_angle: unknown } => ({
  id: r.id, name: r.name, type: r.type, goal: r.goal, value: Number(r.value),
  stage: r.stage as LeadStage, source: r.source, daysInStage: r.days_in_stage,
  ai_angle: r.ai_angle,
});
const rowToEpisode = (r: EpisodeRow): Episode => ({
  id: r.id, show: r.show as Episode["show"], title: r.title, guest: r.guest,
  guestTitle: r.guest_title, recordDate: r.record_date,
  status: r.status as Episode["status"], clipsCut: r.clips_cut, clipsPosted: r.clips_posted,
  platforms: r.platforms as Platform[],
});

// ============================================================
// READS — Supabase first, MOCK_* fallback if env not set
// All functions are tenant-scoped via the required tenantId arg.
// ============================================================

export async function listBookings(tenantId: string): Promise<Booking[]> {
  if (!hasSupabase()) return MOCK_BOOKINGS;
  const sb = createServerClient();
  const { data, error } = await sb.from("bookings").select("*").eq("tenant_id", tenantId).order("date", { ascending: false });
  if (error || !data) return MOCK_BOOKINGS;
  return data.map(rowToBooking);
}

export async function listLeads(tenantId: string): Promise<(Lead & { ai_angle: unknown })[]> {
  if (!hasSupabase()) return MOCK_LEADS.map(l => ({ ...l, ai_angle: null }));
  const sb = createServerClient();
  const { data, error } = await sb.from("leads").select("*").eq("tenant_id", tenantId).order("created_at", { ascending: true });
  if (error || !data) return MOCK_LEADS.map(l => ({ ...l, ai_angle: null }));
  return data.map(rowToLead);
}

export async function listEpisodes(tenantId: string): Promise<Episode[]> {
  if (!hasSupabase()) return MOCK_EPISODES;
  const sb = createServerClient();
  const { data, error } = await sb.from("episodes").select("*").eq("tenant_id", tenantId).order("record_date", { ascending: true });
  if (error || !data) return MOCK_EPISODES;
  return data.map(rowToEpisode);
}

export async function getMrr(tenantId: string): Promise<typeof MOCK_MRR> {
  if (!hasSupabase()) return MOCK_MRR;
  const sb = createServerClient();
  const { data, error } = await sb.from("mrr").select("*").eq("tenant_id", tenantId).maybeSingle();
  if (error || !data) return MOCK_MRR;
  return {
    studioRental: Number(data.studio_rental),
    contentAgency: Number(data.content_agency),
    showSponsors: Number(data.show_sponsors),
    merch: Number(data.merch),
    total: Number(data.studio_rental) + Number(data.content_agency) + Number(data.show_sponsors) + Number(data.merch),
    naplesDigitalCommission: Number(data.naples_digital_commission),
  } as typeof MOCK_MRR;
}

export async function getSocialGrowth(tenantId: string): Promise<SocialPoint[]> {
  if (!hasSupabase()) return MOCK_SOCIAL_GROWTH;
  const sb = createServerClient();
  const { data, error } = await sb.from("social_growth").select("*").eq("tenant_id", tenantId).order("week", { ascending: true });
  if (error || !data) return MOCK_SOCIAL_GROWTH;
  return data.map(d => ({ week: d.week, youtube: d.youtube, instagram: d.instagram, tiktok: d.tiktok, facebook: d.facebook }));
}

export async function getProjections(tenantId: string): Promise<Projection[]> {
  if (!hasSupabase()) return MOCK_PROJECTIONS;
  const sb = createServerClient();
  const { data, error } = await sb.from("projections").select("*").eq("tenant_id", tenantId).order("sort_order", { ascending: true });
  if (error || !data) return MOCK_PROJECTIONS;
  return data.map(d => ({ month: d.month, conservative: Number(d.conservative), realistic: Number(d.realistic), upside: Number(d.upside) }));
}

export async function getRoadmap(tenantId: string): Promise<typeof MOCK_ROADMAP> {
  if (!hasSupabase()) return MOCK_ROADMAP;
  const sb = createServerClient();
  const { data, error } = await sb.from("roadmap_phases").select("*").eq("tenant_id", tenantId).order("phase_number", { ascending: true });
  if (error || !data || data.length < 3) return MOCK_ROADMAP;
  const byNum = (n: number): RoadmapPhase => {
    const r = data.find(d => d.phase_number === n)!;
    return { label: r.label, items: r.items as unknown as RoadmapPhase["items"] };
  };
  return { phase1: byNum(1), phase2: byNum(2), phase3: byNum(3) };
}

export async function getOutreachStats(tenantId: string): Promise<typeof OUTREACH_STATS> {
  if (!hasSupabase()) return OUTREACH_STATS;
  const sb = createServerClient();
  const { count: emailsSent } = await sb.from("outreach_runs").select("*", { count: "exact", head: true }).eq("tenant_id", tenantId);
  if (emailsSent === null) return OUTREACH_STATS;
  return {
    emailsSentThisWeek: emailsSent ?? 0,
    opens: Math.floor((emailsSent ?? 0) * 0.25),
    replies: Math.floor((emailsSent ?? 0) * 0.06),
    meetingsBooked: Math.floor((emailsSent ?? 0) * 0.02),
  };
}

// ============================================================
// WRITES — all require tenantId
// ============================================================

export async function createBooking(tenantId: string, input: Omit<Booking, "id">): Promise<Booking | null> {
  if (!hasSupabase()) return null;
  const sb = createServerClient();
  const insert: Record<string, unknown> = {
    tenant_id: tenantId,
    client: input.client, package: input.package, date: input.date,
    revenue: input.revenue, status: input.status,
  };
  if (input.time) insert.time = input.time;
  const { data, error } = await sb.from("bookings").insert(insert as never).select("*").single();
  if (error || !data) return null;
  return rowToBooking(data as BookingRow);
}

export async function updateLeadStage(tenantId: string, id: string, stage: LeadStage, daysInStage: number): Promise<boolean> {
  if (!hasSupabase()) return true;
  const sb = createServerClient();
  const { error } = await sb.from("leads").update({
    stage, days_in_stage: daysInStage, updated_at: new Date().toISOString(),
  }).eq("id", id).eq("tenant_id", tenantId);
  return !error;
}

export async function cacheLeadAngle(tenantId: string, id: string, angle: unknown): Promise<boolean> {
  if (!hasSupabase()) return true;
  const sb = createServerClient();
  const { error } = await sb.from("leads").update({ ai_angle: angle as never }).eq("id", id).eq("tenant_id", tenantId);
  return !error;
}

export async function getLeadById(tenantId: string, id: string): Promise<(Lead & { ai_angle: unknown }) | null> {
  if (!hasSupabase()) {
    const m = MOCK_LEADS.find(l => l.id === id);
    return m ? { ...m, ai_angle: null } : null;
  }
  const sb = createServerClient();
  const { data, error } = await sb.from("leads").select("*").eq("id", id).eq("tenant_id", tenantId).single();
  if (error || !data) return null;
  return rowToLead(data);
}

export async function createLead(tenantId: string, input: {
  name: string; type: string; goal: string; value: number;
  stage?: LeadStage; source?: string;
}): Promise<(Lead & { ai_angle: unknown }) | null> {
  if (!hasSupabase()) return null;
  const sb = createServerClient();
  const { data, error } = await sb.from("leads").insert({
    tenant_id: tenantId,
    name: input.name, type: input.type, goal: input.goal, value: input.value,
    stage: input.stage ?? "Lead Captured",
    source: input.source ?? "Manual",
  }).select("*").single();
  if (error || !data) return null;
  return rowToLead(data);
}

export async function createEpisode(tenantId: string, input: Omit<Episode, "id">): Promise<Episode | null> {
  if (!hasSupabase()) return null;
  const sb = createServerClient();
  const { data, error } = await sb.from("episodes").insert({
    tenant_id: tenantId,
    show: input.show, title: input.title, guest: input.guest,
    guest_title: input.guestTitle, record_date: input.recordDate,
    status: input.status, clips_cut: input.clipsCut, clips_posted: input.clipsPosted,
    platforms: input.platforms,
  }).select("*").single();
  if (error || !data) return null;
  return rowToEpisode(data);
}

export async function getEpisodeById(tenantId: string, id: string): Promise<Episode | null> {
  if (!hasSupabase()) return MOCK_EPISODES.find(e => e.id === id) ?? null;
  const sb = createServerClient();
  const { data, error } = await sb.from("episodes").select("*").eq("id", id).eq("tenant_id", tenantId).single();
  if (error || !data) return null;
  return rowToEpisode(data);
}

export async function logOutreachRun(tenantId: string, input: {
  business_name: string; business_type: string; goal: string;
  source: "api" | "mock" | "fallback"; emails: unknown;
}): Promise<boolean> {
  if (!hasSupabase()) return true;
  const sb = createServerClient();
  const { error } = await sb.from("outreach_runs").insert({
    tenant_id: tenantId,
    business_name: input.business_name, business_type: input.business_type,
    goal: input.goal, source: input.source, emails: input.emails as never,
  });
  return !error;
}

export type Clip = {
  id: string; episode_id: string; hook: string; caption: string;
  platform: "instagram" | "tiktok" | "youtube" | "facebook" | "best";
  status: "draft" | "posted"; source: "api" | "mock" | "fallback";
};

export async function listClipsForEpisode(tenantId: string, episodeId: string): Promise<Clip[]> {
  if (!hasSupabase()) return [];
  const sb = createServerClient();
  const { data, error } = await sb.from("clips").select("*").eq("tenant_id", tenantId).eq("episode_id", episodeId).order("created_at", { ascending: true });
  if (error || !data) return [];
  return data.map(r => ({
    id: r.id, episode_id: r.episode_id, hook: r.hook, caption: r.caption,
    platform: r.platform as Clip["platform"], status: r.status as Clip["status"],
    source: r.source as Clip["source"],
  }));
}

export async function createClips(tenantId: string, episodeId: string, clips: Omit<Clip, "id" | "episode_id" | "status">[]): Promise<Clip[]> {
  if (!hasSupabase()) return [];
  const sb = createServerClient();
  const rows = clips.map(c => ({
    tenant_id: tenantId,
    episode_id: episodeId, hook: c.hook, caption: c.caption,
    platform: c.platform, source: c.source,
  }));
  const { data, error } = await sb.from("clips").insert(rows).select("*");
  if (error || !data) return [];
  return data.map(r => ({
    id: r.id, episode_id: r.episode_id, hook: r.hook, caption: r.caption,
    platform: r.platform as Clip["platform"], status: r.status as Clip["status"],
    source: r.source as Clip["source"],
  }));
}

export async function markClipPosted(tenantId: string, id: string): Promise<boolean> {
  if (!hasSupabase()) return true;
  const sb = createServerClient();
  const { data: clip } = await sb.from("clips").select("episode_id, status").eq("id", id).eq("tenant_id", tenantId).single();
  if (!clip) return false;
  const { error } = await sb.from("clips").update({ status: "posted" }).eq("id", id).eq("tenant_id", tenantId);
  if (error) return false;
  if (clip.status !== "posted") {
    const { data: ep } = await sb.from("episodes").select("clips_posted").eq("id", clip.episode_id).eq("tenant_id", tenantId).single();
    if (ep) {
      await sb.from("episodes").update({ clips_posted: (ep.clips_posted ?? 0) + 1 }).eq("id", clip.episode_id).eq("tenant_id", tenantId);
    }
  }
  return true;
}

export async function createSponsorPitch(tenantId: string, input: {
  sponsor_name: string; show: string; audience_match: string;
  package_recommendation: unknown; integration_ideas: unknown;
  source: "api" | "mock" | "fallback";
}): Promise<{ id: string } | null> {
  if (!hasSupabase()) return null;
  const sb = createServerClient();
  const { data, error } = await sb.from("sponsor_pitches").insert({
    tenant_id: tenantId,
    sponsor_name: input.sponsor_name, show: input.show,
    audience_match: input.audience_match,
    package_recommendation: input.package_recommendation as never,
    integration_ideas: input.integration_ideas as never,
    source: input.source,
  }).select("id").single();
  if (error || !data) return null;
  return { id: data.id };
}

export async function listSponsorPitches(tenantId: string, limit = 10): Promise<Array<{
  id: string; sponsor_name: string; show: string; created_at: string;
}>> {
  if (!hasSupabase()) return [];
  const sb = createServerClient();
  const { data, error } = await sb.from("sponsor_pitches").select("id, sponsor_name, show, created_at").eq("tenant_id", tenantId).order("created_at", { ascending: false }).limit(limit);
  if (error || !data) return [];
  return data;
}

export async function getSponsorPitch(tenantId: string, id: string) {
  if (!hasSupabase()) return null;
  const sb = createServerClient();
  const { data } = await sb.from("sponsor_pitches").select("*").eq("id", id).eq("tenant_id", tenantId).single();
  return data;
}

// Token-based magic link — public endpoint. Token is the credential; tenant
// resolution happens by reading the sponsor's tenant_id from the result.
export async function getSponsorByToken(token: string) {
  if (!hasSupabase()) return null;
  const sb = createServerClient();
  const { data: sponsor } = await sb.from("sponsors").select("*").eq("magic_link_token", token).single();
  if (!sponsor) return null;
  const { data: metrics } = await sb.from("sponsor_metrics").select("*").eq("sponsor_id", sponsor.id).eq("tenant_id", sponsor.tenant_id).order("week", { ascending: true });
  return { sponsor, metrics: metrics ?? [] };
}

export async function listSponsors(tenantId: string) {
  if (!hasSupabase()) return [];
  const sb = createServerClient();
  const { data } = await sb.from("sponsors").select("*").eq("tenant_id", tenantId).order("created_at", { ascending: false });
  return data ?? [];
}

// ============================================================
// PHASE 7 — Client Portal: contracts, invoices, content submissions
// ============================================================

type ContractRow = Database["public"]["Tables"]["contracts"]["Row"];
type InvoiceRow = Database["public"]["Tables"]["invoices"]["Row"];
type SubmissionRow = Database["public"]["Tables"]["content_submissions"]["Row"];

export type Contract = ContractRow;
export type Invoice = InvoiceRow;
export type ContentSubmission = SubmissionRow;

// Contracts
export async function listContractsForEmail(tenantId: string, email: string): Promise<Contract[]> {
  if (!hasSupabase()) return [];
  const sb = createServerClient();
  const { data } = await sb.from("contracts").select("*").eq("tenant_id", tenantId).eq("client_email", email).order("sent_at", { ascending: false });
  return data ?? [];
}

export async function getContract(tenantId: string, id: string): Promise<Contract | null> {
  if (!hasSupabase()) return null;
  const sb = createServerClient();
  const { data } = await sb.from("contracts").select("*").eq("id", id).eq("tenant_id", tenantId).single();
  return data ?? null;
}

export async function signContract(tenantId: string, id: string, sig: { name: string; initials: string; typed: string; ip?: string }): Promise<boolean> {
  if (!hasSupabase()) return true;
  const sb = createServerClient();
  const { error } = await sb.from("contracts").update({
    status: "signed",
    signed_at: new Date().toISOString(),
    signature_name: sig.name,
    signature_initials: sig.initials,
    signature_typed: sig.typed,
    ip_address: sig.ip,
  }).eq("id", id).eq("tenant_id", tenantId);
  return !error;
}

export async function createContract(tenantId: string, input: {
  booking_id?: string;
  client_name: string;
  client_email: string;
  package: string;
  amount: number;
  scope: string;
  terms: string[];
}): Promise<Contract | null> {
  if (!hasSupabase()) return null;
  const sb = createServerClient();
  const { data, error } = await sb.from("contracts").insert({
    tenant_id: tenantId,
    booking_id: input.booking_id,
    client_name: input.client_name,
    client_email: input.client_email,
    package: input.package,
    amount: input.amount,
    scope: input.scope,
    terms: input.terms as never,
    status: "sent",
  }).select("*").single();
  if (error) return null;
  return data;
}

// Invoices
export async function listInvoicesForEmail(tenantId: string, email: string): Promise<Invoice[]> {
  if (!hasSupabase()) return [];
  const sb = createServerClient();
  const { data } = await sb.from("invoices").select("*").eq("tenant_id", tenantId).eq("client_email", email).order("issued_at", { ascending: false });
  return data ?? [];
}

export async function getInvoice(tenantId: string, id: string): Promise<Invoice | null> {
  if (!hasSupabase()) return null;
  const sb = createServerClient();
  const { data } = await sb.from("invoices").select("*").eq("id", id).eq("tenant_id", tenantId).single();
  return data ?? null;
}

export async function markInvoicePaid(tenantId: string, id: string, method = "card"): Promise<boolean> {
  if (!hasSupabase()) return true;
  const sb = createServerClient();
  const { error } = await sb.from("invoices").update({
    status: "paid",
    paid_at: new Date().toISOString(),
    payment_method: method,
    stripe_payment_intent: `pi_demo_${Math.random().toString(36).slice(2, 14)}`,
  }).eq("id", id).eq("tenant_id", tenantId);
  return !error;
}

// ============================================================
// PHASE 8 — Track A: outreach sequences, email sends, enrichment
// ============================================================

type SequenceRow = Database["public"]["Tables"]["outreach_sequences"]["Row"];
type EmailSendRow = Database["public"]["Tables"]["email_sends"]["Row"];
type LeadEmailRow = Database["public"]["Tables"]["lead_emails"]["Row"];
type EnrichmentRow = Database["public"]["Tables"]["lead_enrichment"]["Row"];

export type OutreachSequence = SequenceRow;
export type EmailSend = EmailSendRow;
export type LeadEmailRecord = LeadEmailRow;
export type LeadEnrichmentRecord = EnrichmentRow;

export async function addLeadEmail(tenantId: string, leadId: string, email: string, primary = false): Promise<LeadEmailRecord | null> {
  if (!hasSupabase()) return null;
  const sb = createServerClient();
  const { data, error } = await sb.from("lead_emails").insert({
    tenant_id: tenantId, lead_id: leadId, email, primary_address: primary,
  }).select("*").single();
  if (error) return null;
  if (primary) {
    await sb.from("leads").update({ primary_email: email }).eq("id", leadId).eq("tenant_id", tenantId);
  }
  return data;
}

export async function listLeadEmails(tenantId: string, leadId: string): Promise<LeadEmailRecord[]> {
  if (!hasSupabase()) return [];
  const sb = createServerClient();
  const { data } = await sb.from("lead_emails").select("*").eq("tenant_id", tenantId).eq("lead_id", leadId);
  return data ?? [];
}

export async function setLeadDomain(tenantId: string, leadId: string, domain: string): Promise<boolean> {
  if (!hasSupabase()) return true;
  const sb = createServerClient();
  const { error } = await sb.from("leads").update({ domain }).eq("id", leadId).eq("tenant_id", tenantId);
  return !error;
}

export async function setLeadEnrichmentStatus(tenantId: string, leadId: string, status: "none" | "pending" | "enriched" | "failed"): Promise<boolean> {
  if (!hasSupabase()) return true;
  const sb = createServerClient();
  const { error } = await sb.from("leads").update({ enrichment_status: status }).eq("id", leadId).eq("tenant_id", tenantId);
  return !error;
}

export async function recordLeadEnrichment(tenantId: string, leadId: string, source: string, raw: Record<string, unknown>): Promise<LeadEnrichmentRecord | null> {
  if (!hasSupabase()) return null;
  const sb = createServerClient();
  const { data, error } = await sb.from("lead_enrichment")
    .upsert({ tenant_id: tenantId, lead_id: leadId, source, raw: raw as never }, { onConflict: "lead_id,source" })
    .select("*").single();
  if (error) return null;
  return data;
}

export async function getLatestEnrichment(tenantId: string, leadId: string): Promise<LeadEnrichmentRecord | null> {
  if (!hasSupabase()) return null;
  const sb = createServerClient();
  const { data } = await sb.from("lead_enrichment").select("*")
    .eq("tenant_id", tenantId).eq("lead_id", leadId)
    .order("fetched_at", { ascending: false }).limit(1).maybeSingle();
  return data ?? null;
}

export async function createSequence(tenantId: string, input: {
  lead_id: string;
  vendor: "instantly" | "smartlead" | "manual";
  emails: Array<{ step: number; subject: string; body: string; delay_days?: number }>;
  config?: Record<string, unknown>;
}): Promise<OutreachSequence | null> {
  if (!hasSupabase()) return null;
  const sb = createServerClient();
  const { data, error } = await sb.from("outreach_sequences").insert({
    tenant_id: tenantId,
    lead_id: input.lead_id,
    vendor: input.vendor,
    state: "draft",
    emails: input.emails as never,
    config: (input.config ?? {}) as never,
  }).select("*").single();
  if (error) return null;
  return data;
}

export async function markSequencePushed(tenantId: string, sequenceId: string, externalId: string): Promise<boolean> {
  if (!hasSupabase()) return true;
  const sb = createServerClient();
  const { error } = await sb.from("outreach_sequences").update({
    external_id: externalId, state: "pushed", pushed_at: new Date().toISOString(),
  }).eq("id", sequenceId).eq("tenant_id", tenantId);
  return !error;
}

export async function updateSequenceState(tenantId: string, sequenceId: string, state: string): Promise<boolean> {
  if (!hasSupabase()) return true;
  const sb = createServerClient();
  const { error } = await sb.from("outreach_sequences").update({
    state, ...(state === "completed" || state === "replied" ? { completed_at: new Date().toISOString() } : {}),
  }).eq("id", sequenceId).eq("tenant_id", tenantId);
  return !error;
}

export async function listSequencesForLead(tenantId: string, leadId: string): Promise<OutreachSequence[]> {
  if (!hasSupabase()) return [];
  const sb = createServerClient();
  const { data } = await sb.from("outreach_sequences").select("*").eq("tenant_id", tenantId).eq("lead_id", leadId).order("created_at", { ascending: false });
  return data ?? [];
}

export async function getSequenceByExternalId(externalId: string): Promise<OutreachSequence | null> {
  // Used by webhook receivers — looked up by vendor's id, returns the row
  // including tenant_id so subsequent ops are scoped.
  if (!hasSupabase()) return null;
  const sb = createServerClient();
  const { data } = await sb.from("outreach_sequences").select("*").eq("external_id", externalId).maybeSingle();
  return data ?? null;
}

export async function createEmailSend(tenantId: string, input: {
  sequence_id: string;
  lead_id: string;
  lead_email: string;
  step: number;
  external_id?: string;
  scheduled_for?: string;
}): Promise<EmailSend | null> {
  if (!hasSupabase()) return null;
  const sb = createServerClient();
  const { data, error } = await sb.from("email_sends").insert({
    tenant_id: tenantId,
    sequence_id: input.sequence_id,
    lead_id: input.lead_id,
    lead_email: input.lead_email,
    step: input.step,
    external_id: input.external_id,
    scheduled_for: input.scheduled_for,
  }).select("*").single();
  if (error) return null;
  return data;
}

export async function recordEmailEvent(input: {
  externalSendId: string;
  kind: "sent" | "opened" | "clicked" | "replied" | "bounced";
  ts?: string;
  vendorStatus?: string;
  replyBody?: string;
}): Promise<boolean> {
  if (!hasSupabase()) return true;
  const sb = createServerClient();
  const ts = input.ts ?? new Date().toISOString();
  const update: Record<string, unknown> = { vendor_status: input.vendorStatus };
  if (input.kind === "sent") update.sent_at = ts;
  if (input.kind === "opened") update.opened_at = ts;
  if (input.kind === "clicked") update.clicked_at = ts;
  if (input.kind === "replied") { update.replied_at = ts; if (input.replyBody) update.reply_body = input.replyBody; }
  if (input.kind === "bounced") update.bounced_at = ts;
  const { error } = await sb.from("email_sends").update(update as never).eq("external_id", input.externalSendId);
  return !error;
}

export async function listSendsForSequence(tenantId: string, sequenceId: string): Promise<EmailSend[]> {
  if (!hasSupabase()) return [];
  const sb = createServerClient();
  const { data } = await sb.from("email_sends").select("*").eq("tenant_id", tenantId).eq("sequence_id", sequenceId).order("step");
  return data ?? [];
}

export async function listSendsForLead(tenantId: string, leadId: string): Promise<EmailSend[]> {
  if (!hasSupabase()) return [];
  const sb = createServerClient();
  const { data } = await sb.from("email_sends").select("*").eq("tenant_id", tenantId).eq("lead_id", leadId).order("created_at");
  return data ?? [];
}

// Content submissions
export async function listSubmissionsForEmail(tenantId: string, email: string): Promise<ContentSubmission[]> {
  if (!hasSupabase()) return [];
  const sb = createServerClient();
  const { data } = await sb.from("content_submissions").select("*").eq("tenant_id", tenantId).eq("client_email", email).order("submitted_at", { ascending: false });
  return data ?? [];
}

export async function createSubmission(tenantId: string, input: {
  client_name: string;
  client_email: string;
  title: string;
  description?: string;
  asset_type?: "video" | "audio" | "image" | "document";
  source_url?: string;
  duration_seconds?: number;
  edit_brief?: string;
}): Promise<ContentSubmission | null> {
  if (!hasSupabase()) return null;
  const sb = createServerClient();
  const { data, error } = await sb.from("content_submissions").insert({
    tenant_id: tenantId,
    client_name: input.client_name,
    client_email: input.client_email,
    title: input.title,
    description: input.description,
    asset_type: input.asset_type ?? "video",
    source_url: input.source_url,
    duration_seconds: input.duration_seconds,
    edit_brief: input.edit_brief,
    status: "submitted",
  }).select("*").single();
  if (error) return null;
  return data;
}
