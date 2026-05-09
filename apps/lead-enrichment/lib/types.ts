// Shared TypeScript shapes for the lead-enrichment module — mirrored
// against the migration 0024 table definitions.

import { EnrichmentSourceKey } from "./sources/types";

export type JobStatus =
  | "draft"
  | "running"
  | "complete"
  | "failed"
  | "partial";

export type InputStatus =
  | "pending"
  | "enriched"
  | "no_match"
  | "low_confidence"
  | "failed"
  | "filtered_out";

export interface EnrichmentJobRow {
  id: string;
  tenant_id: string;
  name: string;
  source_priority: EnrichmentSourceKey[];
  confidence_threshold: number;
  title_filter: string | null;
  status: JobStatus;
  total_inputs: number;
  enriched_count: number;
  failed_count: number;
  pushed_to_outreach: boolean;
  pushed_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  error_summary: string | null;
  created_at: string;
  updated_at: string;
}

export interface EnrichmentInputRow {
  id: string;
  job_id: string;
  tenant_id: string;
  domain: string | null;
  linkedin_url: string | null;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  company_name: string | null;
  title: string | null;
  status: InputStatus;
  resolved_email: string | null;
  resolved_confidence: number | null;
  resolved_source: EnrichmentSourceKey | null;
  resolved_at: string | null;
  icebreaker: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface EnrichmentResultRow {
  id: string;
  input_id: string;
  tenant_id: string;
  source: EnrichmentSourceKey;
  email: string | null;
  confidence: number | null;
  verification_status: string | null;
  raw: Record<string, unknown>;
  http_status: number | null;
  error_message: string | null;
  duration_ms: number | null;
  created_at: string;
}

/** Single-row CSV/clipboard input shape on the new-job form. */
export interface NewJobInput {
  domain?: string;
  linkedin_url?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  company_name?: string;
  title?: string;
}
