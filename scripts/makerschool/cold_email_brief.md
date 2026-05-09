# Nick Saraev Cold Email Playbook — Naples Digital / Jake

---

## Quick reference (table)

| Parameter | Value | Source |
|---|---|---|
| Target open rate | Not specified explicitly | (no specific benchmark in corpus) |
| Target reply rate | 5–7% total; 1% positive (1 positive reply per 100 people contacted) | [#171], [#181] |
| Daily send volume | Not specified as a hard number per day | (no specific daily volume cap in corpus) |
| Mailbox count (Month 1) | 9 mailboxes implied ("assuming you're sending from 9 mailboxes") | [#37] |
| Warmup time before sending | ~21 days (setup Day 1, send Day 22) | [#1], [#35] |
| Lead count target (Month 1) | 4,000 total (1,000 scraped across Days 11, 13, 15, 25) | [#22], [#24], [#28], [#37] |
| Cold emails sent by Day 27 | ~2,000 | [#40] |
| Minimum monthly cold emails (guarantee threshold) | 1,000/month for 3 consecutive months | [#61] |
| Sequences written | 6 initial (2 per niche × 3 niches), then 3 new on Day 29 | [#31], [#43] |
| Sending platform (primary) | Instantly.ai | [#242] |
| Sending platform (alternate) | Smartlead.ai | [#254] |
| Domain registrars | Namecheap or Porkbun | [#3], [#94] |
| Reply-to-response time target | Within 5 minutes | [#30] |
| Reply response time conversion uplift | ~400% higher conversion for instant replies | [#30] |
| Lead scraping cost delta | $0.00/lead vs $0.01/lead = dozens of hours saved | [#18] |
| Expected ROI on program/tooling | 30x–100x; members achieving $15,000+ in first month | [#64] |

---

## The 3-act cold email pipeline — sourcing → enrichment → sending

### Act 1: Lead Sourcing

**Goal:** Compile a raw list of company names, domains, LinkedIn URLs, and job titles.

**Step 1 — Choose your scraping method.** Three categories exist: [#18]
- **Leads-as-a-service:** Apify, Apollo.io, Vayne.io — give you structured data with minimal setup.
- **Build-your-own scrapers:** Claude Code, Codex, n8n — highest flexibility, requires more time.
- **Enrichment-first databases:** LinkedIn Sales Navigator → export CSV → enrich later.

**Step 2 — Pick a source platform per niche.**
- Apollo.io for B2B contacts (free tier covers many use cases). [#229]
- LinkedIn Sales Navigator: set filters by job title, location, industry, company size. [#88], [#107], [#121]
- Apify: Google Maps scraper, Upwork scraper, Instagram scraper, Google Search Results Scraper. [#227]
- Vayne.io: paste Sales Navigator search URL, specify lead count, download CSV. [#130], [#134]

**Step 3 — Set filters.** Specify: country/region/city [#107], company size (e.g., "1–10 employees"), industry keyword [#121].

**Step 4 — Export raw CSV.** Name file: `mm-dd-yyyy-source-segment` (e.g., `09-06-2024-apollo-recruitment-agencies-1-10-employees.csv`). [#22]

**Step 5 — Stage in Google Sheet.** Use naming convention: `Source, Segment, Date` (e.g., "Apollo, Recruitment Agencies 1-10 Employees, Sep 4 2024"). Do NOT upload to Instantly/Smartlead yet. [#22]

---

### Act 2: Enrichment (Email + Personalization)

**Goal:** Turn domain/name/LinkedIn URL into a verified email + a personalized icebreaker.

**Step 1 — Email enrichment.**
- Upload CSV to **AnyMailFinder** (`anymailfinder.com`) for bulk email lookup. [#167]
- Download results filtered to **valid emails only**. [#178]
- Alternative enrichment: Apollo.io, Hunter, Snov, Icypeas. [#18], [#213]

**Step 2 — Filter out leads still missing emails.** [#155]

**Step 3 — Generate personalized icebreakers (high-leverage).**
- Use the n8n/Make workflow: Google Search → Firecrawl scrape website → AI generates icebreaker. [#78], [#79]
- Target icebreaker format (exact prompt):
  > *"Hey {name}. Love {shortenedVersionOfCompanyName}, big fan of {shortParaphrasedVersionOfSomethingPlausiblyUniqueAboutThem} (genius/very smart/etc)."* [#78]
- Rules: icebreaker variables must be **extremely short and informal** (≤5 words), must imply shared context. [#78]
- Alternatively: use the Make scenario (Google Search → Apify → HTTP scrape → AI icebreaker → Google Sheet). [#51]

**Step 4 — Store enriched leads in Google Sheet** with columns: first name, last name, email, company, icebreaker, source segment. [#162], [#194]

**Step 5 — Rename final CSV** `leads_to_enrich.csv` and move to `1_to_enrich` folder before upload. [#100], [#111]

---

### Act 3: Sending

**Goal:** Load leads into campaign platform, configure sequences, launch with proper warmup.

**Step 1 — Set up domains.** Buy 3–4 sending domains (variations of your main domain) via Namecheap or Porkbun. [#3], [#153]
- Faster alternative: buy domains through **Zapmail.ai** with mailboxes pre-configured. [#173]

**Step 2 — Assign 3 mailboxes per domain.** [#175]

**Step 3 — Authenticate each mailbox** (DKIM, SPF, DMARC — see Mailbox Checklist section). [#32]

**Step 4 — Enable warmup** in Instantly.ai for every mailbox. [#191]

**Step 5 — Wait ~21 days** for warmup before sending. [#35]

**Step 6 — Write sequences** (see Sequence Templates section). 6 sequences total: 2 per niche, each using a different offer. [#31]

**Step 7 — Upload enriched CSV** to Instantly or Smartlead. Map fields (first name, email, icebreaker variable). [#22]

**Step 8 — Configure campaign settings.** Preview outgoing emails, verify all variables fill correctly, confirm volume settings. [#35]

**Step 9 — Set up reply notifications.** Install Instantly Unibox app (Hypergrowth plan) OR configure webhooks to push reply notifications to Slack/CRM. [#30]

**Step 10 — Launch.** Click "Launch." Monitor first sends. [#35]

**Step 11 — Split test.** Run 2 variants per niche simultaneously. At Day 28 retrospective, turn off losing variant. On Day 29, write 3 new sequences to test against winners using "Add variant" in Instantly. [#42], [#43]

---

## Day-by-day cold email setup

### Day 1
- Buy your main domain (Namecheap or Porkbun). [#3]
- Set up Google Workspace for primary email (Business Standard, downgrade to Starter at Day 25 to save ~$15/mo). [#3]
- Set up cold email infrastructure: buy sending domains, assign mailboxes (3 per domain), configure DKIM/SPF/DMARC, enable warmup in Instantly.ai. [#1]
- Sign up to Instantly.ai. [#90], [#96], [#118]
- Watch the associated video guide for cold email setup. [#101]
- Clock starts on 21-day warmup period. [#1]

### Day 8
- Set up scraping infrastructure (Apify, Apollo, Vayne, Claude Code, n8n scrapers — whichever combination applies). [#18]
- Goal: infrastructure that will support 4,000+ leads, scalable to hundreds of thousands. [#18]
- Understand lead scraping cost tradeoff: $0.01/lead vs $0.00/lead = enormous time delta. [#18]

### Day 11
- Scrape first **1,000 leads** (running total: 1,000). [#22]
- Export to Google Sheet with naming convention `Source, Segment, Date`. [#22]
- Save CSV as `mm-dd-yyyy-source-segment.csv`. [#22]
- Do NOT upload to Instantly yet. [#22]

### Day 13
- Scrape next **1,000 leads** (running total: 2,000). [#24]
- Same export/naming format. [#24]

### Day 15
- Scrape next **1,000 leads** (running total: 3,000). [#28]
- Same export/naming format. [#28]

### Day 16
- Set up cold email webhooks and/or Instantly Unibox mobile app. [#30]
- Configure push notifications for every reply. [#30]
- If not on Hypergrowth plan: build webhook route to push replies to Slack or CRM. [#30]
- Objective: reply within 5 minutes of every positive response. [#30]

### Day 17
- Write **6 cold email sequences** (2 per niche, each tied to one of 6 offers developed on Day 14). [#31]
- Structure per email: Personalization → Who am I → Why trust me → Offer/CTA. [#31]
- Example copy snippet: *"I work with LeftClick. We book ~20 qualified sales appointments per month for recruitment agencies, and I was wondering if you wanted some free leads (I have a lot I can send you!)"* [#31]

### Day 19
- **Double-check mailbox configuration.** [#32]
- In Instantly: click the 4-grid icon (top right) → auto-check DKIM, DMARC, SPF. [#32]
- Optionally run a placement test for in-depth deliverability data. [#32]
- If using Smartlead: manually check records against Namecheap DNS panel. [#32]

### Day 20
- Run **final pre-send cold email checklist**: email config, copy review, variable fill test, volume settings. [#34]
- High opportunity cost of misconfiguration — don't rush this. [#34]

### Day 21
- (No explicit cold email task listed — implied final warmup day.)

### Day 22
- **Launch campaigns.** [#35]
- Give everything a final once-over. Preview outgoing emails. Confirm variables populate. Verify volume settings. [#35]
- Click "Launch." Note: scheduling may mean first sends go out the following morning. [#35]

### Day 28
- Conduct **cold email retrospective.** [#42]
- By this point: ~2,000 cold emails sent. [#40]
- Read every reply (OOOs, negatives, positives — all of them). [#42]
- Per reply: What triggered the response? What copy element resonated or failed? What does this imply about the niche? [#42]
- Identify highest-performing sequence out of the 6. Turn off the rest. [#42]
- Share metrics in community post: total leads contacted, reply rate, positive reply rate, calls booked. [#42]

### Day 29
- Write **3 new cold email sequences** (one per niche) based on retrospective insights. [#43]
- If one offer is outperforming: keep the offer, rewrite the email around it with novel framing. [#43]
- If no standout offer: make entirely new ones. [#43]
- In Instantly: click "Add variant" within existing sequence to A/B test new email against Day 28 winner. [#43]
- Always be iterating — time passes anyway, extract the data. [#31]

---

## Mailbox + deliverability checklist

### Domain Setup
- [ ] Buy sending domains (variations of main domain, not the main domain itself) via Namecheap, Porkbun, or Zapmail.ai. [#3], [#173]
- [ ] Assign **3 mailboxes per sending domain**. [#175]
- [ ] Total Month 1 setup: 9 mailboxes across 3 domains (implied by [#37]).

### DNS Authentication (per mailbox/domain)
- [ ] **SPF** record added to DNS. Verify in Instantly via 4-grid button. [#32]
- [ ] **DKIM** record added to DNS. Verify in Instantly via 4-grid button. [#32]
- [ ] **DMARC** record added to DNS. Verify in Instantly via 4-grid button. [#32]
- [ ] Verify domain ownership in Google Workspace by adding TXT record to DNS. [#117]
- [ ] Activate Gmail by adding MX records to DNS. [#127]
- [ ] Cross-check all records in Namecheap (or your registrar) if using Smartlead. [#32]

### Warmup
- [ ] Enable warmup in Instantly.ai for **every mailbox immediately after setup** (Day 1). [#191]
- [ ] Warmup period: minimum ~21 days before sending live campaigns. [#1], [#35]
- [ ] Do not send cold outreach during warmup period. [#35]
- [ ] Optionally run a placement test in Instantly for deeper deliverability data. [#32]

### Daily Limits / Slow Ramp
- [ ] Daily send volume: (no specific per-mailbox daily cap stated in corpus — use platform defaults with conservative ramp).
- [ ] Use DFY (done-for-you) mailboxes where possible to ensure config is correct out of the box. [#32]

### Pre-Send Final Check (Day 20)
- [ ] Re-verify DKIM, SPF, DMARC still green. [#34]
- [ ] Preview outgoing emails — confirm ALL variables populate (no blank `{{first_name}}` etc). [#35]
- [ ] Confirm volume settings are correct. [#35]
- [ ] Confirm scheduling window is correct. [#35]

---

## Sequence templates

### Sequence structure (all emails)
Nick follows this 4-part formula for every cold email: [#31]

1. **Personalization** — opens every email. Buys attention. Campaigns without personalization "tend to suck." [#31]
2. **Who am I?** — the core copywriting section. Credible, specific, brief.
3. **Why trust me?** — proof element (authority, results, association).
4. **Offer / CTA** — the irresistible offer. Must be specific, time-bound, low-friction to say yes to.

### Offer formula
> *"I will give you [thing] in [time] or your money back — just send me [input]."* [#26]

### Icebreaker / personalization format (exact copy)
> *"Hey {name}. Love {shortenedVersionOfCompanyName}, big fan of {shortParaphrasedVersionOfSomethingPlausiblyUniqueAboutThem} (genius/very smart/etc)."* [#78]

Rules: variables ≤5 words, short and informal, imply shared context (e.g., *"Hey Jennifer. Love Macleod Trail Dental, big fan of doing same-day emergency work (we do so too!)"*). [#78]

### "Who am I" example (exact copy)
> *"I work with LeftClick. We book ~20 qualified sales appointments per month for recruitment agencies, and I was wondering if you wanted some free leads (I have a lot I can send you!)"* [#31]

### Initial email pattern
```
[Icebreaker — personalized, 1 sentence, from AI workflow]

[Who am I — company name + specific result you deliver + niche]

[Why trust me — proof point, authority, case study reference]

[Offer — specific thing + timeframe + money-back or risk reversal]

[Single low-friction CTA — one question, not "let me know if interested"]
```

### Follow-up #1 pattern
(no specific copy snippet in corpus — implied continuation of same sequence in Instantly. Sequence structure: add variants within campaign.) [#43]

### Follow-up #2 pattern
(no specific copy snippet in corpus)

### Automated follow-up system (workflow)
3-stage cadence: Day 3 / Day 7 / Day 14 follow-ups; customizes messaging based on which links were clicked; logs to CRM. [#208]

For each follow-up: retrieve all prior email history + transcripts between you and the lead → feed context + template into AI → generate unique follow-up message ensuring no repetition. [#138]

### Split testing
- Run 2 variants per niche simultaneously. [#31]
- At Day 28: kill losing variant. [#42]
- Day 29: write new variant, use "Add variant" in Instantly to A/B test against winner. [#43]
- Continue this iteration loop indefinitely. [#43]

---

## Reply handling + lead scoring

### Instant reply imperative
- Reply to every positive response **within 5 minutes.** [#30]
- Leads receiving instant replies convert at ~400% higher rates. [#30]
- Set up: Instantly Unibox app (Hypergrowth plan) with push notifications, OR webhooks to Slack/CRM. [#30]

### Auto-reply bot (workflow available)
Watches Instantly campaign for replies and bounces → classifies reply intent → scores lead → auto-replies to bounces. [#211]

### Email categorization
Watches inbox → AI classifies into priority buckets (high / medium / low / spam) → applies labels → routes to folders. [#210]

### Auto-reply (Make workflow)
Automatically detects inbound leads from emails → generates AI-powered replies → replies within same thread to maintain context → smart filtering for relevance. [#66]

### Classification logic (from n8n workflow prompt)
```
You are an assistant that helps respond to new customer inquiries.
1. Read the incoming email carefully.
2. Determine intent: is this a serious inquiry about services (YES) or spam/unqualified (NO)?
3. If NO, respond only with: "DISQUALIFIED".
4. If YES, write a polite, professional reply that:
   - Thanks them for reaching out,
   - Confirms you understand what they're asking for,
   - [books next step / CTA]
```
[#81]

### Reply retrospective process (Day 28)
For every reply received — including OOOs and negatives — ask: [#42]
- What triggered this response?
- What copy element resonated or failed?
- What does this reveal about the niche?
- What action should I take?

Record insights. Share metrics publicly (reply rate, positive reply rate, calls booked). [#42]

### Lead scoring / CRM
- Configure CRM to track: date lead moved into each stage, number of days since last contact. [#98]
- Filter automation by days in current stage and category. [#122]
- When a lead pays (Stripe `payment_intent.succeeded`) → match by email → mark as Won in ClickUp → trigger onboarding. [#263], [#209]

---

## Specific numbers to internalize

| Metric | Value | Source |
|---|---|---|
| Reply rate target (total) | 5–7% | [#171] |
| Positive reply rate target | 1% (1 positive per 100 contacted) | [#181] |
| Instant reply conversion uplift | ~400% | [#30] |
| Reply-within target | 5 minutes | [#30] |
| Sequences written (initial) | 6 (2 per niche × 3 niches) | [#31] |
| Sequences written (Day 29) | 3 new (1 per niche) | [#43] |
| Niches to test | 3 simultaneously | [#5] |
| Total leads scraped Month 1 | 4,000 | [#37] |
| Leads per scraping session | 1,000 | [#22] |
| Scraping sessions | 4 (Days 11, 13, 15, 25) | [#22], [#24], [#28], [#37] |
| Mailboxes (Month 1) | 9 implied | [#37] |
| Mailboxes per domain | 3 | [#175] |
| Warmup period | ~21 days | [#1], [#35] |
| Cold emails sent by Day 27 | ~2,000 | [#40] |
| Minimum monthly emails (guarantee) | 1,000/month × 3 months | [#61] |
| Minimum Upwork apps (guarantee) | 100/month × 3 months | [#61] |
| Guarantee period | 90 days | [#61] |
| Difference between good offer and no offer | Up to 10× reply rate | [#26] |
| Google Workspace Business Standard cost | ~$23 USD/month | [#3] |
| Google Workspace Business Starter cost | ~$8 USD/month | [#3] |
| Downgrade reminder | Day 25 (25 days after Day 1 setup) | [#3] |
| Polling cost (pre-webhook) | ~$80/month wasted | [#54] |
| Webhook cost | ~$1/month for same scenarios | [#54] |
| Expected program ROI | 30×–100× | [#64] |
| Members achieving $15,000+ in first month | Many examples cited | [#64] |
| Nick's Upwork lifetime revenue | >$1,000,000 | [#6] |
| DOE framework error rate (low-risk functions) | <~2% | [#74] |
| n8n/Make knowledge actually used by Nick | ~10% despite making millions | [#48], [#58] |
| Social media companies generating revenue (~12,000 surveyed) | ~400 of ~12,000 (~3.3%) | [#29] |

---

## Tools (table)

| Tool | What it does | Pricing | Nick's affiliate link |
|---|---|---|---|
| Instantly.ai | Cold email sending, inbox warmup, Unibox, webhooks, A/B testing | Subscription (Hypergrowth for app/webhooks) | https://instantly.ai/?via=nick-saraev |
| Smartlead.ai | Cold email alternative to Instantly, same workflow | Subscription | https://smartlead.ai?via=nick-saraev |
| AnyMailFinder | Email enrichment — domain/LinkedIn URL → verified email, bulk upload | Subscription | https://anymailfinder.com?via=nick |
| Apollo.io | B2B contact database + email enrichment | Freemium | (none) |
| Apify | Web scraping platform — Google Maps, LinkedIn, Instagram, Upwork, Twitter actors | Freemium | https://apify.com?fpr=nick (promo: 30NS = 30% off 2 months) |
| PhantomBuster | LinkedIn + Instagram profile scraper, follower lists, post engagement | Subscription | https://phantombuster.com?deal=noah60 |
| Zapmail.ai | Buy domains + assign mailboxes pre-configured for cold email | (not specified) | (none) |
| Vayne.io | Leads-as-a-service via Sales Navigator URL input | (not specified) | (none) |
| Namecheap | Domain registrar | Per domain | (none) |
| Porkbun | Domain registrar (often has first-time promo codes) | Per domain | (none) |
| Google Workspace | Primary business email hosting | ~$8/mo (Starter) | (none) |
| LinkedIn Sales Navigator | B2B prospecting filters | Subscription | (none) |
| Firecrawl | Website scraper → clean Markdown output, handles JS-rendered pages | (not specified) | (none) |
| Claude Code | AI coding agent for scraper generation, copy variants, data cleaning | Subscription | (none) |
| n8n | No-code automation platform (self-hostable, most flexible) | Freemium/self-host | (none) |
| Make.com | No-code automation platform (simpler, more affordable than Zapier) | Subscription | (none) |
| PandaDoc | Proposal/agreement/invoice documents | (not specified) | (none) |
| ClickUp | CRM + project management | (not specified) | (none) |
| Loom | Video recording for Upwork applications | Freemium (5-min free) | (none) |
| Reply.io | Cold email / outreach platform | (not specified) | (none) |
| Rize | Automatic time tracker | Subscription | (none) |
| Toggl / Harvest | Manual time tracking | Freemium | (none) |
| A Leads | Lead sourcing | (not specified) | Use code SARAEV for 30% off |
| Typeform | Forms | (not specified) | (none) |
| Missive | Shared inbox / email collaboration | (not specified) | (none) |
| Bland.ai | AI phone call automation | (not specified) | (none) |
| Notion / Monday.com | Project management alternatives | (not specified) | (none) |
| Bannerbear | Automated image/video generation | (not specified) | (none) |
| Stripe | Payments | (not specified) | (none) |
| Webflow / Carrd | Website builders | (not specified) | (none) |
| Fireflies.ai | Call recording + transcription | (not specified) | (none) |
| DataForSEO | SEO data API | (not specified) | (none) |

---

## Specific mistakes to avoid

1. **Not having a personalized icebreaker.** "Campaigns that don't have personalization tend to suck." Personalization is what buys you enough time to finish the rest of your pitch. [#31]

2. **Not having an offer.** "If you don't have an offer, your outreach will almost certainly perform poorly. The difference between a campaign with a good offer and one without any offer at all can be as high as 10x the reply rate." [#26]

3. **Sending generic opener emails.** Example of what NOT to do: *"Hello! I hope you're well. My team and I have an opportunity for you..."* — this gets ignored. [#18]

4. **Uploading leads to Instantly/Smartlead before enrichment and organization.** Leads should be staged in Google Sheets with proper naming convention first. [#22]

5. **Not replying within 5 minutes.** Leads that get a slow reply convert at far lower rates. At this stage in the business, you do not have the luxury of missing that window. [#30]

6. **Running cold email campaigns before warmup is complete.** Warmup takes ~21 days. Sending before then damages deliverability. [#1], [#35]

7. **Not verifying DKIM/SPF/DMARC before launch.** Wasting even a day or two due to poor configuration is significant opportunity cost. [#34]

8. **Not split-testing.** Running one sequence per niche with no variant = wasted data. Time passes anyway — always test. [#31], [#43]

9. **Not reading all replies during retrospective.** You must read every reply — OOOs, negatives, positives — to extract signal. [#42]

10. **Using polling instead of webhooks for reply monitoring.** Polling cost Nick ~$80/month vs $1/month for webhooks, and delays replies by 15–20 minutes. [#54]

11. **Uploading anonymous video files (e.g., Google Drive links) instead of Loom links** for Upwork applications. Adds friction and looks like a security risk. [#9]

12. **Spending time on social media before proving cold email and Upwork.** Of ~12,000 automation companies surveyed, only ~400 generated any revenue from social media at all. [#29]

13. **Building a CRM before having customers.** "If you don't have customers, what use is a CRM?!" Spend time on revenue-generating activities first. [#40]

14. **Overthinking the operating name.** "Your operating name should be shallow, meaningless, and kind of dumb sounding." People waste days on this — it should take less than 5 minutes. [#2]

15. **Trying to memorize a script for sales calls** instead of using a "sales skeleton" — kills authenticity and adaptability. [#13]

16. **Automating community engagement.** Despite being an automation program, Nick explicitly warns against automating community comments — it gets detected, violates rules, and destroys the reputation-building mechanism. [#14]

17. **Sending cold email from your main domain.** Implied by the instruction to buy separate sending domains [#153] — burning your primary domain is irreversible.

18. **Not staying organized with lead file naming.** "Since you'll be scraping a ton of leads as you scale your cold email campaigns, organization is important. Learning this now will save you a lot of pain later." [#22]

---

## Direct quotes

> *"Cold email is by far the most powerful, high-volume, scalable outreach mechanism currently available."* — [#1]

> *"The difference between spending $0.00 per lead and $0.01 per lead, for example, is not just one cent: it's dozens of hours (or weeks of progress, whichever is larger)."* — [#18]

> *"If you don't have an offer, your outreach will almost certainly perform poorly. The difference between a campaign with a good offer and one without any offer at all can be as high as 10x the reply rate."* — [#26]

> *"Campaigns that don't have personalization tend to suck, so make sure you have it!"* — [#31]

> *"One of the highest-ROI things you can do while running a cold email campaign is getting back to your prospect within five minutes. Leads that receive instant replies tend to convert at a far higher rate—many studies and surveys show numbers around the 400% mark."* — [#30]

> *"Sure, it's a little annoying to pack your life with more notifs, especially if you're working on other stuff, but positive sales responses are one of those things you'll merely have to tolerate until you get to the point where you can hire someone to do this for you."* — [#30]

> *"Before I knew how webhooks worked, I was personally spending about $80/month in wasted ops and much more than that in poor client response times. After switching to webhooks, my replies became instant and my costs dropped to about $1/month for those webhook scenarios."* — [#54]

> *"Cold outreach is nuanced—it's not just about hitting send, but about nailing the right messaging, and that messaging can vary widely based off of niche."* — [#42]

> *"Since you have six sequences total, this exercise will also let you identify the higher performing sequence and turn off the old one. Tomorrow, you'll write a new sequence that you'll then split test against the winner. In this way, you'll constantly be iterating and improving."* — [#42]

> *"Your operating name should be shallow, meaningless, and kind of dumb sounding. Because the faster someone gets what you do, the better."* — [#2]

> *"If you take this program seriously, and follow it until the end, software costs will be the least of your concerns. Most members can expect somewhere in the realm of a 30x - 100x ROI, and there are many examples of community members achieving $15,000 or more in their first month."* — [#64]

> *"Of the ~12,000 automation companies I've consulted with, the majority had experimented with posting on social media. But only ~400 had generated any revenue from it at all... If those automation companies took the same amount of time that they spent on social media, and instead applied it to proven outbound lead generation methods like cold email and Upwork applications, they would have made much more money."* — [#29]

> *"Keep the icebreaker variables extremely short and informal. Don't write long meandering variables over 5 words—keep them super short and imply we do the same thing, like 'Hey Jennifer. Love Macleod Trail Dental, big fan of doing same-day emergency work (we do so too!)'"* — [#78]

> *"Time passes anyway, and you might as well walk away knowing more about your audience."* — [#31]

> *"We're in business to make money. Instead of guessing at what our core virtues are, it is better to test what the most effective niches are and let the market decide for you."* — [#5]