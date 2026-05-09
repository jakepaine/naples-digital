-- 0023_tenant_users_auth_link.sql
-- Wires tenant_users to Supabase auth.users so signed-in sessions can
-- be resolved to a tenant. The existing tenant_users table tracked
-- (tenant_id, user_email, role) — adding user_id (FK to auth.users)
-- lets us look up tenant by auth.uid() at request time.
--
-- A small trigger auto-fills user_id when an auth user signs up with
-- an email that's already pre-provisioned in tenant_users. This is the
-- "owner pre-invites you, magic link in email lands you in your tenant"
-- flow.

ALTER TABLE public.tenant_users
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS tenant_users_user_id_idx
  ON public.tenant_users(user_id) WHERE user_id IS NOT NULL;

-- Helper: get the tenant_id for the currently authenticated user.
-- Returns NULL when no session or no matching tenant_users row.
CREATE OR REPLACE FUNCTION public.current_user_tenant_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT tenant_id
  FROM public.tenant_users
  WHERE user_id = auth.uid()
  ORDER BY created_at ASC
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.current_user_tenant_id FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_user_tenant_id TO authenticated, anon, service_role;

-- Auto-link trigger: when a new auth user signs up, look for a
-- tenant_users row with their email and stamp user_id. This means a
-- tenant owner can pre-add a teammate by email; the teammate's first
-- magic link auto-resolves to the tenant.
CREATE OR REPLACE FUNCTION public.link_auth_user_to_tenant()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE public.tenant_users
  SET user_id = NEW.id
  WHERE lower(user_email) = lower(NEW.email)
    AND user_id IS NULL;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS auth_users_link_tenant ON auth.users;
CREATE TRIGGER auth_users_link_tenant
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.link_auth_user_to_tenant();
