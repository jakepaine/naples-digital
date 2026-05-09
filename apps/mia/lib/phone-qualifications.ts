// Phone qualifications persistence layer (apps/mia).
// Reads/writes mia_phone_qualifications. Service-role only.

import { createServerClient, hasSupabase } from "@naples/db";

export type CallStatus =
  | "queued"
  | "in_progress"
  | "completed"
  | "failed"
  | "no_answer"
  | "voicemail";

export type FollowupRec =
  | "human_call"
  | "no_call"
  | "followup_30d"
  | "disqualified"
  | "do_not_contact";

export interface PhoneQualificationRow {
  id: string;
  tenant_id: string;
  owner_name: string;
  owner_phone: string;
  property_address: string | null;
  property_id: string | null;
  bland_call_id: string | null;
  call_status: CallStatus;
  call_started_at: string | null;
  call_ended_at: string | null;
  call_duration_seconds: number | null;
  transcript: string | null;
  summary: string | null;
  qualification_score: number | null;
  is_correct_owner: boolean | null;
  is_thinking_of_selling: boolean | null;
  asking_price_range: string | null;
  recommended_followup: FollowupRec | null;
  operator_override: string | null;
  raw: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export async function listQualifications(
  tenantId: string,
  limit = 100,
): Promise<PhoneQualificationRow[]> {
  if (!hasSupabase()) return [];
  const sb = createServerClient() as any;
  const { data, error } = await sb
    .from("mia_phone_qualifications")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(`qualifications fetch: ${error.message}`);
  return (data ?? []) as any;
}

export async function getQualification(
  tenantId: string,
  id: string,
): Promise<PhoneQualificationRow | null> {
  if (!hasSupabase()) return null;
  const sb = createServerClient() as any;
  const { data } = await sb
    .from("mia_phone_qualifications")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("id", id)
    .maybeSingle();
  return (data as any) ?? null;
}

export async function createQualification(args: {
  tenantId: string;
  ownerName: string;
  ownerPhone: string;
  propertyAddress?: string | null;
  propertyId?: string | null;
  blandCallId: string;
  callStatus: CallStatus;
}): Promise<PhoneQualificationRow> {
  if (!hasSupabase()) throw new Error("Supabase required");
  const sb = createServerClient() as any;
  const { data, error } = await sb
    .from("mia_phone_qualifications")
    .insert({
      tenant_id: args.tenantId,
      owner_name: args.ownerName,
      owner_phone: args.ownerPhone,
      property_address: args.propertyAddress ?? null,
      property_id: args.propertyId ?? null,
      bland_call_id: args.blandCallId,
      call_status: args.callStatus,
      call_started_at: new Date().toISOString(),
    })
    .select("*")
    .single();
  if (error || !data) {
    throw new Error(`qualification insert: ${error?.message ?? "unknown"}`);
  }
  return data as any;
}

export async function updateQualification(args: {
  tenantId: string;
  id: string;
  patch: Partial<{
    call_status: CallStatus;
    call_ended_at: string;
    call_duration_seconds: number;
    transcript: string;
    summary: string;
    qualification_score: number;
    is_correct_owner: boolean;
    is_thinking_of_selling: boolean;
    asking_price_range: string;
    recommended_followup: FollowupRec;
    operator_override: string;
    raw: Record<string, unknown>;
  }>;
}): Promise<void> {
  if (!hasSupabase()) return;
  const sb = createServerClient() as any;
  await sb
    .from("mia_phone_qualifications")
    .update(args.patch)
    .eq("tenant_id", args.tenantId)
    .eq("id", args.id);
}
