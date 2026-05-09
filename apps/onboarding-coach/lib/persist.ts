// Onboarding Coach — DB layer.
// Tables (migration 0029):
//   onboarding_runs              one active/paused row per tenant
//   onboarding_step_completions  one row per completed step

import { createServerClient, hasSupabase } from "@naples/db";

export type RunStatus = "active" | "paused" | "completed" | "abandoned";

export interface OnboardingRunRow {
  id: string;
  tenant_id: string;
  status: RunStatus;
  current_day: number;
  started_at: string;
  paused_at: string | null;
  resumed_at: string | null;
  completed_at: string | null;
  timezone: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface OnboardingStepCompletionRow {
  id: string;
  tenant_id: string;
  run_id: string;
  step_key: string;
  day: number;
  completed_at: string;
  notes: string | null;
  artifact_summary: string | null;
  artifact_link: string | null;
}

/**
 * Find the active (or paused) run for the tenant. Returns null when
 * the tenant hasn't started a playbook yet — caller usually flips
 * the UI into "Start onboarding" state.
 */
export async function getActiveRun(
  tenantId: string,
): Promise<OnboardingRunRow | null> {
  if (!hasSupabase()) return null;
  const sb = createServerClient() as any;
  const { data } = await sb
    .from("onboarding_runs")
    .select("*")
    .eq("tenant_id", tenantId)
    .in("status", ["active", "paused"])
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data as any) ?? null;
}

export async function startRun(args: {
  tenantId: string;
  timezone?: string;
}): Promise<OnboardingRunRow> {
  if (!hasSupabase()) throw new Error("Supabase required");
  const sb = createServerClient() as any;
  const { data, error } = await sb
    .from("onboarding_runs")
    .insert({
      tenant_id: args.tenantId,
      status: "active" satisfies RunStatus,
      current_day: 1,
      timezone: args.timezone ?? "America/New_York",
    })
    .select("*")
    .single();
  if (error || !data) {
    throw new Error(`onboarding_runs insert: ${error?.message ?? "unknown"}`);
  }
  return data as any;
}

export async function setRunDay(args: {
  tenantId: string;
  runId: string;
  day: number;
}): Promise<void> {
  if (!hasSupabase()) return;
  const sb = createServerClient() as any;
  const day = Math.max(1, Math.min(30, args.day));
  await sb
    .from("onboarding_runs")
    .update({ current_day: day })
    .eq("tenant_id", args.tenantId)
    .eq("id", args.runId);
}

export async function setRunStatus(args: {
  tenantId: string;
  runId: string;
  status: RunStatus;
}): Promise<void> {
  if (!hasSupabase()) return;
  const sb = createServerClient() as any;
  const patch: Record<string, unknown> = { status: args.status };
  if (args.status === "paused") patch.paused_at = new Date().toISOString();
  if (args.status === "active") patch.resumed_at = new Date().toISOString();
  if (args.status === "completed")
    patch.completed_at = new Date().toISOString();
  await sb
    .from("onboarding_runs")
    .update(patch)
    .eq("tenant_id", args.tenantId)
    .eq("id", args.runId);
}

export async function listCompletions(args: {
  tenantId: string;
  runId: string;
}): Promise<OnboardingStepCompletionRow[]> {
  if (!hasSupabase()) return [];
  const sb = createServerClient() as any;
  const { data, error } = await sb
    .from("onboarding_step_completions")
    .select("*")
    .eq("tenant_id", args.tenantId)
    .eq("run_id", args.runId)
    .order("completed_at", { ascending: true });
  if (error) throw new Error(`completions fetch: ${error.message}`);
  return (data ?? []) as any;
}

export async function markStepComplete(args: {
  tenantId: string;
  runId: string;
  stepKey: string;
  day: number;
  notes?: string;
  artifactSummary?: string;
  artifactLink?: string;
}): Promise<{ row: OnboardingStepCompletionRow | null; duplicate: boolean }> {
  if (!hasSupabase()) return { row: null, duplicate: false };
  const sb = createServerClient() as any;
  const { data, error } = await sb
    .from("onboarding_step_completions")
    .insert({
      tenant_id: args.tenantId,
      run_id: args.runId,
      step_key: args.stepKey,
      day: args.day,
      notes: args.notes ?? null,
      artifact_summary: args.artifactSummary ?? null,
      artifact_link: args.artifactLink ?? null,
    })
    .select("*")
    .single();
  if (error) {
    if (error.code === "23505") {
      // Already completed.
      const { data: existing } = await sb
        .from("onboarding_step_completions")
        .select("*")
        .eq("run_id", args.runId)
        .eq("step_key", args.stepKey)
        .maybeSingle();
      return { row: (existing as any) ?? null, duplicate: true };
    }
    throw new Error(`step_completion insert: ${error.message}`);
  }
  return { row: data as any, duplicate: false };
}

export async function markStepIncomplete(args: {
  tenantId: string;
  runId: string;
  stepKey: string;
}): Promise<void> {
  if (!hasSupabase()) return;
  const sb = createServerClient() as any;
  await sb
    .from("onboarding_step_completions")
    .delete()
    .eq("tenant_id", args.tenantId)
    .eq("run_id", args.runId)
    .eq("step_key", args.stepKey);
}
