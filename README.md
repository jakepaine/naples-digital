# Naples Digital Platform

Vertical SaaS for service businesses. **16 services** in a pnpm + Turborepo monorepo (14 Next.js 14 apps + 2 Node workers), each deployed as its own Railway service, all backed by a single Supabase Postgres database. Four customer-facing AI features powered by Claude Sonnet 4.6 (deterministic mock fallbacks when no API key is set). Multi-tenant by data — five tenants live today (`239live`, `naplesdigital`, `mia`, `lifewise`, `jakepaine`).

239 Live (Kevin) is the flagship design-partner tenant. Naples Digital itself is tenant #2, dogfooding the platform. Future tenants pick a tier and pay a monthly subscription.

## Live URLs

| App | URL | What it is |
|---|---|---|
| **239live-site** | https://239live-site-production.up.railway.app | Public-facing studio website (home, studio, shows, book) |
| **booking-portal** | https://booking-portal-production-883f.up.railway.app | 4-step booking wizard — submissions persist to `bookings` |
| **dashboard** | https://dashboard-production-b08f.up.railway.app | Kevin's operations hub — every chart and KPI reads from Supabase |
| **outreach-demo** | https://outreach-demo-production.up.railway.app | Live AI email generator — every run logs to `outreach_runs` |
| **crm-pipeline** | https://crm-pipeline-production.up.railway.app | Drag-and-drop kanban + ✨ AI "generate angle" on every card |
| **content-pipeline** | https://content-pipeline-production-21b7.up.railway.app | Episode tracker + 🎬 AI clip generator (5 clips per episode) |
| **agency-site** | https://agency-site-production-35a2.up.railway.app | Naples Digital's own marketing site |
| **sponsor-pitch** | https://sponsor-pitch-production.up.railway.app | AI sponsor one-pager builder — pitch any company in 30s |
| **sponsor-analytics** | https://sponsor-analytics-production.up.railway.app | Per-sponsor private analytics portal at `/s/<magic-link-token>` |
| **backlog** | https://backlog-production-2a84.up.railway.app | Naples Digital agency backlog — per-tenant tabs, AI Suggest scans repo state. Operator-gated. |
| **mia** | (Railway service `mia`, port 3013) | MIA-tenant acquisition tools: on-market deal flow, off-market owners, submarkets, coaching pipeline, LP tracker, broker inbox. Operator-gated. |
| **mia-onmarket-cron** | (worker, no public URL) | LoopNet + Crexi scrape via Apify, auto-underwrite, Resend deal alert emails. Reads MIA's Apify token from Vault. Cron on 6h interval. |
| **admin-console** | (Railway service `admin-console`, port 3010) | Cross-tenant operator console. Operator-gated. |
| **client-portal** | (Railway service `client-portal`, port 3009) | Per-tenant client-facing portal. |
| **outreach-dispatcher** | (Railway service `outreach-dispatcher`, port 3011) | Outreach send queue + delivery worker UI. |
| **render-worker** | (worker, no public URL) | Episode → short-form clip rendering: ffmpeg cut + 9:16 crop + karaoke captions in tenant brand color, fed by AssemblyAI word timestamps + Claude clip picks. |

## Architecture

```
naples-digital/
├── apps/
│   ├── 239live-site/        Public studio site
│   ├── admin-console/       Cross-tenant operator console
│   ├── agency-site/         Naples Digital marketing site
│   ├── backlog/             Per-tenant agency backlog tracker (replaces ClickUp)
│   ├── booking-portal/      Multi-step booking wizard
│   ├── client-portal/       Per-tenant client-facing portal
│   ├── content-pipeline/    Episode pipeline + intake form + AI clip generator
│   ├── crm-pipeline/        Kanban with @dnd-kit + AI lead intelligence
│   ├── dashboard/           Kevin's ops hub (sidebar + 6 sections)
│   ├── mia/                 MIA-tenant acquisition tools
│   ├── mia-onmarket-cron/   Worker — LoopNet/Crexi scrape via Apify, auto-underwrite, Resend alerts
│   ├── outreach-demo/       AI 3-email cold sequence generator
│   ├── outreach-dispatcher/ Outreach send queue + delivery worker UI
│   ├── render-worker/       Worker — episode → short-form clips (ffmpeg + AssemblyAI + Claude)
│   ├── sponsor-analytics/   Per-sponsor analytics portal (magic-link)
│   └── sponsor-pitch/       AI sponsor one-pager builder
├── packages/
│   ├── ui/                  Brand tokens, Tailwind preset, shared components (Nav, Card, Button, Badge)
│   ├── db/                  Supabase client + tenant/secret helpers (`getTenantSecret`, `set_tenant_secret`)
│   └── mock-data/           Typed mock data (bookings, leads, MRR, episodes, social, projections, roadmap)
├── scripts/
│   └── sync-env.sh          Sync NEXT_PUBLIC_*_URL + secrets across all Railway services
├── supabase/migrations/     Schema migrations (tenants, integrations, vault, MIA re_* tables, etc.)
├── pnpm-workspace.yaml
├── turbo.json
└── package.json
```

Each Next.js app uses the App Router, Tailwind CSS, the `@naples/ui` shared component library, and `@naples/db` for Supabase access. Charts use Recharts. Drag-and-drop uses `@dnd-kit/core`. Workers (`mia-onmarket-cron`, `render-worker`) are plain Node + `tsx`, no Next.js.

## Local development

```bash
pnpm install
pnpm dev          # runs every app in parallel via Turborepo (ports 3000–3013)
```

Or run a single app:
```bash
pnpm --filter @naples/dashboard dev
```

| App | Local port |
|---|---|
| 239live-site | 3000 |
| booking-portal | 3001 |
| dashboard | 3002 |
| agency-site | 3003 |
| outreach-demo | 3004 |
| crm-pipeline | 3005 |
| content-pipeline | 3006 |
| sponsor-pitch | 3007 |
| sponsor-analytics | 3008 |
| client-portal | 3009 |
| admin-console | 3010 |
| outreach-dispatcher | 3011 |
| backlog | 3012 |
| mia | 3013 |
| mia-onmarket-cron | worker |
| render-worker | worker |

## Environment variables

**Two layers, by scope:**

1. **Platform-wide secrets** — Doppler (project `naples-digital`, config `prd`). `ANTHROPIC_API_KEY`, Supabase keys, Resend, cross-app `NEXT_PUBLIC_*_URL`s, etc. Doppler→Railway dashboard integration syncs them to every service.
2. **Per-tenant per-vendor secrets** — Supabase Vault, accessed via `tenant_integrations.secret_ref` + the `set_tenant_secret(tenant_id, kind, secret, config)` / `get_tenant_secret(tenant_id, kind)` RPCs. This is where MIA's Apify token, a tenant's Klaviyo key, etc. live. Helpers in `packages/db/lib/tenant.ts`. Supported `kind`s: `apify`, `batchskiptracing`, `postmark` (extend the `TenantIntegrationKind` union to add more).

```bash
# Run any command locally with prd secrets injected
doppler run -- pnpm --filter @naples/dashboard dev

# Push platform-wide secrets to all Railway services (only needed when you add a new service or rotate a NEXT_PUBLIC_*_URL)
doppler run -- bash scripts/sync-env.sh
```

`.env.local` exists as a fallback for the sync script when not running under `doppler run`; new platform secrets go in Doppler. `.env.example` documents the variable names for reference.

AI features (`outreach-demo`, `crm-pipeline`, `content-pipeline`, `sponsor-pitch`, `backlog`) read `ANTHROPIC_API_KEY`; if unset they fall back to deterministic mock generators so screens never break.

## AI features (Phase 6)

Four AI features ship as real products. All four use Claude Sonnet 4.6 via the Anthropic SDK and fall back to deterministic mock generators if `ANTHROPIC_API_KEY` is unset (the screen looks identical either way; a small badge indicates "Live · Claude Sonnet 4.6" vs. "Preview mode").

| Feature | App | API route | Persists to |
|---|---|---|---|
| 3-email cold outreach sequences | outreach-demo | `/api/generate` | `outreach_runs` |
| Per-lead intelligence: summary + 3 hooks + draft DM | crm-pipeline | `/api/leads/[id]/angle` | `leads.ai_angle` (cache) |
| Per-episode short-form clips (5 platforms) | content-pipeline | `/api/episodes/[id]/clips` | `clips` |
| Sponsor one-pager: audience match + 3 tiers + 5 ideas | sponsor-pitch | `/api/generate` | `sponsor_pitches` |

The sponsor-analytics portal is the only post-AI app — it consumes the `sponsor_metrics` rows that real-world integrations would populate (in production, weekly cron from IG/TT/YT APIs writes new rows; for now the demo sponsor "Naples Yacht Club" has 12 weeks of seeded metrics).

### Outreach demo notes

- Model: `claude-sonnet-4-6` (current Claude Sonnet)
- Max tokens: 2000 (three full email bodies routinely exceeded the original 1000)
- The original spec called for `claude-sonnet-4-20250514` (May 2024 Sonnet, retired) — substituted with the current Sonnet, see comment at the top of `apps/outreach-demo/app/api/generate/route.ts`.

## Deployment

All apps deploy to Railway via the per-app `Dockerfile` at `apps/<name>/Dockerfile`. Each Railway service has these env vars set:

- `RAILWAY_DOCKERFILE_PATH=apps/<name>/Dockerfile`
- `NEXT_PUBLIC_*_URL` for cross-app navigation (one per other app)

To redeploy a single app:
```bash
railway up --service <service-name> --ci --detach
```

To re-sync env vars across all Railway services after a domain change:
```bash
doppler run -- bash scripts/sync-env.sh
```

## Connecting to real systems

### Real database (Supabase) — DONE ✓

The system runs on a live Supabase Postgres (project `239Live` / ref `ylqoxefiwwimzxeuzfxy`). 13 tables live in the `public` schema with RLS enabled:

- `bookings`, `leads`, `episodes`, `mrr`, `outreach_stats`, `social_growth`, `projections`, `roadmap_phases` — mirror the original `MOCK_*` shapes
- `outreach_runs`, `clips`, `sponsors`, `sponsor_metrics`, `sponsor_pitches` — back the four AI features

All reads/writes go through `@naples/db` workspace package via the service-role key in API routes (RLS bypassed server-side; no anon access). Queries fall back to `MOCK_*` exports if the Supabase env is missing — so the apps still render in dev without keys.

### Anthropic — DONE ✓

Wired into outreach-demo, crm-pipeline (lead intelligence), content-pipeline (clip generator), and sponsor-pitch. Each call falls back to a deterministic mock generator if `ANTHROPIC_API_KEY` is unset, so the live demo never breaks.

### Real CRM (GoHighLevel) — future

When Kevin moves off Supabase-as-CRM onto GHL:
- Replace the `leads` table reads in `@naples/db` queries with GHL REST calls
- Add `GHL_API_KEY` and `GHL_LOCATION_ID` to each app's Railway env vars
- The kanban already PATCHes lead stage on drag — pointing it at GHL is a swap of the `updateLeadStage` implementation, not the UI

## Pricing & modules

Naples Digital is a **subscription SaaS**, not project work. Each tenant picks a tier (or is custom-priced as a Design Partner / Enterprise account). Tiers bundle a default set of modules; add-ons enable individual modules above tier. Source of truth for the module + tier registry: `packages/db/lib/modules.ts`. The admin-console `/modules` route renders the live tenant × module matrix.

| Tier | Setup | Monthly | Modules included |
|---|---|---|---|
| **Starter** | $1,500 | $497 | CRM + Booking + Backlog |
| **Growth** | $2,500 | $997 | + Outreach + Content + Sponsor Pitch |
| **Premium** | $5,000 | $1,997 | + Dashboard + Sponsor Analytics + Client Portal |
| **Design Partner** | $5,000 | $750 (12-mo lock) | Premium feature set, half price, 12-month commitment in exchange for case study + roadmap input. First three paying tenants only. |
| **Enterprise** | custom | custom | Bespoke vertical-specific stack (e.g. MIA's real-estate acquisitions tools). |

Module catalog (current): Operations Dashboard, Booking Portal, CRM Pipeline, Cold Outreach, Content Pipeline, Sponsor Pitch Builder, Sponsor Analytics, Backlog Tracker, Client Portal, Real Estate Acquisitions (vertical). Each maps to one or more apps in this monorepo.

### Lock-in and value

The platform is the operating system tenants log into daily — sponsor lists, lead history, content libraries, and integration credentials live in Naples Digital's Supabase. Migration cost compounds the longer a tenant uses the platform. Each new module shipped to the platform automatically becomes available to every tenant on a tier that includes it.

### Usage-based costs

Anthropic, AssemblyAI, Apify, and other usage-based vendors are passed through at cost or capped per tier. Platform tiers above do not include unbounded API usage.

## Roadmap snapshot

- Stripe-backed subscription billing (currently invoice-based)
- Self-serve tenant onboarding wizard
- Public agency-site case-study page using 239 Live data
- Content syndication module (one post → IG / FB / Twitter / LinkedIn / Medium)
- Email triage / categorization module
- Naples Digital itself fully dogfooding every Premium-tier module

## Built by

Jake Paine and Noah at Naples Digital · Naples, FL.

🤖 Built with [Claude Code](https://claude.com/claude-code).
