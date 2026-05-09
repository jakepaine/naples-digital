// Voice profile persistence — one row per tenant.

import { createServerClient, hasSupabase } from "@naples/db";
import type { VoiceFingerprint } from "@naples/outreach";

export interface VoiceProfileRow {
  id: string;
  tenant_id: string;
  samples: string[];
  samples_count: number;
  fingerprint: VoiceFingerprint | Record<string, never>;
  voice_summary: string | null;
  quality_flags: string[] | null;
  enabled: boolean;
  generated_at: string;
  created_at: string;
  updated_at: string;
}

export async function getVoiceProfile(
  tenantId: string,
): Promise<VoiceProfileRow | null> {
  if (!hasSupabase()) return null;
  const sb = createServerClient() as any;
  const { data } = await sb
    .from("tenant_voice_profiles")
    .select("*")
    .eq("tenant_id", tenantId)
    .maybeSingle();
  return (data as any) ?? null;
}

export async function saveVoiceProfile(args: {
  tenantId: string;
  samples: string[];
  fingerprint: VoiceFingerprint;
  voice_summary: string;
  quality_flags: string[];
}): Promise<VoiceProfileRow | null> {
  if (!hasSupabase()) return null;
  const sb = createServerClient() as any;
  const { data, error } = await sb
    .from("tenant_voice_profiles")
    .upsert(
      {
        tenant_id: args.tenantId,
        samples: args.samples,
        samples_count: args.samples.length,
        fingerprint: args.fingerprint,
        voice_summary: args.voice_summary,
        quality_flags: args.quality_flags,
        enabled: true,
        generated_at: new Date().toISOString(),
      },
      { onConflict: "tenant_id" },
    )
    .select("*")
    .single();
  if (error) {
    throw new Error(`voice profile save: ${error.message}`);
  }
  return data as any;
}

export async function setEnabled(args: {
  tenantId: string;
  enabled: boolean;
}): Promise<void> {
  if (!hasSupabase()) return;
  const sb = createServerClient() as any;
  await sb
    .from("tenant_voice_profiles")
    .update({ enabled: args.enabled })
    .eq("tenant_id", args.tenantId);
}
