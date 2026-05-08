-- 0009_modules.sql
-- SaaS productization: each tenant has a tier and a list of enabled modules + add-ons.
-- Tiers (Starter/Growth/Premium) bundle a default module set; add-ons are à la carte modules above tier.
-- design_partner and enterprise are custom-priced; everything else uses TIERS table list price.

alter table public.tenants
  add column if not exists tier text not null default 'starter',
  add column if not exists enabled_modules text[] not null default '{}',
  add column if not exists addons text[] not null default '{}';

alter table public.tenants
  drop constraint if exists tenants_tier_check;

alter table public.tenants
  add constraint tenants_tier_check
  check (tier in ('starter', 'growth', 'premium', 'design_partner', 'enterprise'));

-- Backfill current tenants to match their actual posture.
-- 239live → design partner, gets the full bundle.
update public.tenants
  set tier = 'design_partner',
      enabled_modules = array['dashboard','booking','crm','outreach','content','sponsor_pitch','sponsor_analytics','backlog','client_portal']
  where slug = '239live';

-- naplesdigital itself → premium tier, dogfooding the platform.
update public.tenants
  set tier = 'premium',
      enabled_modules = array['dashboard','crm','outreach','content','sponsor_pitch','backlog']
  where slug = 'naplesdigital';

-- mia → enterprise tier (vertical-specific stack).
update public.tenants
  set tier = 'enterprise',
      enabled_modules = array['mia','backlog']
  where slug = 'mia';

-- lifewise + jakepaine → starter (intake stage).
update public.tenants
  set tier = 'starter',
      enabled_modules = array['backlog']
  where slug in ('lifewise','jakepaine');
