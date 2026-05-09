-- 0014_email_triage_module.sql
-- Wires the Email Triage module to per-tenant Gmail (or any other inbox source).
-- An ingested email gets stored here, classified by Claude, optionally auto-
-- replied, and labeled in the source inbox.
--
-- Module: email-triage (apps/email-triage/)
-- Trigger: poll Gmail every N minutes (or webhook later) → classify new mail
-- Output: row in `emails` per message + audit row in `email_classifications`
--         per (re)classification. Slack alert when category=high_priority.

-- ─────────────────────────────────────────────────────────────────────────
-- emails: one row per inbound message we've seen
-- ─────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.emails (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,

  -- Source identifiers ('gmail' for now; 'outlook' / 'imap' later)
  source text NOT NULL DEFAULT 'gmail',
  source_message_id text,
  source_thread_id text,

  -- Headers
  from_email text NOT NULL,
  from_name text,
  to_email text,
  subject text NOT NULL DEFAULT '',
  received_at timestamptz NOT NULL,

  -- Body (preview = truncated; body_text = full plaintext)
  preview text,
  body_text text,
  body_html text,

  -- Triage state — set after Claude classification
  category text,
  score integer,
  reason text,
  classified_at timestamptz,

  -- Auto-action state
  auto_replied boolean NOT NULL DEFAULT false,
  auto_reply_text text,
  slack_notified boolean NOT NULL DEFAULT false,
  archived boolean NOT NULL DEFAULT false,
  archived_at timestamptz,

  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  -- Idempotency: don't double-ingest the same Gmail message for a tenant
  UNIQUE (tenant_id, source, source_message_id)
);

CREATE INDEX IF NOT EXISTS emails_tenant_received_idx
  ON public.emails(tenant_id, received_at DESC);
CREATE INDEX IF NOT EXISTS emails_tenant_category_idx
  ON public.emails(tenant_id, category);
CREATE INDEX IF NOT EXISTS emails_tenant_unprocessed_idx
  ON public.emails(tenant_id) WHERE category IS NULL;

-- ─────────────────────────────────────────────────────────────────────────
-- email_classifications: audit trail of every (re)classification
-- Useful when manual-override UI lands — keep history of AI vs human label.
-- ─────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.email_classifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email_id uuid NOT NULL REFERENCES public.emails(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  category text NOT NULL,
  score integer,
  reason text,
  source text NOT NULL CHECK (source IN ('ai', 'manual')),
  actor uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS email_classifications_email_idx
  ON public.email_classifications(email_id, created_at DESC);

ALTER TABLE public.emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_classifications ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS emails_set_updated_at ON public.emails;
CREATE TRIGGER emails_set_updated_at
  BEFORE UPDATE ON public.emails
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
