#!/usr/bin/env bash
set -euo pipefail

# Sets the canonical NEXT_PUBLIC_*_URL env vars on every Railway service
# so each app's nav and CTAs link to real Railway URLs.
# Also sets per-service RAILWAY_DOCKERFILE_PATH and ANTHROPIC_API_KEY where needed.

SITE=https://239live-site-production.up.railway.app
BOOKING=https://booking-portal-production-883f.up.railway.app
DASHBOARD=https://dashboard-production-b08f.up.railway.app
AGENCY=https://agency-site-production-35a2.up.railway.app
OUTREACH=https://outreach-demo-production.up.railway.app
CRM=https://crm-pipeline-production.up.railway.app
CONTENT=https://content-pipeline-production-21b7.up.railway.app

ANTHROPIC_KEY="${ANTHROPIC_API_KEY:-}"

set_common() {
  local svc="$1"
  local docker_path="$2"
  shift 2
  echo "→ Setting env vars on $svc"
  railway variables --service "$svc" \
    --set "RAILWAY_DOCKERFILE_PATH=$docker_path" \
    --set "NEXT_PUBLIC_SITE_URL=$SITE" \
    --set "NEXT_PUBLIC_BOOKING_URL=$BOOKING" \
    --set "NEXT_PUBLIC_DASHBOARD_URL=$DASHBOARD" \
    --set "NEXT_PUBLIC_AGENCY_URL=$AGENCY" \
    --set "NEXT_PUBLIC_OUTREACH_URL=$OUTREACH" \
    --set "NEXT_PUBLIC_CRM_URL=$CRM" \
    --set "NEXT_PUBLIC_CONTENT_URL=$CONTENT" \
    "$@" > /dev/null
}

set_common 239live-site     apps/239live-site/Dockerfile
set_common booking-portal   apps/booking-portal/Dockerfile
set_common dashboard        apps/dashboard/Dockerfile
set_common agency-site      apps/agency-site/Dockerfile
set_common crm-pipeline     apps/crm-pipeline/Dockerfile
set_common content-pipeline apps/content-pipeline/Dockerfile

if [ -n "$ANTHROPIC_KEY" ]; then
  set_common outreach-demo apps/outreach-demo/Dockerfile --set "ANTHROPIC_API_KEY=$ANTHROPIC_KEY"
else
  set_common outreach-demo apps/outreach-demo/Dockerfile
fi

echo "✓ Env vars synced across all 7 services."
