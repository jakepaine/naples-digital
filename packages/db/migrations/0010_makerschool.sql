-- 0010_makerschool.sql
-- Reference data from Nick Saraev's MakerSchool course (296 lessons + ~46 workflow blueprints).
-- Used by `platform/scripts/makerschool/` for ingestion and analysis.
--
-- NOTE: these tables are deliberately NOT tenant-scoped. Per platform/CLAUDE.md every domain
-- table gets `tenant_id`, but this is course/research reference data — same content for every
-- tenant if it's ever surfaced in-product. If we later expose any of this per-tenant
-- (e.g. tenant-specific notes on a lesson), wrap with a separate `tenant_makerschool_notes`
-- table that does have `tenant_id`.

-- All 296 lessons. Primary key matches the JSON `id`.
create table public.makerschool_lessons (
  id            integer     primary key,
  section       text        not null,
  subsection    text,
  title         text        not null,
  url           text,                              -- skool classroom URL
  loom_url      text,                              -- single primary loom (often a section placeholder)
  loom_urls     text[]      default '{}',          -- all related looms surfaced for this lesson
  written_content text,
  download_links jsonb      default '[]'::jsonb,   -- raw structure from JSON
  files         jsonb       default '[]'::jsonb,
  resources     jsonb       default '[]'::jsonb,
  status        text        default 'success',
  day_number    integer,                           -- parsed from subsection (Day 1..Day 30 in Month 1) — null otherwise
  task_number   integer,                           -- parsed from leading "1." / "2." in title
  created_at    timestamptz not null default now()
);

create index makerschool_lessons_section_idx     on public.makerschool_lessons (section, subsection);
create index makerschool_lessons_day_idx         on public.makerschool_lessons (day_number) where day_number is not null;

-- Deduplicated unique loom URLs — unit of video processing.
-- One row per unique URL across all lessons' `loom_url` + `loom_urls`.
create table public.makerschool_videos (
  id              uuid        primary key default gen_random_uuid(),
  url             text        unique not null,
  duration_seconds integer,
  download_path   text,                            -- local path of yt-dlp download (volatile)
  gemini_file_id  text,                            -- Gemini Files API ref after upload
  status          text        not null default 'pending',
                                                    -- pending | downloading | processing | completed | failed | skipped
  error           text,
  attempt_count   integer     not null default 0,
  processed_at    timestamptz,
  created_at      timestamptz not null default now()
);
alter table public.makerschool_videos
  add constraint makerschool_videos_status_check
  check (status in ('pending','downloading','processing','completed','failed','skipped'));

create index makerschool_videos_status_idx on public.makerschool_videos (status);

-- Bridge: which lessons reference which videos (a video can serve many lessons).
create table public.makerschool_lesson_videos (
  lesson_id integer not null references public.makerschool_lessons(id) on delete cascade,
  video_id  uuid    not null references public.makerschool_videos(id)  on delete cascade,
  is_primary boolean not null default false,
  primary key (lesson_id, video_id)
);

-- Action items extracted from a video transcript OR from a lesson's written_content.
create table public.makerschool_action_items (
  id           uuid        primary key default gen_random_uuid(),
  source_type  text        not null,           -- 'video' | 'written'
  video_id     uuid                             references public.makerschool_videos(id)  on delete set null,
  lesson_id    integer                          references public.makerschool_lessons(id) on delete set null,
  description  text        not null,
  ordering     integer,
  created_at   timestamptz not null default now()
);
alter table public.makerschool_action_items
  add constraint makerschool_action_items_source_check
  check (source_type in ('video','written'));

create index makerschool_action_items_lesson_idx on public.makerschool_action_items (lesson_id);
create index makerschool_action_items_video_idx  on public.makerschool_action_items (video_id);

-- Tools inventory: every tool/platform/service named in the course.
create table public.makerschool_tools (
  id                uuid        primary key default gen_random_uuid(),
  name              text        not null,
  category          text,                            -- e.g. 'cold_email', 'crm', 'scraping', 'ai', 'payment', 'design'
  description       text,
  pricing_model     text,                            -- 'free' | 'freemium' | 'paid' | 'subscription'
  affiliate_url     text,
  homepage_url      text,
  first_appears_day integer,                         -- the lowest day_number where this tool appears
  source_lesson_ids integer[]   default '{}',        -- array of makerschool_lessons.id that mention this tool
  notes             text,
  created_at        timestamptz not null default now()
);
create unique index makerschool_tools_name_idx on public.makerschool_tools (lower(name));

-- Workflows: each Make.com / n8n JSON in the makerschool/ folder.
create table public.makerschool_workflows (
  id                uuid        primary key default gen_random_uuid(),
  filename          text        unique not null,
  platform          text        not null,           -- 'make' | 'n8n'
  display_name      text,
  description       text,
  trigger_kind      text,                            -- e.g. 'webhook', 'schedule', 'manual', 'rss', 'watch'
  apps              text[]      default '{}',
  inputs            text,
  outputs           text,
  complexity        text,                            -- 'simple' | 'medium' | 'complex'
  module_count      integer,
  size_bytes        integer,
  naples_relevance  text,                            -- 'high' | 'medium' | 'low' | 'skip'
  naples_module     text,                            -- which Naples Digital module it maps to
  fills_named_gap   text,                            -- 'content_syndication' | 'email_triage' | 'stripe_lead_won' | null
  port_effort       text,                            -- 'S' | 'M' | 'L'
  notes             text,
  created_at        timestamptz not null default now()
);
alter table public.makerschool_workflows
  add constraint makerschool_workflows_platform_check
  check (platform in ('make','n8n'));
alter table public.makerschool_workflows
  add constraint makerschool_workflows_complexity_check
  check (complexity in ('simple','medium','complex') or complexity is null);
alter table public.makerschool_workflows
  add constraint makerschool_workflows_relevance_check
  check (naples_relevance in ('high','medium','low','skip') or naples_relevance is null);
alter table public.makerschool_workflows
  add constraint makerschool_workflows_port_effort_check
  check (port_effort in ('S','M','L') or port_effort is null);

create index makerschool_workflows_relevance_idx on public.makerschool_workflows (naples_relevance);
create index makerschool_workflows_gap_idx       on public.makerschool_workflows (fills_named_gap)
  where fills_named_gap is not null;
