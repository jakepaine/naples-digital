-- 0024_lead_enrichment.sql
-- Wave 2 (expanded scope) — Lead Enrichment module.
--
-- Multi-source enrichment chain. A tenant creates an enrichment_job,
-- supplies a list of inputs (domains, LinkedIn URLs, or partial leads),
-- and the chain runs each input through configured sources in priority
-- order — Apollo → AnyMailFinder → Hunter → Apify-LinkedIn — until one
-- returns a high-confidence email. Each source's response is recorded
-- separately in enrichment_results so we keep an audit trail and can
-- compute per-source quality stats over time.
--
-- Per-tenant API keys live in Supabase Vault (set_tenant_secret) under
-- new vendor kinds: anymailfinder, hunter, phantombuster, vayne.
-- Apollo + Apify were already whitelisted in earlier migrations.

-- ============================================================
-- Vault whitelist v4 — adds 4 vendors for Lead Enrichment + Lead Scraper modules
-- ============================================================

CREATE OR REPLACE FUNCTION public.set_tenant_secret(
  p_tenant_id uuid,
  p_kind text,
  p_secret text,
  p_config jsonb DEFAULT '{}'::jsonb
)
RETURNS TABLE (
  out_id uuid,
  out_tenant_id uuid,
  out_kind text,
  out_status text,
  out_last_verified_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, vault, pg_temp
AS $$
DECLARE
  v_secret_name text := 'tenant_' || p_tenant_id::text || '_' || p_kind;
  v_secret_id uuid;
  v_existing uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.tenants WHERE tenants.id = p_tenant_id) THEN
    RAISE EXCEPTION 'tenant % not found', p_tenant_id;
  END IF;

  -- Whitelist v4 — adds anymailfinder, hunter, phantombuster, vayne
  -- (plus the older apify, batchskiptracing, postmark which were missed
  -- in prior migrations but are referenced by tenant.ts)
  IF p_kind NOT IN (
    'instantly','smartlead','apollo','clay','assemblyai','opusclip',
    'stripe','resend','buffer','publer','klaviyo','meta','ghl',
    'gmail','twitter','linkedin','medium','slack',
    'apify','batchskiptracing','postmark',
    'anymailfinder','hunter','phantombuster','vayne'
  ) THEN
    RAISE EXCEPTION 'kind % not in allowed vendors', p_kind;
  END IF;

  SELECT s.id INTO v_existing FROM vault.secrets s WHERE s.name = v_secret_name;

  IF v_existing IS NULL THEN
    v_secret_id := vault.create_secret(p_secret, v_secret_name, 'tenant integration secret');
  ELSE
    PERFORM vault.update_secret(v_existing, p_secret, v_secret_name, 'tenant integration secret');
    v_secret_id := v_existing;
  END IF;

  INSERT INTO public.tenant_integrations (tenant_id, kind, config, secret_ref, status, last_verified_at)
  VALUES (p_tenant_id, p_kind, p_config, v_secret_id::text, 'verified', now())
  ON CONFLICT (tenant_id, kind) DO UPDATE
    SET config = excluded.config,
        secret_ref = excluded.secret_ref,
        status = 'verified',
        last_verified_at = now(),
        updated_at = now();

  RETURN QUERY
    SELECT ti.id, ti.tenant_id, ti.kind, ti.status, ti.last_verified_at
    FROM public.tenant_integrations ti
    WHERE ti.tenant_id = p_tenant_id AND ti.kind = p_kind;
END;
$$;

REVOKE ALL ON FUNCTION public.set_tenant_secret FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_tenant_secret TO service_role;

-- ============================================================
-- Enrichment tables
-- ============================================================

CREATE TABLE IF NOT EXISTS public.enrichment_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  -- Source priority — first source whose response meets confidence threshold wins.
  -- Default: apollo,anymailfinder,hunter,apify_linkedin
  source_priority text[] NOT NULL DEFAULT ARRAY['apollo','anymailfinder','hunter','apify_linkedin']::text[],
  -- Confidence threshold (0-100). Result with confidence >= threshold short-circuits chain.
  confidence_threshold integer NOT NULL DEFAULT 70 CHECK (confidence_threshold BETWEEN 0 AND 100),
  -- Filter: only enrich rows whose decision-maker title matches this regex (case-insensitive).
  title_filter text,
  -- Job lifecycle.
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','running','complete','failed','partial')),
  total_inputs integer NOT NULL DEFAULT 0,
  enriched_count integer NOT NULL DEFAULT 0,
  failed_count integer NOT NULL DEFAULT 0,
  pushed_to_outreach boolean NOT NULL DEFAULT false,
  pushed_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  error_summary text,
  created_by_user_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS enrichment_jobs_tenant_idx
  ON public.enrichment_jobs(tenant_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.enrichment_inputs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.enrichment_jobs(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  -- Input shape — at minimum one of (domain, linkedin_url, email).
  domain text,
  linkedin_url text,
  email text,
  first_name text,
  last_name text,
  company_name text,
  title text,
  -- Resolution outcome (filled by the chain runner).
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','enriched','no_match','low_confidence','failed','filtered_out')),
  -- The winning source's email — null until status='enriched'.
  resolved_email text,
  resolved_confidence integer CHECK (resolved_confidence BETWEEN 0 AND 100),
  resolved_source text,
  resolved_at timestamptz,
  -- AI-generated icebreaker line for cold email personalization (Nick's pattern).
  icebreaker text,
  -- Free-form notes (catch-all flag, role-based flag, deliverability concerns).
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS enrichment_inputs_job_idx
  ON public.enrichment_inputs(job_id, status);
CREATE INDEX IF NOT EXISTS enrichment_inputs_tenant_idx
  ON public.enrichment_inputs(tenant_id, status);

CREATE TABLE IF NOT EXISTS public.enrichment_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  input_id uuid NOT NULL REFERENCES public.enrichment_inputs(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  source text NOT NULL,
  email text,
  confidence integer CHECK (confidence BETWEEN 0 AND 100),
  verification_status text,    -- 'valid','catch_all','accept_all','invalid','unknown'
  raw jsonb NOT NULL DEFAULT '{}'::jsonb,
  http_status integer,
  error_message text,
  duration_ms integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (input_id, source)
);

CREATE INDEX IF NOT EXISTS enrichment_results_tenant_idx
  ON public.enrichment_results(tenant_id, source, created_at DESC);

-- ============================================================
-- RLS — service-role only for now; per-user RLS retrofit deferred
-- (matches the rest of the platform's tenant-scoped tables today).
-- ============================================================

ALTER TABLE public.enrichment_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrichment_inputs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrichment_results ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS enrichment_jobs_updated ON public.enrichment_jobs;
CREATE TRIGGER enrichment_jobs_updated
  BEFORE UPDATE ON public.enrichment_jobs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS enrichment_inputs_updated ON public.enrichment_inputs;
CREATE TRIGGER enrichment_inputs_updated
  BEFORE UPDATE ON public.enrichment_inputs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
