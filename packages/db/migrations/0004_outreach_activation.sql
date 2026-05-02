-- 0004_outreach_activation.sql
-- Track A: real cold email outreach. We wrap Instantly/Smartlead per tenant —
-- the CRM remains source-of-truth for leads, the vendor handles SMTP.

-- 1. lead_emails — a lead can have multiple email addresses
create table if not exists public.lead_emails (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  lead_id text not null references public.leads(id) on delete cascade,
  email text not null,
  primary_address boolean not null default false,
  created_at timestamptz not null default now(),
  unique (tenant_id, email)
);
create index if not exists lead_emails_tenant_idx on public.lead_emails (tenant_id);
create index if not exists lead_emails_lead_idx on public.lead_emails (lead_id);

-- 2. outreach_sequences — a sequence is a frozen template + lead + state machine
create table if not exists public.outreach_sequences (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  lead_id text not null references public.leads(id) on delete cascade,
  external_id text,                                          -- Instantly/Smartlead lead+campaign id
  vendor text not null check (vendor in ('instantly','smartlead','manual')),
  state text not null default 'draft' check (state in ('draft','pushed','active','paused','completed','replied','bounced','failed')),
  emails jsonb not null default '[]'::jsonb,                  -- frozen at push: [{step,subject,body},...]
  config jsonb not null default '{}'::jsonb,                  -- vendor-specific: campaign_id, etc.
  pushed_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists outreach_sequences_tenant_idx on public.outreach_sequences (tenant_id);
create index if not exists outreach_sequences_lead_idx on public.outreach_sequences (lead_id);
create index if not exists outreach_sequences_state_idx on public.outreach_sequences (tenant_id, state);

-- 3. email_sends — one row per attempted send
create table if not exists public.email_sends (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  sequence_id uuid not null references public.outreach_sequences(id) on delete cascade,
  lead_id text not null references public.leads(id) on delete cascade,
  lead_email text not null,
  step int not null,                                          -- 1, 2, 3, ...
  scheduled_for timestamptz,
  external_id text,                                           -- vendor send id (for webhook lookup)
  vendor_status text,                                         -- raw status from vendor webhook
  sent_at timestamptz,
  opened_at timestamptz,
  clicked_at timestamptz,
  bounced_at timestamptz,
  replied_at timestamptz,
  reply_body text,
  created_at timestamptz not null default now()
);
create index if not exists email_sends_tenant_idx on public.email_sends (tenant_id);
create index if not exists email_sends_sequence_idx on public.email_sends (sequence_id);
create index if not exists email_sends_external_idx on public.email_sends (external_id);
create index if not exists email_sends_due_idx on public.email_sends (tenant_id, scheduled_for) where sent_at is null;

-- 4. lead_enrichment — cache Apollo/Clay/Hunter results to avoid re-billing
create table if not exists public.lead_enrichment (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  lead_id text not null references public.leads(id) on delete cascade,
  source text not null check (source in ('apollo','clay','hunter','manual')),
  raw jsonb not null default '{}'::jsonb,
  fetched_at timestamptz not null default now(),
  unique (lead_id, source)
);
create index if not exists lead_enrichment_tenant_idx on public.lead_enrichment (tenant_id);
create index if not exists lead_enrichment_lead_idx on public.lead_enrichment (lead_id);

-- 5. add columns on leads for primary email + enrichment state
alter table public.leads add column if not exists primary_email text;
alter table public.leads add column if not exists domain text;
alter table public.leads add column if not exists enrichment_status text not null default 'none' check (enrichment_status in ('none','pending','enriched','failed'));

-- 6. RLS — defense in depth (primary isolation is via @naples/db chokepoint)
do $$
declare
  t text;
  outreach_tables text[] := array[
    'lead_emails','outreach_sequences','email_sends','lead_enrichment'
  ];
begin
  foreach t in array outreach_tables loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists tenant_isolation on public.%I', t);
    execute format($f$
      create policy tenant_isolation on public.%I
      using (
        tenant_id::text = current_setting('app.current_tenant', true)
        or current_setting('app.current_tenant', true) is null
        or current_setting('app.current_tenant', true) = ''
      )
      with check (
        tenant_id::text = current_setting('app.current_tenant', true)
        or current_setting('app.current_tenant', true) is null
        or current_setting('app.current_tenant', true) = ''
      )
    $f$, t);
  end loop;
end $$;

-- 7. updated_at trigger
drop trigger if exists outreach_sequences_touch on public.outreach_sequences;
create trigger outreach_sequences_touch before update on public.outreach_sequences
for each row execute function public.touch_updated_at();
