-- queries.sql — ready-made SQL for the MakerSchool study tables.
-- Paste into Supabase SQL editor or psql. All read-only.

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Today's playbook — what should I be doing on Day N?
-- ─────────────────────────────────────────────────────────────────────────────
-- Replace 5 with whatever day you're on.
select task_number, title, written_content
from public.makerschool_lessons
where day_number = 5
order by task_number nulls last, id;


-- ─────────────────────────────────────────────────────────────────────────────
-- 2. All workflows that fill a named module gap, sorted by port effort.
-- ─────────────────────────────────────────────────────────────────────────────
select
  fills_named_gap as gap,
  port_effort,
  display_name,
  platform,
  complexity,
  filename
from public.makerschool_workflows
where fills_named_gap is not null
order by
  case fills_named_gap
    when 'stripe_lead_won'      then 1
    when 'email_triage'         then 2
    when 'content_syndication'  then 3
  end,
  case port_effort when 'S' then 1 when 'M' then 2 when 'L' then 3 end;


-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Quickest wins — high-relevance workflows with small port effort.
-- ─────────────────────────────────────────────────────────────────────────────
select display_name, naples_module, fills_named_gap, complexity, filename
from public.makerschool_workflows
where naples_relevance = 'high' and port_effort = 'S'
order by fills_named_gap nulls last, display_name;


-- ─────────────────────────────────────────────────────────────────────────────
-- 4. What tools does Day N introduce? (resolves via primary lesson<->video)
-- ─────────────────────────────────────────────────────────────────────────────
-- Pulls from both the curated tools table (first_appears_day) and tool
-- mentions extracted from videos for that day.
select distinct t.name, t.category, t.affiliate_url
from public.makerschool_tools t
where t.first_appears_day = 8
   or t.id in (
     select t2.id
     from public.makerschool_tools t2,
          unnest(t2.source_lesson_ids) as lid
     join public.makerschool_lessons l on l.id = lid::int
     where l.day_number = 8
   )
order by t.name;


-- ─────────────────────────────────────────────────────────────────────────────
-- 5. Action items extracted from videos for a specific day.
-- ─────────────────────────────────────────────────────────────────────────────
select
  l.day_number,
  l.task_number,
  l.title as lesson,
  ai.ordering,
  ai.description as action_item
from public.makerschool_action_items ai
join public.makerschool_videos v on v.id = ai.video_id
join public.makerschool_lesson_videos lv
  on lv.video_id = v.id and lv.is_primary = true
join public.makerschool_lessons l on l.id = lv.lesson_id
where l.day_number = 5
order by l.task_number, ai.ordering;


-- ─────────────────────────────────────────────────────────────────────────────
-- 6. Find every workflow that uses a specific tool.
-- ─────────────────────────────────────────────────────────────────────────────
select display_name, platform, naples_relevance, port_effort, filename
from public.makerschool_workflows
where 'Stripe' = any(apps)
order by naples_relevance, display_name;


-- ─────────────────────────────────────────────────────────────────────────────
-- 7. Video ingestion status overview.
-- ─────────────────────────────────────────────────────────────────────────────
select status, count(*) as videos
from public.makerschool_videos
group by status
order by status;


-- ─────────────────────────────────────────────────────────────────────────────
-- 8. Failed videos with their error reason, for retry triage.
-- ─────────────────────────────────────────────────────────────────────────────
select url, attempt_count, error
from public.makerschool_videos
where status = 'failed'
order by attempt_count desc;


-- ─────────────────────────────────────────────────────────────────────────────
-- 9. Top tools by lesson-mention count (post-video-extraction).
-- ─────────────────────────────────────────────────────────────────────────────
select
  name,
  category,
  array_length(source_lesson_ids, 1) as lesson_count,
  pricing_model,
  affiliate_url
from public.makerschool_tools
where source_lesson_ids is not null and array_length(source_lesson_ids, 1) > 0
order by lesson_count desc nulls last
limit 25;


-- ─────────────────────────────────────────────────────────────────────────────
-- 10. Course coverage — how many lessons per day, with download presence.
-- ─────────────────────────────────────────────────────────────────────────────
select
  day_number,
  count(*) as lessons,
  count(*) filter (where jsonb_array_length(download_links) > 0) as with_downloads
from public.makerschool_lessons
where day_number is not null
group by day_number
order by day_number;
