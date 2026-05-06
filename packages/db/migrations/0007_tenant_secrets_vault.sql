-- 0007_tenant_secrets_vault.sql
-- Per-tenant per-vendor secrets stored in Supabase Vault (encrypted at rest).
-- tenant_integrations.secret_ref now holds the vault.secrets.id (uuid as text).
--
-- Why this design over storing raw secret_ref text:
--   - tenant_integrations rows are visible to anyone with service-role; vault
--     ciphertext is decrypted only by joining the locked-down vault.decrypted_secrets
--     view, which requires explicit access via the SECURITY DEFINER functions below.
--   - Adding new clients does NOT add Doppler entries — Doppler stays for
--     platform-level secrets (Anthropic, Supabase keys, admin password). Per-tenant
--     vendor keys (Kevin's Instantly, MIA's Klaviyo, etc.) live here.
--   - vault.secrets.name is unique per project, so we namespace as
--     'tenant_<uuid>_<vendor_kind>' to avoid collisions across tenants.

-- ============================================================
-- 1. set_tenant_secret(tenant_id, kind, secret, config)
--    Upserts both the vault.secret and the tenant_integrations row.
--    Returns the integration row (without exposing the plaintext).
-- ============================================================
create or replace function public.set_tenant_secret(
  p_tenant_id uuid,
  p_kind text,
  p_secret text,
  p_config jsonb default '{}'::jsonb
)
returns table (
  out_id uuid,
  out_tenant_id uuid,
  out_kind text,
  out_status text,
  out_last_verified_at timestamptz
)
language plpgsql
security definer
set search_path = public, vault, pg_temp
as $$
declare
  v_secret_name text := 'tenant_' || p_tenant_id::text || '_' || p_kind;
  v_secret_id uuid;
  v_existing uuid;
begin
  -- Validate tenant exists (defense — caller is service-role but cheap to check)
  if not exists (select 1 from public.tenants where tenants.id = p_tenant_id) then
    raise exception 'tenant % not found', p_tenant_id;
  end if;

  -- Validate kind is one of the allowed vendors
  if p_kind not in ('instantly','smartlead','apollo','clay','assemblyai','opusclip','stripe','resend','buffer','publer','klaviyo','meta','ghl') then
    raise exception 'kind % not in allowed vendors', p_kind;
  end if;

  -- Upsert into vault. vault.create_secret returns the new id; for updates we
  -- look up by name and call vault.update_secret.
  select s.id into v_existing from vault.secrets s where s.name = v_secret_name;

  if v_existing is null then
    v_secret_id := vault.create_secret(p_secret, v_secret_name, 'tenant integration secret');
  else
    perform vault.update_secret(v_existing, p_secret, v_secret_name, 'tenant integration secret');
    v_secret_id := v_existing;
  end if;

  -- Upsert tenant_integrations with the vault uuid as the secret_ref.
  insert into public.tenant_integrations (tenant_id, kind, config, secret_ref, status, last_verified_at)
  values (p_tenant_id, p_kind, p_config, v_secret_id::text, 'verified', now())
  on conflict (tenant_id, kind) do update
    set config = excluded.config,
        secret_ref = excluded.secret_ref,
        status = 'verified',
        last_verified_at = now(),
        updated_at = now();

  return query
    select ti.id, ti.tenant_id, ti.kind, ti.status, ti.last_verified_at
    from public.tenant_integrations ti
    where ti.tenant_id = p_tenant_id and ti.kind = p_kind;
end;
$$;

revoke all on function public.set_tenant_secret from public;
grant execute on function public.set_tenant_secret to service_role;

-- ============================================================
-- 2. get_tenant_secret(tenant_id, kind)
--    Returns plaintext secret + config for use at runtime by services.
--    Service-role only.
-- ============================================================
create or replace function public.get_tenant_secret(
  p_tenant_id uuid,
  p_kind text
)
returns table (
  out_secret text,
  out_config jsonb,
  out_status text,
  out_last_verified_at timestamptz
)
language plpgsql
security definer
set search_path = public, vault, pg_temp
as $$
declare
  v_secret_ref text;
  v_config jsonb;
  v_status text;
  v_last timestamptz;
begin
  select ti.secret_ref, ti.config, ti.status, ti.last_verified_at
    into v_secret_ref, v_config, v_status, v_last
  from public.tenant_integrations ti
  where ti.tenant_id = p_tenant_id and ti.kind = p_kind;

  if v_secret_ref is null then
    return;
  end if;

  return query
    select ds.decrypted_secret, v_config, v_status, v_last
    from vault.decrypted_secrets ds
    where ds.id = v_secret_ref::uuid;
end;
$$;

revoke all on function public.get_tenant_secret from public;
grant execute on function public.get_tenant_secret to service_role;

-- ============================================================
-- 3. delete_tenant_secret(tenant_id, kind)
--    Removes both the vault entry and the tenant_integrations row.
-- ============================================================
create or replace function public.delete_tenant_secret(
  p_tenant_id uuid,
  p_kind text
)
returns boolean
language plpgsql
security definer
set search_path = public, vault, pg_temp
as $$
declare
  v_secret_ref text;
  v_secret_name text := 'tenant_' || p_tenant_id::text || '_' || p_kind;
begin
  select ti.secret_ref into v_secret_ref
  from public.tenant_integrations ti
  where ti.tenant_id = p_tenant_id and ti.kind = p_kind;

  delete from public.tenant_integrations
  where tenant_id = p_tenant_id and kind = p_kind;

  if v_secret_ref is not null then
    delete from vault.secrets where id = v_secret_ref::uuid or name = v_secret_name;
  end if;

  return true;
end;
$$;

revoke all on function public.delete_tenant_secret from public;
grant execute on function public.delete_tenant_secret to service_role;

-- ============================================================
-- 4. Verification: round-trip a test secret. Run manually after apply.
-- ============================================================
-- select * from public.set_tenant_secret(
--   (select id from public.tenants where slug='239live'),
--   'instantly',
--   'sk-test-abcd1234',
--   jsonb_build_object('campaign_id', 'demo-1')
-- );
-- select * from public.get_tenant_secret(
--   (select id from public.tenants where slug='239live'),
--   'instantly'
-- );
-- select public.delete_tenant_secret(
--   (select id from public.tenants where slug='239live'),
--   'instantly'
-- );
