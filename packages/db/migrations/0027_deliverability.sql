-- 0027_deliverability.sql
-- Cold Email Compliance & Deliverability — module #4 in the audit's
-- recommended order.
--
-- Two new tables:
-- 1) deliverability_audits  — DNS scorecards per (tenant, domain).
--    Records SPF/DKIM/DMARC/MX state at a point in time.
-- 2) deliverability_alerts  — bounce-rate / complaint-rate / unsubscribe-
--    rate threshold breaches surfaced to the tenant. Auto-pause flag
--    flips here when the monitor decides to halt sending.
--
-- No vault changes — Instantly + Smartlead were whitelisted earlier.

CREATE TABLE IF NOT EXISTS public.deliverability_audits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  domain text NOT NULL,
  -- DNS check results — keyed scorecard-style, raw record values stored too.
  spf_present boolean NOT NULL DEFAULT false,
  spf_record text,
  spf_includes text[],
  dkim_selectors_checked text[],
  dkim_selectors_passing text[],
  dmarc_present boolean NOT NULL DEFAULT false,
  dmarc_record text,
  dmarc_policy text,                -- none | quarantine | reject
  dmarc_pct integer,
  mx_records text[],
  list_unsubscribe_compliant boolean NOT NULL DEFAULT false,
  -- Aggregate score 0-100 derived from the booleans above. Null until
  -- the audit completes.
  score integer CHECK (score BETWEEN 0 AND 100),
  -- Risk flags surfaced to the operator. Each is a short string e.g.
  -- "no_dmarc", "dmarc_p_none", "no_dkim", "spf_softfail".
  risk_flags text[],
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS deliverability_audits_tenant_idx
  ON public.deliverability_audits(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS deliverability_audits_domain_idx
  ON public.deliverability_audits(tenant_id, domain, created_at DESC);

CREATE TABLE IF NOT EXISTS public.deliverability_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  source text NOT NULL,             -- instantly | smartlead | manual
  alert_kind text NOT NULL CHECK (alert_kind IN (
    'bounce_rate_high','complaint_rate_high','unsubscribe_rate_high',
    'open_rate_low','reply_rate_low','dns_misconfigured','warmup_incomplete'
  )),
  severity text NOT NULL CHECK (severity IN ('info','warning','critical')),
  metric_name text,                 -- e.g. "complaint_rate"
  metric_value numeric,             -- e.g. 0.0042
  threshold numeric,                -- threshold the metric exceeded
  message text NOT NULL,
  campaign_id text,
  campaign_name text,
  -- Auto-pause action (true if we paused something on the vendor side).
  paused_campaign boolean NOT NULL DEFAULT false,
  paused_at timestamptz,
  -- Slack notification status.
  slack_alerted boolean NOT NULL DEFAULT false,
  -- Operator can resolve to silence the alert.
  resolved boolean NOT NULL DEFAULT false,
  resolved_at timestamptz,
  resolved_by_user_id uuid,
  raw jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS deliverability_alerts_tenant_idx
  ON public.deliverability_alerts(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS deliverability_alerts_unresolved_idx
  ON public.deliverability_alerts(tenant_id, severity, created_at DESC)
  WHERE resolved = false;

ALTER TABLE public.deliverability_audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deliverability_alerts ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS deliverability_alerts_updated ON public.deliverability_alerts;
CREATE TRIGGER deliverability_alerts_updated
  BEFORE UPDATE ON public.deliverability_alerts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
