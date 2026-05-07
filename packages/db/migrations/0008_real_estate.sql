-- 0008_real_estate.sql
-- Real-estate / multifamily acquisition tooling. First consumer: MIA tenant
-- (real estate coaching + multifamily acquisition fund, DFW + Houston, 32+
-- unit deals). Tables are tenant-scoped so a future RE-shaped tenant shares
-- the schema; MIA-specific data isolated by tenant_id.
--
-- Naming: 're_' prefix because (a) tables like 'deals' are too generic,
-- (b) we may add other domains later (e2e tests, e-comm, etc.) and want
-- the namespace to stay clean.

-- ============================================================
-- 1. Extend allowed integration vendor kinds
-- ============================================================
-- Add 'apify' (actor runner — talks to LoopNet/Crexi/etc.) and
-- 'batchskiptracing' (owner contact lookups) to both the table CHECK
-- constraint and the set_tenant_secret validation.

alter table public.tenant_integrations drop constraint if exists tenant_integrations_kind_check;
alter table public.tenant_integrations add constraint tenant_integrations_kind_check
  check (kind in (
    'instantly','smartlead','apollo','clay','assemblyai','opusclip','stripe',
    'resend','buffer','publer','klaviyo','meta','ghl',
    'apify','batchskiptracing','postmark'
  ));

-- Replace set_tenant_secret with the extended kind list.
create or replace function public.set_tenant_secret(
  p_tenant_id uuid,
  p_kind text,
  p_secret text,
  p_config jsonb default '{}'::jsonb
)
returns table (
  out_id uuid,
  out_tenant_id uuid,
  out_kind text,
  out_status text,
  out_last_verified_at timestamptz
)
language plpgsql
security definer
set search_path = public, vault, pg_temp
as $$
declare
  v_secret_name text := 'tenant_' || p_tenant_id::text || '_' || p_kind;
  v_secret_id uuid;
  v_existing uuid;
begin
  if not exists (select 1 from public.tenants t where t.id = p_tenant_id) then
    raise exception 'tenant % not found', p_tenant_id;
  end if;

  if p_kind not in (
    'instantly','smartlead','apollo','clay','assemblyai','opusclip','stripe',
    'resend','buffer','publer','klaviyo','meta','ghl',
    'apify','batchskiptracing','postmark'
  ) then
    raise exception 'kind % not in allowed vendors', p_kind;
  end if;

  select s.id into v_existing from vault.secrets s where s.name = v_secret_name;

  if v_existing is null then
    v_secret_id := vault.create_secret(p_secret, v_secret_name, 'tenant integration secret');
  else
    perform vault.update_secret(v_existing, p_secret, v_secret_name, 'tenant integration secret');
    v_secret_id := v_existing;
  end if;

  insert into public.tenant_integrations (tenant_id, kind, config, secret_ref, status, last_verified_at)
  values (p_tenant_id, p_kind, p_config, v_secret_id::text, 'verified', now())
  on conflict (tenant_id, kind) do update
    set config = excluded.config,
        secret_ref = excluded.secret_ref,
        status = 'verified',
        last_verified_at = now(),
        updated_at = now();

  return query
    select ti.id, ti.tenant_id, ti.kind, ti.status, ti.last_verified_at
    from public.tenant_integrations ti
    where ti.tenant_id = p_tenant_id and ti.kind = p_kind;
end;
$$;
revoke all on function public.set_tenant_secret from public;
grant execute on function public.set_tenant_secret to service_role;

-- ============================================================
-- 2. re_deals — on-market listings (LoopNet, Crexi, broker emails, manual)
-- ============================================================
create table if not exists public.re_deals (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  source text not null check (source in ('loopnet','crexi','broker_email','manual')),
  source_url text,
  source_listing_id text,
  title text,
  address text,
  city text,
  state text,
  zip text,
  units int,
  year_built int,
  asking_price numeric,
  price_per_unit numeric generated always as
    (case when units > 0 then asking_price / units else null end) stored,
  noi_advertised numeric,
  cap_rate_advertised numeric,
  broker_name text,
  broker_company text,
  broker_email text,
  broker_phone text,
  raw jsonb,
  status text not null default 'new' check (status in ('new','qualified','passed','under_review','dead')),
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists re_deals_tenant_source_listing_unique
  on public.re_deals (tenant_id, source, source_listing_id)
  where source_listing_id is not null;
create index if not exists re_deals_tenant_idx on public.re_deals (tenant_id);
create index if not exists re_deals_status_idx on public.re_deals (tenant_id, status);
create index if not exists re_deals_market_idx on public.re_deals (tenant_id, state, city);

-- ============================================================
-- 3. re_underwrites — auto-underwriting outputs per deal
-- ============================================================
create table if not exists public.re_underwrites (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  deal_id uuid not null references public.re_deals(id) on delete cascade,
  model_version text not null,
  inputs jsonb not null default '{}'::jsonb,
  cap_rate_actual numeric,
  noi_estimated numeric,
  dscr_at_market numeric,
  value_add_upside numeric,
  target_irr numeric,
  qualifying boolean not null default false,
  summary text,
  score numeric,
  created_at timestamptz not null default now()
);
create index if not exists re_underwrites_tenant_idx on public.re_underwrites (tenant_id);
create index if not exists re_underwrites_deal_idx on public.re_underwrites (deal_id, created_at desc);
create index if not exists re_underwrites_qualifying_idx on public.re_underwrites (tenant_id, qualifying, score desc);

-- ============================================================
-- 4. re_off_market_targets — county appraisal district owner records
-- ============================================================
create table if not exists public.re_off_market_targets (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  county text not null,
  account_number text not null,
  address text,
  city text,
  state text,
  zip text,
  owner_name text,
  owner_address text,
  units int,
  year_built int,
  last_sale_date date,
  last_sale_price numeric,
  owned_for_years numeric,
  raw jsonb,
  bookmarked boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists re_off_market_targets_unique
  on public.re_off_market_targets (tenant_id, county, account_number);
create index if not exists re_off_market_tenant_idx on public.re_off_market_targets (tenant_id);
create index if not exists re_off_market_owned_idx on public.re_off_market_targets (tenant_id, owned_for_years desc);
create index if not exists re_off_market_units_idx on public.re_off_market_targets (tenant_id, units);

-- ============================================================
-- 5. re_skiptraces — owner contact lookups
-- ============================================================
create table if not exists public.re_skiptraces (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  target_id uuid references public.re_off_market_targets(id) on delete cascade,
  provider text not null,
  llc_unwound_to text,
  phones text[] not null default array[]::text[],
  emails text[] not null default array[]::text[],
  raw jsonb,
  cost_cents int,
  created_at timestamptz not null default now()
);
create index if not exists re_skiptraces_tenant_idx on public.re_skiptraces (tenant_id);
create index if not exists re_skiptraces_target_idx on public.re_skiptraces (target_id);

-- ============================================================
-- 6. re_students — coaching program enrollment
-- ============================================================
create table if not exists public.re_students (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  email text,
  phone text,
  enrolled_at date,
  status text not null default 'active' check (status in ('active','paused','graduated','dropped')),
  target_market text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists re_students_tenant_idx on public.re_students (tenant_id);

-- ============================================================
-- 7. re_student_deals — students' LOIs and underwriting practice
-- ============================================================
create table if not exists public.re_student_deals (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  student_id uuid not null references public.re_students(id) on delete cascade,
  address text,
  units int,
  asking_price numeric,
  offer_price numeric,
  status text not null default 'practice' check (status in ('practice','loi_sent','under_contract','closed','passed')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists re_student_deals_tenant_idx on public.re_student_deals (tenant_id);
create index if not exists re_student_deals_student_idx on public.re_student_deals (student_id);

-- ============================================================
-- 8. re_submarkets — cached submarket intelligence
-- ============================================================
create table if not exists public.re_submarkets (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  city text,
  state text,
  avg_rent_per_unit numeric,
  avg_occupancy numeric,
  recent_sales_count int,
  avg_cap_rate numeric,
  new_supply_units int,
  demographics jsonb,
  last_refreshed_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists re_submarkets_tenant_idx on public.re_submarkets (tenant_id);

-- ============================================================
-- 9. re_investors — LP / capital partner records
-- ============================================================
create table if not exists public.re_investors (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  entity_name text,
  email text,
  phone text,
  accredited boolean,
  target_check_size_min numeric,
  target_check_size_max numeric,
  preferred_geographies text[] not null default array[]::text[],
  preferred_asset_classes text[] not null default array[]::text[],
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists re_investors_tenant_idx on public.re_investors (tenant_id);

-- ============================================================
-- 10. re_broker_emails — forwarded broker email blast parses
-- ============================================================
create table if not exists public.re_broker_emails (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  received_at timestamptz not null default now(),
  from_email text,
  subject text,
  body_text text,
  parsed jsonb,
  linked_deal_id uuid references public.re_deals(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists re_broker_emails_tenant_idx on public.re_broker_emails (tenant_id);
create index if not exists re_broker_emails_received_idx on public.re_broker_emails (tenant_id, received_at desc);

-- ============================================================
-- 11. re_deal_criteria — per-tenant underwriting filter rules
-- One row per tenant. Schemaless JSON so we can evolve without migrations.
-- ============================================================
create table if not exists public.re_deal_criteria (
  tenant_id uuid primary key references public.tenants(id) on delete cascade,
  criteria jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- Seed MIA's Dallas criteria (Houston + Fort Worth to be added once Jake provides).
-- Markets array structure: {metro, states, cities, units_min, units_max, vintage_min_year,
-- asset_classes, max_deal_size_usd}
insert into public.re_deal_criteria (tenant_id, criteria)
select
  t.id,
  jsonb_build_object(
    'markets', jsonb_build_array(
      jsonb_build_object(
        'metro', 'Dallas-Fort Worth',
        'states', jsonb_build_array('TX'),
        'cities', jsonb_build_array(
          'Dallas','Plano','Frisco','McKinney','Allen','Richardson','Garland',
          'Mesquite','Irving','Arlington','Fort Worth','Grand Prairie','Carrollton',
          'Lewisville','Flower Mound','Coppell','Addison','Farmers Branch'
        ),
        'units_min', 50,
        'units_max', 350,
        'vintage_min_year', 1980,
        'asset_classes', jsonb_build_array('A','B'),
        'max_deal_size_usd', 50000000
      ),
      jsonb_build_object(
        'metro', 'Houston',
        'states', jsonb_build_array('TX'),
        'cities', jsonb_build_array(
          'Houston','Sugar Land','Pearland','Katy','Cypress','Spring','The Woodlands',
          'Tomball','Conroe','Humble','Kingwood','Pasadena','Friendswood','League City'
        ),
        'units_min', 50,
        'units_max', 350,
        'vintage_min_year', 1980,
        'asset_classes', jsonb_build_array('A','B'),
        'max_deal_size_usd', 50000000
      )
    ),
    'target_cap_rate_min', 5.5,
    'max_ltv', 0.75,
    'hold_period_years', 5,
    'value_add_appetite', true,
    'notes', 'Seeded 2026-05-06 from Jake (Dallas confirmed; Houston applied same numbers — confirm with MIA).'
  )
from public.tenants t where t.slug = 'mia'
on conflict (tenant_id) do nothing;

-- ============================================================
-- 12. RLS — same chassis as the rest of the platform
-- ============================================================
do $$
declare
  t text;
  re_tables text[] := array[
    're_deals','re_underwrites','re_off_market_targets','re_skiptraces',
    're_students','re_student_deals','re_submarkets','re_investors',
    're_broker_emails','re_deal_criteria'
  ];
begin
  foreach t in array re_tables loop
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

-- ============================================================
-- 12. updated_at triggers for re_deals + re_off_market_targets + re_students + re_student_deals + re_investors
-- ============================================================
do $$
declare
  t text;
  trig_tables text[] := array['re_deals','re_off_market_targets','re_students','re_student_deals','re_investors'];
begin
  foreach t in array trig_tables loop
    execute format('drop trigger if exists %I_touch on public.%I', t, t);
    execute format('create trigger %I_touch before update on public.%I for each row execute function public.touch_updated_at()', t, t);
  end loop;
end $$;
