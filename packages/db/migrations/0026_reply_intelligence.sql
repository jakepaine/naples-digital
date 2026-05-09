-- 0026_reply_intelligence.sql
-- Reply Intelligence — wires Instantly cold-email reply webhooks into
-- existing modules.
--
-- Single new table: cold_email_replies (audit trail of every reply
-- the platform processed, with classified intent + the downstream
-- actions we triggered). Lives in email-triage's app footprint but is
-- a peer to `emails` rather than a column on it because reply lifecycles
-- are different (replies belong to a sequence/campaign, not just an
-- inbox).
--
-- No vault whitelist changes — Instantly was added in earlier migrations.

CREATE TABLE IF NOT EXISTS public.cold_email_replies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  -- Source platform (instantly | smartlead | other) — only instantly today,
  -- but the table is shared because reply intent is platform-agnostic.
  source text NOT NULL DEFAULT 'instantly',
  -- Source-side identifier so reprocessing a webhook is idempotent.
  source_event_id text,
  campaign_id text,
  campaign_name text,
  lead_email text,
  lead_name text,
  reply_subject text,
  reply_body text,
  -- Classified intent.
  intent text NOT NULL CHECK (intent IN (
    'interested','more_info','not_interested','ooo','bounce','unsubscribe','unknown'
  )),
  intent_confidence integer CHECK (intent_confidence BETWEEN 0 AND 100),
  intent_reason text,
  -- Outcomes the handler triggered.
  slack_alerted boolean NOT NULL DEFAULT false,
  crm_stage_advanced boolean NOT NULL DEFAULT false,
  crm_lead_id uuid,
  crm_from_stage text,
  crm_to_stage text,
  -- Sequence-side cleanup — removed from campaign / unsubscribed.
  removed_from_campaign boolean NOT NULL DEFAULT false,
  removed_from_campaign_at timestamptz,
  -- Raw webhook payload for re-processing if classification logic changes.
  raw jsonb NOT NULL DEFAULT '{}'::jsonb,
  received_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, source, source_event_id)
);

CREATE INDEX IF NOT EXISTS cold_email_replies_tenant_idx
  ON public.cold_email_replies(tenant_id, received_at DESC);
CREATE INDEX IF NOT EXISTS cold_email_replies_intent_idx
  ON public.cold_email_replies(tenant_id, intent, received_at DESC);
CREATE INDEX IF NOT EXISTS cold_email_replies_lead_email_idx
  ON public.cold_email_replies(tenant_id, lower(lead_email))
  WHERE lead_email IS NOT NULL;

ALTER TABLE public.cold_email_replies ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS cold_email_replies_updated ON public.cold_email_replies;
CREATE TRIGGER cold_email_replies_updated
  BEFORE UPDATE ON public.cold_email_replies
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
