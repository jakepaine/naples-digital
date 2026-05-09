-- 0019_email_auto_reply_templates.sql
-- Per-category auto-reply templates for the Email Triage module.
-- When an email is classified, matching enabled templates fire via Resend
-- (per-tenant Resend key with platform fallback, same as 0017's stage-change
-- emails). Idempotent — emails.auto_replied=true gates re-firing.

CREATE TABLE IF NOT EXISTS public.email_auto_reply_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  -- Match category from emails.category
  category text NOT NULL,
  subject text NOT NULL,
  body_template text NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  fire_count integer NOT NULL DEFAULT 0,
  last_fired_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS email_auto_reply_match_idx
  ON public.email_auto_reply_templates(tenant_id, category)
  WHERE enabled = true;

ALTER TABLE public.email_auto_reply_templates ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS email_auto_reply_set_updated_at
  ON public.email_auto_reply_templates;
CREATE TRIGGER email_auto_reply_set_updated_at
  BEFORE UPDATE ON public.email_auto_reply_templates
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
