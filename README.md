# Naples Digital × 239 Live System

A connected demo + production system showing what Naples Digital builds for 239 Live Studios. **Nine** Next.js 14 apps in a pnpm + Turborepo monorepo, each deployed as its own Railway service, all backed by a real Supabase Postgres database, all sharing the same brand. Four AI features ship as real products powered by Claude Sonnet 4.6 (with deterministic mock fallbacks if no API key).

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

## Architecture

```
naples-digital/
├── apps/
│   ├── 239live-site/        Public studio site
│   ├── booking-portal/      Multi-step booking wizard
│   ├── dashboard/           Kevin's ops hub (sidebar + 6 sections)
│   ├── outreach-demo/       AI email generator (Anthropic + mock fallback)
│   ├── crm-pipeline/        Kanban with @dnd-kit
│   ├── content-pipeline/    Episode pipeline + intake form
│   └── agency-site/         Naples Digital marketing site
├── packages/
│   ├── ui/                  Brand tokens, Tailwind preset, shared components (Nav, Card, Button, Badge)
│   └── mock-data/           Typed mock data (bookings, leads, MRR, episodes, social, projections, roadmap)
├── scripts/
│   ├── scaffold-apps.sh     Idempotent Next.js scaffold across all 7 apps
│   └── sync-env.sh          Sync NEXT_PUBLIC_*_URL across all 7 Railway services
├── pnpm-workspace.yaml
├── turbo.json
└── package.json
```

Each app uses Next.js 14 App Router, Tailwind CSS, the `@naples/ui` shared component library, and the `@naples/mock-data` shared data layer. Charts use Recharts. Drag-and-drop uses `@dnd-kit/core`.

## Local development

```bash
pnpm install
pnpm dev          # runs all 7 apps in parallel on ports 3000–3006
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

## Environment variables

**Source of truth: Doppler** (project `naples-digital`, config `prd`). Local dev uses `doppler run --` to inject secrets; Railway services receive them via `bash scripts/sync-env.sh` (run inside `doppler run`) or the Doppler→Railway dashboard integration.

```bash
# Run any command with prd secrets injected
doppler run -- pnpm --filter @naples/dashboard dev

# Push secrets to all 10 Railway services
doppler run -- bash scripts/sync-env.sh
```

`.env.local` exists only as a legacy fallback for the sync script. New secrets go in Doppler, never `.env.local`. `.env.example` documents the variable names for reference.

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

To re-sync env vars across all 7 services after a domain change:
```bash
ANTHROPIC_API_KEY=sk-ant-... bash scripts/sync-env.sh
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

## Cost breakdown (what Kevin pays)

| Item | Monthly |
|---|---|
| Railway hosting (7 services) | ~$50–80 |
| GoHighLevel CRM | $97–297 |
| Anthropic API (outreach + content) | $50–150 |
| Buffer / Hootsuite (content distribution) | $30–100 |
| Stripe processing | per-transaction, ~2.9% |
| Domain + DNS + transactional email | $20–40 |
| **Platform stack pass-through** | **~$460–690/mo (at cost, no markup)** |
| Naples Digital retainer | $3,000/mo |
| Equipment rental (optional) | $1,500/mo |

## Engagement terms

| | Option A (Build Heavy) | Option B (Commission Heavy) |
|---|---|---|
| Setup | $25,000 | $15,000 |
| Monthly retainer | $3,000 | $3,000 |
| Commission (net new sponsor + client MRR) | 10% | 20% |

## Ownership

| What | Who owns it |
|---|---|
| Code in this repo | 239 Live (after final invoice paid) |
| Railway services | 239 Live (paid by 239 Live) |
| GoHighLevel account | 239 Live |
| Studio website + brand | 239 Live |
| Anthropic API key | 239 Live (Naples Digital sets it up) |
| The "Naples Digital" mark | Naples Digital |

Naples Digital builds the system and operates it during the engagement. At end of engagement, every system, every credential, every workflow handed over to 239 Live or its operator. No vendor lock-in.

## How commissions are tracked

The dashboard's Revenue & Commissions page is a single source of truth. New leads that close (move to "Client Won" in the CRM) automatically appear in the commission ledger at 10% (Option A) or 20% (Option B) of monthly value. Naples Digital invoices monthly against this ledger.

In production this would be wired to GoHighLevel webhooks — the moment a lead's stage changes to "Client Won", the dashboard updates and the commission line item is appended.

## Built by

Jake Paine and Noah at Naples Digital · Built April 2026 · Naples, FL.

🤖 This system was built with [Claude Code](https://claude.com/claude-code).
