-- 0005_content_activation.sql
-- Track B: real podcast pipeline. Client uploads raw video → Supabase Storage →
-- AssemblyAI transcript → Claude picks clip moments → render-worker outputs
-- 9:16 mp4s with burned captions.

-- 1. episode columns
alter table public.episodes add column if not exists raw_video_url text;
alter table public.episodes add column if not exists transcript_url text;
alter table public.episodes add column if not exists transcript jsonb;
alter table public.episodes add column if not exists duration_seconds int;
alter table public.episodes add column if not exists processing_state text not null default 'idle' check (processing_state in (
  'idle','uploaded','transcribing','transcribed','clipping','rendering','ready','failed'
));

-- 2. clip columns (for real video clips)
alter table public.clips add column if not exists start_seconds numeric;
alter table public.clips add column if not exists end_seconds numeric;
alter table public.clips add column if not exists video_url text;
alter table public.clips add column if not exists thumbnail_url text;
alter table public.clips add column if not exists word_timestamps jsonb;

-- 3. render_jobs queue (consumed by render-worker)
create table if not exists public.render_jobs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  episode_id text not null references public.episodes(id) on delete cascade,
  clip_id text not null references public.clips(id) on delete cascade,
  state text not null default 'queued' check (state in ('queued','running','done','failed')),
  ffmpeg_log text,
  error text,
  created_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz
);
create index if not exists render_jobs_tenant_idx on public.render_jobs (tenant_id);
create index if not exists render_jobs_state_idx on public.render_jobs (state, created_at) where state in ('queued','running');

-- 4. content_submissions: link to episode + tracking columns
alter table public.content_submissions add column if not exists episode_id text references public.episodes(id) on delete set null;
alter table public.content_submissions add column if not exists storage_path text;

-- 5. RLS on render_jobs
alter table public.render_jobs enable row level security;
drop policy if exists tenant_isolation on public.render_jobs;
create policy tenant_isolation on public.render_jobs
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
