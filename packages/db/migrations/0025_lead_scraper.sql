-- 0025_lead_scraper.sql
-- Wave 2 (expanded) — Lead Scraper module.
--
-- Tenants define scrape jobs (niche / job title / location / size filter)
-- and the system routes to the appropriate source: Apify actors (Google
-- Maps, LinkedIn search, IG hashtag), Apollo bulk filter export,
-- PhantomBuster (LinkedIn DM list, IG follower scrape), Vayne (Sales
-- Nav URL → CSV). Each run produces a scraping_run row plus a flood of
-- outreach_leads inserts, idempotent on (tenant_id, normalized_key).
--
-- The four supported sources' Vault kinds — apify, apollo, phantombuster,
-- vayne — were either pre-existing or added by migration 0024, so no
-- whitelist changes here.

-- ============================================================
-- Scrape job: per-tenant config of "what to scrape repeatedly"
-- ============================================================

CREATE TABLE IF NOT EXISTS public.scrape_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  source text NOT NULL CHECK (source IN ('apify','apollo','phantombuster','vayne')),
  -- Free-form params object — shape depends on source. Documented at:
  --   apify  → { actor_id, input: {...} }
  --   apollo → { filters: {...}, max_per_run }
  --   phantombuster → { agent_id, input: {...} }
  --   vayne  → { sales_nav_url, max }
  params jsonb NOT NULL DEFAULT '{}'::jsonb,
  -- Optional cron schedule. NULL = manual-only.
  cron_schedule text,
  -- Tenant guidance fields (also used to seed icebreakers for resulting leads).
  niche text,
  target_titles text[],
  target_locations text[],
  -- Lifecycle.
  enabled boolean NOT NULL DEFAULT true,
  total_runs integer NOT NULL DEFAULT 0,
  total_leads_added integer NOT NULL DEFAULT 0,
  last_run_at timestamptz,
  last_run_status text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS scrape_jobs_tenant_idx
  ON public.scrape_jobs(tenant_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.scrape_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  job_id uuid NOT NULL REFERENCES public.scrape_jobs(id) ON DELETE CASCADE,
  source text NOT NULL,
  status text NOT NULL DEFAULT 'queued'
    CHECK (status IN ('queued','running','complete','failed','partial')),
  started_at timestamptz,
  completed_at timestamptz,
  raw_results_url text,    -- pointer to Apify dataset / PhantomBuster CSV
  fetched_count integer NOT NULL DEFAULT 0,
  inserted_count integer NOT NULL DEFAULT 0,
  duplicate_count integer NOT NULL DEFAULT 0,
  filtered_count integer NOT NULL DEFAULT 0,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS scrape_runs_job_idx
  ON public.scrape_runs(job_id, created_at DESC);

ALTER TABLE public.scrape_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scrape_runs ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS scrape_jobs_updated ON public.scrape_jobs;
CREATE TRIGGER scrape_jobs_updated
  BEFORE UPDATE ON public.scrape_jobs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS scrape_runs_updated ON public.scrape_runs;
CREATE TRIGGER scrape_runs_updated
  BEFORE UPDATE ON public.scrape_runs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
