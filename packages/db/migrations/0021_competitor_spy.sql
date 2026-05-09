-- 0021_competitor_spy.sql
-- Wave 3 #15 — Facebook Ad Library spy module.
-- Each tenant tracks N competitor brands. We pull their currently-running
-- Meta ads via Apify's FB Ad Library actor, analyze each via Claude vision
-- (asset_type / visual_format / messaging_angle / hook_tactic / offer_type),
-- and rank by appearance count over time so the top-of-funnel "what's
-- working in our niche" set surfaces.

CREATE TABLE IF NOT EXISTS public.competitor_brands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  fb_page_id text,
  notes text,
  enabled boolean NOT NULL DEFAULT true,
  last_synced_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS competitor_brands_tenant_idx
  ON public.competitor_brands(tenant_id);

CREATE TABLE IF NOT EXISTS public.competitor_ads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  brand_id uuid NOT NULL REFERENCES public.competitor_brands(id) ON DELETE CASCADE,
  -- Apify-side identifier so we can dedupe across syncs
  ad_archive_id text NOT NULL,
  ad_text text,
  cta_text text,
  cta_url text,
  image_url text,
  video_url text,
  -- Date the ad was first observed running (per FB Ad Library)
  first_seen_at timestamptz,
  last_seen_at timestamptz,
  -- Claude-extracted structured tags
  asset_type text,            -- image | video | carousel | other
  visual_format text,         -- product_shot | lifestyle | testimonial | text_card | meme | etc.
  messaging_angle text,       -- pain_point | aspiration | social_proof | scarcity | discount | etc.
  hook_tactic text,           -- question | shocking_claim | stat | quote | first_person | etc.
  offer_type text,            -- discount | bundle | free_trial | none | etc.
  ai_summary text,
  weeks_in_top10 integer NOT NULL DEFAULT 0,
  raw jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, ad_archive_id)
);

CREATE INDEX IF NOT EXISTS competitor_ads_brand_idx
  ON public.competitor_ads(brand_id, last_seen_at DESC);
CREATE INDEX IF NOT EXISTS competitor_ads_tenant_top_idx
  ON public.competitor_ads(tenant_id, weeks_in_top10 DESC);

ALTER TABLE public.competitor_brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competitor_ads ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS competitor_brands_updated ON public.competitor_brands;
CREATE TRIGGER competitor_brands_updated
  BEFORE UPDATE ON public.competitor_brands
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS competitor_ads_updated ON public.competitor_ads;
CREATE TRIGGER competitor_ads_updated
  BEFORE UPDATE ON public.competitor_ads
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
