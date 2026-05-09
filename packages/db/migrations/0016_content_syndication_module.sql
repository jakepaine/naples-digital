-- 0016_content_syndication_module.sql
-- Wires the Content Syndication module to per-tenant social platforms.
-- A source post is written once; the tailor step generates per-platform
-- variants; each variant has its own status + publish lifecycle.
--
-- Module: content-syndication (apps/content-syndication/)
-- Trigger: tenant pastes a source post (title + body + optional image_url)
-- Output: content_posts row + N content_variants rows; publishing dispatches
--         to the per-platform publisher using credentials from Vault.

CREATE TABLE IF NOT EXISTS public.content_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT '',
  body text NOT NULL,
  source_url text,
  image_url text,
  -- 'draft' | 'tailored' | 'partial' | 'published' | 'archived'
  status text NOT NULL DEFAULT 'draft',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS content_posts_tenant_idx
  ON public.content_posts(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS content_posts_tenant_status_idx
  ON public.content_posts(tenant_id, status);

CREATE TABLE IF NOT EXISTS public.content_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.content_posts(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  -- 'twitter' | 'linkedin' | 'instagram' | 'facebook' | 'medium'
  platform text NOT NULL,
  text text NOT NULL,
  hashtags text[] NOT NULL DEFAULT '{}',
  -- 'draft' | 'approved' | 'scheduled' | 'published' | 'failed'
  status text NOT NULL DEFAULT 'draft',
  scheduled_at timestamptz,
  published_at timestamptz,
  published_url text,
  external_id text,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (post_id, platform)
);

CREATE INDEX IF NOT EXISTS content_variants_post_idx
  ON public.content_variants(post_id);
CREATE INDEX IF NOT EXISTS content_variants_tenant_status_idx
  ON public.content_variants(tenant_id, status);
CREATE INDEX IF NOT EXISTS content_variants_scheduled_idx
  ON public.content_variants(scheduled_at)
  WHERE status = 'scheduled';

ALTER TABLE public.content_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_variants ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS content_posts_set_updated_at ON public.content_posts;
CREATE TRIGGER content_posts_set_updated_at
  BEFORE UPDATE ON public.content_posts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS content_variants_set_updated_at ON public.content_variants;
CREATE TRIGGER content_variants_set_updated_at
  BEFORE UPDATE ON public.content_variants
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
