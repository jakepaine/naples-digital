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
  )
  if [ -n "$SB_URL" ];     then args+=( --set "SUPABASE_URL=$SB_URL" ); fi
  if [ -n "$SB_ANON" ];    then args+=( --set "SUPABASE_ANON_KEY=$SB_ANON" ); fi
  if [ -n "$SB_SERVICE" ]; then args+=( --set "SUPABASE_SERVICE_ROLE_KEY=$SB_SERVICE" ); fi
  args+=( "$@" )
  railway variables "${args[@]}" > /dev/null
}

# Helper: services that call Anthropic get the key; others don't.
ai_args=()
if [ -n "$ANTHROPIC_KEY" ]; then
  ai_args=( --set "ANTHROPIC_API_KEY=$ANTHROPIC_KEY" )
fi

set_common 239live-site     apps/239live-site/Dockerfile
set_common booking-portal   apps/booking-portal/Dockerfile
set_common dashboard        apps/dashboard/Dockerfile
set_common agency-site      apps/agency-site/Dockerfile
set_common crm-pipeline     apps/crm-pipeline/Dockerfile     "${ai_args[@]}"
set_common content-pipeline apps/content-pipeline/Dockerfile "${ai_args[@]}"
set_common outreach-demo    apps/outreach-demo/Dockerfile    "${ai_args[@]}"

# Phase 6 services — created later. Detect via `railway status --json` (which
# lists all services), and skip silently if not yet provisioned.
detect_service() {
  railway status --json 2>/dev/null | grep -q "\"serviceName\": \"$1\""
}
if detect_service sponsor-pitch; then
  set_common sponsor-pitch     apps/sponsor-pitch/Dockerfile "${ai_args[@]}"
fi
if detect_service sponsor-analytics; then
  set_common sponsor-analytics apps/sponsor-analytics/Dockerfile
fi

echo "✓ Env vars synced across all services."
