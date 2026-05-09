-- 0033_rss_commentary.sql
-- Phase 3 — RSS news/commentary loop.
--
-- Tenant subscribes to N RSS feeds (industry blogs, podcast feeds,
-- competitor publications). Cron polls each feed, ingests new items,
-- Claude writes a commentary post per item using the tenant's voice
-- profile (when configured via tone-calibrator). Operator reviews +
-- approves before publishing — Naples does NOT auto-publish.

CREATE TABLE IF NOT EXISTS public.rss_feeds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  url text NOT NULL,
  title text,
  category text,
  enabled boolean NOT NULL DEFAULT true,
  last_polled_at timestamptz,
  last_item_published_at timestamptz,
  poll_interval_minutes integer NOT NULL DEFAULT 60 CHECK (poll_interval_minutes BETWEEN 5 AND 1440),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, url)
);

CREATE INDEX IF NOT EXISTS rss_feeds_tenant_idx
  ON public.rss_feeds(tenant_id, enabled, last_polled_at);

CREATE TABLE IF NOT EXISTS public.rss_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  feed_id uuid NOT NULL REFERENCES public.rss_feeds(id) ON DELETE CASCADE,
  -- Per-feed identifier from the RSS guid; falls back to link when guid absent.
  external_guid text NOT NULL,
  title text,
  link text,
  published_at timestamptz,
  author text,
  excerpt text,
  -- Full body — for podcasts this is the show notes, not the audio.
  body_html text,
  body_text text,
  raw jsonb NOT NULL DEFAULT '{}'::jsonb,
  -- Generated commentary (filled by analyzer step).
  commentary_status text NOT NULL DEFAULT 'pending'
    CHECK (commentary_status IN ('pending','generated','approved','rejected','published','archived')),
  commentary_title text,
  commentary_body text,
  commentary_angle text,    -- "agree", "disagree", "extend", "refute", "translate-to-vertical"
  commentary_generated_at timestamptz,
  approved_at timestamptz,
  approved_by_user_id uuid,
  published_at_target timestamptz,
  published_at_actual timestamptz,
  ingested_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (feed_id, external_guid)
);

CREATE INDEX IF NOT EXISTS rss_items_tenant_idx
  ON public.rss_items(tenant_id, ingested_at DESC);
CREATE INDEX IF NOT EXISTS rss_items_status_idx
  ON public.rss_items(tenant_id, commentary_status, ingested_at DESC);

ALTER TABLE public.rss_feeds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rss_items ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS rss_feeds_updated ON public.rss_feeds;
CREATE TRIGGER rss_feeds_updated
  BEFORE UPDATE ON public.rss_feeds
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS rss_items_updated ON public.rss_items;
CREATE TRIGGER rss_items_updated
  BEFORE UPDATE ON public.rss_items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
