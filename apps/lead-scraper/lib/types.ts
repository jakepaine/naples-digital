import { ScrapeSourceKey } from "./sources/types";

export type ScrapeJobStatus = "queued" | "running" | "complete" | "failed" | "partial";

export interface ScrapeJobRow {
  id: string;
  tenant_id: string;
  name: string;
  source: ScrapeSourceKey;
  params: Record<string, unknown>;
  cron_schedule: string | null;
  niche: string | null;
  target_titles: string[] | null;
  target_locations: string[] | null;
  enabled: boolean;
  total_runs: number;
  total_leads_added: number;
  last_run_at: string | null;
  last_run_status: string | null;
  created_at: string;
  updated_at: string;
}

export interface ScrapeRunRow {
  id: string;
  tenant_id: string;
  job_id: string;
  source: ScrapeSourceKey;
  status: ScrapeJobStatus;
  started_at: string | null;
  completed_at: string | null;
  raw_results_url: string | null;
  fetched_count: number;
  inserted_count: number;
  duplicate_count: number;
  filtered_count: number;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}
