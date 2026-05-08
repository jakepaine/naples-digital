# MakerSchool — Workflows Library

Plain-English summary of every unique Make.com / n8n workflow JSON in `~/Documents/Vibecoding/naples-digital/makerschool/`. Hash-deduped. Files were originally in `~/Documents/Vibecoding/MakerSchool/`; moved into the project root for sandbox access.

**Naples Digital relevance** is rated against the existing module catalog (CRM, Cold Outreach, Content Pipeline, Sponsor Pitch, Sponsor Analytics, Booking Portal, Backlog, Client Portal, Operations Dashboard, MIA Real Estate) and the **3 named gaps** flagged for porting:
1. Content Syndication (1 post → IG/FB/Twitter/LinkedIn/Medium)
2. Email Triage / Categorization
3. Stripe-backed Lead-Won → auto-invoice

Per repo rules: **port the patterns, don't deploy the blueprints.** Make + n8n are reference-only.

---

## Production workflows

### 1. Content Syndication onto Twitter, Facebook, Instagram, LinkedIn, and Medium
- **File:** `Content Syndication onto Twitter, Facebook, Instagram, LinkedIn, and Medium (1).json` + ASCII variant `Content_Syndication_onto_Twitter__Facebook__Instagram__LinkedIn__and_Medium.json`
- **Platform:** Make.com
- **What it does:** When a blog post is published (WordPress webhook or manual trigger), tailors copy per-platform (character limits, tone, hashtags), and posts simultaneously to all 5 platforms. Tracks engagement.
- **Trigger:** WordPress `post_published` webhook OR manual run with post URL.
- **Inputs:** blog post URL + content + featured image.
- **Outputs:** 5 platform-specific posts; engagement-tracking row in Google Sheets.
- **Apps:** WordPress, Twitter, Facebook, Instagram, LinkedIn, Medium, Google Sheets.
- **Complexity:** Complex (~20 modules, per-platform branches).
- **Naples Digital relevance:** **HIGH — directly fills gap #1 (Content Syndication).** Port to a `content-syndication` module under Content Pipeline. The 5-platform API integration is the main work; the rest is template-fill.
- **Port effort:** M.

### 2. Email Categorization System
- **File:** `Email_Categorization_System.json`
- **Platform:** n8n
- **What it does:** Watches Gmail/Outlook inbox, AI-classifies incoming emails into priority buckets (high = sales lead, medium = partnership, low = notification, spam = auto-delete), applies labels, routes to folders.
- **Trigger:** Gmail webhook on new email.
- **Inputs:** subject, body, sender domain.
- **Outputs:** category label, folder move, lead score.
- **Apps:** Gmail, OpenAI, Google Sheets (for category rules).
- **Complexity:** Medium (~12 nodes).
- **Naples Digital relevance:** **HIGH — directly fills gap #2 (Email Triage).** Port to an `email-triage` module. Use Gmail API + Claude (not OpenAI) to match platform LLM standard.
- **Port effort:** M.

### 3. Email Autoresponder
- **File:** `Email_Autoresponder.json` (450 KB)
- **Platform:** n8n
- **What it does:** Watches inbox, classifies email intent (sales, support, automation request), sends templated AI responses based on intent. Logs to Google Sheets.
- **Trigger:** Gmail / Sendgrid webhook.
- **Inputs:** email body + recipient.
- **Outputs:** auto-reply email, sheet log, optional Slack alert.
- **Apps:** Gmail, OpenAI, Google Sheets, Slack.
- **Complexity:** Complex (~20 nodes, multiple conditional branches).
- **Naples Digital relevance:** **HIGH** — pairs with Email Categorization to complete the triage module. Auto-reply for known intents (FAQs, scheduling) saves tenant time.
- **Port effort:** M.

### 4. Email Autoresponder (alt variant)
- **File:** `email_autoresponder (1) (5).json` (43 KB) — different hash; smaller alternative.
- **Platform:** n8n
- **What it does:** Lighter version of #3. Same shape, fewer branches.
- **Naples Digital relevance:** Reference only — pick the larger one as the spec.
- **Port effort:** —.

### 5. Instantly.ai Auto-Reply Bot
- **File:** `Instantly.ai Auto-Reply Bot.json`
- **Platform:** n8n
- **What it does:** Watches Instantly cold-email campaign for replies/bounces, classifies reply intent (interested / not interested / more info needed), scores lead, updates ClickUp with priority; auto-replies to bounces requesting alternative contact.
- **Trigger:** Instantly webhook (reply received OR bounce).
- **Inputs:** reply body, sender, original campaign metadata.
- **Outputs:** auto-response email, lead score, ClickUp priority update.
- **Apps:** Instantly, Email, ClickUp, AI classifier.
- **Complexity:** Medium (~12 nodes).
- **Naples Digital relevance:** **HIGH** — augments existing Cold Outreach module. The platform already has `outreach-dispatcher`; add a `reply-classifier` step.
- **Port effort:** M.

### 6. CRM Lead Won → Send Invoice (Stripe)
- **File:** `CRM_Lead_Won_ClickUp_____Send_Invoice_Stripe.json`
- **Platform:** Make.com
- **What it does:** Watches ClickUp for task status → "Lead Won". Generates invoice from template (custom fields = client name, services, amount), sends to client email, creates Stripe payment link, updates ClickUp with invoice #.
- **Trigger:** ClickUp watch task status change.
- **Inputs:** ClickUp task with custom fields (client info, line items).
- **Outputs:** invoice PDF, Stripe payment link, email sent, ClickUp updated.
- **Apps:** ClickUp, PandaDoc or PDF.co, Stripe, Email, Google Sheets.
- **Complexity:** Medium (~12 modules).
- **Naples Digital relevance:** **HIGH — directly fills gap #3 (Stripe Lead-Won → invoice).** Port to a `lead-won-invoice` module. Replace ClickUp watch with CRM Pipeline status change → tenant's Stripe account.
- **Port effort:** M.

### 7. Payment Completed (Stripe) → Update ClickUp + Onboard on Trello
- **File:** `Payment_Completed_Stripe_____Update_ClickUp___Onboard_on_Trello.json`
- **Platform:** n8n
- **What it does:** Stripe `payment_intent.succeeded` webhook → updates ClickUp task to "Payment Received", creates Trello onboarding card, sends welcome email.
- **Trigger:** Stripe webhook.
- **Inputs:** payment metadata.
- **Outputs:** ClickUp task update, Trello card, welcome email.
- **Apps:** Stripe, ClickUp, Trello, Email, Google Sheets.
- **Complexity:** Medium (~10 nodes).
- **Naples Digital relevance:** **HIGH** — second half of gap #3. After invoice is paid, onboard. In Naples Digital, this triggers Client Portal provisioning.
- **Port effort:** M.

### 8. Automatic Invoice Collection
- **File:** `1. Automatic Invoice Collection (1) (1).json` (106 KB)
- **Platform:** Make.com
- **What it does:** Watches Stripe for payment_succeeded, generates invoice PDF, sends thank-you email, creates ClickUp fulfillment task, Slack alerts fulfillment team.
- **Trigger:** Stripe webhook.
- **Inputs:** payment metadata (line items, customer, amount).
- **Outputs:** invoice PDF, email, ClickUp task, Slack alert.
- **Apps:** Stripe, PandaDoc/PDF.co, Email, ClickUp, Slack.
- **Complexity:** Medium (~10 modules).
- **Naples Digital relevance:** **HIGH** — same gap #3 area; merge with #7 patterns when porting.
- **Port effort:** M.

### 9. Automated Followup System
- **File:** `Automated Followup System.json` (267 KB)
- **Platform:** Make.com
- **What it does:** Multi-step lead followup: watches Instantly for opens/clicks, triggers 1st followup after 3 days no-response, 2nd at 7 days, 3rd at 14 days. Customizes by which links were clicked. Logs to CRM.
- **Trigger:** Instantly webhook (open/click) OR scheduled time check.
- **Inputs:** lead email, initial campaign content.
- **Outputs:** followup emails, CRM log, engagement score.
- **Apps:** Instantly, Email, ClickUp/Notion, Google Sheets.
- **Complexity:** Complex (~25 modules).
- **Naples Digital relevance:** **HIGH** — extends Cold Outreach module. The 3-stage cadence is the spec.
- **Port effort:** M.

### 10. AI Proposal Generator Flow
- **File:** `AI Proposal Generator Flow (1).json` (110 KB)
- **Platform:** Make.com
- **What it does:** Form submission → extracts lead info → Claude writes scope/timeline/pricing → generates PDF from template → sends to client → logs in ClickUp → Slack notification.
- **Trigger:** Typeform / form webhook.
- **Inputs:** lead form data.
- **Outputs:** proposal PDF, email, ClickUp task.
- **Apps:** Form platform, Claude, PDF.co, Email, ClickUp, Slack.
- **Complexity:** Medium (~12 modules).
- **Naples Digital relevance:** **HIGH** — Day 5 of the playbook. Port as a new `proposal-generator` module. PandaDoc-or-PDF templating in Node is straightforward.
- **Port effort:** M.

### 11. AI Proposal Generator System (variant)
- **File:** `AI Proposal Generator System.json` (32 KB)
- **Platform:** Make.com
- **What it does:** Same as #10 but smaller / cleaner. Watch ClickUp task creation → Claude generates → PandaDoc PDF → email.
- **Naples Digital relevance:** HIGH — use as the simpler reference implementation.
- **Port effort:** M.

### 12. Monday Webhook → Slides Proposal Generator
- **File:** `monday_webhook_slides_proposal_generator (1) (1).json`
- **Platform:** Make.com
- **What it does:** Monday.com webhook → fills a Google Slides template with deal details → sends presentation link to client.
- **Apps:** Monday.com, Google Slides, Email.
- **Complexity:** Simple-medium.
- **Naples Digital relevance:** MEDIUM — overlaps with #10/#11. Slides instead of PDF is a valid tenant preference.
- **Port effort:** S.

### 13. General Application Form Fill → Add to ClickUp Hiring Pipeline
- **File:** `General Application Form Fill -_ Add to ClickUp Hiring Pipeline.json`
- **Platform:** Make.com
- **What it does:** Typeform → ClickUp task in "Hiring Pipeline" with applicant data as custom fields → confirmation email → Slack alert to hiring team.
- **Apps:** Typeform, ClickUp, Email, Slack.
- **Complexity:** Simple (~8 modules).
- **Naples Digital relevance:** LOW for hiring directly, but the pattern (form → CRM with custom fields → notify) is reusable for any **lead intake** in CRM Pipeline. Day 27 maps here.
- **Port effort:** S.

### 14. Hiring Pipeline Status → "Request Trial" → Email
- **File:** `Hiring Pipeline Status Changed to _Request Trial_ -_ Send Email.json`
- **Platform:** Make.com
- **What it does:** ClickUp task moves to "Request Trial" status → templated email to applicant → updates ClickUp with timestamp.
- **Apps:** ClickUp, Email.
- **Complexity:** Simple (~6 modules).
- **Naples Digital relevance:** LOW (hiring); pattern reusable for **status-change-triggered emails** in CRM (e.g., "Discovery Call Booked" → send prep doc).
- **Port effort:** S.

### 15. Scrape & Send to Anymailfinder
- **File:** `Scrape & Send to Anymailfinder.json`
- **Platform:** n8n
- **What it does:** Domain list → batch query Anymailfinder for emails → filter by job title (CEO, Sales Mgr) → export to Sheets.
- **Apps:** Anymailfinder, Google Sheets.
- **Complexity:** Simple (~7 nodes).
- **Naples Digital relevance:** **HIGH** — email enrichment for Cold Outreach. Tenant provides domain list; system fills emails.
- **Port effort:** S.

### 16. Retrieve Enrichment Results & Search for DM
- **File:** `Retrieve Enrichment Results & Search for DM.json`
- **Platform:** n8n
- **What it does:** Takes scraped LinkedIn profiles, enriches each with Anymailfinder, secondary search via Apollo/Hunter, prepares CSV for cold email.
- **Apps:** Anymailfinder, Apollo (or Hunter), Google Sheets.
- **Complexity:** Medium (~12 nodes).
- **Naples Digital relevance:** **HIGH** — pairs with #15 to complete enrichment.
- **Port effort:** M.

### 17. LinkedIn DM Outreach System (Step 1)
- **File:** `1. LinkedIn DM Outreach System (1).json`
- **Platform:** n8n
- **What it does:** Step 1 of a multi-step LinkedIn outreach: triggers PhantomBuster scrape of LinkedIn profiles by job-title query, dumps to Sheets for Step 2.
- **Apps:** PhantomBuster, Google Sheets.
- **Complexity:** Simple (~6 nodes).
- **Naples Digital relevance:** MEDIUM — LinkedIn DM is a different rail than email outreach; would extend Cold Outreach with a LinkedIn provider.
- **Port effort:** S.

### 18. LinkedIn Parasite System in n8n
- **File:** `LinkedIn_Parasite_System_in_n8n (1).json`
- **Platform:** n8n
- **What it does:** Scrapes trending LinkedIn content by keyword via Apify, classifies, republishes as own posts (parasite SEO on LinkedIn) for inbound leads.
- **Apps:** Apify, LinkedIn API.
- **Complexity:** Medium (~12 nodes).
- **Naples Digital relevance:** MEDIUM — alternative content-syndication strategy. Reference for Sponsor Pitch / Content Pipeline LinkedIn track.
- **Port effort:** M.

### 19. AI Parasite SEO System (Medium)
- **File:** `AI Parasite SEO System (Medium) (1).json` (130 KB)
- **Platform:** n8n
- **What it does:** Scrapes trending Medium articles by topic → Claude generates unique spin → publishes new post on Medium → syndicates to Twitter/LinkedIn → tracks referral traffic.
- **Apps:** Medium API, Claude, Twitter, LinkedIn, Google Analytics.
- **Complexity:** Complex (~22 nodes).
- **Naples Digital relevance:** MEDIUM — variant of gap #1 (syndication). Useful pattern, lower priority.
- **Port effort:** L.

### 20. Parasite Medium SEO System
- **File:** `Parasite_Medium_SEO_System.json`
- **Platform:** Make.com (68 KB)
- **What it does:** Reformats blog posts for Medium (shorter paragraphs, bold key phrases, 5–10 tags), publishes to Medium, logs URL.
- **Apps:** WordPress (source), Medium, Google Sheets.
- **Complexity:** Simple (~10 modules).
- **Naples Digital relevance:** MEDIUM — narrower variant of #19; useful for the Medium leg of gap #1.
- **Port effort:** S.

### 21. Twitter Apify Parasite
- **File:** `Twitter_Apify_Parasite.json` (104 KB)
- **Platform:** Make.com
- **What it does:** Scrapes top tweets by keyword via Apify → reformats with own commentary → schedules posts to your Twitter. Tracks engagement.
- **Apps:** Apify, Twitter API, Google Sheets.
- **Complexity:** Medium (~13 modules).
- **Naples Digital relevance:** MEDIUM — Twitter leg of gap #1.
- **Port effort:** M.

### 22. Trigger Apify Run (Step 1 of Twitter scraper)
- **File:** `1. Trigger Apify Run (1) (1).json`
- **Platform:** n8n
- **What it does:** Kicks off an Apify actor run with search params, returns dataset ID.
- **Apps:** Apify.
- **Complexity:** Simple (~5 nodes).
- **Naples Digital relevance:** MEDIUM — generic Apify-trigger pattern. Useful as a building block.
- **Port effort:** S.

### 23. Watch Actor Runs → Get Data (Step 2 of Twitter scraper)
- **File:** `2. Watch Actor Runs -_ Get Data (1).json`
- **Platform:** n8n
- **What it does:** Polls Apify for run completion, downloads dataset, parses JSON, exports to CSV/Sheets.
- **Apps:** Apify, Google Sheets.
- **Complexity:** Simple (~6 nodes).
- **Naples Digital relevance:** MEDIUM — pairs with #22.
- **Port effort:** S.

### 24. Instagram Scraping with PhantomBuster
- **File:** `Instagram_Scraping_with_PhantomBuster.json`
- **Platform:** n8n
- **What it does:** Scrapes Instagram profiles by hashtag/location → handles, follower counts, engagement → saves to Sheets.
- **Apps:** PhantomBuster, Google Sheets.
- **Complexity:** Simple (~7 nodes).
- **Naples Digital relevance:** MEDIUM — IG lead sourcing. Tangential.
- **Port effort:** S.

### 25. Launch Bulk PhantomBuster Instagram Scraper (Step 1)
- **File:** `1. Launch Bulk PhantomBuster Instagram Scraper (1) (1).json`
- **Platform:** n8n
- **What it does:** Configures + launches bulk PhantomBuster IG actor (100+ profiles per run).
- **Apps:** PhantomBuster.
- **Complexity:** Simple.
- **Naples Digital relevance:** MEDIUM — same family as #24.
- **Port effort:** S.

### 26. Watch Output of Bulk PhantomBuster Instagram Scraper (Step 2)
- **File:** `2. Watch Output of Bulk PhantomBuster Instagram Scraper (1) (1).json`
- **Platform:** n8n
- **What it does:** Polls PhantomBuster for completion, downloads, parses, exports.
- **Apps:** PhantomBuster, Google Sheets.
- **Complexity:** Simple.
- **Naples Digital relevance:** MEDIUM.
- **Port effort:** S.

### 27. Launch Individual PhantomBuster Instagram Scraper (Step 3)
- **File:** `3. Launch Individual PhantomBuster Instagram Scraper (1) (2).json` (110 KB)
- **Platform:** n8n
- **What it does:** Single-profile detail scrape (posts, captions, hashtags, engagement) for competitive analysis.
- **Apps:** PhantomBuster.
- **Complexity:** Simple-medium.
- **Naples Digital relevance:** LOW — IG-only competitive intel.
- **Port effort:** S.

### 28. Apify Scrape New Instagram Reels → Transcribe → Add to Sheet
- **File:** `Apify_Scrape_New_Instagram_Reels____Transcribe____Add_to_Sheet (2).json`
- **Platform:** n8n
- **What it does:** Scrapes new Reels by account, downloads video, transcribes via Whisper, extracts hashtags + captions, writes to Sheets.
- **Apps:** Apify, Whisper, Google Sheets.
- **Complexity:** Medium (~13 nodes).
- **Naples Digital relevance:** MEDIUM — Content Pipeline competitive research. Replace Whisper with Gemini 2.5 Flash to match platform LLM.
- **Port effort:** M.

### 29. AI Facebook Ad Spy Tool
- **File:** `AI_Facebook_Ad_Spy_Tool (1).json`
- **Platform:** n8n
- **What it does:** Scrapes FB Ad Library for competitor ads in a niche, extracts copy + landing URLs + estimated spend, generates report on winning patterns.
- **Apps:** FB Ad Library (API/scrape), Google Sheets.
- **Complexity:** Medium (~12 nodes).
- **Naples Digital relevance:** MEDIUM — competitive intelligence; could be a Sponsor Analytics-adjacent module for tenants running ads.
- **Port effort:** M.

### 30. AI Content Generator (Make)
- **File:** `AI Content Generator (3).json` (285 KB)
- **Platform:** Make.com
- **What it does:** Topic/keyword input → Claude generates 5+ outlines → expands to 2,000+ word post → 3–5 social variants → DALL-E featured image → publishes to WordPress + social.
- **Apps:** Claude, DALL-E, WordPress, Twitter, LinkedIn, Google Drive.
- **Complexity:** Complex (~25 modules).
- **Naples Digital relevance:** MEDIUM — Content Pipeline upgrade; overlap with gap #1.
- **Port effort:** L.

### 31. AI Content Generator (n8n)
- **File:** `AI_Content_Generator.json` (41 KB)
- **Platform:** n8n
- **What it does:** Title + keyword → Claude generates 800–1,500 word SEO article → saves to Google Docs → emails preview link.
- **Apps:** Claude, Google Docs, Email.
- **Complexity:** Simple (~8 nodes).
- **Naples Digital relevance:** MEDIUM — simpler Content Pipeline reference.
- **Port effort:** S.

### 32. Cyclic Content Generator (Make)
- **File:** `Cyclic Content Generator.json`
- **Platform:** Make.com (39 KB)
- **What it does:** Watches RSS feeds, periodically generates "what's new" summaries + commentary posts, syndicates to social, content calendar in Sheets.
- **Apps:** RSS, Claude, social platforms, Sheets.
- **Complexity:** Medium (~14 modules).
- **Naples Digital relevance:** MEDIUM — Content Pipeline news/trend monitoring.
- **Port effort:** M.

### 33. Cyclic Content Generator (n8n variant)
- **File:** `Cyclic_Content_Generator.json` (25 KB)
- **Platform:** n8n
- **Naples Digital relevance:** Same as #32, pick one.
- **Port effort:** M.

### 34. Deep Content Generator
- **File:** `Deep Content Generator.json` (25 KB)
- **Platform:** Make.com
- **What it does:** Single keyword → Claude in loop generates 3,000+ word deep-dive → 5–7 DALL-E section images → publishes to WordPress.
- **Apps:** Claude, DALL-E, WordPress.
- **Complexity:** Medium (~14 modules with loops).
- **Naples Digital relevance:** MEDIUM — long-form Content Pipeline.
- **Port effort:** M.

### 35. YouTube Repurposing w Unique Changes
- **File:** `YouTube Repurposing w Unique Changes.json` (217 KB)
- **Platform:** Make.com
- **What it does:** Watches YouTube channel for new uploads → downloads via youtube-dl → audio → Whisper transcript → Claude summary + key talking points → Sheets log (input for Part 2).
- **Apps:** YouTube API, youtube-dl, Whisper, Sheets.
- **Complexity:** Complex (~22 modules).
- **Naples Digital relevance:** MEDIUM — Naples Digital already has `content-pipeline` + `render-worker`. Pattern overlaps with existing transcription package.
- **Port effort:** L.

### 36. YouTube to Blog Post Generator
- **File:** `YouTube to Blog Post Generator (1) (1).json` + `YouTube_to_Blog_Post_Generator.json`
- **Platform:** Make.com
- **What it does:** Transcript → Claude/GPT writes 2,000+ word blog → DALL-E featured image → publishes to WordPress → Sheets log.
- **Apps:** Claude/GPT, DALL-E, WordPress, Sheets.
- **Complexity:** Medium (~14 modules).
- **Naples Digital relevance:** MEDIUM — Part 2 of #35.
- **Port effort:** M.

### 37. AI Podcast Repurposing Engine 1
- **File:** `AI PODCAST REPURPOSING ENGINE 1.json` (25 KB)
- **Platform:** n8n
- **What it does:** Downloads latest podcast episode (RSS) → Whisper transcript → Claude generates title/description.
- **Apps:** Podcast RSS, Whisper, Claude.
- **Complexity:** Medium.
- **Naples Digital relevance:** MEDIUM — Naples Digital `content-pipeline` already does episode → transcript → clip-picks for podcast use cases. Compare and merge.
- **Port effort:** M.

### 38. AI Podcast Repurposing Engine 2
- **File:** `AI PODCAST REPURPOSING ENGINE 2.json` (19 KB)
- **Platform:** n8n
- **What it does:** Takes transcript from Part 1 → 3–5 blog post variants → 10+ short-form social clips → LinkedIn article → publishes across platforms.
- **Apps:** Claude, WordPress, LinkedIn, Twitter, YT Shorts.
- **Complexity:** Complex.
- **Naples Digital relevance:** MEDIUM — Part 2 of #37.
- **Port effort:** L.

### 39. AI Graphic Designer (master)
- **File:** `AI_Graphic_Designer (1).json` (20 KB)
- **Platform:** n8n (orchestrates 4 sub-workflows below).
- **What it does:** Product description → style guide → logo variations (DALL-E) → 10–20 ad creative variations → user revises.
- **Naples Digital relevance:** MEDIUM — bespoke client deliverable; useful for Sponsor Pitch visual assets.
- **Port effort:** L.

### 40. AI Graphic Designer — Logo Generator (sub)
- **File:** `Logo_Generator__AI_Graphic_Designer_.json`
- Sub-workflow of #39.

### 41. AI Graphic Designer — Style Guide Generator (sub)
- **File:** `Style_Guide_Generator__AI_Graphic_Designer_.json`
- Sub-workflow of #39.

### 42. AI Graphic Designer — Image Spinner (sub)
- **File:** `Image_Spinner__1_Click___1000_Ad_Creatives_.json`
- Sub-workflow of #39 / #43.

### 43. AI Graphic Designer — Gradient Image (sub)
- **File:** `Gradient_Image__AI_Graphic_Designer_.json`
- Sub-workflow of #39.

### 44. AI Graphic Designer — Design Editor / Revisor (sub)
- **File:** `Design_Editor_Revisor__AI_Graphic_Designer_.json`
- Sub-workflow of #39.

### 45. 1-Click → 1,000 Ad Creatives Agent
- **File:** `1_Click___1000_Ad_Creatives_Agent.json`
- **Platform:** n8n (agentic).
- **What it does:** Product + brand input → Claude generates 100+ headlines → DALL-E creates 1,000+ ad images → samples + ranks by predicted CTR → outputs top 50.
- **Apps:** Claude, DALL-E, Sheets, Drive.
- **Complexity:** Complex (~22 nodes, agentic loop).
- **Naples Digital relevance:** MEDIUM — agency-style deliverable; not a tenant module by default.
- **Port effort:** L.

### 46. AI Automated Resume System
- **File:** `AI_Automated_Resume_System.json` (1.2 MB — largest)
- **Platform:** n8n
- **What it does:** Watches Upwork for new jobs → Claude rewrites resume per JD → PDF → custom cover letter → uploads to Upwork → Sheets log.
- **Apps:** Upwork, Claude, PDF generators, Sheets.
- **Complexity:** Complex (>30 nodes).
- **Naples Digital relevance:** **LOW — SKIP.** Upwork-freelance specific, not service-business SaaS-relevant.
- **Port effort:** —.

### 47. Upwork Scraper
- **File:** `Upwork_Scraper.json` (153 KB)
- **Platform:** n8n
- **What it does:** Watches Upwork job feed, scrapes new postings by filters, alerts via Slack.
- **Naples Digital relevance:** **LOW — SKIP.**
- **Port effort:** —.

### 48. Updated Upwork "RSS" Feed
- **File:** `Updated Upwork _RSS_ Feed.json` (1.8 MB)
- **Platform:** Make.com
- **What it does:** Scheduled scrape of Upwork search → parses HTML → emits as RSS-style JSON.
- **Naples Digital relevance:** **LOW — SKIP.**
- **Port effort:** —.

### 49. Bland.ai Call
- **File:** `Bland_ai_Call.json`
- **Platform:** n8n
- **What it does:** Form submission → Bland.ai initiates AI phone call to lead → records → transcribes → CRM log.
- **Apps:** Bland.ai, Sheets, Slack.
- **Complexity:** Simple (~5 nodes).
- **Naples Digital relevance:** MEDIUM — phone outreach is novel for the platform; Real Estate vertical (MIA) could use it.
- **Port effort:** S.

### 50. YouTube Trend Detector (Add/Update)
- **File:** `YouTube_Trend_Detector__Add_Update.json` + `1__YouTube_Trend_Detector__Add_Update.json`
- **Platform:** n8n
- **What it does:** Daily scheduled query of YouTube trending → top 50–100 videos → keyword analysis → store with timestamp.
- **Apps:** YouTube API, Google Sheets.
- **Complexity:** Simple (~7 nodes).
- **Naples Digital relevance:** LOW — content research utility.
- **Port effort:** S.

### 51. YouTube Trend Detector (Daily Digest)
- **File:** `2__YouTube_Trend_Detector__Daily_Digest.json`
- **Platform:** n8n
- **What it does:** Compares today vs yesterday's trends, identifies new trends, emails digest + Slack post.
- **Naples Digital relevance:** LOW.
- **Port effort:** S.

---

## Make.com Accelerator tutorial blueprints (NOT production)

These are progressive teaching scenarios from the Make Accelerator course section. They are **reference / educational only** — not production patterns to port. List for completeness:

| # | File | Teaches |
|---|---|---|
| 1 | `Make.com Accelerator- Your First Scenario (1).blueprint.json` | HTTP request + JSON parse + transform |
| 2 | `Make.com Accelerator- Your Second Scenario (2).blueprint (1).json` | Conditional logic + multi-source filtering |
| 3 | `Make.com Accelerator- Your Third Scenario (Google Slides) (3).blueprint.json` | Google Sheets/Slides API integration |
| 4 | `Make.com Accelerator- Your Fourth Scenario (4).blueprint.json` | Complex transforms + chained scenarios |
| 5 | `Make.com Accelerator- Your Fifth Scenario (5).blueprint.json` | Error handling + webhooks |
| 6 | `Make.com Accelerator- Your sixth scenario (6).blueprint.json` | E-commerce: orders + inventory sync |
| 7 | `Make.com Accelerator- Your seventh scenario (7).blueprint (1).json` | Advanced agentic patterns + iteration |

## n8n / Agentic tutorial files ("Your Nth workflow")

Same pattern, n8n side. Reference-only.

| File | Notes |
|---|---|
| `Your second workflow.json` | Beginner |
| `Your third workflow.json` | Beginner-intermediate |
| `Your fourth workflow.json` | Intermediate |
| `Your fifth workflow.json` | Intermediate |
| `Your sixth workflow.json` | Advanced |
| `Your seventh workflow.json` | Advanced |

(`Your first workflow.json` is missing from the folder — likely intentional, since the Resource Library hosts it on Skool only.)

---

## Summary table

| Pri | # | Workflow | Platform | Naples gap / module | Effort |
|---|---|---|---|---|---|
| 🟢 H | 1 | Content Syndication 5-platform | Make | **Gap #1: Content Syndication** | M |
| 🟢 H | 2 | Email Categorization System | n8n | **Gap #2: Email Triage** | M |
| 🟢 H | 3 | Email Autoresponder | n8n | Gap #2 | M |
| 🟢 H | 6 | CRM Lead Won → Stripe Invoice | Make | **Gap #3: Stripe Lead-Won → invoice** | M |
| 🟢 H | 7 | Stripe Payment → ClickUp + Trello onboarding | n8n | Gap #3 | M |
| 🟢 H | 8 | Automatic Invoice Collection | Make | Gap #3 | M |
| 🟢 H | 5 | Instantly Auto-Reply Bot | n8n | Cold Outreach | M |
| 🟢 H | 9 | Automated Followup System | Make | Cold Outreach | M |
| 🟢 H | 10 | AI Proposal Generator Flow | Make | New: Proposal Generator | M |
| 🟢 H | 11 | AI Proposal Generator System | Make | New: Proposal Generator | M |
| 🟢 H | 15 | Scrape & Send to Anymailfinder | n8n | Cold Outreach (enrich) | S |
| 🟢 H | 16 | Retrieve Enrichment & DM | n8n | Cold Outreach (enrich) | M |
| 🟡 M | 12 | Monday Webhook → Slides Proposal | Make | Proposal alt | S |
| 🟡 M | 17 | LinkedIn DM Outreach Step 1 | n8n | Cold Outreach (LinkedIn) | S |
| 🟡 M | 18 | LinkedIn Parasite | n8n | Content Pipeline alt | M |
| 🟡 M | 19 | Medium Parasite SEO (full) | n8n | Gap #1 alt | L |
| 🟡 M | 20 | Medium Parasite SEO (light) | Make | Gap #1 alt | S |
| 🟡 M | 21 | Twitter Apify Parasite | Make | Gap #1 alt | M |
| 🟡 M | 22-23 | Apify trigger + watch | n8n | Building blocks | S |
| 🟡 M | 24-27 | PhantomBuster IG scraper × 4 | n8n | Cold Outreach (IG sourcing) | S |
| 🟡 M | 28 | IG Reels → Whisper → Sheet | n8n | Content Pipeline research | M |
| 🟡 M | 29 | FB Ad Spy Tool | n8n | Sponsor Analytics adjacent | M |
| 🟡 M | 30-34 | AI Content Generator family + Deep + Cyclic | mixed | Content Pipeline | M-L |
| 🟡 M | 35-38 | YouTube + Podcast repurposing | mixed | Content Pipeline | M-L |
| 🟡 M | 39-45 | AI Graphic Designer family + 1k Ads | n8n | Sponsor Pitch visuals | L |
| 🟡 M | 49 | Bland.ai phone call | n8n | Phone outreach (MIA?) | S |
| 🟡 M | 13-14 | Hiring Pipeline form/status patterns | Make | Reusable pattern | S |
| 🔴 L | 46 | Upwork AI Resume | n8n | SKIP | — |
| 🔴 L | 47-48 | Upwork Scraper + RSS | mixed | SKIP | — |
| 🔴 L | 50-51 | YouTube Trend Detector | n8n | SKIP | — |

**Total:** ~46 unique production workflows + 7 Make Accelerator tutorials + 6 n8n tutorial workflows = 59 unique JSONs.

**Recommended next port (3 highest-ROI):**
1. #6 + #7 + #8 → **Lead-Won → Invoice** module (gap #3, agency-table-stakes).
2. #2 + #3 → **Email Triage** module (gap #2, low-effort trust-builder).
3. #1 → **Content Syndication** module (gap #1, biggest visible value-add).
