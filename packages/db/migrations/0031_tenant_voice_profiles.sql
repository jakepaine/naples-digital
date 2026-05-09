-- 0031_tenant_voice_profiles.sql
-- Email Tone Calibrator — Phase 2 module.
--
-- Tenant pastes 3 historical sent emails. Claude extracts a structured
-- voice fingerprint (sentence shape, vocabulary, signature phrases,
-- do/don't word lists). Future copy-generating modules (Lead
-- Enrichment icebreakers, Cold Outreach sequences, Reply auto-replies)
-- read this profile and constrain their output.
--
-- Single new table: tenant_voice_profiles. One profile per tenant
-- (UNIQUE on tenant_id). Re-running calibration overwrites in place.

CREATE TABLE IF NOT EXISTS public.tenant_voice_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL UNIQUE REFERENCES public.tenants(id) ON DELETE CASCADE,
  -- Caller-provided sample emails (the originals, kept for audit /
  -- recalibration when the prompt evolves).
  samples jsonb NOT NULL DEFAULT '[]'::jsonb,
  samples_count integer NOT NULL DEFAULT 0,
  -- Structured fingerprint that the LLM produces:
  --   { sentence_shape, vocabulary_register, signature_phrases[],
  --     do_words[], dont_words[], punctuation_quirks, paragraph_style,
  --     greetings[], signoffs[], one_line_voice }
  fingerprint jsonb NOT NULL DEFAULT '{}'::jsonb,
  -- Free-form summary the LLM writes — useful for human review and
  -- for embedding into other prompts as a system-message preface.
  voice_summary text,
  -- Quality flags surfaced by the LLM ("samples too short", "samples
  -- inconsistent in tone", "high formality variance").
  quality_flags text[],
  -- Optional consumer-toggle. If false, downstream modules ignore the
  -- profile (useful for testing).
  enabled boolean NOT NULL DEFAULT true,
  generated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS tenant_voice_profiles_tenant_idx
  ON public.tenant_voice_profiles(tenant_id);

ALTER TABLE public.tenant_voice_profiles ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS tenant_voice_profiles_updated ON public.tenant_voice_profiles;
CREATE TRIGGER tenant_voice_profiles_updated
  BEFORE UPDATE ON public.tenant_voice_profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
