-- 0018_extend_vault_whitelist_slack.sql
-- Adds 'slack' to the set_tenant_secret whitelist so per-tenant Slack
-- webhook URLs can be stored in Vault. Replaces the cross-tenant
-- SLACK_WEBHOOK_* env vars with per-tenant routing.

CREATE OR REPLACE FUNCTION public.set_tenant_secret(
  p_tenant_id uuid,
  p_kind text,
  p_secret text,
  p_config jsonb DEFAULT '{}'::jsonb
)
RETURNS TABLE (
  out_id uuid,
  out_tenant_id uuid,
  out_kind text,
  out_status text,
  out_last_verified_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, vault, pg_temp
AS $$
DECLARE
  v_secret_name text := 'tenant_' || p_tenant_id::text || '_' || p_kind;
  v_secret_id uuid;
  v_existing uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.tenants WHERE tenants.id = p_tenant_id) THEN
    RAISE EXCEPTION 'tenant % not found', p_tenant_id;
  END IF;

  -- Whitelist v3 — adds slack
  IF p_kind NOT IN (
    'instantly','smartlead','apollo','clay','assemblyai','opusclip',
    'stripe','resend','buffer','publer','klaviyo','meta','ghl',
    'gmail','twitter','linkedin','medium','slack'
  ) THEN
    RAISE EXCEPTION 'kind % not in allowed vendors', p_kind;
  END IF;

  SELECT s.id INTO v_existing FROM vault.secrets s WHERE s.name = v_secret_name;

  IF v_existing IS NULL THEN
    v_secret_id := vault.create_secret(p_secret, v_secret_name, 'tenant integration secret');
  ELSE
    PERFORM vault.update_secret(v_existing, p_secret, v_secret_name, 'tenant integration secret');
    v_secret_id := v_existing;
  END IF;

  INSERT INTO public.tenant_integrations (tenant_id, kind, config, secret_ref, status, last_verified_at)
  VALUES (p_tenant_id, p_kind, p_config, v_secret_id::text, 'verified', now())
  ON CONFLICT (tenant_id, kind) DO UPDATE
    SET config = excluded.config,
        secret_ref = excluded.secret_ref,
        status = 'verified',
        last_verified_at = now(),
        updated_at = now();

  RETURN QUERY
    SELECT ti.id, ti.tenant_id, ti.kind, ti.status, ti.last_verified_at
    FROM public.tenant_integrations ti
    WHERE ti.tenant_id = p_tenant_id AND ti.kind = p_kind;
END;
$$;

REVOKE ALL ON FUNCTION public.set_tenant_secret FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_tenant_secret TO service_role;
