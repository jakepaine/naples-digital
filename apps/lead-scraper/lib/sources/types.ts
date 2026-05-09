// Scrape-source adapter contract.
//
// Different shape from Lead Enrichment — we yield a stream of leads
// rather than enriching a single input. Each adapter normalises into
// `RawScrapedLead` so the run-handler can dedupe + insert into
// outreach_leads regardless of source.

export type ScrapeSourceKey =
  | "apify"
  | "apollo"
  | "phantombuster"
  | "vayne";

export interface RawScrapedLead {
  /** Stable cross-source identifier — used for dedupe alongside email. */
  external_id?: string | null;
  email?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  company_name?: string | null;
  domain?: string | null;
  linkedin_url?: string | null;
  phone?: string | null;
  title?: string | null;
  location?: string | null;
  industry?: string | null;
  source: ScrapeSourceKey;
  /** Carry the full source payload for future re-processing. */
  raw: Record<string, unknown>;
}

export interface ScrapeOutcome {
  fetched: RawScrapedLead[];
  raw_results_url?: string | null;
  error?: string | null;
  /** True when no API key was configured and the adapter returned a synthetic batch. */
  is_stub?: boolean;
}

export interface ScrapeSource {
  key: ScrapeSourceKey;
  displayName: string;
  isConfigured(args: { apiKey?: string | null }): boolean;
  /**
   * Run a single scrape. params are source-specific (see each adapter
   * for documented shapes). Adapters MUST not throw — return outcome
   * with `error` set instead so the caller can record the failure.
   */
  scrape(args: {
    apiKey?: string | null;
    params: Record<string, unknown>;
    /** Hard cap on results returned to the caller. */
    maxLeads: number;
  }): Promise<ScrapeOutcome>;
}
