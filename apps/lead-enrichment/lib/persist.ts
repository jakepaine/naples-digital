// DB layer for the enrichment module. Service-role only — every query
// scopes by tenant_id, matching the tenant-scoping invariant from
// platform/CLAUDE.md.

import { createServerClient, hasSupabase } from "@naples/db";
import { getTenantSecret, TenantIntegrationKind } from "@naples/db";
import {
  EnrichmentJobRow,
  EnrichmentInputRow,
  EnrichmentResultRow,
  JobStatus,
  InputStatus,
  NewJobInput,
} from "./types";
import {
  EnrichmentSourceKey,
  EnrichmentResult,
} from "./sources/types";
import { SOURCE_VAULT_KIND, ALL_SOURCE_KEYS } from "./sources";

export async function listJobs(tenantId: string): Promise<EnrichmentJobRow[]> {
  if (!hasSupabase()) return [];
  const sb = createServerClient() as any;
  const { data, error } = await sb
    .from("enrichment_jobs")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw new Error(`jobs fetch: ${error.message}`);
  return (data ?? []) as any;
}

export async function getJob(
  tenantId: string,
  id: string,
): Promise<EnrichmentJobRow | null> {
  if (!hasSupabase()) return null;
  const sb = createServerClient() as any;
  const { data } = await sb
    .from("enrichment_jobs")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("id", id)
    .maybeSingle();
  return (data as any) ?? null;
}

export async function createJob(args: {
  tenantId: string;
  name: string;
  source_priority?: EnrichmentSourceKey[];
  confidence_threshold?: number;
  title_filter?: string | null;
  inputs: NewJobInput[];
}): Promise<EnrichmentJobRow> {
  if (!hasSupabase()) throw new Error("Supabase required");
  const sb = createServerClient() as any;
  const priority = (args.source_priority?.length
    ? args.source_priority
    : ALL_SOURCE_KEYS) as EnrichmentSourceKey[];
  const threshold = args.confidence_threshold ?? 70;

  const { data: job, error } = await sb
    .from("enrichment_jobs")
    .insert({
      tenant_id: args.tenantId,
      name: args.name,
      source_priority: priority,
      confidence_threshold: threshold,
      title_filter: args.title_filter ?? null,
      status: "draft" satisfies JobStatus,
      total_inputs: args.inputs.length,
    })
    .select("*")
    .single();
  if (error || !job) throw new Error(`job insert: ${error?.message ?? "unknown"}`);

  if (args.inputs.length > 0) {
    const rows = args.inputs.map((i) => ({
      job_id: (job as any).id,
      tenant_id: args.tenantId,
      domain: nullable(i.domain),
      linkedin_url: nullable(i.linkedin_url),
      email: nullable(i.email),
      first_name: nullable(i.first_name),
      last_name: nullable(i.last_name),
      company_name: nullable(i.company_name),
      title: nullable(i.title),
      status: "pending" satisfies InputStatus,
    }));
    const { error: insErr } = await sb.from("enrichment_inputs").insert(rows);
    if (insErr) throw new Error(`inputs insert: ${insErr.message}`);
  }

  return job as any;
}

export async function listInputs(
  tenantId: string,
  jobId: string,
): Promise<EnrichmentInputRow[]> {
  if (!hasSupabase()) return [];
  const sb = createServerClient() as any;
  const { data, error } = await sb
    .from("enrichment_inputs")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("job_id", jobId)
    .order("created_at", { ascending: true })
    .limit(2000);
  if (error) throw new Error(`inputs fetch: ${error.message}`);
  return (data ?? []) as any;
}

export async function listResultsForInput(
  tenantId: string,
  inputId: string,
): Promise<EnrichmentResultRow[]> {
  if (!hasSupabase()) return [];
  const sb = createServerClient() as any;
  const { data, error } = await sb
    .from("enrichment_results")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("input_id", inputId)
    .order("created_at", { ascending: true });
  if (error) throw new Error(`results fetch: ${error.message}`);
  return (data ?? []) as any;
}

export async function updateInputResolution(args: {
  tenantId: string;
  inputId: string;
  status: InputStatus;
  resolved_email?: string | null;
  resolved_confidence?: number | null;
  resolved_source?: EnrichmentSourceKey | null;
  icebreaker?: string | null;
  notes?: string | null;
}): Promise<void> {
  if (!hasSupabase()) return;
  const sb = createServerClient() as any;
  await sb
    .from("enrichment_inputs")
    .update({
      status: args.status,
      resolved_email: args.resolved_email ?? null,
      resolved_confidence: args.resolved_confidence ?? null,
      resolved_source: args.resolved_source ?? null,
      resolved_at:
        args.status === "enriched" || args.status === "low_confidence"
          ? new Date().toISOString()
          : null,
      icebreaker: args.icebreaker ?? null,
      notes: args.notes ?? null,
    })
    .eq("tenant_id", args.tenantId)
    .eq("id", args.inputId);
}

export async function recordResult(args: {
  tenantId: string;
  inputId: string;
  result: EnrichmentResult;
}): Promise<void> {
  if (!hasSupabase()) return;
  const sb = createServerClient() as any;
  await sb
    .from("enrichment_results")
    .upsert(
      {
        tenant_id: args.tenantId,
        input_id: args.inputId,
        source: args.result.source,
        email: args.result.email,
        confidence: args.result.confidence,
        verification_status: args.result.verification_status,
        raw: args.result.raw,
        http_status: args.result.http_status ?? null,
        error_message: args.result.error_message ?? null,
        duration_ms: args.result.duration_ms,
      },
      { onConflict: "input_id,source" },
    );
}

export async function updateJobStatus(args: {
  tenantId: string;
  jobId: string;
  status: JobStatus;
  enriched_count?: number;
  failed_count?: number;
  error_summary?: string | null;
  started_at?: string | null;
  completed_at?: string | null;
}): Promise<void> {
  if (!hasSupabase()) return;
  const sb = createServerClient() as any;
  const patch: Record<string, unknown> = { status: args.status };
  if (args.enriched_count !== undefined) patch.enriched_count = args.enriched_count;
  if (args.failed_count !== undefined) patch.failed_count = args.failed_count;
  if (args.error_summary !== undefined) patch.error_summary = args.error_summary;
  if (args.started_at !== undefined) patch.started_at = args.started_at;
  if (args.completed_at !== undefined) patch.completed_at = args.completed_at;
  await sb
    .from("enrichment_jobs")
    .update(patch)
    .eq("tenant_id", args.tenantId)
    .eq("id", args.jobId);
}

export async function markJobPushed(args: {
  tenantId: string;
  jobId: string;
}): Promise<void> {
  if (!hasSupabase()) return;
  const sb = createServerClient() as any;
  await sb
    .from("enrichment_jobs")
    .update({
      pushed_to_outreach: true,
      pushed_at: new Date().toISOString(),
    })
    .eq("tenant_id", args.tenantId)
    .eq("id", args.jobId);
}

/**
 * Resolve per-tenant API keys for every source. Returns `null` for sources
 * the tenant hasn't configured — adapters fall through to stub mode in
 * that case.
 */
export async function loadSourceKeys(
  tenantId: string,
): Promise<Partial<Record<EnrichmentSourceKey, string | null>>> {
  const out: Partial<Record<EnrichmentSourceKey, string | null>> = {};
  for (const key of ALL_SOURCE_KEYS) {
    const vaultKind = SOURCE_VAULT_KIND[key] as TenantIntegrationKind;
    try {
      const sec = await getTenantSecret(tenantId, vaultKind);
      out[key] = sec?.secret ?? null;
    } catch {
      out[key] = null;
    }
  }
  return out;
}

export async function listSourceConfigStatus(
  tenantId: string,
): Promise<Record<EnrichmentSourceKey, boolean>> {
  const keys = await loadSourceKeys(tenantId);
  const out = {} as Record<EnrichmentSourceKey, boolean>;
  for (const k of ALL_SOURCE_KEYS) out[k] = !!keys[k];
  return out;
}

/**
 * Push enriched leads from this job into the outreach pipeline. Writes
 * into `outreach_leads` if that table exists (matches existing
 * outreach-dispatcher schema). Idempotent on (tenant_id, email).
 */
export async function pushEnrichedToOutreach(args: {
  tenantId: string;
  jobId: string;
}): Promise<{ pushed: number; skipped: number; reason?: string }> {
  if (!hasSupabase()) return { pushed: 0, skipped: 0, reason: "no_supabase" };
  const sb = createServerClient() as any;
  const { data: inputs, error } = await sb
    .from("enrichment_inputs")
    .select("*")
    .eq("tenant_id", args.tenantId)
    .eq("job_id", args.jobId)
    .in("status", ["enriched"]);
  if (error) return { pushed: 0, skipped: 0, reason: error.message };
  const rows = (inputs ?? []) as EnrichmentInputRow[];
  let pushed = 0;
  let skipped = 0;
  for (const row of rows) {
    if (!row.resolved_email) {
      skipped++;
      continue;
    }
    const payload = {
      tenant_id: args.tenantId,
      email: row.resolved_email,
      first_name: row.first_name,
      last_name: row.last_name,
      company_name: row.company_name,
      domain: row.domain,
      linkedin_url: row.linkedin_url,
      title: row.title,
      icebreaker: row.icebreaker,
      source: "lead-enrichment",
      source_ref: row.id,
      confidence: row.resolved_confidence,
      enriched_via: row.resolved_source,
    };
    // Best-effort upsert. If outreach_leads doesn't exist yet (the
    // outreach module ships its own migration), we record the failure
    // but don't blow up the request.
    const { error: upErr } = await sb
      .from("outreach_leads")
      .upsert(payload, { onConflict: "tenant_id,email" });
    if (upErr) {
      skipped++;
      // First missing-table error stops the loop — no point retrying.
      if (
        upErr.code === "42P01" ||
        /relation .* does not exist/i.test(upErr.message)
      ) {
        return {
          pushed,
          skipped: skipped + (rows.length - pushed - skipped),
          reason:
            "outreach_leads table not present yet — push deferred until outreach module migration ships",
        };
      }
      continue;
    }
    pushed++;
  }
  return { pushed, skipped };
}

function nullable(v: string | undefined | null): string | null {
  if (v == null) return null;
  const s = String(v).trim();
  return s ? s : null;
}
