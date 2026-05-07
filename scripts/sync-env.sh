#!/usr/bin/env bash
set -euo pipefail

# Pushes env vars to every Railway service: NEXT_PUBLIC_*_URL cross-app links,
# Supabase + Anthropic keys, RAILWAY_DOCKERFILE_PATH per service.
#
# Source of truth is Doppler (project: naples-digital, config: prd). Run via:
#
#   doppler run -- bash scripts/sync-env.sh
#
# That injects all prd secrets into env before this script runs. Legacy fallback:
# if DOPPLER_PROJECT isn't set in env (i.e. not running under doppler run), the
# script falls back to sourcing .env.local. New work should use Doppler.
#
# Long-term, the Doppler dashboard's Railway integration auto-syncs prd secrets
# to all services and this script becomes only-needed for the
# RAILWAY_DOCKERFILE_PATH per-service value.

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
if [ -z "${DOPPLER_PROJECT:-}" ] && [ -f "$ROOT_DIR/.env.local" ]; then
  echo "⚠ not running under 'doppler run --' — falling back to .env.local. Prefer: doppler run -- bash scripts/sync-env.sh"
  # shellcheck disable=SC1091
  set -a; source "$ROOT_DIR/.env.local"; set +a
fi

SITE=https://239live-site-production.up.railway.app
BOOKING=https://booking-portal-production-883f.up.railway.app
DASHBOARD=https://dashboard-production-b08f.up.railway.app
AGENCY=https://agency-site-production-35a2.up.railway.app
OUTREACH=https://outreach-demo-production.up.railway.app
CRM=https://crm-pipeline-production.up.railway.app
CONTENT=https://content-pipeline-production-21b7.up.railway.app
SPONSOR_PITCH="${NEXT_PUBLIC_SPONSOR_PITCH_URL:-https://sponsor-pitch-production.up.railway.app}"
SPONSOR_ANALYTICS="${NEXT_PUBLIC_SPONSOR_ANALYTICS_URL:-https://sponsor-analytics-production.up.railway.app}"
BACKLOG="${NEXT_PUBLIC_BACKLOG_URL:-https://backlog-production-2a84.up.railway.app}"
MIA_URL="${NEXT_PUBLIC_MIA_URL:-https://mia-production-6900.up.railway.app}"

ANTHROPIC_KEY="${ANTHROPIC_API_KEY:-}"
SB_URL="${SUPABASE_URL:-}"
SB_ANON="${SUPABASE_ANON_KEY:-}"
SB_SERVICE="${SUPABASE_SERVICE_ROLE_KEY:-}"
RESEND_KEY="${RESEND_API_KEY:-}"

set_common() {
  local svc="$1"
  local docker_path="$2"
  shift 2
  echo "→ Setting env vars on $svc"
  local args=(
    --service "$svc"
    --set "RAILWAY_DOCKERFILE_PATH=$docker_path"
    --set "NEXT_PUBLIC_SITE_URL=$SITE"
    --set "NEXT_PUBLIC_BOOKING_URL=$BOOKING"
    --set "NEXT_PUBLIC_DASHBOARD_URL=$DASHBOARD"
    --set "NEXT_PUBLIC_AGENCY_URL=$AGENCY"
    --set "NEXT_PUBLIC_OUTREACH_URL=$OUTREACH"
    --set "NEXT_PUBLIC_CRM_URL=$CRM"
    --set "NEXT_PUBLIC_CONTENT_URL=$CONTENT"
    --set "NEXT_PUBLIC_SPONSOR_PITCH_URL=$SPONSOR_PITCH"
    --set "NEXT_PUBLIC_SPONSOR_ANALYTICS_URL=$SPONSOR_ANALYTICS"
    --set "NEXT_PUBLIC_BACKLOG_URL=$BACKLOG"
    --set "NEXT_PUBLIC_MIA_URL=$MIA_URL"
  )
  if [ -n "$SB_URL" ];     then args+=( --set "SUPABASE_URL=$SB_URL" ); fi
  if [ -n "$SB_ANON" ];    then args+=( --set "SUPABASE_ANON_KEY=$SB_ANON" ); fi
  if [ -n "$SB_SERVICE" ]; then args+=( --set "SUPABASE_SERVICE_ROLE_KEY=$SB_SERVICE" ); fi
  if [ -n "$RESEND_KEY" ]; then args+=( --set "RESEND_API_KEY=$RESEND_KEY" ); fi
  args+=( "$@" )
  railway variables "${args[@]}" > /dev/null
}

# Helper: services that call Anthropic get the key appended; others don't.
# Use a function instead of an array so empty-array expansion under `set -u`
# doesn't error when ANTHROPIC_API_KEY is unset.
set_ai_service() {
  local svc="$1"; local docker="$2"
  if [ -n "$ANTHROPIC_KEY" ]; then
    set_common "$svc" "$docker" --set "ANTHROPIC_API_KEY=$ANTHROPIC_KEY"
  else
    set_common "$svc" "$docker"
  fi
}

set_common      239live-site       apps/239live-site/Dockerfile
set_common      booking-portal     apps/booking-portal/Dockerfile
set_common      dashboard          apps/dashboard/Dockerfile
set_common      agency-site        apps/agency-site/Dockerfile
set_ai_service  crm-pipeline       apps/crm-pipeline/Dockerfile
set_ai_service  content-pipeline   apps/content-pipeline/Dockerfile
set_ai_service  outreach-demo      apps/outreach-demo/Dockerfile

# Phase 6+ services. All confirmed present in the project. (Previous detect_service
# gating via `railway status --json` was flaky under repeated calls, so the
# services are now hardcoded — sync-env will fail loudly if one is missing,
# which is what we want.)
set_ai_service  sponsor-pitch       apps/sponsor-pitch/Dockerfile
set_common      sponsor-analytics   apps/sponsor-analytics/Dockerfile

# Phase 9 — Naples Digital agency backlog. ADMIN_PASSWORD-gated, uses Anthropic
# for the Suggest endpoint. ADMIN_PASSWORD is set per service via the Railway
# dashboard or `railway variable set --service backlog "ADMIN_PASSWORD=..."`.
set_ai_service  backlog             apps/backlog/Dockerfile

# Phase 10 — MIA acquisition tools (real estate / multifamily)
set_ai_service  mia                  apps/mia/Dockerfile
set_ai_service  mia-onmarket-cron    apps/mia-onmarket-cron/Dockerfile

echo "✓ Env vars synced across all services."
