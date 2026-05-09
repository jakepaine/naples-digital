-- 0035_podcast_feeds.sql
-- Podcast RSS auto-ingest for content-pipeline.
--
-- Tenant adds an RSS feed URL of a podcast. Cron polls every N minutes,
-- new items land in podcast_episode_inbox. Operator promotes an inbox
-- item to an active episodes row (existing transcribe + clip-pick flow
-- takes over from there).
--
-- Separate inbox table from episodes so half-ingested feeds don't pollute
-- the operator's "real" episode pipeline. Promotion is one-way; once
-- promoted, the inbox row references the episode it became.

CREATE TABLE IF NOT EXISTS public.podcast_feeds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  feed_url text NOT NULL,
  name text,
  -- Optional default `show` value to stamp on promoted episodes
  -- (matches the existing episodes.show enum-ish field).
  default_show text,
  enabled boolean NOT NULL DEFAULT true,
  last_polled_at timestamptz,
  last_item_published_at timestamptz,
  poll_interval_minutes integer NOT NULL DEFAULT 60 CHECK (poll_interval_minutes BETWEEN 5 AND 1440),
  -- When true, cron auto-promotes new items to episodes (still requires
  -- audio_url present). When false, operator manually promotes from inbox.
  auto_promote boolean NOT NULL DEFAULT false,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, feed_url)
);

CREATE INDEX IF NOT EXISTS podcast_feeds_tenant_idx
  ON public.podcast_feeds(tenant_id, enabled, last_polled_at);

CREATE TABLE IF NOT EXISTS public.podcast_episode_inbox (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  feed_id uuid NOT NULL REFERENCES public.podcast_feeds(id) ON DELETE CASCADE,
  external_guid text NOT NULL,
  title text,
  description text,
  audio_url text,
  duration_seconds integer,
  published_at timestamptz,
  -- Lifecycle: pending → promoted (becomes episode) | skipped (operator dismissed).
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','promoted','skipped','failed')),
  -- Set when promoted.
  episode_id text REFERENCES public.episodes(id) ON DELETE SET NULL,
  promoted_at timestamptz,
  promoted_by_user_id uuid,
  -- Reason if status=skipped or failed.
  notes text,
  raw jsonb NOT NULL DEFAULT '{}'::jsonb,
  ingested_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (feed_id, external_guid)
);

CREATE INDEX IF NOT EXISTS podcast_inbox_tenant_idx
  ON public.podcast_episode_inbox(tenant_id, status, ingested_at DESC);
CREATE INDEX IF NOT EXISTS podcast_inbox_feed_idx
  ON public.podcast_episode_inbox(feed_id, ingested_at DESC);

ALTER TABLE public.podcast_feeds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.podcast_episode_inbox ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS podcast_feeds_updated ON public.podcast_feeds;
CREATE TRIGGER podcast_feeds_updated
  BEFORE UPDATE ON public.podcast_feeds
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS podcast_inbox_updated ON public.podcast_episode_inbox;
CREATE TRIGGER podcast_inbox_updated
  BEFORE UPDATE ON public.podcast_episode_inbox
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
