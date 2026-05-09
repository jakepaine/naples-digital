-- 0030_mia_phone_qualifications.sql
-- Wave 2 #8 — Bland.ai phone-call kickoff for MIA.
--
-- The off-market workflow finds property owners (BatchSkipTracing
-- unwraps LLCs into human contacts with phone + email). Before MIA's
-- acquisitions team places a human call, fire a Bland.ai AI call to
-- pre-qualify: are they the right person, are they thinking about
-- selling, what's their range. Calls that pre-qualify get routed to
-- a human; calls that don't waste no human time.
--
-- Single new table: mia_phone_qualifications.
-- Vault whitelist extended with 'bland'.

-- Vault whitelist v5 — adds bland.
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

  -- Whitelist v5 — adds bland
  IF p_kind NOT IN (
    'instantly','smartlead','apollo','clay','assemblyai','opusclip',
    'stripe','resend','buffer','publer','klaviyo','meta','ghl',
    'gmail','twitter','linkedin','medium','slack',
    'apify','batchskiptracing','postmark',
    'anymailfinder','hunter','phantombuster','vayne',
    'bland'
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
-- Phone qualifications
-- ============================================================
CREATE TABLE IF NOT EXISTS public.mia_phone_qualifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  -- Owner contact info from BatchSkipTracing — denormalized so we can
  -- fire calls without joining other tables.
  owner_name text NOT NULL,
  owner_phone text NOT NULL,
  -- Property reference (free-form for now — schema for properties table
  -- lives in MIA's existing migrations).
  property_address text,
  property_id uuid,
  -- Bland.ai side identifiers.
  bland_call_id text UNIQUE,
  call_status text NOT NULL DEFAULT 'queued'
    CHECK (call_status IN ('queued','in_progress','completed','failed','no_answer','voicemail')),
  call_started_at timestamptz,
  call_ended_at timestamptz,
  call_duration_seconds integer,
  -- Result fields filled by Bland's webhook on completion.
  transcript text,
  summary text,
  -- 0-100 — how qualified is the lead. Filled by post-call analysis
  -- (Claude on the transcript) or by Bland's analysis hooks.
  qualification_score integer CHECK (qualification_score BETWEEN 0 AND 100),
  -- Boolean qualification flags surfaced by the analysis prompt.
  is_correct_owner boolean,
  is_thinking_of_selling boolean,
  asking_price_range text,
  recommended_followup text CHECK (recommended_followup IN (
    'human_call','no_call','followup_30d','disqualified','do_not_contact'
  )),
  -- Operator can override the AI's recommendation.
  operator_override text,
  raw jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS mia_phone_qualifications_tenant_idx
  ON public.mia_phone_qualifications(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS mia_phone_qualifications_status_idx
  ON public.mia_phone_qualifications(tenant_id, call_status, created_at DESC);
CREATE INDEX IF NOT EXISTS mia_phone_qualifications_phone_idx
  ON public.mia_phone_qualifications(tenant_id, owner_phone);

ALTER TABLE public.mia_phone_qualifications ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS mia_phone_qualifications_updated ON public.mia_phone_qualifications;
CREATE TRIGGER mia_phone_qualifications_updated
  BEFORE UPDATE ON public.mia_phone_qualifications
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
