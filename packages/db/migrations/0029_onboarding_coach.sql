-- 0029_onboarding_coach.sql
-- Onboarding Coach — the audit-flagged killer feature.
--
-- Mirrors Saraev's 30-day playbook (daily_playbook.md). Tenants log in,
-- get walked through Days 1-30 with each step pointing at the relevant
-- Naples module. Drives Starter/Growth tier perceived value (clear path
-- to first customer in 90 days), drives module adoption (each step
-- unlocks a module), drives retention (tenants who complete Day 30 are
-- more committed than tenants who poke around feature-by-feature).
--
-- Two tables:
-- 1) onboarding_runs              — one row per tenant per playbook run
--                                   (rare: usually one per tenant)
-- 2) onboarding_step_completions  — every step the tenant has marked
--                                   done. Step KEYS live in code
--                                   (lib/playbook.ts), not DB, so the
--                                   playbook can evolve without
--                                   migrations.

CREATE TABLE IF NOT EXISTS public.onboarding_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  -- Status of the run.
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active','paused','completed','abandoned')),
  -- Day the tenant is currently on (1-indexed).
  current_day integer NOT NULL DEFAULT 1 CHECK (current_day BETWEEN 1 AND 30),
  -- Timestamps for the funnel analytics view.
  started_at timestamptz NOT NULL DEFAULT now(),
  paused_at timestamptz,
  resumed_at timestamptz,
  completed_at timestamptz,
  -- Day-of-program timezone — defaults to America/New_York to match
  -- Naples HQ, but tenants can override.
  timezone text NOT NULL DEFAULT 'America/New_York',
  -- Optional notes (post-run reflection, blockers, etc.).
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  -- One active/paused run per tenant. (Completed/abandoned runs can stack.)
  UNIQUE (tenant_id, status) DEFERRABLE INITIALLY DEFERRED
);

CREATE INDEX IF NOT EXISTS onboarding_runs_tenant_idx
  ON public.onboarding_runs(tenant_id, status, started_at DESC);

CREATE TABLE IF NOT EXISTS public.onboarding_step_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  run_id uuid NOT NULL REFERENCES public.onboarding_runs(id) ON DELETE CASCADE,
  -- step_key is e.g. "day-1.choose-name" or "day-22.turn-on-email" — the
  -- canonical code-side identifier from lib/playbook.ts. Free-form
  -- string here so the playbook can grow without migrations.
  step_key text NOT NULL,
  day integer NOT NULL CHECK (day BETWEEN 1 AND 30),
  completed_at timestamptz NOT NULL DEFAULT now(),
  completed_by_user_id uuid,
  notes text,
  -- The result of the step if the tenant did it via a Naples module
  -- (e.g. "scrape job created: <id>"). Helps the dashboard render
  -- "you did the thing" badges.
  artifact_summary text,
  artifact_link text,
  UNIQUE (run_id, step_key)
);

CREATE INDEX IF NOT EXISTS onboarding_step_completions_run_idx
  ON public.onboarding_step_completions(run_id, day, completed_at);
CREATE INDEX IF NOT EXISTS onboarding_step_completions_tenant_idx
  ON public.onboarding_step_completions(tenant_id, day, completed_at);

ALTER TABLE public.onboarding_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_step_completions ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS onboarding_runs_updated ON public.onboarding_runs;
CREATE TRIGGER onboarding_runs_updated
  BEFORE UPDATE ON public.onboarding_runs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
