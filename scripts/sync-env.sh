#!/usr/bin/env bash
set -euo pipefail

# Sets the canonical NEXT_PUBLIC_*_URL env vars on every Railway service
# so each app's nav and CTAs link to real Railway URLs.
# Also sets per-service RAILWAY_DOCKERFILE_PATH, ANTHROPIC_API_KEY, and Supabase keys.
#
# Usage (loads .env.local automatically if present):
#   bash scripts/sync-env.sh

# Auto-load .env.local from repo root if present.
ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
if [ -f "$ROOT_DIR/.env.local" ]; then
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

ANTHROPIC_KEY="${ANTHROPIC_API_KEY:-}"
SB_URL="${SUPABASE_URL:-}"
SB_ANON="${SUPABASE_ANON_KEY:-}"
SB_SERVICE="${SUPABASE_SERVICE_ROLE_KEY:-}"

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
  )
  if [ -n "$SB_URL" ];     then args+=( --set "SUPABASE_URL=$SB_URL" ); fi
  if [ -n "$SB_ANON" ];    then args+=( --set "SUPABASE_ANON_KEY=$SB_ANON" ); fi
  if [ -n "$SB_SERVICE" ]; then args+=( --set "SUPABASE_SERVICE_ROLE_KEY=$SB_SERVICE" ); fi
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

echo "✓ Env vars synced across all services."
