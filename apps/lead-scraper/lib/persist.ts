// Lead Scraper persistence layer — service-role only.
// Tables (migration 0025): scrape_jobs, scrape_runs.
// Lead writes target outreach_leads (existing table from outreach module).

import { createServerClient, hasSupabase } from "@naples/db";
import { getTenantSecret, TenantIntegrationKind } from "@naples/db";
import type {
  ScrapeJobRow,
  ScrapeRunRow,
  ScrapeJobStatus,
} from "./types";
import type { RawScrapedLead, ScrapeSourceKey } from "./sources/types";
import { ALL_SOURCE_KEYS, SOURCE_VAULT_KIND } from "./sources";
import { dedupeKey, passesFilters } from "./normalize";

export async function listJobs(tenantId: string): Promise<ScrapeJobRow[]> {
  if (!hasSupabase()) return [];
  const sb = createServerClient() as any;
  const { data, error } = await sb
    .from("scrape_jobs")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw new Error(`scrape_jobs fetch: ${error.message}`);
  return (data ?? []) as any;
}

export async function getJob(
  tenantId: string,
  id: string,
): Promise<ScrapeJobRow | null> {
  if (!hasSupabase()) return null;
  const sb = createServerClient() as any;
  const { data } = await sb
    .from("scrape_jobs")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("id", id)
    .maybeSingle();
  return (data as any) ?? null;
}

export async function createJob(args: {
  tenantId: string;
  name: string;
  source: ScrapeSourceKey;
  params: Record<string, unknown>;
  niche?: string | null;
  target_titles?: string[];
  target_locations?: string[];
  cron_schedule?: string | null;
}): Promise<ScrapeJobRow> {
  if (!hasSupabase()) throw new Error("Supabase required");
  const sb = createServerClient() as any;
  const { data, error } = await sb
    .from("scrape_jobs")
    .insert({
      tenant_id: args.tenantId,
      name: args.name,
      source: args.source,
      params: args.params,
      niche: args.niche ?? null,
      target_titles: args.target_titles ?? null,
      target_locations: args.target_locations ?? null,
      cron_schedule: args.cron_schedule ?? null,
    })
    .select("*")
    .single();
  if (error || !data) {
    throw new Error(`scrape_jobs insert: ${error?.message ?? "unknown"}`);
  }
  return data as any;
}

export async function listRuns(
  tenantId: string,
  jobId: string,
): Promise<ScrapeRunRow[]> {
  if (!hasSupabase()) return [];
  const sb = createServerClient() as any;
  const { data, error } = await sb
    .from("scrape_runs")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("job_id", jobId)
    .order("created_at", { ascending: false })
    .limit(20);
  if (error) throw new Error(`scrape_runs fetch: ${error.message}`);
  return (data ?? []) as any;
}

export async function createRun(args: {
  tenantId: string;
  jobId: string;
  source: ScrapeSourceKey;
}): Promise<ScrapeRunRow> {
  if (!hasSupabase()) throw new Error("Supabase required");
  const sb = createServerClient() as any;
  const { data, error } = await sb
    .from("scrape_runs")
    .insert({
      tenant_id: args.tenantId,
      job_id: args.jobId,
      source: args.source,
      status: "running" satisfies ScrapeJobStatus,
      started_at: new Date().toISOString(),
    })
    .select("*")
    .single();
  if (error || !data) {
    throw new Error(`scrape_runs insert: ${error?.message ?? "unknown"}`);
  }
  return data as any;
}

export async function updateRun(args: {
  tenantId: string;
  id: string;
  status: ScrapeJobStatus;
  fetched_count?: number;
  inserted_count?: number;
  duplicate_count?: number;
  filtered_count?: number;
  error_message?: string | null;
  raw_results_url?: string | null;
  completed_at?: string | null;
}): Promise<void> {
  if (!hasSupabase()) return;
  const sb = createServerClient() as any;
  const patch: Record<string, unknown> = { status: args.status };
  if (args.fetched_count !== undefined) patch.fetched_count = args.fetched_count;
  if (args.inserted_count !== undefined) patch.inserted_count = args.inserted_count;
  if (args.duplicate_count !== undefined) patch.duplicate_count = args.duplicate_count;
  if (args.filtered_count !== undefined) patch.filtered_count = args.filtered_count;
  if (args.error_message !== undefined) patch.error_message = args.error_message;
  if (args.raw_results_url !== undefined) patch.raw_results_url = args.raw_results_url;
  if (args.completed_at !== undefined) patch.completed_at = args.completed_at;
  await sb
    .from("scrape_runs")
    .update(patch)
    .eq("tenant_id", args.tenantId)
    .eq("id", args.id);
}

export async function bumpJobAfterRun(args: {
  tenantId: string;
  jobId: string;
  insertedCount: number;
  status: string;
}): Promise<void> {
  if (!hasSupabase()) return;
  const sb = createServerClient() as any;
  // Two-step: read totals, then write — tolerable with single-tenant
  // run cadence. Move to a server-side increment RPC if concurrent
  // runs become a real concern.
  const { data: existing } = await sb
    .from("scrape_jobs")
    .select("total_runs,total_leads_added")
    .eq("tenant_id", args.tenantId)
    .eq("id", args.jobId)
    .maybeSingle();
  const cur = (existing as any) ?? { total_runs: 0, total_leads_added: 0 };
  await sb
    .from("scrape_jobs")
    .update({
      total_runs: (cur.total_runs ?? 0) + 1,
      total_leads_added: (cur.total_leads_added ?? 0) + args.insertedCount,
      last_run_at: new Date().toISOString(),
      last_run_status: args.status,
    })
    .eq("tenant_id", args.tenantId)
    .eq("id", args.jobId);
}

export async function getSourceKey(
  tenantId: string,
  source: ScrapeSourceKey,
): Promise<string | null> {
  const vaultKind = SOURCE_VAULT_KIND[source] as TenantIntegrationKind;
  try {
    const sec = await getTenantSecret(tenantId, vaultKind);
    return sec?.secret ?? null;
  } catch {
    return null;
  }
}

export async function listSourceConfigStatus(
  tenantId: string,
): Promise<Record<ScrapeSourceKey, boolean>> {
  const out = {} as Record<ScrapeSourceKey, boolean>;
  for (const key of ALL_SOURCE_KEYS) {
    out[key] = !!(await getSourceKey(tenantId, key));
  }
  return out;
}

/**
 * Idempotent insert into outreach_leads. Returns counts inserted vs
 * duplicate vs filtered for the run record. If outreach_leads doesn't
 * exist on this tenant yet, we still record a partial run with a clear
 * error_message so the operator knows what's missing.
 */
export async function persistLeads(args: {
  tenantId: string;
  leads: RawScrapedLead[];
  filters: {
    target_titles?: string[] | null;
    target_locations?: string[] | null;
  };
}): Promise<{
  inserted: number;
  duplicate: number;
  filtered: number;
  error?: string;
}> {
  if (!hasSupabase()) {
    return { inserted: 0, duplicate: 0, filtered: 0, error: "no_supabase" };
  }
  const sb = createServerClient() as any;

  let inserted = 0;
  let duplicate = 0;
  let filtered = 0;
  let lastError: string | undefined;
  const seen = new Set<string>();

  for (const lead of args.leads) {
    if (!passesFilters(lead, args.filters)) {
      filtered++;
      continue;
    }
    const key = dedupeKey(lead);
    if (!key) {
      filtered++;
      continue;
    }
    if (seen.has(key)) {
      duplicate++;
      continue;
    }
    seen.add(key);

    const payload = {
      tenant_id: args.tenantId,
      email: lead.email ?? null,
      first_name: lead.first_name ?? null,
      last_name: lead.last_name ?? null,
      company_name: lead.company_name ?? null,
      domain: lead.domain ?? null,
      linkedin_url: lead.linkedin_url ?? null,
      phone: lead.phone ?? null,
      title: lead.title ?? null,
      location: lead.location ?? null,
      industry: lead.industry ?? null,
      source: `lead-scraper:${lead.source}`,
      source_ref: lead.external_id ?? null,
      raw: lead.raw,
    };

    // Upsert prefers email; fall back to linkedin_url; fall back to insert.
    let target = "outreach_leads";
    let conflict: string | undefined;
    if (lead.email) conflict = "tenant_id,email";
    else if (lead.linkedin_url) conflict = "tenant_id,linkedin_url";

    const builder = conflict
      ? sb.from(target).upsert(payload, { onConflict: conflict })
      : sb.from(target).insert(payload);
    const { error: insErr, count } = await builder.select("id", { count: "exact" });

    if (insErr) {
      lastError = insErr.message;
      if (
        insErr.code === "42P01" ||
        /relation .* does not exist/i.test(insErr.message)
      ) {
        return {
          inserted,
          duplicate,
          filtered,
          error:
            "outreach_leads table not present yet — install the outreach module migration first",
        };
      }
      // Treat conflict-on-unique as duplicate, not failure.
      if (insErr.code === "23505") {
        duplicate++;
        continue;
      }
      filtered++;
      continue;
    }
    if (count !== null && count !== undefined) {
      inserted += count;
    } else {
      inserted++;
    }
  }
  return {
    inserted,
    duplicate,
    filtered,
    error: lastError,
  };
}
