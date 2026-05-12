-- 0036_tenant_usage_snapshots.sql
-- Per-tenant per-vendor usage + spend tracking for hybrid centralized billing.
--
-- Naples runs metered vendor accounts (Anthropic, Apify, AssemblyAI, Resend)
-- on behalf of tenants. Daily cron pulls usage per vendor per tenant and
-- writes snapshots here. Dashboard reads these rows to show per-tenant
-- spend; Stripe metered billing reads them to push usage records monthly.
--
-- One row per (tenant, vendor, period_start). Period is normally a single
-- day in UTC but the schema doesn't enforce that — leaves room for hourly
-- or monthly snapshots if a vendor only exposes coarser granularity.
--
-- raw_payload preserves the original vendor response so cost computation
-- can be re-run if rates change without re-querying the vendor.

CREATE TABLE IF NOT EXISTS public.tenant_usage_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  -- Vendor identifier — one of: 'anthropic', 'apify', 'assemblyai',
  -- 'resend'. Free text rather than enum so new vendors don't require
  -- a migration.
  vendor text NOT NULL,
  -- Inclusive start of the snapshot window in UTC. Day boundary by default.
  period_start timestamptz NOT NULL,
  -- Exclusive end of the snapshot window. period_end - period_start is
  -- typically 24h.
  period_end timestamptz NOT NULL,
  -- Raw unit count (e.g. 1_200_000 tokens, 340 compute units, 180 minutes).
  units numeric(20, 6) NOT NULL DEFAULT 0,
  -- Human label for the unit (e.g. 'tokens', 'compute_units', 'minutes',
  -- 'emails').
  unit_label text NOT NULL,
  -- Computed cost in USD at the rate effective during the period.
  cost_usd numeric(12, 4) NOT NULL DEFAULT 0,
  -- Original vendor API response — kept for audit + recompute.
  raw_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  fetched_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, vendor, period_start)
);

CREATE INDEX IF NOT EXISTS tenant_usage_snapshots_tenant_idx
  ON public.tenant_usage_snapshots(tenant_id, vendor, period_start DESC);
CREATE INDEX IF NOT EXISTS tenant_usage_snapshots_period_idx
  ON public.tenant_usage_snapshots(period_start DESC, vendor);

ALTER TABLE public.tenant_usage_snapshots ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS tenant_usage_snapshots_updated ON public.tenant_usage_snapshots;
CREATE TRIGGER tenant_usage_snapshots_updated
  BEFORE UPDATE ON public.tenant_usage_snapshots
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Upsert RPC for the daily sync cron. Service-role only.
CREATE OR REPLACE FUNCTION public.upsert_tenant_usage_snapshot(
  p_tenant_id uuid,
  p_vendor text,
  p_period_start timestamptz,
  p_period_end timestamptz,
  p_units numeric,
  p_unit_label text,
  p_cost_usd numeric,
  p_raw_payload jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
BEGIN
  INSERT INTO public.tenant_usage_snapshots (
    tenant_id, vendor, period_start, period_end,
    units, unit_label, cost_usd, raw_payload, fetched_at
  ) VALUES (
    p_tenant_id, p_vendor, p_period_start, p_period_end,
    p_units, p_unit_label, p_cost_usd, p_raw_payload, now()
  )
  ON CONFLICT (tenant_id, vendor, period_start) DO UPDATE
    SET period_end = EXCLUDED.period_end,
        units = EXCLUDED.units,
        unit_label = EXCLUDED.unit_label,
        cost_usd = EXCLUDED.cost_usd,
        raw_payload = EXCLUDED.raw_payload,
        fetched_at = now()
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

-- Per-tenant monthly spend cap (defensive circuit breaker). 0 = unlimited.
-- High-cost API call sites check current-month sum(cost_usd) against this
-- before firing the request.
ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS monthly_spend_cap_usd numeric(10, 2) NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.tenants.monthly_spend_cap_usd IS
  'Defensive monthly spend cap across all metered vendors in USD. 0 = unlimited. Enforced in app code at API call sites.';
