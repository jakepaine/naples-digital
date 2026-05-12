-- 0037_tenant_apify_runs.sql
-- Per-tenant attribution of Apify actor runs.
--
-- Apify's REST API does not expose a user-settable `meta` field on runs,
-- so we can't tag runs in-band. Instead, every Apify caller in the
-- platform inserts a row here immediately after launching a run,
-- capturing the run_id returned in the response (either body for async
-- runs, or X-Apify-Run-Id / Apify-Sync-Run-Id header for sync runs).
--
-- The usage adapter (@naples/usage/apify.ts) reads runs from this table
-- in the daily window, then GETs each run's metadata via
-- /v2/actor-runs/:id to capture usageTotalUsd.

CREATE TABLE IF NOT EXISTS public.tenant_apify_runs (
  apify_run_id text PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  actor_id text NOT NULL,
  -- Free-form caller-supplied tag — e.g. "lead-scraper",
  -- "ig-reels-research" — surfaced in the dashboard breakdown to
  -- explain which module drove the cost.
  source_app text,
  -- When the run started, as captured at insert time. Apify reports the
  -- authoritative startedAt on the run itself; this is just the
  -- client-side timestamp for window filtering before the auth fetch.
  started_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS tenant_apify_runs_tenant_started_idx
  ON public.tenant_apify_runs(tenant_id, started_at DESC);

ALTER TABLE public.tenant_apify_runs ENABLE ROW LEVEL SECURITY;
