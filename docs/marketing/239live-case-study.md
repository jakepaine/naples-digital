# 239 Live — Case Study

**Tenant:** 239 Live (Kevin)
**Vertical:** Podcast / media studio, Southwest Florida
**Status:** Flagship design-partner tenant on Naples Digital, live in production
**Stack:** Multi-tenant SaaS chassis · Next.js 14 · Supabase · Railway · Anthropic Claude (Sonnet 4.6 today, Opus 4.7 planned)

> "I went from running a podcast studio on five tools and a Zapier graveyard to one login that runs the whole business."
> — placeholder pull-quote, [Kevin to confirm exact wording]

---

## The problem

Kevin runs 239 Live — a Naples-based podcast and media studio that books guests, records and edits long-form episodes, distributes them across social platforms, lines up sponsors, and converts listener interest into booked studio time. Every one of those motions touched a different tool:

- **Bookings** came in through a generic scheduler with no link to anything else.
- **Lead capture and CRM** lived in a spreadsheet that nobody updated after week two.
- **Outreach** was hand-typed cold emails. No sequencing, no tracking, no warmup.
- **Content production** meant a person watching back every episode to pick clips, then another person cutting them in Premiere, then another posting them to five different platforms by hand.
- **Sponsor pitches** were one-off Google Docs rebuilt from scratch for every prospect.
- **Sponsor analytics** — what each sponsor actually got in exchange for their dollar — didn't exist.

The operating cost was real: subscriptions across HighLevel, Calendly, a transcription tool, an editing tool, an analytics tool, an email sender, and the Zapier seat to glue half of it together. The hidden cost was worse — the studio's time. Every new episode kicked off the same 4-hour manual content production loop. Sponsor pitches took half a day. The CRM was always stale because nobody had time to feed it.

Kevin needed one platform, built around how a media business actually runs, where every module reads and writes the same database — not five SaaS subscriptions with brittle Zaps between them.

## What Naples Digital built

239 Live runs as tenant #1 on the Naples Digital platform. Every module below is a production app in the monorepo, deployed on Railway, backed by a single Supabase Postgres with row-level security and `tenant_id` scoping.

**Public studio site (`239live-site`)** — Kevin's marketing front door: home, studio, shows, book. Renders from the same database every internal module writes to, so a new episode or booking shows up everywhere without a manual sync.

**Booking portal (`booking-portal`)** — Four-step booking wizard. Submissions persist directly to the `bookings` table, which the dashboard, CRM, and content pipeline all read. No webhook chains, no "did the Zap fire?" forensics.

**CRM pipeline (`crm-pipeline`)** — Drag-and-drop kanban board. Every lead card has an AI "Generate angle" button that runs the lead through Claude and produces a one-line summary, three personalized outreach hooks, and a draft DM, cached on the lead row so it doesn't regenerate on every view.

**Outreach (`outreach-demo` + `outreach-dispatcher`)** — AI 3-email cold sequence generator wired to Instantly for sending and warmup, with AssemblyAI in the pipeline for call/voicemail transcription. Every generation logs to `outreach_runs` so Kevin can see exactly which prompt produced which sequence.

**Content pipeline (`content-pipeline` + `render-worker`)** — The biggest single time-saver. Upload an episode; the pipeline:
  1. Transcribes via AssemblyAI with word-level timestamps
  2. Asks Claude to pick the 5 best short-form clip moments
  3. Hands cut points and word timings to `render-worker`, which runs ffmpeg to cut, crop to 9:16, and burn karaoke-style captions in 239 Live's brand color
  4. Writes the clip rows back to Supabase, surfaced in the dashboard

What used to be a 4-hour manual loop per episode is now a single upload. **`[X clips/week]`** generated · **`[Y hours/episode saved]`** — *Jake to fill from real episode data.*

**Sponsor pitch builder (`sponsor-pitch`)** — Type the name of a prospective sponsor; Claude reads the studio's positioning, the prospect's profile, and produces a one-pager with audience-match analysis, three tiered packages, and five activation ideas — in roughly 30 seconds. **`[Y sponsor pitches drafted]`** · **`[Z pitches sent]`** · **`[N% acceptance rate vs. baseline]`** — *Jake to fill.*

**Sponsor analytics (`sponsor-analytics`)** — Per-sponsor private analytics portal accessible by magic link at `/s/<token>`. Sponsors see exactly what they're paying for: weekly impressions, watch time, audience overlap, brand mentions. The metric rows are populated by scheduled IG/TT/YT ingestion. **`[N sponsors live]` on the portal.**

**Client portal & dashboard (`client-portal`, `dashboard`)** — Kevin's daily operations hub. Every chart and KPI — bookings, lead funnel, MRR, social growth, projections — reads from the same Supabase, so nothing ever disagrees with anything.

**Backlog (`backlog`)** — Per-tenant work tracker that replaced an external project tool. AI Suggest scans repo state and proposes the next thing to ship.

## Outcomes

> Placeholders below — Jake to drop in real numbers before this goes out.

- **Tools collapsed:** `[5+]` SaaS subscriptions replaced by a single Naples Digital tenant.
- **Time saved on content production:** `[~X hours/episode]`, `[~Y hours/month]`.
- **Sponsor pitch throughput:** `[Z pitches drafted]` vs. `[baseline]` before Naples Digital. Acceptance rate: `[N%]`.
- **Outreach volume:** `[A sequences generated]`, `[B emails delivered]`, `[C% reply rate]`.
- **Bookings:** `[D bookings in last 90 days]`, `[E% from inbound vs. outbound]`.
- **Total subscription cost reduction:** `[$X/mo]` → `[$Y/mo on Naples Digital]`. *(Compare against Premium tier: $5,000 setup + $1,997/mo, or design-partner pricing of $750/mo for 12-month lock.)*

The platform itself is the moat. Every new module Naples Digital ships becomes available to 239 Live the day it goes live — content syndication and email triage are next in queue.

## The stack story

239 Live isn't running on a custom build. It's running on **the same multi-tenant chassis** Naples Digital sells to every other service business — that's the whole point.

- **Single Supabase project** with row-level security and `tenant_id` on every domain table. 239 Live's data and the platform's other four tenants live in the same Postgres with strict isolation.
- **One Next.js 14 monorepo,** 14 customer-facing apps and 2 background workers, every app deployed as its own Railway service via per-app Dockerfile.
- **AI features run on Claude Sonnet 4.6** today (Opus 4.7 planned), and every AI feature ships with a deterministic mock fallback — so demos and dev environments never break when the API key isn't set.
- **Secrets in two layers:** Doppler for platform-wide keys, Supabase Vault for per-tenant per-vendor credentials (Kevin's Instantly key, MIA's Apify token) accessed via `set_tenant_secret` / `get_tenant_secret` RPCs.
- **No Zapier, no n8n, no glue tax.** Modules talk to each other by reading and writing the same database.

239 Live is the proof that a service business can run on one platform, one login, one bill. That platform is shipping today, and it's available to the next handful of design-partner tenants at half the Premium price in exchange for a case study and roadmap input.

---

*Naples Digital is built by Jake Paine and Noah in Naples, FL. Operated as a DBA of Purity Goat LLC.*

*[Insert Kevin testimonial here once captured]*
