-- 0034_outreach_experiments.sql
-- Sequence A/B testing for outbound campaigns.
--
-- An experiment groups 2+ sequence variants. Each push of a lead
-- picks a variant (weighted random), records the assignment, and
-- the existing Instantly/Smartlead webhook flow back-fills outcome
-- fields (open / reply / bounce / unsubscribe) onto the assignment
-- via lead_email + tenant match.
--
-- Reporting reads assignments grouped by variant_id to compute
-- per-variant reply rates, then surfaces a winner suggestion when
-- a variant's replied_count is statistically distinguishable from
-- its sibling's.

CREATE TABLE IF NOT EXISTS public.outreach_sequence_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  experiment_id uuid NOT NULL,
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  -- The full multi-step sequence as a JSONB array of
  --   { step, subject, body, delay_days }
  -- matching packages/outreach/lib/types.ts SequenceEmail.
  sequence jsonb NOT NULL DEFAULT '[]'::jsonb,
  -- Weight 0-100 — relative share of traffic. Variants in the same
  -- experiment are normalized at pick time, so 50/50 and 1/1 mean
  -- the same thing.
  traffic_weight integer NOT NULL DEFAULT 50 CHECK (traffic_weight BETWEEN 0 AND 100),
  -- Aggregated outcome counts maintained incrementally by the
  -- assignment + webhook handlers.
  pushed_count integer NOT NULL DEFAULT 0,
  opened_count integer NOT NULL DEFAULT 0,
  replied_count integer NOT NULL DEFAULT 0,
  positive_reply_count integer NOT NULL DEFAULT 0,
  bounced_count integer NOT NULL DEFAULT 0,
  unsubscribed_count integer NOT NULL DEFAULT 0,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (experiment_id, name)
);

CREATE TABLE IF NOT EXISTS public.outreach_experiments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  -- Lifecycle. 'draft' = variants editable; 'running' = variants
  -- locked, pushes happen; 'paused' = no new pushes, existing
  -- assignments still recieve outcomes; 'concluded' = winner
  -- declared, no further activity.
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','running','paused','concluded')),
  -- Free-form, surfaced in the dashboard.
  hypothesis text,
  notes text,
  -- Set when the operator (or auto-conclude) picks a winner.
  winner_variant_id uuid REFERENCES public.outreach_sequence_variants(id),
  winner_decided_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, name)
);

-- FK back-link variants → experiment now that both tables exist.
ALTER TABLE public.outreach_sequence_variants
  ADD CONSTRAINT outreach_sequence_variants_experiment_fk
  FOREIGN KEY (experiment_id) REFERENCES public.outreach_experiments(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS outreach_experiments_tenant_idx
  ON public.outreach_experiments(tenant_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS outreach_sequence_variants_exp_idx
  ON public.outreach_sequence_variants(experiment_id);
CREATE INDEX IF NOT EXISTS outreach_sequence_variants_tenant_idx
  ON public.outreach_sequence_variants(tenant_id);

CREATE TABLE IF NOT EXISTS public.outreach_lead_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  experiment_id uuid NOT NULL REFERENCES public.outreach_experiments(id) ON DELETE CASCADE,
  variant_id uuid NOT NULL REFERENCES public.outreach_sequence_variants(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  lead_email text NOT NULL,
  lead_name text,
  -- Vendor's external lead+campaign id from pushSequence().
  vendor_external_id text,
  vendor_kind text,
  pushed_at timestamptz NOT NULL DEFAULT now(),
  -- Outcome fields filled by the webhook handler matching on
  -- (tenant_id, lower(lead_email)). Forward-only — first event of
  -- each kind wins.
  first_open_at timestamptz,
  reply_at timestamptz,
  reply_intent text,
  bounced_at timestamptz,
  unsubscribed_at timestamptz,
  raw jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (experiment_id, lead_email)
);

CREATE INDEX IF NOT EXISTS outreach_lead_assignments_variant_idx
  ON public.outreach_lead_assignments(variant_id, pushed_at DESC);
CREATE INDEX IF NOT EXISTS outreach_lead_assignments_lead_email_idx
  ON public.outreach_lead_assignments(tenant_id, lower(lead_email));

ALTER TABLE public.outreach_experiments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outreach_sequence_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outreach_lead_assignments ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS outreach_experiments_updated ON public.outreach_experiments;
CREATE TRIGGER outreach_experiments_updated
  BEFORE UPDATE ON public.outreach_experiments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS outreach_sequence_variants_updated ON public.outreach_sequence_variants;
CREATE TRIGGER outreach_sequence_variants_updated
  BEFORE UPDATE ON public.outreach_sequence_variants
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS outreach_lead_assignments_updated ON public.outreach_lead_assignments;
CREATE TRIGGER outreach_lead_assignments_updated
  BEFORE UPDATE ON public.outreach_lead_assignments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
