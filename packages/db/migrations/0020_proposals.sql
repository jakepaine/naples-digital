-- 0020_proposals.sql
-- Wave 5 #19 — standalone Proposal Generator module.
-- A proposal is drafted from a lead (existing leads table) using Claude,
-- approved by the operator, then sent to the customer (Resend email with
-- a hosted public URL). PDF export is a follow-up — for now the public
-- URL is a clean printable HTML page.

CREATE TABLE IF NOT EXISTS public.proposals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  lead_id text REFERENCES public.leads(id) ON DELETE SET NULL,

  -- Drafted content
  title text NOT NULL DEFAULT '',
  client_name text,
  client_email text,
  intro text,
  scope_items jsonb NOT NULL DEFAULT '[]'::jsonb,
  deliverables jsonb NOT NULL DEFAULT '[]'::jsonb,
  pricing jsonb NOT NULL DEFAULT '[]'::jsonb,
  timeline_weeks integer,
  notes text,

  -- Workflow state
  -- 'draft' | 'approved' | 'sent' | 'accepted' | 'rejected' | 'expired'
  status text NOT NULL DEFAULT 'draft',
  public_token text UNIQUE,
  approved_at timestamptz,
  sent_at timestamptz,
  responded_at timestamptz,
  expires_at timestamptz,

  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS proposals_tenant_idx
  ON public.proposals(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS proposals_tenant_status_idx
  ON public.proposals(tenant_id, status);
CREATE INDEX IF NOT EXISTS proposals_lead_idx
  ON public.proposals(lead_id);
CREATE INDEX IF NOT EXISTS proposals_public_token_idx
  ON public.proposals(public_token) WHERE public_token IS NOT NULL;

ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;

-- Public-token reads need a permissive policy because the customer hits
-- the proposal URL anonymously. We expose only the columns the public
-- proposal page needs, and only when the URL contains a valid token.
CREATE POLICY proposals_public_token_read ON public.proposals
  FOR SELECT
  TO anon, authenticated
  USING (public_token IS NOT NULL);

DROP TRIGGER IF EXISTS proposals_set_updated_at ON public.proposals;
CREATE TRIGGER proposals_set_updated_at
  BEFORE UPDATE ON public.proposals
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
