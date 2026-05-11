# Naples Digital Platform

Vertical SaaS for service businesses. **29 services** in a pnpm + Turborepo monorepo (27 Next.js 14 apps + 2 Node workers), each deployed as its own Railway service, all backed by a single Supabase Postgres database. Customer-facing AI features powered by Claude Sonnet 4.6 with deterministic mock fallbacks when no API key is set. Multi-tenant by data — five tenants live today (`239live`, `naplesdigital`, `mia`, `lifewise`, `jakepaine`).

239 Live (Kevin) is the flagship design-partner tenant. Naples Digital itself is tenant #2, dogfooding the platform. Future tenants pick a tier and pay a monthly subscription.

## Apps

The full inventory of apps in this monorepo. "Deployed" means a Railway service exists; "Built, not deployed" means the app builds locally but no Railway service has been provisioned yet.

| App | Port | Type | Purpose | Deploy |
|---|---|---|---|---|
| **239live-site** | 3000 | Next.js | Public-facing 239 Live studio website (home, studio, shows, book). | https://239live-site-production.up.railway.app |
| **booking-portal** | 3001 | Next.js | 4-step booking wizard — submissions persist to `bookings`. | https://booking-portal-production-883f.up.railway.app |
| **dashboard** | 3002 | Next.js | Kevin's operations hub — every chart and KPI reads from Supabase. | https://dashboard-production-b08f.up.railway.app |
| **agency-site** | 3003 | Next.js | Naples Digital's own marketing site. | https://agency-site-production-35a2.up.railway.app |
| **outreach-demo** | 3004 | Next.js | Live AI email generator — every run logs to `outreach_runs`. | https://outreach-demo-production.up.railway.app |
| **crm-pipeline** | 3005 | Next.js | Drag-and-drop kanban with AI "generate angle" per card. | https://crm-pipeline-production.up.railway.app |
| **content-pipeline** | 3006 | Next.js | Episode tracker + AI clip generator (5 clips/episode) + podcast RSS auto-ingest. | https://content-pipeline-production-21b7.up.railway.app |
| **sponsor-pitch** | 3007 | Next.js | AI sponsor one-pager builder — pitch any company in 30s. | https://sponsor-pitch-production.up.railway.app |
| **sponsor-analytics** | 3008 | Next.js | Per-sponsor private analytics portal at `/s/<magic-link-token>`. | https://sponsor-analytics-production.up.railway.app |
| **client-portal** | 3009 | Next.js | Per-tenant client-facing portal — contracts, invoices, content submissions. | Deployed (Railway service `client-portal`) |
| **admin-console** | 3010 | Next.js | Cross-tenant operator console. Operator-gated. | https://admin-console-production-12e2.up.railway.app |
| **outreach-dispatcher** | 3011 | Next.js | Outreach send queue + delivery worker UI + Instantly/Smartlead webhook receiver. | https://outreach-dispatcher-production.up.railway.app |
| **backlog** | 3012 | Next.js | Per-tenant agency backlog tracker (replaces ClickUp) with AI Suggest. Operator-gated. | https://backlog-production-2a84.up.railway.app |
| **mia** *(private client)* | 3013 | Next.js | MIA-tenant real-estate acquisitions tools: on-market deal flow, off-market owners, submarkets, coaching pipeline, LP tracker, broker inbox. Operator-gated. | https://mia-production-6900.up.railway.app |
| **email-triage** | 3015 | Next.js | AI inbox triage — fetches Gmail threads, classifies, routes by tenant. | Deployed |
| **content-syndication** | 3016 | Next.js | One post → IG / FB / Twitter / LinkedIn / Medium fan-out. | Built, not deployed |
| **lead-won-invoice** | 3017 | Next.js | When a CRM lead hits Won, auto-spin a Stripe invoice draft. | Built, not deployed |
| **proposal-generator** | 3018 | Next.js | AI proposal builder, seeded from a CRM lead. | Built, not deployed |
| **competitor-spy** | 3019 | Next.js | Competitor ad scraping via Apify; per-tenant brand/ads database. | Built, not deployed |
| **lead-enrichment** | 3020 | Next.js | Per-tenant Apollo/Clay enrichment jobs + source config. | Deployed |
| **lead-scraper** | 3021 | Next.js | Per-tenant lead scraping jobs + source config (Apify-driven). | Deployed |
| **sla-dashboard** | 3022 | Next.js | SLA queue / response-time monitoring dashboard. | Deployed |
| **onboarding-coach** | 3023 | Next.js | Step-by-step tenant onboarding coach — tracks completion of setup tasks. | Deployed |
| **warmup-monitor** | 3024 | Next.js | Cold-email inbox warmup monitor. | Deployed |
| **tone-calibrator** | 3025 | Next.js | Brand voice profile capture/calibration — feeds outreach copy. | Deployed |
| **ig-reels-research** | 3026 | Next.js | Instagram Reels competitor research — tracks creators + reels. | Deployed |
| **rss-commentary** | 3027 | Next.js | RSS feed monitor + AI commentary generator for content reactions. | Deployed |
| **mia-onmarket-cron** *(private client)* | worker | Node + tsx | LoopNet + Crexi scrape via Apify, auto-underwrite, Resend deal alerts. 6h cron. | Deployed (worker, no public URL) |
| **render-worker** | worker | Node + tsx | Episode → short-form clip rendering: ffmpeg + 9:16 crop + karaoke captions in tenant brand color, fed by AssemblyAI word timestamps + Claude clip picks. | Deployed (worker, no public URL) |

*(private client)* — mia + mia-onmarket-cron serve a single private client and are not part of the standard tenant tier matrix. Keep or remove from a public README depending on audience.

## Packages

Shared workspace packages under `packages/`.

| Package | Purpose |
|---|---|
| **@naples/ui** | Brand tokens, Tailwind preset, shared components (Nav, BrandFrame, Card, Button, Badge, StripeGradient, StripeFooter). |
| **@naples/db** | Supabase client + tenant/secret helpers (`getTenantSecret`, `setTenantSecret`, `getServerTenant`), shared queries, types. |
| **@naples/mock-data** | Typed mock data (bookings, leads, MRR, episodes, social, projections, roadmap) — fallback when Supabase env is missing. |
| **@naples/outreach** | Vendor-agnostic `OutreachVendor` interface + Instantly + Smartlead implementations, plus deliverability, list-unsubscribe, complaint-monitor, voice-profile, experiment helpers. |
| **@naples/enrichment** | Apollo + Clay enrichment client implementations. |
| **@naples/storage** | Tenant-prefixed Supabase Storage wrapper. |
| **@naples/transcription** | AssemblyAI transcription client. |

## Architecture

```
naples-digital/
├── apps/                    27 Next.js apps + 2 Node workers — see Apps table above
├── packages/                7 shared workspace packages — see Packages table above
├── scripts/
│   └── sync-env.sh          Sync NEXT_PUBLIC_*_URL + secrets across Railway services
├── supabase/migrations/     Schema migrations (tenants, integrations, vault, MIA re_* tables, outreach_experiments, podcast_feeds, etc.)
├── pnpm-workspace.yaml
├── turbo.json
└── package.json
```

Each Next.js app uses the App Router, Tailwind CSS, the `@naples/ui` shared component library, and `@naples/db` for Supabase access. Charts use Recharts. Drag-and-drop uses `@dnd-kit/core`. Workers (`mia-onmarket-cron`, `render-worker`) are plain Node + `tsx`, no Next.js.

<!-- TODO: 2026-05-11 — Architecture section above is high-level only. Many apps now use `getServerTenant` + per-app `lib/persist*.ts` modules; document the standard app skeleton if it stabilizes. -->

## Local development

```bash
pnpm install
pnpm dev          # runs every app in parallel via Turborepo
```

Or run a single app:
```bash
pnpm --filter @naples/dashboard dev
```

Port assignments are listed in the Apps table above. Ports 3000–3013 are the original Phase 7–10 apps; 3015–3027 are the Phase 11+ module expansion.

<!-- TODO: 2026-05-11 — Port 3014 is unassigned (was reserved at some point; verify if needed before claiming for a new app). -->

## Environment variables

**Two layers, by scope:**

1. **Platform-wide secrets** — Doppler (project `naples-digital`, config `prd`). `ANTHROPIC_API_KEY`, Supabase keys, Resend, cross-app `NEXT_PUBLIC_*_URL`s, etc. Doppler→Railway dashboard integration syncs them to every service.
2. **Per-tenant per-vendor secrets** — Supabase Vault, accessed via `tenant_integrations.secret_ref` + the `set_tenant_secret(tenant_id, kind, secret, config)` / `get_tenant_secret(tenant_id, kind)` RPCs. This is where MIA's Apify token, a tenant's Klaviyo key, etc. live. Helpers in `packages/db/lib/tenant.ts`. Supported `kind`s include `apify`, `batchskiptracing`, `postmark`, `resend` — extend the `TenantIntegrationKind` union to add more.

```bash
# Run any command locally with prd secrets injected
doppler run -- pnpm --filter @naples/dashboard dev

# Push platform-wide secrets to all Railway services (only needed when you add a new service or rotate a NEXT_PUBLIC_*_URL)
doppler run -- bash scripts/sync-env.sh
```

`.env.local` exists as a fallback for the sync script when not running under `doppler run`; new platform secrets go in Doppler. `.env.example` documents the variable names for reference.

AI features (`outreach-demo`, `crm-pipeline`, `content-pipeline`, `sponsor-pitch`, `backlog`, `proposal-generator`, `competitor-spy`, `lead-enrichment`, `lead-scraper`, `email-triage`, `ig-reels-research`, `rss-commentary`, `tone-calibrator`, `content-syndication`, `lead-won-invoice`, `mia`) read `ANTHROPIC_API_KEY`; if unset they fall back to deterministic mock generators so screens never break.

<!-- TODO: 2026-05-11 — Per project_naples_modules_state, 9 newer services were created via `railway add` outside the Doppler→Railway dashboard integration. They get core secrets via `railway variables` manual push, not auto-sync. Audit + wire up. -->

## AI features

AI features ship as real products. All use Claude Sonnet 4.6 via the Anthropic SDK and fall back to deterministic mock generators if `ANTHROPIC_API_KEY` is unset (the screen looks identical either way; a small badge indicates "Live · Claude Sonnet 4.6" vs. "Preview mode").

| Feature | App | API route | Persists to |
|---|---|---|---|
| 3-email cold outreach sequences | outreach-demo | `/api/generate` | `outreach_runs` |
| Per-lead intelligence: summary + 3 hooks + draft DM | crm-pipeline | `/api/leads/[id]/angle` | `leads.ai_angle` (cache) |
| Per-episode short-form clips (5 platforms) | content-pipeline | `/api/episodes/[id]/clips` | `clips` |
| Sponsor one-pager: audience match + 3 tiers + 5 ideas | sponsor-pitch | `/api/generate` | `sponsor_pitches` |
| AI proposal generation | proposal-generator | `/api/generate` | `proposals` |
| Competitor ad analysis | competitor-spy | `/api/...` | `competitor_*` tables |
| Lead enrichment | lead-enrichment | `/api/...` | enrichment job rows |
| Lead scraping | lead-scraper | `/api/...` | scrape job rows |
| Inbox triage | email-triage | `/api/...` | inbox state |
| IG Reels research | ig-reels-research | `/api/...` | creator + reel rows |
| RSS commentary | rss-commentary | `/api/...` | feed + item rows |
| Tone calibration | tone-calibrator | `/api/...` | voice profile |

<!-- TODO: 2026-05-11 — Newer apps' API routes weren't enumerated mechanically; fill in when verifying. -->

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

### Real database (Supabase) — DONE

The system runs on a live Supabase Postgres (project `239Live` / ref `ylqoxefiwwimzxeuzfxy`). 30+ tables across the `public` schema with RLS enabled:

- Core domain (Phase 7): `bookings`, `leads`, `episodes`, `mrr`, `outreach_stats`, `social_growth`, `projections`, `roadmap_phases`
- AI feature outputs: `outreach_runs`, `clips`, `sponsors`, `sponsor_metrics`, `sponsor_pitches`
- Multi-tenancy + outreach + content (Phase 8): `tenants`, `tenant_users`, `tenant_integrations`, `outreach_sequences`, `email_sends`, `lead_emails`, `lead_enrichment`, `render_jobs`
- Vertical (Phase 10): `re_deals`, `re_underwrites`, `re_off_market_targets`, `re_skiptraces`, `re_students`, `re_student_deals`, `re_submarkets`, `re_investors`, `re_broker_emails`, `re_deal_criteria`
- Module expansion (Phase 11+): `outreach_experiments`, `podcast_feeds`, plus per-app job/state tables

All reads/writes go through `@naples/db` workspace package via the service-role key in API routes (RLS bypassed server-side; no anon access). Queries fall back to `MOCK_*` exports if the Supabase env is missing — so the apps still render in dev without keys.

<!-- TODO: 2026-05-11 — Exact table count: run `select count(*) from information_schema.tables where table_schema='public'`. Was 13 in Phase 7. -->

### Anthropic — DONE

Wired into all AI-touching apps listed above. Each call falls back to a deterministic mock generator if `ANTHROPIC_API_KEY` is unset, so the live demo never breaks.

### Real CRM (GoHighLevel) — future

When Kevin moves off Supabase-as-CRM onto GHL:
- Replace the `leads` table reads in `@naples/db` queries with GHL REST calls
- Add `GHL_API_KEY` and `GHL_LOCATION_ID` to each app's Railway env vars
- The kanban already PATCHes lead stage on drag — pointing it at GHL is a swap of the `updateLeadStage` implementation, not the UI

## Pricing & modules

Naples Digital is a **subscription SaaS**, not project work. Each tenant picks a tier (or is custom-priced as a Design Partner / Enterprise account). Tiers bundle a default set of modules; add-ons enable individual modules above tier. Source of truth for the module + tier registry: `packages/db/lib/modules.ts`. The admin-console `/modules` route renders the live tenant × module matrix.

An alternative agency-engagement model (Lite $7.5k / Full $25k) is documented separately in `docs/marketing/engagement-terms.md` for prospects that want services-style scoping instead of subscription.

| Tier | Setup | Monthly | Modules included |
|---|---|---|---|
| **Starter** | $1,500 | $497 | CRM + Booking + Backlog |
| **Growth** | $2,500 | $997 | + Outreach + Content + Sponsor Pitch |
| **Premium** | $5,000 | $1,997 | + Dashboard + Sponsor Analytics + Client Portal |
| **Design Partner** | $5,000 | $750 (12-mo lock) | Premium feature set, half price, 12-month commitment in exchange for case study + roadmap input. First three paying tenants only. |
| **Enterprise** | custom | custom | Bespoke vertical-specific stack (e.g. MIA's real-estate acquisitions tools). |

Module catalog has grown to ~25 modules across Sales, Content, Ops, and Vertical buckets. See `packages/db/lib/modules.ts` for the live registry. Each module maps to one or more apps in this monorepo.

### Lock-in and value

The platform is the operating system tenants log into daily — sponsor lists, lead history, content libraries, and integration credentials live in Naples Digital's Supabase. Migration cost compounds the longer a tenant uses the platform. Each new module shipped to the platform automatically becomes available to every tenant on a tier that includes it.

### Usage-based costs

Anthropic, AssemblyAI, Apify, and other usage-based vendors are passed through at cost or capped per tier. Platform tiers above do not include unbounded API usage.

## Roadmap snapshot

- Stripe-backed subscription billing (currently invoice-based)
- Self-serve tenant onboarding wizard
- Public agency-site case-study page using 239 Live data
- Deploy the 4 built-but-undeployed apps (content-syndication, lead-won-invoice, proposal-generator, competitor-spy)
- Wire Doppler→Railway integration for the 9 services created via `railway add` outside the Doppler integration
- Naples Digital itself fully dogfooding every Premium-tier module

## Built by

Jake Paine and Noah at Naples Digital · Naples, FL.

Built with [Claude Code](https://claude.com/claude-code).
