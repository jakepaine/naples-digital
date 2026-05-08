# MakerSchool — 30-Day Playbook

Source: Nick Saraev's Maker School "Month 1" curriculum (296 lessons total; 107 in Month 1).
Goal of the program: land your first paying AI/automation customer in 30 days through Upwork applications, niche communities, and cold email at scale.

This playbook only covers Days 1–30 (the action plan). Pre-Program, Resource Library, and Automation Tutorials are reference material — see `tools_inventory.md` and `workflows_library.md`.

**Time pattern:** Day 1 is the heaviest setup day (3–4 hrs). Days 2–7 average 2–3 hrs (setup-heavy). Days 8–30 average 1–2 hrs (execution-heavy: send applications, post in communities, scrape leads). Nick repeatedly says "no days off for the next month."

**Three lead-gen rails the whole program builds:**
1. Upwork applications (10/day → 5/day after Day 17)
2. Niche communities (3 chosen, 1 post per community per cycle)
3. Cold email (warmup Days 1–21, send Day 22 onward)

---

## Day 1 — Setup foundations
**Goal:** name the business, lock the domain, start cold email warmup.
**Time required:** 3 hours
**Tasks:**
- [ ] Choose operating name (Tool: Namelix / NameSnack / ChatGPT | Time: 30 min)
- [ ] Buy main domain & set up primary email (Tool: GoDaddy/Cloudflare + Google Workspace | Time: 60 min)
- [ ] Set up cold email & start warmup (Tool: Instantly.ai or Smartlead.ai | Time: 90 min)
**Key concepts:** "Permissive" steps unlock everything else. Cold email is the highest-volume scalable rail. Warmup takes ~21 days, so start now.
**Assets available:** None this day.
**Can be automated:** No — domain purchase + Workspace setup are manual.

## Day 2 — Niche, portfolio, Upwork profile
**Goal:** pick 3 niches, build 3 case studies, create Upwork profile.
**Time required:** 3 hours
**Tasks:**
- [ ] Build "portfolio" & 3 case studies (Tool: Notion or Google Docs | Time: 90 min)
- [ ] Select niche(s) — 3 to test (Tool: Niche Discovery Spreadsheet | Time: 30 min)
- [ ] Create Upwork profile (Tool: Upwork | Time: 60 min)
**Key concepts:** Case study format = "I did X for Y by doing Z." Three niches = parallel testing, fastest signal. Don't agonize over picking the "right" niche.
**Assets available:** Niche Discovery Spreadsheet (Google Sheets template, link in lesson).
**Can be automated:** No — judgment calls.

## Day 3 — Upwork application engine + communities
**Goal:** build a reusable Upwork app template, join 3 communities, dry-run 5 video applications.
**Time required:** 3 hours
**Tasks:**
- [ ] Build Upwork application template (Tool: macOS Text Replacements / AHK / Beeftext / Espanso | Time: 60 min)
- [ ] Join 3 niche-related communities (Tool: Skool, Discord-via-Google search | Time: 30 min)
- [ ] Dry-run 5 video applications (Tool: Loom | Time: 60 min — record only, don't post)
- [ ] Set up time tracker(s) (Tool: Rize / Toggl / Harvest | Time: 30 min)
**Key concepts:** Applications use video walkthroughs (Loom), not text. Templates save hours; never write a fresh app from scratch. Communities are warm-lead reservoirs.
**Assets available:** 4 example Looms (Content Repurposing System, AI Agent for X/LinkedIn, AI Automation Expert, Streamlined Report Writing).
**Can be automated:** Partially — automating Upwork applications is covered later in the Resource Library (`AI_Automated_Resume_System.json`, `Updated Upwork _RSS_ Feed.json`, `Upwork_Scraper.json`).

## Day 4 — First contact with customers
**Goal:** send 10 real Upwork applications, memorize sales script, set up call recording.
**Time required:** 3 hours
**Tasks:**
- [ ] Send 10 applications (Tool: Upwork + Loom | Time: 90 min)
- [ ] Memorize sales skeleton (Tool: Standalone Sales Skeleton Doc | Time: 30 min)
- [ ] Set up call recording (Tool: Fireflies.ai or Fathom | Time: 15 min)
- [ ] Set up AI agent workspace (Tool: Claude Code / Codex / Antigravity / Cursor | Time: 30 min)
- [ ] Create community post calendar (Tool: Community Post Calendar Template | Time: 30 min)
**Key concepts:** Sales process = (1) discovery call → (2) proposal doc → (3) close. Recording calls cuts learning curve in half. AI agent workspace lets you build automations on demand during sales calls.
**Assets available:** Standalone Sales Skeleton Doc (Google Docs); Community Post Calendar Template (Google Sheets).
**Can be automated:** No — sales calls + community posts are deliberately human.

## Day 5 — Engagement + first proposal template
**Goal:** stay active in communities, build proposal template, post first community post.
**Time required:** 2.5 hours
**Tasks:**
- [ ] Send 10 applications (Time: 60 min)
- [ ] Spend 5 min engaging on each community (Time: 15 min)
- [ ] Create proposal template (Tool: PandaDoc; review Example Proposal PDF | Time: 60 min)
- [ ] Create first community post (Time: 30 min)
**Key concepts:** Engagement = real comments, not low-effort likes. Proposal is what you send AFTER discovery call to close.
**Assets available:** `Proposal (1).pdf` (example proposal); `AI Proposal Generator Flow (1).json` (Make.com blueprint to auto-generate from a form).
**Can be automated:** YES — proposal generation is automatable today via `AI Proposal Generator Flow` blueprint. **Naples Digital relevance:** HIGH — port to a `proposal-generator` module.

## Day 6 — Stripe + community cycle
**Goal:** payment infra ready before first close, second community post.
**Time required:** 2 hours
**Tasks:**
- [ ] Send 10 applications (Time: 60 min)
- [ ] Create next community post (Time: 30 min)
- [ ] Set up Stripe / payment processor (Tool: Stripe | Time: 15 min)
- [ ] Spend 5 min engaging on each community (Time: 15 min)
**Key concepts:** Stripe is the most automation-friendly processor — Make/n8n integrations are first-class. Skip if you already have one.
**Assets available:** None (referenced workflows like `CRM_Lead_Won_ClickUp_____Send_Invoice_Stripe.json` come from Resource Library).
**Can be automated:** YES, the lead-won → Stripe invoice flow is one of Naples Digital's 3 named module gaps.

## Day 7 — Wrap week 1
**Goal:** third community post, accountability, lifestyle audit.
**Time required:** 2.5 hours
**Tasks:**
- [ ] Send 10 applications (Time: 60 min)
- [ ] Create next community post (Time: 30 min)
- [ ] Find an accountability group (Tool: Skool peer | Time: 15 min)
- [ ] Set up lifestyle audit (Tool: Lifestyle Audit Skill template | Time: 45 min)
**Key concepts:** Lifestyle audit = list every friction point in your life, sort by difficulty, fix easiest first. Friction kills consistency more than willpower.
**Assets available:** `lifestyle-audit.md` (skill template).
**Can be automated:** No — personal reflection.

## Day 8 — Build scraping infrastructure
**Goal:** stand up the lead-scraping stack you'll use to hit 4,000 leads.
**Time required:** 2.5 hours
**Tasks:**
- [ ] Send 10 applications (Time: 60 min)
- [ ] Spend 5 min engaging on each community (Time: 15 min)
- [ ] Create next community post (Time: 30 min)
- [ ] Set up scraping infrastructure (Tool: Apify + Apollo + PhantomBuster + Anymailfinder | Time: 45 min)
**Key concepts:** 4,000 leads ÷ 30 days = ~133/day. We'll scrape in 4 batches of 1,000 starting Day 11.
**Assets available:** Affiliate links (Apify "30NS" code = 30% off 2 mo; PhantomBuster "noah60" deal). Workflows: `Scrape & Send to Anymailfinder.json`, `Retrieve Enrichment Results & Search for DM.json`.
**Can be automated:** YES — every step in this scraping stack has a Make or n8n template in the workflow library.

## Day 9 — Steady-state cycle
**Goal:** apply, engage, post (no new system today).
**Time required:** 1.5 hours
**Tasks:**
- [ ] Send 10 applications (Time: 60 min)
- [ ] Spend 5 min engaging on each community (Time: 15 min)
- [ ] Create next community post (Time: 30 min)
**Key concepts:** Days like this look "boring" — they're the actual job. Most people quit here.
**Assets available:** None.
**Can be automated:** No (intentional).

## Day 10 — Affiliate links + Upwork retrospective
**Goal:** stop leaving money on the table; review week 1 of Upwork.
**Time required:** 2 hours
**Tasks:**
- [ ] Spend 5 min engaging on each community (Time: 15 min)
- [ ] Set up affiliate links — optional (Tool: 70+ Affiliate Programs spreadsheet | Time: 60 min)
- [ ] Upwork application retrospective (Time: 45 min)
**Key concepts:** You'll be recommending tools to clients anyway — affiliate links capture the kickback. Most platforms (Apollo, ClickUp, Notion) pay 20–30%.
**Assets available:** 70+ Affiliate Programs Google Sheet.
**Can be automated:** Partially — link-substitution can be a browser snippet later.

## Day 11 — First lead scrape (1,000 leads)
**Goal:** scrape your first batch.
**Time required:** 2 hours
**Tasks:**
- [ ] Community post retrospective (Time: 30 min)
- [ ] Send 10 applications (Time: 60 min)
- [ ] Scrape 1,000 leads (Tool: Apify + Apollo + PhantomBuster + Anymailfinder | Time: 30 min — mostly waiting)
- [ ] Create next community post (Time: 30 min)
**Key concepts:** Run scrapers async — kick off, do other tasks, return to enrich.
**Assets available:** Workflows from Day 8 setup; `Instagram_Scraping_with_PhantomBuster.json`; `LinkedIn DM Outreach System` (3-part system).
**Can be automated:** YES — entire scraping pipeline is a workflow you can run as a cron.

## Day 12 — Lifestyle friction + website
**Goal:** fix 5 friction points, get a basic website live.
**Time required:** 2 hours
**Tasks:**
- [ ] Solve 5 friction points (from lifestyle audit | Time: 30 min)
- [ ] Send 10 applications (Time: 60 min)
- [ ] Create website (Tool: Carrd or Webflow; YouTube guide linked | Time: 30 min)
**Key concepts:** Website is for credibility, not lead conversion. Don't optimize SEO. Carrd/single-page is fine.
**Assets available:** "Build Your Automation Agency Site" YouTube guide.
**Can be automated:** No — content writing.

## Day 13 — Second batch scrape
**Goal:** scrape leads 1,001–2,000.
**Time required:** 2 hours
**Tasks:**
- [ ] Spend 5 min engaging on each community (Time: 15 min)
- [ ] Scrape 1,000 leads (Time: 30 min)
- [ ] Send 10 applications (Time: 60 min)
**Key concepts:** Same as Day 11 — repetition.
**Assets available:** None new.
**Can be automated:** YES.

## Day 14 — Build offers
**Goal:** write 6 offers (2 per niche × 3 niches).
**Time required:** 2.5 hours
**Tasks:**
- [ ] Create next community post (Time: 30 min)
- [ ] Write six offers (Time: 90 min)
- [ ] Send 10 applications (Time: 60 min)
**Key concepts:** Offer = (problem + solution + price + guarantee). Two per niche so you can A/B test in cold email.
**Assets available:** None new.
**Can be automated:** Partially — Claude can draft offers given niche + ICP.

## Day 15 — Social profiles + third scrape
**Goal:** create social presence, scrape 1,000 more leads.
**Time required:** 2.5 hours
**Tasks:**
- [ ] Create social media profiles & links (Tool: LinkedIn, Twitter, Instagram | Time: 30 min)
- [ ] Spend 5 min engaging on each community (Time: 15 min)
- [ ] Send 10 applications (Time: 60 min)
- [ ] Scrape 1,000 leads (Time: 30 min)
**Key concepts:** Social is for credibility (warm leads check you), not direct lead source. Don't post yet — Month 2 covers content syndication.
**Assets available:** Workflows for syndication: `Content Syndication onto Twitter, Facebook, Instagram, LinkedIn, and Medium.json` (Make), `LinkedIn_Parasite_System_in_n8n.json`.
**Can be automated:** Profile creation is manual; ongoing posting is automatable later.

## Day 16 — Cold email reply infrastructure
**Goal:** wire webhooks/mobile so you reply within 5 minutes of any cold-email response.
**Time required:** 2 hours
**Tasks:**
- [ ] Create next community post (Time: 30 min)
- [ ] Set up cold email webhooks and/or mobile apps (Tool: Instantly Unibox app or Webhooks + Make/n8n | Time: 30 min)
- [ ] Send 10 applications (Time: 60 min)
**Key concepts:** Sub-5-minute reply lifts cold-email conversion 4–10×. Webhook → Slack/Push notification.
**Assets available:** Instantly Webhooks Guide; Smartlead Webhooks Guide; `Instantly.ai Auto-Reply Bot.json`.
**Can be automated:** YES — webhook → AI classifier → Slack alert is the standard pattern.

## Day 17 — Cold email sequences + retrospectives
**Goal:** write 6 cold-email sequences (2 per niche), retrospect Upwork + calls week 2.
**Time required:** 3 hours
**Tasks:**
- [ ] Write six cold email sequences (Time: 90 min)
- [ ] Call(s) retrospective (Time: 30 min)
- [ ] Upwork application retrospective (Time: 30 min)
**Key concepts:** A/B test offers via cold email. Each sequence = 3 emails (initial + 2 followups).
**Assets available:** "43 pages of cold email by Nick" Google Doc (deep reference).
**Can be automated:** Partially — Claude drafts; you edit.

## Day 18 — Down-shift apps to 5/day
**Goal:** apps drop because lead volume from email is about to start; protect your time.
**Time required:** 1.5 hours
**Tasks:**
- [ ] Send 5 applications (Time: 30 min — half of previous)
- [ ] Solve 5 friction points (Time: 30 min)
- [ ] Create next community post (Time: 30 min)
**Key concepts:** Volume shifts from Upwork → cold email. Don't double-up; that creates cascade overload.
**Assets available:** None new.
**Can be automated:** No.

## Day 19 — Pre-send check
**Goal:** final mailbox/DNS validation before going live.
**Time required:** 2 hours
**Tasks:**
- [ ] Community post retrospective (Time: 30 min)
- [ ] Send 5 applications (Time: 30 min)
- [ ] Double check mailbox config (SPF / DKIM / DMARC) (Time: 30 min)
**Key concepts:** One DKIM typo = 70% of emails to spam. Check before send, not after.
**Assets available:** Smartlead DNS Guide.
**Can be automated:** No (config validation is manual).

## Day 20 — Final pre-send checklist
**Goal:** preview every variable, confirm volumes, run final dry pass.
**Time required:** 2 hours
**Tasks:**
- [ ] Run through final pre-send cold email checklist (Time: 30 min)
- [ ] Send 5 applications (Time: 30 min)
- [ ] Spend 5 min engaging on each community (Time: 15 min)
- [ ] Solve 5 friction points (Time: 30 min)
**Key concepts:** Variables that don't fill in = "{{firstName}}" arriving in real inboxes = dead campaign.
**Assets available:** None new.
**Can be automated:** Variable validation can be a pre-flight script.

## Day 21 — Skim cold email masterclass + post #10
**Goal:** internalize Nick's full cold-email playbook (43 pages) before sending tomorrow.
**Time required:** 2 hours
**Tasks:**
- [ ] Skim Maker School Wrapped — cold email masterclass (Time: 60 min)
- [ ] Create next community post (#10 — Time: 30 min)
**Key concepts:** Reference doc, not memorize-it. Re-read sections as you iterate.
**Assets available:** "43 pages of cold email by Nick" Google Doc.
**Can be automated:** No.

## Day 22 — TURN ON COLD EMAIL
**Goal:** flip the switch. Cold email starts sending today.
**Time required:** 1 hour
**Tasks:**
- [ ] Turn on email (Tool: Instantly or Smartlead | Time: 15 min)
- [ ] Send 5 applications (Time: 30 min)
**Key concepts:** First send is the moment cold email lead-flow begins. Watch reply rate first 48h.
**Assets available:** Workflows for follow-up: `Automated Followup System.json` (Make, complex).
**Can be automated:** YES — automated followups, auto-replies, lead scoring.

## Day 23 — Post-send steady state
**Goal:** monitor email, keep posting, keep engaging.
**Time required:** 1.5 hours
**Tasks:**
- [ ] Create next community post (#11 — Time: 30 min)
- [ ] Spend 5 min engaging on each community (Time: 15 min)
- [ ] (implicit) Send 5 applications (Time: 30 min)
**Key concepts:** Don't tweak email config in first 48h — let data accumulate.
**Assets available:** None new.
**Can be automated:** No.

## Day 24 — Proposal + Upwork retrospectives
**Goal:** review what's converting in proposals + Upwork apps.
**Time required:** 2.5 hours
**Tasks:**
- [ ] Proposal retrospective (Time: 60 min)
- [ ] Upwork application retrospective (Time: 30 min)
- [ ] Send 5 applications (Time: 30 min)
**Key concepts:** Track which proposal sections clients quote back. Cut sections nobody references.
**Assets available:** None new.
**Can be automated:** Partial — usage analytics on PandaDoc proposals.

## Day 25 — Last lead scrape (4,000 total) + post #12
**Goal:** finish lead scraping for the month.
**Time required:** 2 hours
**Tasks:**
- [ ] Send 5 applications (Time: 30 min)
- [ ] Spend 5 min engaging on each community (Time: 15 min)
- [ ] Create next community post (#12 — Time: 30 min)
- [ ] Scrape 1,000 leads (final batch — Time: 30 min)
**Key concepts:** 4,000 leads ÷ ~50/day send rate = ~80 days of email. Sets you up through end of Month 2.
**Assets available:** Same scraping workflows as Day 8.
**Can be automated:** YES.

## Day 26 — Steady state + post #13
**Time required:** 1.5 hours
**Tasks:**
- [ ] Create next community post (#13 — Time: 30 min)
- [ ] Spend 5 min engaging on each community (Time: 15 min)
- [ ] Send 5 applications (Time: 30 min)
**Key concepts:** Repetition. Five days left.
**Assets available:** None new.
**Can be automated:** No.

## Day 27 — Set up CRM
**Goal:** install lightweight CRM now that lead pipeline is real.
**Time required:** 2 hours
**Tasks:**
- [ ] Send 5 applications (Time: 30 min)
- [ ] Spend 5 min engaging on each community (Time: 15 min)
- [ ] Set up CRM (Tool: ClickUp / Monday / Notion | Time: 60 min)
**Key concepts:** Don't build CRM before you have customers. Now's the right time.
**Assets available:** "Automation Agency CRMs" guide; "Video Guide to Creating a CRM" YouTube; ClickUp/Monday/Notion affiliate links. Workflows: `CRM_Lead_Won_ClickUp_____Send_Invoice_Stripe.json`, `Payment_Completed_Stripe_____Update_ClickUp___Onboard_on_Trello.json`.
**Can be automated:** YES — lead intake → CRM is exactly what `General Application Form Fill -> Add to ClickUp.json` does.

## Day 28 — Cold email retrospective + post #14
**Goal:** first real review of cold-email data (~2,000 sends).
**Time required:** 2 hours
**Tasks:**
- [ ] Create next community post (#14 — Time: 30 min)
- [ ] Send 5 applications (Time: 30 min)
- [ ] Cold email retrospective (Time: 60 min)
**Key concepts:** Open rate <50% → DNS/warmup issue. Reply rate <2% → offer/copy issue. Diagnose before iterating.
**Assets available:** None new.
**Can be automated:** Open/reply analytics already in Instantly/Smartlead.

## Day 29 — Last apps + new sequences
**Goal:** ship final batch of apps + iterate to v2 cold-email sequences.
**Time required:** 2.5 hours
**Tasks:**
- [ ] Send 5 applications (final day — Time: 30 min)
- [ ] Write 3 new cold email sequences (one per niche — Time: 60 min)
- [ ] Create community post (last one of month — Time: 30 min)
- [ ] Spend 5 min engaging on each community (Time: 15 min)
**Key concepts:** Carry forward what worked from v1 sequences. New sequences should test single variable each.
**Assets available:** None new.
**Can be automated:** Partially — Claude drafts variants given v1 winner.

## Day 30 — Rest + retrospective
**Goal:** day off + Month 1 retrospective.
**Time required:** 1 hour
**Tasks:**
- [ ] Take the day off (Time: rest)
- [ ] Month 1 retrospective (Time: 60 min)
**Key concepts:** First scheduled day off. Month 2 in Skool unlocks tomorrow. Reflect: what worked, what didn't, what surprised you, what to keep doing.
**Assets available:** None new.
**Can be automated:** No.

---

## Naples Digital module mapping (where this playbook intersects the platform)

| Day | Activity | Platform module / gap | Notes |
|---|---|---|---|
| 1, 22 | Cold email warmup + send | **Cold Outreach** (existing module) | Already in `apps/outreach-demo` + `outreach-dispatcher` |
| 5, 24 | Proposal generation | New module: **Proposal Generator** | Workflow `AI Proposal Generator Flow.json` is portable |
| 6, 27 | Stripe payments + CRM | **CRM Pipeline** (existing) + Gap: **Stripe Lead-Won → invoice** | Naples Digital named gap #3 |
| 8, 11, 13, 15, 25 | Lead scraping | New sub-module: **Lead Scraper** under Cold Outreach | 5 distinct workflows in library cover this |
| 15 | Social syndication | Gap: **Content Syndication** | Naples Digital named gap #1 |
| 16 | Email reply infrastructure | Gap: **Email Triage / Categorization** | Naples Digital named gap #2 |
| 27 | CRM lead intake | **CRM Pipeline** (existing) | `General Application Form Fill → ClickUp` shows the pattern |

The 3 named gaps from `apps/admin-console` modules matrix (Content Syndication / Email Triage / Stripe Lead-Won → Invoice) are all hit by Days 5, 6, 15, 16, 22, 27 of this playbook. That alignment is the reason this study work exists.
