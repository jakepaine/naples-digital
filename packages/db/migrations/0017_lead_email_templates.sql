-- 0017_lead_email_templates.sql
-- Per-tenant email templates that fire automatically when a lead's stage
-- transitions. Trigger is app-level (CRM Pipeline's PATCH /api/leads/[id]
-- handler) — no Postgres trigger to keep transitions traceable in app logs.
--
-- A template matches if lead.stage transitions from from_stage → to_stage
-- (either side may be NULL = wildcard). enabled=false acts as a soft-delete.
--
-- Templates use {{double_brace}} variables. Available:
--   {{name}} — lead.name
--   {{email}} — lead's primary email
--   {{type}} — lead.type
--   {{goal}} — lead.goal
--   {{value}} — formatted lead.value (e.g. "$3,500")
--   {{tenant_name}} — display name of tenant

CREATE TABLE IF NOT EXISTS public.lead_email_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  -- NULL = wildcard. Match if lead.stage transitions from from_stage to to_stage.
  from_stage text,
  to_stage text NOT NULL,
  subject text NOT NULL,
  body_template text NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  fire_count integer NOT NULL DEFAULT 0,
  last_fired_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS lead_email_templates_match_idx
  ON public.lead_email_templates(tenant_id, to_stage)
  WHERE enabled = true;

ALTER TABLE public.lead_email_templates ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS lead_email_templates_set_updated_at
  ON public.lead_email_templates;
CREATE TRIGGER lead_email_templates_set_updated_at
  BEFORE UPDATE ON public.lead_email_templates
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Audit trail of fired emails so we can debug + count without recomputing
-- from the leads table's stage history (which we don't keep).
CREATE TABLE IF NOT EXISTS public.lead_email_sends (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  template_id uuid REFERENCES public.lead_email_templates(id) ON DELETE SET NULL,
  lead_id text REFERENCES public.leads(id) ON DELETE SET NULL,
  to_email text NOT NULL,
  from_stage text,
  to_stage text NOT NULL,
  subject text NOT NULL,
  status text NOT NULL CHECK (status IN ('sent', 'failed', 'skipped')),
  resend_message_id text,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS lead_email_sends_tenant_idx
  ON public.lead_email_sends(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS lead_email_sends_lead_idx
  ON public.lead_email_sends(lead_id);

ALTER TABLE public.lead_email_sends ENABLE ROW LEVEL SECURITY;
