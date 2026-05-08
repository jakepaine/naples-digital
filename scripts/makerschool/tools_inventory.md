# MakerSchool — Tools Inventory

Every tool, platform, or service named across the 296 lessons. Sources: outline §"Tool stack, affiliates & discounts" (16 numbered tools, all with affiliate links), plus mentions throughout Days 1–30 + Resource Library workflow files.

Pricing as of 2026-05. Affiliate links extracted directly from the outline — they are Nick's links (he profits if you sign up through them). For Naples Digital tenant onboarding, **substitute Jake's own affiliate links** — see "70+ Affiliate Programs" Google Sheet referenced on Day 10.

---

## Cold email & deliverability

### Instantly.ai
- **Used for:** cold email sending platform — primary recommendation. Inbox warmup, sending, unibox, webhooks.
- **First appears:** Day 1 (set up cold email & start warmup), recurring through Day 22 (turn on email).
- **Pricing:** paid (subscription). Free trial available.
- **Affiliate URL:** https://instantly.ai/?via=nick-saraev
- **Day 1 tool stack rank:** #1

### Smartlead.ai
- **Used for:** cold email alternative to Instantly. Same workflow.
- **First appears:** Day 1.
- **Pricing:** paid (subscription).
- **Affiliate URL:** https://smartlead.ai?via=nick-saraev
- **Day 1 tool stack rank:** #2

### AnyMailFinder
- **Used for:** email enrichment — turn LinkedIn URL or domain → verified email.
- **First appears:** Day 8 (scraping infrastructure).
- **Pricing:** paid (subscription, credit-based).
- **Affiliate URL:** https://anymailfinder.com?via=nick
- **Day 1 tool stack rank:** #3
- **Workflow files:** `Scrape & Send to Anymailfinder.json`, `Retrieve Enrichment Results & Search for DM.json`.

### Apollo.io
- **Used for:** B2B contact database + email enrichment. Free tier covers many cases.
- **First appears:** Day 8.
- **Pricing:** freemium (free up to 10k credits/month).
- **Affiliate URL:** none directly in outline (just `https://apollo.io/`); Day 10 affiliate spreadsheet has it.
- **Day 1 tool stack rank:** #4

### PhantomBuster
- **Used for:** scraping LinkedIn + Instagram profiles, follower lists, post engagement.
- **First appears:** Day 8.
- **Pricing:** paid (subscription).
- **Affiliate URL:** https://phantombuster.com?deal=noah60
- **Day 1 tool stack rank:** #5
- **Workflow files:** `Instagram_Scraping_with_PhantomBuster.json`, `1. Launch Bulk PhantomBuster Instagram Scraper.json`, `2. Watch Output of Bulk PhantomBuster Instagram Scraper.json`, `3. Launch Individual PhantomBuster Instagram Scraper.json`.

### Apify
- **Used for:** general-purpose web scraping platform. Twitter, LinkedIn, Google Maps, Instagram, Upwork actors.
- **First appears:** Day 8.
- **Pricing:** freemium ("30NS" promo code = 30% off 2 mo). Pay-per-use after free tier.
- **Affiliate URL:** https://apify.com?fpr=nick
- **Day 1 tool stack rank:** #11
- **Workflow files:** `Twitter_Apify_Parasite.json`, `Apify_Scrape_New_Instagram_Reels____Transcribe____Add_to_Sheet.json`, `1. Trigger Apify Run.json`, `2. Watch Actor Runs -> Get Data.json`, `AI Parasite SEO System (Medium).json`.

---

## Proposal & document generation

### PandaDoc
- **Used for:** proposal docs, e-signature, automated proposal flows.
- **First appears:** Day 5 (proposal template).
- **Pricing:** paid (subscription, free trial).
- **Affiliate URL:** https://pandadoc.partnerlinks.io/ar44yghojibe
- **Day 1 tool stack rank:** #6
- **Workflow files:** `AI Proposal Generator Flow (1).json`, `AI Proposal Generator System.json`, `monday_webhook_slides_proposal_generator.json`.

### Typeform
- **Used for:** intake forms (lead capture, hiring application, client onboarding).
- **First appears:** Resource Library + Niche Pack (Recruitment/HR).
- **Pricing:** freemium.
- **Affiliate URL:** none in outline.
- **Day 1 tool stack rank:** #7
- **Workflow files:** `General Application Form Fill -> Add to ClickUp Hiring Pipeline.json`.

---

## CRM & project management

### ClickUp
- **Used for:** CRM, hiring pipeline, project management. Nick's primary recommendation.
- **First appears:** Day 27 (set up CRM).
- **Pricing:** freemium (free tier generous).
- **Affiliate URL:** https://clickup.pxf.io/4PQo61
- **Day 1 tool stack rank:** #8
- **Workflow files:** `CRM_Lead_Won_ClickUp_____Send_Invoice_Stripe.json`, `Payment_Completed_Stripe_____Update_ClickUp___Onboard_on_Trello.json`, `General Application Form Fill -> Add to ClickUp Hiring Pipeline.json`, `Hiring Pipeline Status Changed to "Request Trial" -> Send Email.json`.

### Monday.com
- **Used for:** CRM alternative to ClickUp.
- **First appears:** Day 27.
- **Pricing:** paid (subscription, free trial).
- **Affiliate URL:** https://try.monday.com/1ty9wtpsara2
- **Day 1 tool stack rank:** #9
- **Workflow files:** `monday_webhook_slides_proposal_generator.json`.

### Notion
- **Used for:** docs, wiki, lightweight CRM, knowledge base.
- **First appears:** Day 27 + various.
- **Pricing:** freemium.
- **Affiliate URL:** https://affiliate.notion.so/3viwitl53eg7
- **Day 1 tool stack rank:** #10

### Trello
- **Used for:** lightweight kanban for client onboarding.
- **First appears:** Resource Library workflow.
- **Pricing:** freemium.
- **Affiliate URL:** none in outline.
- **Workflow files:** `Payment_Completed_Stripe_____Update_ClickUp___Onboard_on_Trello.json`.

---

## Automation platforms (the meta-tools)

### Make.com (formerly Integromat)
- **Used for:** the dominant no-code automation platform in this course. 21+ workflow blueprints in the library.
- **First appears:** Day 1 tool stack list; Make Accelerator (16 lessons under "Automation Tutorials").
- **Pricing:** freemium (free tier = 1,000 ops/mo).
- **Affiliate URL:** none in outline.
- **Day 1 tool stack rank:** #12
- **NAPLES DIGITAL NOTE:** course leans heavily on Make. Per Naples Digital rules ("No Make.com / Zapier"), treat Make blueprints as **reference / spec sheet only** — port to native Node services in the platform.

### n8n
- **Used for:** open-source automation platform. Self-hostable. 21+ workflow JSONs in library.
- **First appears:** Day 4 (set up AI agent workspace also references); N8N Accelerator (16 lessons).
- **Pricing:** open-source self-host (free) or n8n Cloud (paid).
- **Affiliate URL:** none in outline.
- **NAPLES DIGITAL NOTE:** also reference-only — modules ported to native Node, per the SaaS pivot decision in `~/Documents/Vibecoding/naples-digital/platform/CLAUDE.md`.

### Claude Code / Codex / Antigravity / Cursor
- **Used for:** AI agent workspace for building automations + custom code.
- **First appears:** Day 4.
- **Pricing:** Claude Code = paid (Anthropic API or subscription); Codex = free (OpenAI); Cursor = freemium; Antigravity = free.
- **Affiliate URL:** none.

### Botpress
- **Used for:** chatbot builder.
- **First appears:** Day 1 tool stack list (#14).
- **Pricing:** freemium.
- **Affiliate URL:** none in outline.

---

## Design & creative

### Bannerbear
- **Used for:** programmatic image generation (ad creatives, social cards).
- **First appears:** Day 1 tool stack list (#13).
- **Pricing:** paid (subscription).
- **Affiliate URL:** none in outline.

### DALL-E (OpenAI)
- **Used for:** AI image generation in workflows (logo, ad creatives, blog featured images).
- **First appears:** workflow files `1_Click___1000_Ad_Creatives_Agent.json`, `AI_Graphic_Designer.json`, `AI Content Generator.json`.
- **Pricing:** paid (per-image API).
- **Affiliate URL:** none.

### Webflow
- **Used for:** website builder (heavier than Carrd).
- **First appears:** Day 1 tool stack list (#15); Day 12 (create website).
- **Pricing:** freemium (paid for custom domain + advanced).
- **Affiliate URL:** none in outline.

### Carrd
- **Used for:** single-page website builder. Recommended for Day 12.
- **First appears:** Day 1 tool stack list (#16); Day 12.
- **Pricing:** freemium ($19/yr Pro).
- **Affiliate URL:** none in outline.

---

## AI / LLMs

### Anthropic Claude
- **Used for:** primary LLM in workflows for content generation, classification, proposal writing.
- **First appears:** throughout. Naples Digital uses Claude Sonnet 4.6 platform-wide.
- **Pricing:** paid (per-token API).
- **Affiliate URL:** none.

### OpenAI / GPT
- **Used for:** alternative LLM in many course workflows (especially older ones).
- **First appears:** Day 1 (ChatGPT for naming).
- **Pricing:** paid + ChatGPT Plus subscription.
- **Affiliate URL:** none.

### Whisper API (OpenAI)
- **Used for:** audio/video transcription in repurposing workflows.
- **First appears:** workflow files `AI PODCAST REPURPOSING ENGINE 1.json`, `YouTube Repurposing w Unique Changes.json`, `Apify_Scrape_New_Instagram_Reels____Transcribe____Add_to_Sheet.json`.
- **Pricing:** paid (per-minute API).
- **Affiliate URL:** none.
- **NAPLES DIGITAL NOTE:** for the Naples Digital `transcription` package, prefer Gemini 2.5 Flash native video understanding (no separate audio extraction step).

### Gemini (Google)
- **Used for:** mentioned occasionally as Claude alternative.
- **Pricing:** freemium (very generous free tier).
- **Affiliate URL:** none.

### ElevenLabs
- **Used for:** AI voice generation (mentioned in Resource Library, podcast workflows).
- **Pricing:** freemium.
- **Affiliate URL:** none.

### Bland.ai
- **Used for:** AI-powered outbound phone calls.
- **First appears:** workflow `Bland_ai_Call.json`.
- **Pricing:** paid (per-minute API).
- **Affiliate URL:** none.

---

## Payments

### Stripe
- **Used for:** payment processor. "Most automation-friendly" per Nick.
- **First appears:** Day 6 (set up payment processor).
- **Pricing:** transaction-based (2.9% + 30¢ standard).
- **Affiliate URL:** none.
- **Workflow files:** `CRM_Lead_Won_ClickUp_____Send_Invoice_Stripe.json`, `Payment_Completed_Stripe_____Update_ClickUp___Onboard_on_Trello.json`, `1. Automatic Invoice Collection.json`.

---

## Time tracking

### Rize.io
- **Used for:** automatic time tracking with AI categorization.
- **First appears:** Day 3.
- **Pricing:** paid (subscription, promo code "NICK").
- **Affiliate URL:** https://rize.io?via=LEFTCLICKAI

### Toggl
- **Used for:** manual time tracking.
- **First appears:** Day 3.
- **Pricing:** freemium.
- **Affiliate URL:** https://toggl.com/?via=nick

### Harvest
- **Used for:** time tracking with invoicing.
- **First appears:** Day 3.
- **Pricing:** freemium.
- **Affiliate URL:** none in outline (just https://www.getharvest.com/).

---

## Sales call recording

### Fireflies.ai
- **Used for:** call recording + AI summarization.
- **First appears:** Day 4.
- **Pricing:** freemium (free 800 min/mo).
- **Affiliate URL:** https://fireflies.ai/?fpr=nick33
- **NAPLES DIGITAL NOTE:** already used in radenergy-os per cross-project rules.

### Fathom
- **Used for:** alternative call recording.
- **First appears:** Day 4.
- **Pricing:** freemium.
- **Affiliate URL:** none in outline.

### Loom
- **Used for:** screen recording for Upwork application videos. Core tool — every Upwork app uses Loom.
- **First appears:** Day 3.
- **Pricing:** freemium (Loom Pro recommended for unlimited videos).
- **Affiliate URL:** none.

---

## Naming / domains

### Namelix
- **Used for:** AI business name generator.
- **First appears:** Day 1.
- **Pricing:** free.
- **URL:** https://namelix.com/

### NameSnack
- **Used for:** name generator alternative.
- **First appears:** Day 1.
- **Pricing:** free.
- **URL:** https://www.namesnack.com/

---

## Communities & content distribution

### Skool
- **Used for:** community platform. Where MakerSchool itself runs. Day 3 says "join niche communities" → Skool Discovery is the search.
- **First appears:** Day 3.
- **Pricing:** freemium (host free; communities can charge).
- **Affiliate URL:** none.

### Discord
- **Used for:** alternative community platform.
- **First appears:** Day 3.
- **Pricing:** free.
- **Affiliate URL:** none.

### Slack
- **Used for:** notifications + ops alerting in workflows.
- **First appears:** workflow files passim.
- **Pricing:** freemium.
- **Affiliate URL:** none.

### WordPress
- **Used for:** blog publishing target in many content workflows.
- **First appears:** workflow files `YouTube to Blog Post Generator.json`, `AI Content Generator.json`, `Parasite_Medium_SEO_System.json`.
- **Pricing:** freemium (self-host = free; WP.com hosted = paid).
- **Affiliate URL:** none.

### Medium
- **Used for:** parasite SEO target — publish duplicated content to capture Medium's domain authority.
- **First appears:** workflow `Parasite_Medium_SEO_System.json`, `AI Parasite SEO System (Medium).json`.
- **Pricing:** free to publish.
- **Affiliate URL:** none.

### YouTube
- **Used for:** content source (repurposing) and content target.
- **Workflow files:** `YouTube Repurposing w Unique Changes.json`, `YouTube to Blog Post Generator.json`, `1__YouTube_Trend_Detector__Add_Update.json`, `2__YouTube_Trend_Detector__Daily_Digest.json`.
- **Pricing:** free.
- **Affiliate URL:** none.

---

## Storage & spreadsheets

### Google Sheets / Docs / Drive / Slides
- **Used for:** universal data store across the entire course. Almost every workflow writes to a Google Sheet.
- **Pricing:** free.
- **Affiliate URL:** none.

---

## Text-replacement / productivity (Day 3)

### macOS Text Replacements
- **Used for:** snippet expansion for Upwork application templates on Mac.
- **Pricing:** free (built-in).

### AutoHotkey (AHK)
- **Used for:** Windows snippet expansion.
- **Pricing:** free, open-source.

### Beeftext
- **Used for:** Windows snippet expansion alternative.
- **Pricing:** free, open-source.

### Espanso
- **Used for:** cross-platform snippet expansion.
- **Pricing:** free, open-source.

---

## Naples Digital alignment

Tools already in the Naples Digital stack (per `platform/CLAUDE.md`):
- **Anthropic Claude** (Sonnet 4.6) — primary LLM
- **Stripe** — billing
- **Slack + Gmail** — alerts (course uses both)
- **Fireflies.ai** — call transcripts (course uses)
- **Supabase** — DB (course uses Google Sheets; Naples Digital uses Supabase tables instead)

Tools the course recommends but the platform should NOT adopt (per Naples Digital rules):
- **Make.com / Zapier** — banned for product code; reference-only
- **n8n** — same; banned for tenant deployments per the pivot brief

Tools to consider adding to Naples Digital stack for the 3 named module gaps:
- **Instantly + Smartlead** (already integrated as outreach providers per the existing outreach modules)
- **Anymailfinder + Apollo** — for the Cold Outreach module's enrichment step
- **PhantomBuster + Apify** — for lead-scraper sub-module
- **PandaDoc** — for the proposal generator module (Day 5 workflow)
