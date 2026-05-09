-- 0013_lead_won_invoice_module.sql
-- Wires the Lead-Won → Invoice module to the existing leads + invoices tables.
-- Adds columns to invoices for the AI-drafted Stripe Invoice flow,
-- plus a client_onboarding_tasks table that fires post-payment.
--
-- Module: lead-won-invoice (apps/lead-won-invoice/)
-- Trigger: leads.stage flips to 'won'
-- Output: AI drafts invoice → human approves → finalize via tenant Stripe →
--         email customer → on payment_intent.succeeded webhook, kick off
--         client_onboarding_tasks rows.

-- ─────────────────────────────────────────────────────────────────────────
-- invoices: extend for AI-drafted flow + Stripe Invoice (not just PI)
-- ─────────────────────────────────────────────────────────────────────────
ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS lead_id text REFERENCES public.leads(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS stripe_invoice_id text,
  ADD COLUMN IF NOT EXISTS stripe_invoice_url text,
  ADD COLUMN IF NOT EXISTS stripe_hosted_invoice_url text,
  ADD COLUMN IF NOT EXISTS auto_generated boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS approval_status text NOT NULL DEFAULT 'draft'
    CHECK (approval_status IN ('draft', 'approved', 'rejected', 'sent', 'paid', 'voided')),
  ADD COLUMN IF NOT EXISTS approved_at timestamptz,
  ADD COLUMN IF NOT EXISTS approved_by uuid,
  ADD COLUMN IF NOT EXISTS sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS webhook_event_log jsonb NOT NULL DEFAULT '[]'::jsonb;

CREATE UNIQUE INDEX IF NOT EXISTS invoices_stripe_invoice_id_uq
  ON public.invoices(stripe_invoice_id) WHERE stripe_invoice_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS invoices_lead_id_idx ON public.invoices(lead_id);
CREATE INDEX IF NOT EXISTS invoices_tenant_status_idx ON public.invoices(tenant_id, approval_status);

-- ─────────────────────────────────────────────────────────────────────────
-- client_onboarding_tasks: kicked off after Stripe webhook confirms payment
-- ─────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.client_onboarding_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  lead_id text REFERENCES public.leads(id) ON DELETE SET NULL,
  invoice_id text REFERENCES public.invoices(id) ON DELETE SET NULL,
  task_name text NOT NULL,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'in_progress', 'completed', 'skipped')),
  assignee_email text,
  due_at timestamptz,
  completed_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS cot_tenant_status_idx
  ON public.client_onboarding_tasks(tenant_id, status);
CREATE INDEX IF NOT EXISTS cot_lead_idx
  ON public.client_onboarding_tasks(lead_id);

-- RLS: enable but no policies — service-role only (matches the existing
-- pattern from the 2026-05-05 architectural decision). Authenticated/anon
-- get nothing by default.
ALTER TABLE public.client_onboarding_tasks ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────────────────────────────────
-- Generic updated_at trigger — first introduction in this codebase.
-- Idempotent via OR REPLACE so future migrations can reuse it.
-- ─────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS cot_set_updated_at ON public.client_onboarding_tasks;
CREATE TRIGGER cot_set_updated_at
  BEFORE UPDATE ON public.client_onboarding_tasks
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
