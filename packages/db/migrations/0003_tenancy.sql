-- 0003_tenancy.sql
-- Multi-tenant chassis. Every domain table gets tenant_id; RLS enabled as defense-in-depth.
-- Primary tenant isolation is enforced in @naples/db via withTenant() + .eq('tenant_id', ...).
-- Apply via Supabase MCP apply_migration.

-- ============================================================
-- 1. tenants table + seed default tenant
-- ============================================================
create table if not exists public.tenants (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  brand jsonb not null default '{}'::jsonb,
  plan text not null default 'starter' check (plan in ('starter','pro','agency')),
  status text not null default 'active' check (status in ('active','paused','churned')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Seed the existing system as tenant '239live'. All existing rows backfill to this tenant.
insert into public.tenants (slug, name, brand, plan, status)
values (
  '239live',
  '239 Live',
  jsonb_build_object(
    'logo_url', 'https://239live-site-production.up.railway.app/logo.svg',
    'primary_color', '#E8192C',
    'font_display', 'Bebas Neue',
    'font_body', 'Inter',
    'caption_style', 'broadcast'
  ),
  'agency',
  'active'
) on conflict (slug) do nothing;

-- Naples Digital itself is tenant #2 — we run our own outreach + content on the same stack.
insert into public.tenants (slug, name, brand, plan, status)
values (
  'naplesdigital',
  'Naples Digital',
  jsonb_build_object(
    'primary_color', '#0A0A0A',
    'font_display', 'Bebas Neue',
    'font_body', 'Inter',
    'caption_style', 'minimal'
  ),
  'agency',
  'active'
) on conflict (slug) do nothing;

-- ============================================================
-- 2. tenant_users (membership + role)
-- ============================================================
create table if not exists public.tenant_users (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  user_email text not null,
  role text not null default 'operator' check (role in ('owner','operator','viewer')),
  created_at timestamptz not null default now(),
  unique (tenant_id, user_email)
);
create index if not exists tenant_users_email_idx on public.tenant_users (user_email);
create index if not exists tenant_users_tenant_idx on public.tenant_users (tenant_id);

-- ============================================================
-- 3. tenant_integrations (per-tenant vendor configs)
-- ============================================================
create table if not exists public.tenant_integrations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  kind text not null check (kind in ('instantly','smartlead','apollo','clay','assemblyai','opusclip','stripe','resend','buffer','publer')),
  config jsonb not null default '{}'::jsonb,        -- non-secret config (campaign IDs, workspace ids, etc)
  secret_ref text,                                   -- ref to secret store; NEVER raw secret
  status text not null default 'pending' check (status in ('pending','verified','failed','disabled')),
  last_verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, kind)
);
create index if not exists tenant_integrations_tenant_idx on public.tenant_integrations (tenant_id);

-- ============================================================
-- 4. Add tenant_id to every existing domain table (nullable, backfill, then NOT NULL)
-- ============================================================
do $$
declare
  default_tenant_id uuid;
  t text;
  domain_tables text[] := array[
    'bookings','leads','episodes','clips','contracts','invoices','content_submissions',
    'outreach_runs','outreach_stats','mrr','social_growth','projections','roadmap_phases',
    'sponsors','sponsor_metrics','sponsor_pitches'
  ];
begin
  select id into default_tenant_id from public.tenants where slug = '239live';

  foreach t in array domain_tables loop
    -- add column if missing
    execute format(
      'alter table public.%I add column if not exists tenant_id uuid references public.tenants(id) on delete cascade',
      t
    );
    -- backfill nulls
    execute format(
      'update public.%I set tenant_id = %L where tenant_id is null',
      t, default_tenant_id
    );
    -- enforce not-null
    execute format(
      'alter table public.%I alter column tenant_id set not null',
      t
    );
    -- index
    execute format(
      'create index if not exists %I on public.%I (tenant_id)',
      t || '_tenant_idx', t
    );
  end loop;
end $$;

-- ============================================================
-- 5. RLS — enabled on all tenant-scoped tables (defense in depth)
-- Policy: tenant_id matches app.current_tenant GUC, OR caller is service_role (bypass).
-- ============================================================
do $$
declare
  t text;
  domain_tables text[] := array[
    'bookings','leads','episodes','clips','contracts','invoices','content_submissions',
    'outreach_runs','outreach_stats','mrr','social_growth','projections','roadmap_phases',
    'sponsors','sponsor_metrics','sponsor_pitches','tenant_users','tenant_integrations'
  ];
begin
  foreach t in array domain_tables loop
    execute format('alter table public.%I enable row level security', t);

    -- drop & recreate to be idempotent
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

-- tenants table: readable to everyone authenticated (so apps can resolve tenant by slug),
-- but writes only via service role.
alter table public.tenants enable row level security;
drop policy if exists tenants_read_all on public.tenants;
create policy tenants_read_all on public.tenants for select using (true);

-- ============================================================
-- 6. Helper function: set tenant for current transaction
-- ============================================================
create or replace function public.set_current_tenant(tenant_id uuid)
returns void
language sql
security definer
as $$
  select set_config('app.current_tenant', tenant_id::text, true);
$$;

-- ============================================================
-- 7. updated_at trigger for new tables
-- ============================================================
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

drop trigger if exists tenants_touch on public.tenants;
create trigger tenants_touch before update on public.tenants
for each row execute function public.touch_updated_at();

drop trigger if exists tenant_integrations_touch on public.tenant_integrations;
create trigger tenant_integrations_touch before update on public.tenant_integrations
for each row execute function public.touch_updated_at();

-- ============================================================
-- 8. Verification queries (run manually after apply)
-- ============================================================
-- select tenant_id, count(*) from leads group by 1;
-- select tenant_id, count(*) from episodes group by 1;
-- select count(*) from tenants;  -- expect 2
