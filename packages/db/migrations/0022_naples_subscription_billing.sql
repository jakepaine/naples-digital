-- 0022_naples_subscription_billing.sql
-- Naples Digital's own subscription billing — extends tenants with Stripe
-- customer / subscription pointers + billing_email so the agency-site
-- Checkout flow can attach Stripe to the right tenant row.
--
-- This is *separate* from the lead-won-invoice module's per-tenant Stripe
-- (which is each tenant billing THEIR customers). This is Naples (your
-- LLC) billing tenants on YOUR Stripe account.

ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS billing_email text,
  ADD COLUMN IF NOT EXISTS stripe_customer_id text,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id text,
  ADD COLUMN IF NOT EXISTS stripe_price_id text,
  ADD COLUMN IF NOT EXISTS billing_status text NOT NULL DEFAULT 'unbilled'
    CHECK (billing_status IN (
      'unbilled', 'trialing', 'active', 'past_due',
      'canceled', 'incomplete', 'incomplete_expired', 'unpaid'
    )),
  ADD COLUMN IF NOT EXISTS current_period_end timestamptz,
  ADD COLUMN IF NOT EXISTS cancel_at_period_end boolean NOT NULL DEFAULT false;

CREATE UNIQUE INDEX IF NOT EXISTS tenants_stripe_customer_uq
  ON public.tenants(stripe_customer_id)
  WHERE stripe_customer_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS tenants_stripe_subscription_uq
  ON public.tenants(stripe_subscription_id)
  WHERE stripe_subscription_id IS NOT NULL;

-- Audit trail of subscription lifecycle events from Stripe.
CREATE TABLE IF NOT EXISTS public.naples_billing_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES public.tenants(id) ON DELETE SET NULL,
  stripe_event_id text NOT NULL UNIQUE,
  stripe_event_type text NOT NULL,
  stripe_customer_id text,
  stripe_subscription_id text,
  amount_cents integer,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS naples_billing_events_tenant_idx
  ON public.naples_billing_events(tenant_id, created_at DESC);

ALTER TABLE public.naples_billing_events ENABLE ROW LEVEL SECURITY;
