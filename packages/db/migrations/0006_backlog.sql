-- 0006_backlog.sql
-- Naples Digital agency backlog. Per-tenant work tracker — replaces ClickUp/Linear
-- for tracking outstanding work across clients (239 Live, Naples Digital itself,
-- future tenants). Each item is scoped to a tenant_id so the backlog app's tabs
-- map directly to tenants.
--
-- The "source" column tags how an item entered the backlog — "manual" for human
-- entry, "build-state" / "readme" / "git" / "github" for items proposed by the
-- /api/backlog/suggest endpoint that scans repo state.

-- ============================================================
-- 1. backlog_items table
-- ============================================================
create table if not exists public.backlog_items (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  title text not null,
  description text,
  status text not null default 'backlog' check (status in ('backlog','in_progress','blocked','done')),
  priority text not null default 'P2' check (priority in ('P0','P1','P2','P3')),
  source text not null default 'manual' check (source in ('manual','build-state','readme','git','github','suggest')),
  tags text[] not null default array[]::text[],
  due_at timestamptz,
  completed_at timestamptz,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists backlog_items_tenant_idx on public.backlog_items (tenant_id);
create index if not exists backlog_items_status_idx on public.backlog_items (tenant_id, status);
create index if not exists backlog_items_priority_idx on public.backlog_items (tenant_id, priority);

-- ============================================================
-- 2. RLS — same shape as every other tenant-scoped table
-- ============================================================
alter table public.backlog_items enable row level security;
drop policy if exists tenant_isolation on public.backlog_items;
create policy tenant_isolation on public.backlog_items
using (
  tenant_id::text = current_setting('app.current_tenant', true)
  or current_setting('app.current_tenant', true) is null
  or current_setting('app.current_tenant', true) = ''
)
with check (
  tenant_id::text = current_setting('app.current_tenant', true)
  or current_setting('app.current_tenant', true) is null
  or current_setting('app.current_tenant', true) = ''
);

-- ============================================================
-- 3. updated_at trigger
-- ============================================================
drop trigger if exists backlog_items_touch on public.backlog_items;
create trigger backlog_items_touch before update on public.backlog_items
for each row execute function public.touch_updated_at();

-- ============================================================
-- 4. Give Naples Digital tenant a distinct accent color (sapphire) so its tab
-- is visually different from 239 Live's red. The brand JSON already has
-- primary_color = '#0A0A0A' (the bg) which is invisible as an accent.
-- ============================================================
update public.tenants
set brand = brand || jsonb_build_object('accent_color', '#4F7DB8')
where slug = 'naplesdigital'
  and (brand->>'accent_color') is null;

update public.tenants
set brand = brand || jsonb_build_object('accent_color', '#E8192C')
where slug = '239live'
  and (brand->>'accent_color') is null;
