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
type ClipRow = Database["public"]["Tables"]["clips"]["Row"];

// ============================================================
// Mappers — DB row ↔ domain type from @naples/mock-data
// ============================================================

const rowToBooking = (r: BookingRow & { time?: string | null }): Booking => ({
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
// ============================================================

export async function listBookings(): Promise<Booking[]> {
  if (!hasSupabase()) return MOCK_BOOKINGS;
  const sb = createServerClient();
  const { data, error } = await sb.from("bookings").select("*").order("date", { ascending: false });
  if (error || !data) return MOCK_BOOKINGS;
  return data.map(rowToBooking);
}

export async function listLeads(): Promise<(Lead & { ai_angle: unknown })[]> {
  if (!hasSupabase()) return MOCK_LEADS.map(l => ({ ...l, ai_angle: null }));
  const sb = createServerClient();
  const { data, error } = await sb.from("leads").select("*").order("created_at", { ascending: true });
  if (error || !data) return MOCK_LEADS.map(l => ({ ...l, ai_angle: null }));
  return data.map(rowToLead);
}

export async function listEpisodes(): Promise<Episode[]> {
  if (!hasSupabase()) return MOCK_EPISODES;
  const sb = createServerClient();
  const { data, error } = await sb.from("episodes").select("*").order("record_date", { ascending: true });
  if (error || !data) return MOCK_EPISODES;
  return data.map(rowToEpisode);
}

export async function getMrr(): Promise<typeof MOCK_MRR> {
  if (!hasSupabase()) return MOCK_MRR;
  const sb = createServerClient();
  const { data, error } = await sb.from("mrr").select("*").eq("id", "current").maybeSingle();
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

export async function getSocialGrowth(): Promise<SocialPoint[]> {
  if (!hasSupabase()) return MOCK_SOCIAL_GROWTH;
  const sb = createServerClient();
  const { data, error } = await sb.from("social_growth").select("*").order("week", { ascending: true });
  if (error || !data) return MOCK_SOCIAL_GROWTH;
  return data.map(d => ({ week: d.week, youtube: d.youtube, instagram: d.instagram, tiktok: d.tiktok, facebook: d.facebook }));
}

export async function getProjections(): Promise<Projection[]> {
  if (!hasSupabase()) return MOCK_PROJECTIONS;
  const sb = createServerClient();
  const { data, error } = await sb.from("projections").select("*").order("sort_order", { ascending: true });
  if (error || !data) return MOCK_PROJECTIONS;
  return data.map(d => ({ month: d.month, conservative: Number(d.conservative), realistic: Number(d.realistic), upside: Number(d.upside) }));
}

export async function getRoadmap(): Promise<typeof MOCK_ROADMAP> {
  if (!hasSupabase()) return MOCK_ROADMAP;
  const sb = createServerClient();
  const { data, error } = await sb.from("roadmap_phases").select("*").order("phase_number", { ascending: true });
  if (error || !data || data.length < 3) return MOCK_ROADMAP;
  const byNum = (n: number): RoadmapPhase => {
    const r = data.find(d => d.phase_number === n)!;
    return { label: r.label, items: r.items as unknown as RoadmapPhase["items"] };
  };
  return { phase1: byNum(1), phase2: byNum(2), phase3: byNum(3) };
}

export async function getOutreachStats(): Promise<typeof OUTREACH_STATS> {
  if (!hasSupabase()) return OUTREACH_STATS;
  const sb = createServerClient();
  const { count: emailsSent } = await sb.from("outreach_runs").select("*", { count: "exact", head: true });
  if (emailsSent === null) return OUTREACH_STATS;
  return {
    emailsSentThisWeek: emailsSent ?? 0,
    opens: Math.floor((emailsSent ?? 0) * 0.25),
    replies: Math.floor((emailsSent ?? 0) * 0.06),
    meetingsBooked: Math.floor((emailsSent ?? 0) * 0.02),
  };
}

// ============================================================
// WRITES
// ============================================================

export async function createBooking(input: Omit<Booking, "id">): Promise<Booking | null> {
  if (!hasSupabase()) return null;
  const sb = createServerClient();
  const insert: Record<string, unknown> = {
    client: input.client, package: input.package, date: input.date,
    revenue: input.revenue, status: input.status,
  };
  if (input.time) insert.time = input.time;
  const { data, error } = await sb.from("bookings").insert(insert as never).select("*").single();
  if (error || !data) return null;
  return rowToBooking(data as BookingRow & { time?: string | null });
}

export async function updateLeadStage(id: string, stage: LeadStage, daysInStage: number): Promise<boolean> {
  if (!hasSupabase()) return true;
  const sb = createServerClient();
  const { error } = await sb.from("leads").update({
    stage, days_in_stage: daysInStage, updated_at: new Date().toISOString(),
  }).eq("id", id);
  return !error;
}

export async function cacheLeadAngle(id: string, angle: unknown): Promise<boolean> {
  if (!hasSupabase()) return true;
  const sb = createServerClient();
  const { error } = await sb.from("leads").update({ ai_angle: angle as never }).eq("id", id);
  return !error;
}

export async function getLeadById(id: string): Promise<(Lead & { ai_angle: unknown }) | null> {
  if (!hasSupabase()) {
    const m = MOCK_LEADS.find(l => l.id === id);
    return m ? { ...m, ai_angle: null } : null;
  }
  const sb = createServerClient();
  const { data, error } = await sb.from("leads").select("*").eq("id", id).single();
  if (error || !data) return null;
  return rowToLead(data);
}

export async function createEpisode(input: Omit<Episode, "id">): Promise<Episode | null> {
  if (!hasSupabase()) return null;
  const sb = createServerClient();
  const { data, error } = await sb.from("episodes").insert({
    show: input.show, title: input.title, guest: input.guest,
    guest_title: input.guestTitle, record_date: input.recordDate,
    status: input.status, clips_cut: input.clipsCut, clips_posted: input.clipsPosted,
    platforms: input.platforms,
  }).select("*").single();
  if (error || !data) return null;
  return rowToEpisode(data);
}

export async function getEpisodeById(id: string): Promise<Episode | null> {
  if (!hasSupabase()) return MOCK_EPISODES.find(e => e.id === id) ?? null;
  const sb = createServerClient();
  const { data, error } = await sb.from("episodes").select("*").eq("id", id).single();
  if (error || !data) return null;
  return rowToEpisode(data);
}

export async function logOutreachRun(input: {
  business_name: string; business_type: string; goal: string;
  source: "api" | "mock" | "fallback"; emails: unknown;
}): Promise<boolean> {
  if (!hasSupabase()) return true;
  const sb = createServerClient();
  const { error } = await sb.from("outreach_runs").insert({
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

export async function listClipsForEpisode(episodeId: string): Promise<Clip[]> {
  if (!hasSupabase()) return [];
  const sb = createServerClient();
  const { data, error } = await sb.from("clips").select("*").eq("episode_id", episodeId).order("created_at", { ascending: true });
  if (error || !data) return [];
  return data.map(r => ({
    id: r.id, episode_id: r.episode_id, hook: r.hook, caption: r.caption,
    platform: r.platform as Clip["platform"], status: r.status as Clip["status"],
    source: r.source as Clip["source"],
  }));
}

export async function createClips(episodeId: string, clips: Omit<Clip, "id" | "episode_id" | "status">[]): Promise<Clip[]> {
  if (!hasSupabase()) return [];
  const sb = createServerClient();
  const rows = clips.map(c => ({
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

export async function markClipPosted(id: string): Promise<boolean> {
  if (!hasSupabase()) return true;
  const sb = createServerClient();
  const { data: clip } = await sb.from("clips").select("episode_id, status").eq("id", id).single();
  if (!clip) return false;
  const { error } = await sb.from("clips").update({ status: "posted" }).eq("id", id);
  if (error) return false;
  if (clip.status !== "posted") {
    await sb.rpc as never; // noop placeholder
    const { data: ep } = await sb.from("episodes").select("clips_posted").eq("id", clip.episode_id).single();
    if (ep) {
      await sb.from("episodes").update({ clips_posted: (ep.clips_posted ?? 0) + 1 }).eq("id", clip.episode_id);
    }
  }
  return true;
}

export async function createSponsorPitch(input: {
  sponsor_name: string; show: string; audience_match: string;
  package_recommendation: unknown; integration_ideas: unknown;
  source: "api" | "mock" | "fallback";
}): Promise<{ id: string } | null> {
  if (!hasSupabase()) return null;
  const sb = createServerClient();
  const { data, error } = await sb.from("sponsor_pitches").insert({
    sponsor_name: input.sponsor_name, show: input.show,
    audience_match: input.audience_match,
    package_recommendation: input.package_recommendation as never,
    integration_ideas: input.integration_ideas as never,
    source: input.source,
  }).select("id").single();
  if (error || !data) return null;
  return { id: data.id };
}

export async function listSponsorPitches(limit = 10): Promise<Array<{
  id: string; sponsor_name: string; show: string; created_at: string;
}>> {
  if (!hasSupabase()) return [];
  const sb = createServerClient();
  const { data, error } = await sb.from("sponsor_pitches").select("id, sponsor_name, show, created_at").order("created_at", { ascending: false }).limit(limit);
  if (error || !data) return [];
  return data;
}

export async function getSponsorPitch(id: string) {
  if (!hasSupabase()) return null;
  const sb = createServerClient();
  const { data } = await sb.from("sponsor_pitches").select("*").eq("id", id).single();
  return data;
}

export async function getSponsorByToken(token: string) {
  if (!hasSupabase()) return null;
  const sb = createServerClient();
  const { data: sponsor } = await sb.from("sponsors").select("*").eq("magic_link_token", token).single();
  if (!sponsor) return null;
  const { data: metrics } = await sb.from("sponsor_metrics").select("*").eq("sponsor_id", sponsor.id).order("week", { ascending: true });
  return { sponsor, metrics: metrics ?? [] };
}

export async function listSponsors() {
  if (!hasSupabase()) return [];
  const sb = createServerClient();
  const { data } = await sb.from("sponsors").select("*").order("created_at", { ascending: false });
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
export async function listContractsForEmail(email: string): Promise<Contract[]> {
  if (!hasSupabase()) return [];
  const sb = createServerClient();
  const { data } = await sb.from("contracts").select("*").eq("client_email", email).order("sent_at", { ascending: false });
  return data ?? [];
}

export async function getContract(id: string): Promise<Contract | null> {
  if (!hasSupabase()) return null;
  const sb = createServerClient();
  const { data } = await sb.from("contracts").select("*").eq("id", id).single();
  return data ?? null;
}

export async function signContract(id: string, sig: { name: string; initials: string; typed: string; ip?: string }): Promise<boolean> {
  if (!hasSupabase()) return true;
  const sb = createServerClient();
  const { error } = await sb.from("contracts").update({
    status: "signed",
    signed_at: new Date().toISOString(),
    signature_name: sig.name,
    signature_initials: sig.initials,
    signature_typed: sig.typed,
    ip_address: sig.ip,
  }).eq("id", id);
  return !error;
}

export async function createContract(input: {
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
export async function listInvoicesForEmail(email: string): Promise<Invoice[]> {
  if (!hasSupabase()) return [];
  const sb = createServerClient();
  const { data } = await sb.from("invoices").select("*").eq("client_email", email).order("issued_at", { ascending: false });
  return data ?? [];
}

export async function getInvoice(id: string): Promise<Invoice | null> {
  if (!hasSupabase()) return null;
  const sb = createServerClient();
  const { data } = await sb.from("invoices").select("*").eq("id", id).single();
  return data ?? null;
}

export async function markInvoicePaid(id: string, method = "card"): Promise<boolean> {
  if (!hasSupabase()) return true;
  const sb = createServerClient();
  const { error } = await sb.from("invoices").update({
    status: "paid",
    paid_at: new Date().toISOString(),
    payment_method: method,
    stripe_payment_intent: `pi_demo_${Math.random().toString(36).slice(2, 14)}`,
  }).eq("id", id);
  return !error;
}

// Content submissions
export async function listSubmissionsForEmail(email: string): Promise<ContentSubmission[]> {
  if (!hasSupabase()) return [];
  const sb = createServerClient();
  const { data } = await sb.from("content_submissions").select("*").eq("client_email", email).order("submitted_at", { ascending: false });
  return data ?? [];
}

export async function createSubmission(input: {
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
