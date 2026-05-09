# MakerSchool Corpus → Naples Digital Plan — 2026-Lens Audit

**Date:** 2026-05-09
**Author:** Claude (Opus 4.7) under Jake's direction
**Purpose:** Verify the MakerSchool corpus actually fits Naples Digital's pivot to multi-tenant vertical SaaS. Filter through 2026 best practices. Surface where the existing porting plan undercooks, overcooks, or misreads the corpus.

**Inputs reviewed:** `daily_playbook.md`, `tools_inventory.md`, `workflows_library.md`, `porting_plan.md`, `cold_email_brief.md`, `lessons_learned.md`, `packages/db/lib/modules.ts`, `apps/` directory, the platform `CLAUDE.md`, cross-project rules, GTM strategy memory.

**Inputs NOT reviewed (intentional):** raw transcripts of all 92 videos. The two briefs (`cold_email_brief.md` 26KB + `lessons_learned.md` 17KB) already digest the corpus comprehensively — re-reading the source would not change the conclusions.

---

## TL;DR

1. **The corpus's most valuable contribution to Naples is the operator playbook, not the workflow JSONs.** The 30-day sequence ("Day 1 do X, Day 14 do Y") is the spec for tenant onboarding. The 51 production workflow JSONs are reference-only — already correctly framed in `porting_plan.md`.
2. **The corpus teaches "build an agency" — Naples is "build a SaaS." Every Nick lesson needs a translation step.** Single-founder operator → tenant. Personal API key → per-tenant Vault. Manual scrape → per-tenant cron. The porting plan does this translation but doesn't make the pattern explicit, which leaves money on the table during tenant onboarding.
3. **The current 15-module catalog is well-aligned with the corpus.** The 3 named gaps (email triage, content syndication, lead-won → invoice) all correspond to Wave 1 in the porting plan and all shipped this morning. Wave 2 (3 remaining: Anymailfinder, PhantomBuster, Bland.ai) is correctly prioritized.
4. **Wave 3 (Content Pipeline expansion) is the riskiest investment.** 7 of its 8 modules are 2024-vintage tactics that have aged badly: long-form AI blog SEO, Medium parasite, Twitter parasite — all of these were Q4 2024 plays that 2026 algorithm changes have crushed. Recommend deprioritizing 4 of 7 and replacing with 2026-native plays.
5. **Wave 4 (Sponsor Pitch enhancements: AI Graphic Designer + 1k Ad Creatives) should be cut.** Both are 2024-DALL-E-era patterns that compete poorly in 2026 against Canva AI / Adobe Firefly / V0 / Midjourney. The 1k Ad Creatives module overlaps with the existing `scale-static-ad-variation-engine` skill; rebuilding it in Naples is duplicate work.
6. **The corpus's biggest insight that Naples is underweighting: lead enrichment is its own product.** Currently scoped as "Wave 2 #4: Anymailfinder enrichment, 1-2d." It should be a flagship module — multi-source enrichment chain (Apollo → AnyMailFinder → Hunter → Apify) with quality scoring. This is what Clay.com is, and the corpus repeatedly emphasizes "$0.00/lead vs $0.01/lead is the difference between weeks of progress" (lesson #18).
7. **Reply intelligence is also underweighted.** Email Triage module is scoped as inbox routing; the corpus shows reply intent classification + auto-reply + CRM stage advance + 5-min Slack alert is its own coherent product worth its own tier. Today this is split across 3 places (email-triage, outreach-dispatcher, crm-pipeline) without integration.
8. **The corpus does NOT cover Naples's vertical-SaaS targeting strategy.** Nick teaches generic "pick a niche" but doesn't have niche packs for service businesses (real estate, law, med spas, contractors). Naples's vertical positioning is its own asset — don't expect the corpus to validate it.

---

## What the corpus actually contains

| Category | Count | Naples value |
|---|---|---|
| Lessons (transcribed + structured) | 296 | High — operator playbook |
| Production workflow JSONs (Make + n8n) | 51 unique | **Reference-only.** Per platform rules, no Make/n8n in delivery. |
| Tutorial blueprint JSONs | 13 (7 Make Accelerator + 6 n8n "Your Nth") | Skip |
| Named tools across cold email/scraping/CRM/AI | ~30 | Mixed — see tools section below |
| Specific numbers (volumes, rates, conversion benchmarks) | 100+ | High — calibration values for Cold Outreach module |
| Templates (sales skeleton, cold email formula, offer formula, icebreaker prompt, follow-up prompt) | ~10 | High — embedded in modules' AI prompts |
| Affiliate code structure | 17 tools with codes | Medium — replace Nick's codes with Jake's per Day 10 sheet |
| Course Slack/Skool community posts | not transcribed | Probably low value |

**The actual deployable artifacts the corpus offers are zero.** Make.com blueprints can't be deployed (Naples doesn't run Make); n8n blueprints can't be deployed (Naples doesn't run n8n). Every module is a clean-room rebuild from the JSON read as a spec.

---

## The strategic re-frame: corpus IS Naples's onboarding playbook

This is the most important insight in this audit and isn't currently in any deliverable.

Nick's 30-day playbook reads:
- Day 1: name, domain, email warmup, Instantly signup
- Day 5: build proposal template
- Day 8: stand up scraping (Apollo + Apify + PhantomBuster + Anymailfinder)
- Day 16: webhook reply alerts (5-min response SLA)
- Day 17: write 6 cold email sequences
- Day 22: turn on email
- Day 27: set up CRM
- Day 28: cold email retrospective

A Naples Digital tenant logging in on Day 1 of their subscription would do **exactly this sequence** — except Naples automates it. The tenant doesn't write 6 sequences from scratch; they pick from templates. They don't manually wire webhooks; the platform does. They don't manually scrape; they paste their Apify/Apollo keys and the system runs cron.

**Implication:** Naples's tenant onboarding wizard SHOULD walk them through a 30-day plan that mirrors Nick's playbook. We have the playbook content. We have the modules that automate each step. We don't have the wizard that connects them.

This is a distinct product feature — call it "Onboarding Coach" or "Day-N Playbook" — that doesn't exist today and isn't on the roadmap. It would:
- Drive Starter/Growth tier perceived value (clear path to first customer in 90 days)
- Drive module adoption (each step unlocks a module)
- Drive retention (tenants who finish Day 30 are more committed)
- Drive case studies (we know what Day 30 success looks like)

This should be a Q3 add to the plan.

---

## Current Naples plan inventory

**15 modules** (from `packages/db/lib/modules.ts`):

| Module | Category | Addon $/mo | Backed by |
|---|---|---|---|
| dashboard | ops | 200 | apps/dashboard |
| booking | ops | 150 | apps/booking-portal |
| crm | sales | 250 | apps/crm-pipeline |
| outreach | sales | 350 | apps/outreach-demo + apps/outreach-dispatcher |
| content | content | 500 | apps/content-pipeline + apps/render-worker |
| sponsor_pitch | sales | 200 | apps/sponsor-pitch |
| sponsor_analytics | sales | 150 | apps/sponsor-analytics |
| backlog | ops | 100 | apps/backlog |
| client_portal | content | 100 | apps/client-portal |
| mia | vertical | 1500 | apps/mia + mia-onmarket-cron |
| email_triage | ops | 150 | apps/email-triage ✅ Wave 1 (this morning) |
| content_syndication | content | 200 | apps/content-syndication ✅ Wave 1 |
| lead_won_invoice | sales | 150 | apps/lead-won-invoice ✅ Wave 1 |
| proposal_generator | sales | 200 | apps/proposal-generator ✅ Wave 5 (this morning) |
| competitor_spy | content | 250 | apps/competitor-spy ✅ Wave 3 #15 (this morning) |

**4 tiers** (from same file):
- Starter $497 / $1500 setup: crm + booking + backlog
- Growth $997 / $2500: + outreach + content + sponsor_pitch
- Premium $1997 / $5000: + dashboard + sponsor_analytics + client_portal
- Design Partner $750 (12-mo lock) / $5000: same modules as Premium
- Enterprise: custom (mia is enterprise-only by default given $1500 addon)

**Remaining Wave 2 (queued):**
- Anymailfinder enrichment → cold outreach
- PhantomBuster IG/LinkedIn scraper → cold outreach
- Bland.ai phone-call kickoff → MIA

**Remaining Wave 3 (queued):** 7 modules (long-form blog, RSS news, YouTube repurposing, podcast repurposing, Medium parasite, Twitter parasite, IG Reels research)

**Remaining Wave 4 (queued):** 2 modules (AI Graphic Designer master + 5 subs, 1-Click 1000 Ad Creatives)

---

## Cross-reference: corpus → plan

### What the corpus suggests AND Naples already has

| Corpus theme | Naples module | Status | Notes |
|---|---|---|---|
| Cold email send (Day 22, Instantly/Smartlead) | outreach | Live | Confirm Instantly + Smartlead are configured per-tenant via Vault |
| Reply classification (Day 16, intent buckets) | email_triage | Live as of this morning | But not wired to Instantly's reply webhook — only to Gmail inbound |
| 3-stage follow-up cadence (Day 22+) | outreach | Live (?) | Need to verify follow-up logic exists; might be missing |
| Stripe lead-won → invoice (Day 6, 27) | lead_won_invoice | Live as of this morning | ✅ matches corpus exactly |
| Proposal generation (Day 5) | proposal_generator | Live as of this morning | ✅ matches corpus + adds public hosted-URL accept/reject Nick doesn't have |
| 5-platform syndication (Day 15+) | content_syndication | Live as of this morning | ✅ matches corpus + better isolation (per-tenant) |
| CRM stages: Intake → Meeting Booked → Proposal Sent → Closed Won/Lost (Day 27) | crm | Live | Verify days-in-stage tracking exists; corpus emphasizes this drives followup logic |
| Lead intake form → CRM (Day 27) | crm | Live as of this morning | A2 ports added Typeform/generic webhook this morning |
| Email categorization 5 buckets (corpus's 4 → Naples's 5) | email_triage | Live | ✅ Adapted Nick's "Worthwhile-default" classifier explicitly |
| Sponsor pitch / one-pager builder | sponsor_pitch | Live | Naples-specific; corpus doesn't directly cover but adjacent to proposal flow |
| Real estate vertical (MIA) | mia | Live | Naples-specific vertical asset, not corpus-derived |

### What the corpus suggests, Naples partially has, and SHOULD strengthen

| Corpus theme | Current Naples coverage | Gap |
|---|---|---|
| **Lead enrichment chain** (Apollo → AnyMailFinder → Hunter → Apify, with verification + quality scoring) | Wave 2 #4 scoped as "Anymailfinder enrichment, 1-2d" | **Underspecified.** Should be a flagship lead-enrichment module ~5-7 days, not 1-2. Multi-source fallback chain + per-tenant API keys + Clay.com-style preview UI. **High-leverage upsell** ($300-500/mo addon). |
| **Lead scraping orchestration** (Apollo + Apify + PhantomBuster + Vayne + LinkedIn Sales Nav) | Wave 2 #7 scoped as "PhantomBuster IG/LinkedIn, 2-3d" | **Underspecified.** PhantomBuster alone is incomplete. Should be `lead-scraper` module with adapter pattern: Apify + Apollo + PhantomBuster + Vayne as pluggable sources. Tenant pastes their own keys. |
| **Reply intent classifier + auto-reply + CRM stage advance** | Split across email_triage + outreach + crm | **Not integrated.** A "Smart Reply" sub-flow doesn't exist. Reply hits Instantly webhook → classifier → if positive, advance CRM stage to "Meeting Booked" → if bounce, remove from sequence → if OOO, re-queue → 5-min Slack alert. Corpus is explicit this is THE moat (lesson #200, #81, #66). |
| **Speed-to-lead alerting (5-min SLA)** | Email Triage has high_priority Slack alerts (this morning's A4) | Half there. Needs SLA dashboard, escalations if not responded to in 5 min, mobile push, oncall-style routing. Worth $200/mo addon. |
| **Cold email warmup status** | Outreach module lists Instantly delivery; warmup status surface unclear | Tenants need a visible warmup readiness gauge. Day 1-21 is dead time during which they can't send — surfacing "warmup at 73%, sending unlocks Day 22" is high-perceived-value at near-zero implementation cost. |
| **Sequence A/B testing framework** (6 sequences in 3 niches, kill loser weekly) | Outreach generates 3-email sequences | Doesn't surface A/B test infrastructure. Should be tenant-visible: which variant is winning, how many sends/replies, kill-loser button. |
| **Onboarding coach / Day-N playbook** | Doesn't exist | **NEW MODULE.** Drives entire tenant lifecycle. Mirror Nick's 30-day plan with each step backed by an existing Naples module. |
| **Affiliate-link substitution at runtime** (Nick teaches Day 10: replace his affiliate links with yours when recommending tools) | Doesn't exist | Tenant sets their own affiliate codes for tools they recommend (Apify, ClickUp, Notion, Apollo, etc.) and Naples-generated proposals/emails substitute them automatically. Niche feature, but a real Day-10 lesson. Probably skip until Q4. |

### What corpus suggests but Naples should NOT do (deprioritize/skip)

These are 2024-vintage tactics that haven't aged well or duplicate existing assets.

| Workflow / module | Reason to skip |
|---|---|
| Wave 3 #9 — **Long-form AI blog generator** (4-5d) | Google's HCU updates 2024-2025 actively penalize AI-generated SEO blog content. The 2024 tactic of "Claude → 2,000-word post → publish" produces results that get crushed by 2026's algorithm. Skip OR reposition as "draft → human edit" with explicit anti-AI-detection guardrails. |
| Wave 3 #13 — **Medium parasite SEO** (4-5d) | Medium has cracked down on AI content; their algorithm actively deprioritizes spun articles. The "scrape Medium → spin → republish" play that worked in 2023 doesn't work in 2026. Skip. |
| Wave 3 #14 — **Twitter parasite SEO** (3d) | X/Twitter API paywall + verified-only reach + algorithm changes make this a much worse bet than 2024. Skip. |
| Wave 3 #11 — **YouTube repurposing** (5-6d) | Naples already has `apps/content-pipeline` with episode → AI clip-pick → 9:16 render. Don't rebuild; extend the existing pipeline if a tenant wants YouTube → blog as an output target. **Defer until a tenant asks**, not as Wave 3 priority. |
| Wave 3 #10 — **RSS news/commentary loop** (3d) | Decent low-stakes module. Keep but de-prioritize. Tenant-facing value is real but not urgent. |
| Wave 4 #17 — **AI Graphic Designer master + 5 subs** (7-10d) | 2024 DALL-E-era pattern. In 2026 this is competing against Canva AI, Adobe Firefly, V0, Midjourney. A custom "AI graphic designer" module is unlikely to win on craft. Skip OR massively scope-down to "brand asset generator" that just does logo + 3-color palette. |
| Wave 4 #18 — **1-Click 1000 Ad Creatives** (5-7d) | Overlaps with the existing `scale-static-ad-variation-engine` skill in Jake's RadEnergy OS. Shipping it again in Naples is duplicate work. If a Naples tenant needs this, they invoke the skill or the radenergy-side tool. Skip. |
| Resume / Upwork workflows (3 in corpus) | Already correctly skipped in porting plan. |
| YouTube Trend Detector (2 in corpus) | Already correctly skipped. |
| Make.com Accelerator + n8n "Your Nth workflow" tutorials (13 total) | Educational only. Already correctly skipped. |

### What corpus suggests that Naples should KEEP from Wave 3

| Workflow / module | Reason to keep |
|---|---|
| Wave 3 #12 — **Podcast repurposing engine** (6-7d) | Podcasts are still rising in 2026 (vs blogs/Twitter declining). Real audience. Naples already has the transcription + clip-pick infrastructure; this extends it cleanly. Keep. |
| Wave 3 #16 — **IG Reels research feed** (3d) | Reels-as-research (not Reels-as-syndication) is solid. Tenant uploads competitor Reels accounts → transcripts + hashtags + caption patterns inform their own Reels. Keep. |
| Wave 3 #10 — **RSS news/commentary** (3d) | Keep but Q4. Steady value, low stakes. |

---

## 2026 staleness filter — what aged badly

The corpus is recorded Sept 2024 - Feb 2025. Most of the operator-psychology content (5-min reply, personalization, offer-quality) is timeless. But specific tactics have aged:

### Tactics still valid in 2026 (keep)

- 5-min reply SLA on positive responses — still ~400% conversion lift, psychology unchanged
- Personalization buys time for the rest of the pitch — still true
- Offer formula `[thing] in [time] or money back, just send [input]` — still works
- Volume math (300-500 emails/day across 9 mailboxes for 1% positive reply rate) — recipe still works
- Webhooks > polling — architectural truth; Naples is already native-webhook
- Speed-to-lead beats elaborate funnel — still true
- Daily lead-scraping cadence (1k/session × 4 sessions = 4k/month) — still works
- 21-day warmup before cold-email send — still required (more so, given 2024 Google/Yahoo bulk sender requirements)
- AI-drafted, human-final follow-up sequences — still works

### Tactics with significant 2026 friction (adjust)

- **Cold email deliverability** is much harder in 2026. The corpus doesn't address Google/Yahoo bulk sender requirements (DMARC reject + one-click unsubscribe + spam complaint <0.3%). Naples Cold Outreach module needs: SPF/DKIM/DMARC validator, list-unsubscribe header injection, complaint-rate monitoring with auto-pause. Corpus's Day 19 (DKIM/SPF/DMARC check) is not enough for 2026.
- **AI-generated email detection** is sharper in Gmail 2026. Pure Claude-drafted emails that don't sound human get filtered. Naples needs a "humanize" pass and per-tenant tone fingerprinting.
- **AI-generated SEO blog content** is penalized by Google 2024-2026. The Wave 3 long-form blog generator should be deprioritized (above) or repositioned as research-augmentation, not auto-publish.
- **DALL-E references** in workflows are stale — Naples already correctly uses FAL flux-pro / Nano Banana per the content pipeline decisions.
- **OpenAI GPT references** are stale — Naples already correctly uses Claude Sonnet 4.6 platform-wide.
- **Whisper references** are stale — Naples already correctly uses Gemini 2.5 Flash native video.

### Tactics newly relevant in 2026 that the corpus doesn't cover

- **AI-detection avoidance for outbound copy.** Corpus pre-dates the 2025 surge in AI-content detection by inbox providers. Naples should add a per-tenant "tone calibrator" — show me 3 of your historical sent emails, I'll fingerprint your voice and constrain Claude.
- **One-click unsubscribe headers** (RFC 8058 + Google/Yahoo 2024 mandate). Corpus doesn't mention this; Naples's outreach module must inject it or all sends get flagged.
- **Apollo's pricing-tier crackdown** — 2024 changes made the free tier far less useful (10k credits/mo capped, often less). Should Naples scope this assumption? Yes — recommend Vayne or alternatives.
- **Verified-only X reach** — kills Twitter parasite as a 2024 tactic that paid in 2026.
- **YouTube → Shorts algorithm changes** make the 2024 long-form repurposing pattern less effective; lift verbatim only with care.
- **Video-as-LLM-input via Gemini 2.5 Flash** opens new patterns the corpus doesn't have. The MakerSchool transcription itself uses this — but Naples could build modules that work directly off video inputs without intermediate transcript steps (e.g., "watch competitor Reels → extract winning hooks via Gemini vision" instead of transcribe-then-LLM).

---

## Multi-tenant SaaS reframe — every "do X" is "tenant configures X"

The corpus is single-operator. Naples is multi-tenant. Every lesson translates as follows:

| Corpus instruction (single founder) | Naples module surface (per-tenant) |
|---|---|
| "Sign up for Instantly, paste your API key" | Tenant pastes their Instantly key into `tenant_integrations.kind='instantly'`, stored in Supabase Vault via `set_tenant_secret`. Naples reads via `get_tenant_secret(tenant_id, 'instantly')` |
| "Buy 9 mailboxes from Zapmail" | Tenant pastes their Zapmail / Google Workspace credentials; Naples doesn't host mailboxes. We DO surface mailbox count + warmup status. |
| "Run Apify scraper for Apollo data" | Tenant pastes Apify token; Naples runs the scraper actor on their account; results land in `outreach_leads` with `tenant_id` |
| "Set up Stripe to receive client payments" | Tenant pastes their Stripe key + webhook secret (per-tenant URL `/api/webhooks/stripe/[tenantId]`); Naples creates invoices on tenant's Stripe account, never on Naples's |
| "Send 300-500 emails per day" | Each tenant configures their own send volume; Naples surfaces consumption vs limit |
| "Use ClickUp for CRM" | Naples replaces ClickUp with `apps/crm-pipeline` (this is in module `backlog`'s description: "Replaces ClickUp"). Don't integrate ClickUp; replace it. |
| "Set up DKIM/SPF/DMARC at Namecheap" | Naples surfaces DNS-record validator and pre-flight check on the tenant's sending domain |
| "Reply within 5 minutes of positive response" | Naples runs the classifier + Slack alert + push notification automatically; tenant doesn't watch the inbox |
| "Run weekly retrospective on cold email metrics" | Naples runs the retrospective in cron; tenant gets a Slack digest |
| "Build proposal template in PandaDoc" | Naples replaces PandaDoc with `proposal_generator` module hosted public URL (better than PandaDoc — no per-seat cost) |
| "Set up CRM stages on Day 27" | Naples ships CRM stages out of the box; Day 27 is the day the tenant logs in and finds them already there |

The PORTING PLAN does this translation in spirit but doesn't make the pattern explicit. **Surface this in tenant onboarding documentation and sales materials.** Naples is "Nick's playbook, automated."

### Tools the corpus says to use that Naples should integrate (per-tenant)

| Tool | Integration shape | Status |
|---|---|---|
| Instantly.ai | Per-tenant API key; outreach reads + writes | Live (?) — verify |
| Smartlead.ai | Same as Instantly | Reference; add when a tenant asks |
| Apollo.io | Per-tenant API key; lead scraping reads | Wave 2 #4 (queued) |
| Apify | Per-tenant API key; orchestrate actors | Live for `competitor-spy` (this morning); extend to `lead-scraper` |
| AnyMailFinder | Per-tenant API key; enrichment chain | Wave 2 #4 (queued) |
| PhantomBuster | Per-tenant API key; LinkedIn/IG scraping | Wave 2 #7 (queued) |
| Stripe | Per-tenant secret + webhook secret + per-tenant webhook URL | Live as of this morning |
| Gmail OAuth | Per-tenant OAuth flow | Live as of this morning (email-triage) |
| LinkedIn Sales Navigator | Per-tenant cookie? Or via PhantomBuster | Defer; complicated auth |
| Zapmail.ai | Tenant-side; Naples doesn't integrate | Skip |
| Bland.ai | Per-tenant API key; outbound calling | Wave 2 #8 (queued) |
| ElevenLabs | Per-tenant API key; voice gen | Live for content pipeline |
| HeyGen | Per-tenant API key; avatar video | Queued (RadEnergy side) |
| Firecrawl | Per-tenant API key (or platform-shared) | Live |
| Resend | Per-tenant override; platform default | Live as of this morning (A2) |
| ClickUp | DON'T integrate — Naples REPLACES ClickUp via `crm` + `backlog` modules | Confirmed |
| Monday.com | Same — don't integrate | Confirmed |
| Notion | Same — don't integrate as core CRM | Confirmed |
| PandaDoc | DON'T integrate — Naples REPLACES PandaDoc via `proposal_generator` hosted URLs | Confirmed |
| Trello | DON'T integrate — Naples replaces via `backlog` | Confirmed |

The "replace, don't integrate" pattern is doing the work of keeping Naples positioned as the platform, not as a glue layer. This is correct and matches the GTM strategy memory exactly.

---

## Gap analysis — what corpus suggests Naples is missing

Ranked by leverage on the SaaS-multi-client objective.

### High-leverage gaps

1. **Lead Enrichment module (`lead-enrichment`)** — multi-source chain with quality scoring. Currently scoped as 1-2d under Wave 2. Should be 5-7 days. $300-500/mo addon. Pattern: Clay.com but ours.
2. **Reply Intelligence sub-flow (`reply-intent`)** — wired between email_triage + outreach + crm. When Instantly webhook fires reply, classify intent, advance CRM stage, send 5-min Slack alert, kick off auto-reply if appropriate. Today this is a stub. ~3-4 days.
3. **Onboarding Coach / Day-N Playbook (`onboarding-coach`)** — guides tenant through Days 1-30 with module unlocks per day. Drives Starter/Growth conversion AND retention. ~5-7 days. Could be the killer feature.
4. **Speed-to-Lead SLA Dashboard (`sla-dashboard`)** — dedicated mobile-friendly dashboard showing every cold-email reply with countdown, escalation paths. ~3 days.
5. **Cold Email Compliance & Deliverability** — DKIM/SPF/DMARC validator + list-unsubscribe header + complaint-rate monitor. Probably extends the existing outreach module rather than its own thing. ~2-3 days.

### Medium-leverage gaps

6. **Sequence A/B testing infrastructure** — visible to tenant; kill-loser button. Extends outreach module. ~2 days.
7. **Warmup status surface** — visible warmup gauge in outreach module dashboard. <1 day, near-zero cost, perceived value high.
8. **Lead Scraping orchestration (`lead-scraper`)** — currently scoped as PhantomBuster-only at 2-3 days. Should be adapter pattern (Apify + Apollo + PhantomBuster + Vayne) at 4-5 days.
9. **Email tone calibrator** — fingerprint tenant's voice from 3 sent emails, constrain Claude going forward. ~2-3 days.
10. **CRM days-in-stage tracker** — corpus emphasizes this drives followup logic. Verify it exists in `apps/crm-pipeline`; if not, ~1 day.

### Low-leverage gaps

11. **Affiliate-link substitution** — Nick's Day 10 lesson. Niche; defer to Q4.
12. **Lifestyle audit / friction tracker** — internal-use only; not a tenant module.
13. **70+ Affiliate Programs sheet** — internal reference for Jake; not a tenant feature.
14. **Niche Discovery Spreadsheet** — Nick's template; could be a tenant onboarding aid but low priority.

---

## Tier positioning — corpus alignment

Currently Naples tiers position by feature breadth. The corpus suggests a re-positioning by **outcome**:

| Tier | Today (feature breadth) | Suggested re-position (outcome-driven) |
|---|---|---|
| Starter $497 | "Solo operator getting organized" | **"Get your first customer in 90 days."** Mirror Nick's guarantee. Modules: crm + booking + backlog + outreach (currently in Growth) + lead_enrichment (new). The corpus is explicit: the minimum viable rail is cold email + CRM + invoicing. Without outreach in Starter, the tier under-delivers on the implicit promise. |
| Growth $997 | "Active business doing sales + content" | **"Scale to $15k/mo from cold email + content."** Modules: + content + sponsor_pitch + email_triage + lead_won_invoice + reply_intent (new). |
| Premium $1997 | "Established business across multiple channels" | **"Run a real recurring business with full ops visibility."** Modules: + dashboard + sponsor_analytics + client_portal + sla_dashboard (new) + onboarding_coach (new). |
| Design Partner $750 (12mo) | "Premium feature set at half price" | Keep — corpus doesn't change this. Limited to first 3 paying tenants. |
| Enterprise | "Custom-priced. Bespoke modules." | Keep — verticals (mia is enterprise-shaped at $1500/mo) |

The corpus is loud on this: **cold email + lead enrichment is the entry-level revenue rail.** Putting outreach in Growth ($997) instead of Starter ($497) means tenants paying $497 can't actually generate leads — they're paying for a CRM with no leads going into it. That's bad for activation.

**Proposed change:** move `outreach` and `lead_enrichment` (new) to Starter. Re-balance by moving `sponsor_pitch` (which is more Naples-specific than corpus-derived) to Growth-only. Or raise Starter to $597-697 to absorb the cost. Decision is Jake's.

---

## Recommended Q3 sequence updates

Reordering the existing porting_plan.md Wave structure based on this audit.

### Q3 Phase 1 (4-6 weeks) — Finish what's started + close the high-leverage gaps

1. **Wave 2 Anymailfinder** — but expand to Lead Enrichment module (multi-source chain, 5-7 days)
2. **Wave 2 PhantomBuster** — but expand to Lead Scraper module (adapter pattern, 4-5 days)
3. **Wave 2 Bland.ai** — for MIA only (2 days, scope unchanged)
4. **NEW: Reply Intelligence sub-flow** (3-4 days) — wires existing modules, doesn't create new tables
5. **NEW: Speed-to-Lead SLA Dashboard** (3 days) — extends email_triage
6. **NEW: Cold Email Compliance & Deliverability** (2-3 days) — extends outreach

### Q3 Phase 2 (3-4 weeks) — Activation flywheel

7. **NEW: Onboarding Coach / Day-N Playbook** (5-7 days) — KEY differentiator
8. **Sequence A/B testing infrastructure** (2 days) — extends outreach
9. **Warmup status surface** (<1 day) — extends outreach
10. **Email tone calibrator** (2-3 days) — extends outreach

### Q3 Phase 3 (4-6 weeks) — Selective Wave 3 with 2026 lens

11. **Wave 3 #12 Podcast repurposing engine** (6-7 days) — keep
12. **Wave 3 #16 IG Reels research feed** (3 days) — keep
13. **Wave 3 #10 RSS news/commentary** (3 days) — keep but de-prioritize

### Q4 — Selective Wave 3 + Wave 4 with cuts

14. ~~Wave 3 #9 Long-form blog generator~~ — **CUT** (2026 SEO doesn't reward AI-generated long-form)
15. ~~Wave 3 #11 YouTube repurposing~~ — **DEFER** (extend existing content-pipeline if a tenant asks)
16. ~~Wave 3 #13 Medium parasite SEO~~ — **CUT** (Medium algorithm penalizes spun content)
17. ~~Wave 3 #14 Twitter parasite SEO~~ — **CUT** (X paywall + reach changes kill the bet)
18. ~~Wave 4 #17 AI Graphic Designer~~ — **CUT** (loses to Canva AI / Adobe Firefly / V0 in 2026)
19. ~~Wave 4 #18 1-Click 1000 Ad Creatives~~ — **CUT** (duplicates RadEnergy's `scale-static-ad-variation-engine`)

### What this trim accomplishes

- ~6 weeks of "stale 2024 tactic" work removed from the roadmap
- ~3-4 new modules added that directly address SaaS-multi-client objectives (enrichment, reply intelligence, onboarding coach, SLA)
- Tier perceived value increases (Starter actually delivers cold-email leads; Premium actually delivers an SLA-grade ops surface)
- Naples positioning tightens: "Nick's 30-day playbook, automated for service businesses" — a frame Kevin and tenants 3+ can immediately understand

### Calendar estimate (1 dev pace, AI-assisted)

| Phase | Effort | Cumulative |
|---|---|---|
| Phase 1 (high-leverage gaps) | 19-24 days | ~5 weeks |
| Phase 2 (activation flywheel) | 9-13 days | ~3 weeks |
| Phase 3 (selective Wave 3) | 12-13 days | ~3 weeks |
| **Total Q3** | **40-50 days** | **~11 weeks** |

For comparison: original porting_plan.md estimated 71-92 days (~6 months) for the full Wave 1-5. This audit trims ~30 days by cutting the stale tactics, while adding the high-leverage gaps. Net: similar effort, much higher SaaS-objective ROI.

---

## Open questions for Jake

These are decisions only Jake can make. Documented here so they don't get lost.

1. **Do we move `outreach` to Starter tier?** It's the highest-leverage corpus-aligned module; putting it in Growth means Starter tenants can't generate leads. Trade-off: Starter price might need to rise to $597-697 to absorb. Or we eat margin on Starter to drive volume.
2. **Do we cut Wave 3 #9, #11, #13, #14 and Wave 4 #17, #18 from the roadmap?** This audit recommends yes (~30 days of work removed). But Jake might want to keep some for tactical reasons not visible to me.
3. **Does the Onboarding Coach module ship before or after Kevin signs?** This audit puts it in Phase 2 (after Wave 2 finishes). If Kevin's pitch is on Friday 2026-05-08 and he signs by end of May, the coach would be ready ~July. Acceptable, but we could pull it forward if it's Kevin-pitch-decisive.
4. **Should we save the cut workflows JSON files for archival?** Currently in `~/Documents/Vibecoding/naples-digital/makerschool/`. Memory says they may be moved back to `~/Documents/Vibecoding/MakerSchool/` later. Suggest keeping them — they cost nothing and the corpus might be useful in 2027 for reasons we can't predict.
5. **Tier 1+2 (Anymailfinder, PhantomBuster) — should we expand scope per this audit's recommendations (Lead Enrichment, Lead Scraper) BEFORE shipping, or ship narrow first then expand?** Trade-off: ship narrow = faster to first tenant value, expand later. Ship broad = better tier positioning, longer to ship.

---

## Strategic take

The MakerSchool corpus is well-suited as a **spec sheet for Naples Digital's tenant playbook** — and roughly half of the porting plan correctly does that. The other half is at risk of building 2024-vintage tactics that don't pay in 2026.

The biggest insight not yet captured anywhere: **Naples Digital is not a "platform that includes some of MakerSchool's modules." Naples Digital is "MakerSchool's 30-day playbook, automated, sold as SaaS to service businesses."** That positioning is sharper than today's catalog implies. It also gives the tier descriptions a much clearer outcome: "Starter = land your first customer in 90 days. Growth = scale to $15k/mo. Premium = run a real recurring business."

If we accept that framing, the roadmap clarifies fast:

- **Cut what's not in the playbook:** Wave 4 graphic designer, 1k ads, parasite SEO, long-form AI blog
- **Build what IS in the playbook but missing:** Lead Enrichment, Lead Scraper, Reply Intelligence, Onboarding Coach, SLA Dashboard
- **Strengthen what's already in the playbook AND in Naples:** Cold Outreach (warmup, A/B, deliverability), Email Triage (reply intent), CRM (days-in-stage), Lead-Won Invoice (already strong)
- **Keep what's Naples-specific (not in playbook) but valuable:** MIA real estate vertical, Sponsor Pitch / Sponsor Analytics, Client Portal, Booking Portal — these don't come from the corpus but are real Naples assets

The remaining strategic question is one Jake's already wrestled with: **is Naples a vertical SaaS for service businesses, or a horizontal SaaS that imitates Nick's playbook?** Today's positioning says vertical. The corpus suggests horizontal. The right answer is probably: **vertical positioning + horizontal feature set, branded as "the playbook for service businesses."** That's defensible because the corpus's ICP (small agencies, freelancers) and Naples's ICP (small service businesses) overlap heavily.

---

## Appendix — what didn't get audited

- The 92 raw video transcripts. The two briefs (`cold_email_brief.md`, `lessons_learned.md`) are exhaustive enough that re-reading source wouldn't change conclusions. If a specific decision hinges on a single transcript, we can `ask.ts` it.
- The 4 currently-failed video transcripts (#34, #35, #36, plus the in-flight one). When they land, the corpus expands by ~3 hours of content. They're per the existing log "business strategy coaching call" content — likely affects the operator-psychology side, not the technical workflows.
- Skool community posts / Discord / private channels. Not transcribed.
- The 70+ Affiliate Programs sheet (Day 10). Not in the corpus deliverables; would need to ingest separately if we want to drive the affiliate-link substitution feature.
- Any updates to MakerSchool published after Feb 2025. The corpus is a snapshot.
