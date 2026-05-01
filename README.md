# Naples Digital × 239 Live System

A connected mockup demo system showing what Naples Digital builds for 239 Live Studios. Seven Next.js 14 apps in a pnpm + Turborepo monorepo, each deployed as its own Railway service, all sharing brand and mock data.

## Live URLs

| App | URL | What it is |
|---|---|---|
| **239live-site** | https://239live-site-production.up.railway.app | Public-facing studio website (home, studio, shows, book) |
| **booking-portal** | https://booking-portal-production-883f.up.railway.app | 4-step booking wizard for studio sessions |
| **dashboard** | https://dashboard-production-b08f.up.railway.app | Kevin's operations hub — KPIs, bookings, CRM, content, revenue, outreach |
| **outreach-demo** | https://outreach-demo-production.up.railway.app | Live AI email generator (Claude Sonnet 4.6) — the closer |
| **crm-pipeline** | https://crm-pipeline-production.up.railway.app | Drag-and-drop kanban with 14 mock leads |
| **content-pipeline** | https://content-pipeline-production-21b7.up.railway.app | Episode tracker, distribution grid, guest intake |
| **agency-site** | https://agency-site-production-35a2.up.railway.app | Naples Digital's own marketing site |

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

Copy `.env.example` to `.env.local` in any app that needs custom values. Most apps don't need any — the cross-app links use `NEXT_PUBLIC_*_URL` env vars set on each Railway service.

The only secret used in production is `ANTHROPIC_API_KEY` for the outreach-demo. **If unset, the app falls through to a deterministic template generator that produces realistic-looking emails so the screen never breaks.**

## Outreach demo notes

- Model: `claude-sonnet-4-6` (current Claude Sonnet as of April 2026)
- Max tokens: 1000
- Source badge on output indicates whether the response came from the real API, the deterministic template, or a fallback after API failure

The original spec called for `claude-sonnet-4-20250514` (May 2024 Sonnet), which has been retired. Substituted with the current Sonnet — see comment at the top of `apps/outreach-demo/app/api/generate/route.ts`.

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

This demo runs entirely on hardcoded mock data. To wire it up to production:

### Real CRM (GoHighLevel)
- Replace `MOCK_LEADS` in `packages/mock-data/index.ts` with `fetch()` calls to GoHighLevel's REST API
- Add `GHL_API_KEY` and `GHL_LOCATION_ID` to each app's Railway env vars
- Wire booking-portal Step 4 submission to POST a new contact + opportunity
- Wire content-pipeline guest intake form similarly

### Real database (Supabase)
- Replace each `MOCK_*` export with a Supabase query (`supabase.from(...).select()`)
- Use Supabase Auth for the dashboard's gating (currently anyone can view)
- Add `SUPABASE_URL` and `SUPABASE_ANON_KEY` to Railway env vars
- Mock data files become reasonable seed scripts

### Anthropic
- Already wired in the outreach-demo. Just need the key set on the Railway service.

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
