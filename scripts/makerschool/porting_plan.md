# MakerSchool → Naples Digital — Porting Plan

A concrete blueprint for rebuilding every relevant Make.com / n8n workflow as a native Naples Digital module. Source data: `makerschool_workflows` (67 entries with full JSON configs in `makerschool_workflows.config`).

**Total scope:** 67 workflows in the corpus. After dedup and relevance scoring:
- **14 HIGH-relevance ports** (fills named gaps or augments existing modules)
- **31 MEDIUM-relevance ports** (useful patterns, longer tail)
- **22 SKIP** (Upwork-freelance, tutorial blueprints, hardware/noise)

**Architecture rules** (from `platform/CLAUDE.md`):
- Multi-tenancy non-negotiable: every domain table gets `tenant_id`
- Per-tenant secrets (Stripe key, Instantly key, etc.) → Supabase Vault via `tenant_integrations` + `set_tenant_secret` / `get_tenant_secret`
- LLM = Claude Sonnet 4.6 (replace OpenAI/GPT references in source workflows)
- Audio/video transcription = Gemini 2.5 Flash (replace Whisper)
- No Make.com / Zapier / n8n in production
- Each module = its own `apps/` package on Railway

---

## Wave 1 — Gap fillers (highest priority)

Three named gaps in the platform CLAUDE.md, all directly addressable.

### 1. `apps/email-triage` — fills "Email Triage" gap ✅ **scaffolded**
**Source workflows:** `Email_Categorization_System.json`, `Email_Autoresponder.json`, `email_autoresponder (1) (5).json`

**Target architecture:**
- Webhook on `/api/inbound` from per-tenant Gmail/Outlook integration
- Classifier in `lib/classify.ts` (already scaffolded — Claude Sonnet 4.6)
- Categories: `high_priority` / `partnerships` / `support` / `newsletter` / `spam`
- Score 0–100 + reason
- Optional auto-reply via `lib/auto-reply.ts` (build next)
- Persists to new `emails` table: `tenant_id`, `subject`, `from_addr`, `body`, `category`, `score`, `reason`, `auto_replied`, `received_at`

**New tables (migration 0013):** `emails`, `email_classifications` (audit trail of re-classifications)

**Per-tenant integrations:** Gmail OAuth (or IMAP), optional Slack webhook for high-priority alerts.

**Estimated days:** 4–5 (live email integration + UI to triage manually + Slack alerts)

**What's done:** scaffold, classifier, mock inbox UI, /api/classify route.
**What's left:** real Gmail integration, persistence, auto-reply, Slack alerts.

---

### 2. `apps/content-syndication` — fills "Content Syndication" gap ✅ **scaffolded**
**Source workflows:** `Content Syndication onto Twitter, Facebook, Instagram, LinkedIn, and Medium (1).json` + variant; secondary: `Parasite_Medium_SEO_System.json`, `Twitter_Apify_Parasite.json`, `LinkedIn_Parasite_System_in_n8n (1).json`

**Target architecture:**
- Composer UI takes `{ title, body, sourceUrl }` (already scaffolded)
- `lib/tailor.ts` calls Claude to produce one variant per platform with platform-specific char limits + tone (already scaffolded)
- `/api/publish/{platform}` per-platform routes that read tenant Vault for the platform's API token
- Persists drafts to new `content_posts` table; publishes update `published_at` per platform

**New tables (migration 0014):** `content_posts` (one row per source post), `content_variants` (one row per platform per source)

**Per-tenant integrations:** Twitter API v2, LinkedIn API, Meta Graph (FB+IG), Medium API, optionally WordPress for source ingestion. Each goes in `tenant_integrations` with `secret_ref` pointing to Vault.

**Estimated days:** 6–8 (5 platform integrations + UI to schedule/publish + per-tenant credential mgmt UI)

**What's done:** scaffold, tailor logic, mock composer UI, /api/tailor route.
**What's left:** the 5 platform publishers, scheduling, persistence.

---

### 3. `apps/lead-won-invoice` — fills "Stripe Lead-Won → Invoice" gap ✅ **scaffolded**
**Source workflows:** `CRM_Lead_Won_ClickUp_____Send_Invoice_Stripe.json`, `Payment_Completed_Stripe_____Update_ClickUp___Onboard_on_Trello.json`, `1. Automatic Invoice Collection (1) (1).json`

**Target architecture:**
- Watches CRM Pipeline for status change to "Won" → calls `lib/generate-invoice.ts`
- Pulls tenant's Stripe key from Vault
- Creates Stripe Invoice + InvoiceItems → finalizes → emails customer
- Webhook from Stripe `payment_intent.succeeded` → updates lead status → triggers onboarding workflow
- Onboarding = create row in `client_onboarding_tasks`, send welcome email via Resend, optional Slack alert

**New tables (migration 0015):** `lead_won_invoices` (Stripe invoice IDs + status mirror), `client_onboarding_tasks`

**Per-tenant integrations:** Stripe (per-tenant Connected Account or per-tenant API key), Resend already platform-wide.

**Estimated days:** 5–6 (Stripe invoice creation + webhook handling + onboarding hooks + UI to override line items)

**What's done:** scaffold, mock leads UI, /api/generate-invoice route with stub Stripe URLs.
**What's left:** real Stripe integration, webhook handling, onboarding hooks.

---

## Wave 2 — Quick wins (S effort, high pattern reuse)

These augment **existing** modules. No new app needed.

### 4. Anymailfinder enrichment → Cold Outreach
**Source:** `Scrape & Send to Anymailfinder.json`, `Retrieve Enrichment Results & Search for DM.json`

**Goal:** Inside `apps/outreach-dispatcher`, add an `enrich-leads.ts` step that:
1. Takes a list of LinkedIn URLs / domains from `outreach_leads`
2. Batches to Anymailfinder (per-tenant API key from Vault)
3. Filters by job title (CEO, Sales Mgr, etc.)
4. Updates `outreach_leads.email` + sets `enriched_at`

**Estimated days:** 1–2

---

### 5. Form intake → CRM Pipeline
**Source:** `General Application Form Fill -_ Add to ClickUp Hiring Pipeline.json`

**Goal:** Inside `apps/crm-pipeline`, add a `/api/inbound-form` route accepting Typeform-shaped webhooks. Maps form fields → custom fields on a new lead. Sends Slack alert.

**Estimated days:** 1

---

### 6. Status-change → templated email
**Source:** `Hiring Pipeline Status Changed to _Request Trial_ -_ Send Email.json`

**Goal:** Inside `apps/crm-pipeline`, add a generic "on status change → email template" trigger. Tenant configures: which from-status → which to-status → which email template.

**Estimated days:** 2

---

### 7. PhantomBuster IG/LinkedIn scraper → Outreach (sub-module)
**Source:** `Instagram_Scraping_with_PhantomBuster.json`, `1. Launch Bulk PhantomBuster Instagram Scraper.json` (+ Step 2), `1. LinkedIn DM Outreach System.json`

**Goal:** New `packages/scraping/` shared package with adapters for PhantomBuster IG + LinkedIn search → writes to `outreach_leads`. Used by Cold Outreach module.

**Estimated days:** 2–3

---

### 8. Bland.ai phone-call kickoff → MIA Real Estate
**Source:** `Bland_ai_Call.json`

**Goal:** Inside `apps/mia` (real estate vertical), add a "qualify lead" step that calls Bland.ai with a vertical-specific script. MIA already has Apify cron; phone outreach is the next leg.

**Estimated days:** 2

---

## Wave 3 — Content Pipeline expansion (M/L effort)

These extend `apps/content-pipeline`. The platform already has episode → transcript → AI clip-picks → 9:16 render. These add adjacent capabilities.

### 9. Long-form blog generator
**Source:** `AI Content Generator (3).json` (Make), `AI_Content_Generator.json` (n8n simpler), `Deep Content Generator.json`

**Goal:** Generate 2,000–3,000 word SEO blog posts from a topic+keyword. Outputs Markdown + DALL-E (or replacement) featured image + 3–5 social variants. Publishes to WordPress (or Ghost) via per-tenant integration.

**Estimated days:** 4–5

### 10. RSS-driven news/commentary loop
**Source:** `Cyclic Content Generator.json` (both variants)

**Goal:** Per-tenant RSS feeds → daily/weekly digest with commentary → posts to social.

**Estimated days:** 3

### 11. YouTube → blog repurposing
**Source:** `YouTube Repurposing w Unique Changes.json`, `YouTube to Blog Post Generator (1) (1).json` + n8n variant

**Goal:** Watches a tenant YouTube channel; downloads new uploads; transcribes via Gemini (replacing Whisper); generates blog post + featured image; publishes to tenant WordPress.

**Estimated days:** 5–6

### 12. Podcast repurposing engine
**Source:** `AI PODCAST REPURPOSING ENGINE 1.json` + `2.json`

**Goal:** Watches a tenant podcast RSS; transcribes; produces blog variants + 10+ short-form clips + LinkedIn article. Multi-platform publish.

**Estimated days:** 6–7

### 13. Medium parasite SEO
**Source:** `Parasite_Medium_SEO_System.json`, `AI Parasite SEO System (Medium) (1).json`

**Goal:** Per-tenant: scrape trending Medium articles in a topic → Claude generates unique angle → publishes new Medium post → syndicates to Twitter/LinkedIn → tracks referral traffic.

**Estimated days:** 4–5

### 14. Twitter parasite SEO
**Source:** `Twitter_Apify_Parasite.json`

**Goal:** Per-tenant: scrape top tweets in a niche → reformat with own commentary → schedules to tenant's Twitter.

**Estimated days:** 3

### 15. Facebook Ad Library spy
**Source:** `AI_Facebook_Ad_Spy_Tool (1).json`

**Goal:** Per-tenant competitive intel: scrape FB Ad Library by niche → extract winning ad patterns → report to tenant. Supports both Sponsor Analytics (for tenants running ads) and the SCALE-style brief generation.

**Estimated days:** 3–4

### 16. Instagram Reels research feed
**Source:** `Apify_Scrape_New_Instagram_Reels____Transcribe____Add_to_Sheet (2).json`

**Goal:** Per-tenant: scrape Reels from configured accounts → transcribe via Gemini (replacing Whisper) → store with hashtags + captions. Feeds Content Pipeline.

**Estimated days:** 3

---

## Wave 4 — Sponsor Pitch enhancements (L effort)

### 17. AI Graphic Designer master + sub-workflows
**Source:** `AI_Graphic_Designer (1).json` + 5 sub-workflows (Logo, Style Guide, Image Spinner, Gradient, Design Editor)

**Goal:** Inside `apps/sponsor-pitch`, add a "brand assets" tab that takes product description + brand input and outputs logo variations + style guide + revised designs.

**Estimated days:** 7–10

### 18. 1-Click 1000 Ad Creatives
**Source:** `1_Click___1000_Ad_Creatives_Agent.json`

**Goal:** Agentic loop: 100+ headlines via Claude → 1,000+ images via image model → samples + ranks → outputs top 50 to tenant Drive.

**Estimated days:** 5–7

---

## Wave 5 — Proposal Generator (independent app)

### 19. `apps/proposal-generator`
**Source:** `AI Proposal Generator Flow (1).json`, `AI Proposal Generator System.json`, `monday_webhook_slides_proposal_generator.json`

**Goal:** Standalone module. Form/CRM intake → Claude writes proposal → PDF (PandaDoc-compatible template OR PDF.co) OR Google Slides → email → CRM update + Slack alert.

**Estimated days:** 5–6

**Per-tenant integrations:** PandaDoc (or Google Slides), Resend, optional ClickUp/Monday for source.

---

## Skip list

These are **not** worth porting. Either Upwork-freelance specific (out of vertical), tutorial-only, or duplicates.

| Filename | Why skip |
|---|---|
| `AI_Automated_Resume_System.json` | Upwork-freelance |
| `Upwork_Scraper.json` | Upwork-freelance |
| `Updated Upwork _RSS_ Feed.json` | Upwork-freelance |
| `1__YouTube_Trend_Detector__Add_Update.json` | Low-value content research |
| `YouTube_Trend_Detector__Add_Update.json` | Same as above (variant) |
| `2__YouTube_Trend_Detector__Daily_Digest.json` | Low-value digest |
| `3. Launch Individual PhantomBuster Instagram Scraper.json` | Single-account variant; bulk version covers it |
| All 7 Make.com Accelerator tutorials | Educational, not production |
| All 6 n8n "Your Nth workflow" tutorials | Educational, not production |

---

## Total effort summary

| Wave | Workflows | Effort | Calendar (1 dev, 60% pace) |
|---|---|---|---|
| 1 — Gap fillers | 3 modules (E-T, C-S, L-W-I) | 15–19 days | ~5 weeks |
| 2 — Quick wins | 5 augmentations | 8–11 days | ~3 weeks |
| 3 — Content Pipeline | 8 modules | 31–39 days | ~9 weeks |
| 4 — Sponsor Pitch | 2 modules | 12–17 days | ~4 weeks |
| 5 — Proposal Generator | 1 module | 5–6 days | ~2 weeks |
| **Total**           | **19 ports** | **71–92 days** | **~6 months** |

If parallelized to 2–3 devs (Jake + Noah + AI assistance), drops to ~2–3 months.

## Recommended Q3 sequence

1. **Week 1–2:** Finish Wave 1 ground floors (live integrations, not just scaffolds). Live before Kevin signs.
2. **Week 3–4:** Wave 2 quick wins. Ships marginal value continuously.
3. **Week 5–8:** Wave 3 — long-form blog + YouTube repurposing (top 2 of Wave 3).
4. **Week 9–12:** Wave 5 — Proposal Generator. Then Wave 3 remainder.
5. **Q4:** Wave 4 (graphic designer) — most expensive, lowest urgency.
