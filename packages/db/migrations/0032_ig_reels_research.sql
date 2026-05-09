-- 0032_ig_reels_research.sql
-- Phase 3 — IG Reels research feed.
--
-- Tenant configures a list of IG creator handles to track. Apify
-- scrapes new Reels per creator on a cadence; Gemini transcribes the
-- audio; Claude tags hook_pattern / niche_relevance / retention_signal.
-- The result is a research-grade feed for the tenant's content team —
-- NOT a publishing pipeline. (Saraev's lesson #18 + the audit's
-- explicit "Reels-as-research, not Reels-as-output" reframe.)

CREATE TABLE IF NOT EXISTS public.ig_creators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  -- IG handle without leading "@" (we strip it on insert).
  handle text NOT NULL,
  display_name text,
  niche text,
  notes text,
  enabled boolean NOT NULL DEFAULT true,
  last_synced_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, handle)
);

CREATE INDEX IF NOT EXISTS ig_creators_tenant_idx
  ON public.ig_creators(tenant_id, enabled, last_synced_at);

CREATE TABLE IF NOT EXISTS public.ig_reels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  creator_id uuid NOT NULL REFERENCES public.ig_creators(id) ON DELETE CASCADE,
  -- Stable identifier from Apify (shortcode usually).
  ig_shortcode text NOT NULL,
  ig_url text,
  video_url text,
  thumbnail_url text,
  caption text,
  hashtags text[],
  music_title text,
  music_artist text,
  -- Engagement metrics at the time of scrape.
  view_count integer,
  like_count integer,
  comment_count integer,
  duration_seconds integer,
  posted_at timestamptz,
  -- Gemini transcript (audio only — full Reel typically <90s).
  transcript text,
  transcript_language text,
  -- Claude-extracted structured tags.
  hook_first_3s text,           -- the spoken/written hook in the first 3 seconds
  hook_pattern text,            -- question | bold_claim | stat | demo | story | other
  niche_relevance integer CHECK (niche_relevance BETWEEN 0 AND 100),
  retention_signal text,        -- pattern_break | escalating_promise | curiosity_gap | other
  cta_present boolean,
  cta_text text,
  ai_summary text,
  raw jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, ig_shortcode)
);

CREATE INDEX IF NOT EXISTS ig_reels_tenant_idx
  ON public.ig_reels(tenant_id, posted_at DESC);
CREATE INDEX IF NOT EXISTS ig_reels_creator_idx
  ON public.ig_reels(creator_id, posted_at DESC);
CREATE INDEX IF NOT EXISTS ig_reels_relevance_idx
  ON public.ig_reels(tenant_id, niche_relevance DESC, posted_at DESC);

ALTER TABLE public.ig_creators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ig_reels ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS ig_creators_updated ON public.ig_creators;
CREATE TRIGGER ig_creators_updated
  BEFORE UPDATE ON public.ig_creators
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS ig_reels_updated ON public.ig_reels;
CREATE TRIGGER ig_reels_updated
  BEFORE UPDATE ON public.ig_reels
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
