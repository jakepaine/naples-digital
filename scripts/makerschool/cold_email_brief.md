# Nick Saraev Cold Email Playbook — Complete Reference for Jake (Naples Digital)

---

## Quick reference (table)

| Metric / Parameter | Nick's Number / Guidance |
|---|---|
| Target open rate | (no specific open rate benchmark cited in corpus) |
| Target reply rate | ~1% positive-reply rate as baseline; 2.5–3.5% is strong; 0.4% = dead campaign [#274] |
| Daily send volume | 300–500 emails per day [#274] [#120] |
| Weekly send volume | ~2,800 emails per week [#274] |
| Simultaneous campaigns | 3 running at once, ~1,000 emails per campaign or ~3 days of volume [#274] [#132] |
| Recommended mailbox count | 9 mailboxes (Nick's baseline assumption) [#255] |
| Warmup time before sending | ~21 days (setup Day 1, send Day 22) [#1] [#35] |
| Lead count — Month 1 target | 4,000 total (1,000 per scraping session × 4) [#18] [#22] [#24] [#28] [#37] |
| Lead coverage | 4,000 leads covers remainder of Month 1 + Month 2 at 9 mailboxes [#37] |
| Minimum cold email for guarantee | 1,000/month for 3 consecutive months [#61] [#255] |
| Speed-to-reply target | Within 5 minutes of a positive response [#30] |
| Reply conversion uplift from instant reply | ~400% higher conversion [#30] |
| Estimated startup software cost | "A couple hundred dollars" [#64] |
| Expected ROI on program | 20x–100x; many members hit $15,000+ first month [#64] [#273] |
| Primary sending platform | Instantly.ai [#231] |
| Alternative sending platform | Smartlead.ai [#243] |
| Lead sources (scraping) | Apollo.io, Apify, Vayne, LinkedIn Sales Navigator [#18] [#216] [#218] |
| Enrichment tool | AnyMailFinder, Icypeas [#18] [#214] |

---

## The 3-act cold email pipeline — sourcing → enrichment → sending

### Act 1: Sourcing

**Goal:** Pull a raw list of target companies and decision-makers.

1. **Define your niche segment.** Use the format "I build [service] for [market type]." Lock in 3 niches. [#5]
2. **Choose your scraping method.** Options ranked by cost/effort:
   - **Apollo.io** (freemium B2B database) — filter by industry, employee count, job title. Export CSV. [#218]
   - **Apify actors** — Google Maps Scraper, LinkedIn scraper, or custom actors via the Apify Store. [#216]
   - **Vayne.io** — paste a LinkedIn Sales Navigator search URL, specify lead count, download CSV. [#125] [#130]
   - **LinkedIn Sales Navigator** — set job title, location, company size filters; export. [#87]
   - **Leads-as-a-service** — Vayne, Apollo, Airscale for done-for-you lists. [#18]
3. **Set filters.** Specify: country/region, company size, job title, industry keywords. [#104] [#114]
4. **Export raw data.** Download CSV. Rename using convention: `mm-dd-yyyy-source-segment`. Example: `09-06-2024-apollo-recruitment-agencies-1-10-employees.csv` [#22]
5. **Stage in Google Sheets.** Do NOT upload to sending platform yet. Naming convention for the sheet: `Source, Segment, Date`. Example: `Apollo, Recruitment Agencies 1-10 Employees, Sep 4 2024`. [#22]
6. **Aim for 1,000 leads per session.** Month 1 = 4 scraping sessions = 4,000 total leads. [#22] [#37]

---

### Act 2: Enrichment

**Goal:** Turn company names + LinkedIn URLs into verified, personalized email addresses + icebreakers.

1. **Filter sheet for missing emails.** Identify rows without email address. [#152]
2. **Export enrichment CSV.** Keep columns: first name, last name, company, LinkedIn URL (or domain). Rename to `leads_to_enrich.csv`. [#157] [#95]
3. **Move to enrichment queue.** Place in `1_to_enrich` folder. [#110]
4. **Run AnyMailFinder bulk search.** Go to anymailfinder.com → upload CSV → run bulk email search → download results filtering for "valid" emails only. [#162] [#174] [#214]
5. **Alternative enrichment.** Apollo.io, Icypeas, Snov, or Hunter for domains without AnyMailFinder coverage. [#18]
6. **Generate personalized icebreakers.** Use the n8n or Make workflow: Google Search → Firecrawl scrape of each company website → AI node generates one-sentence icebreaker. [#78] [#79]
   - **Icebreaker prompt (exact):** *"Hey {name}. Love {shortenedVersionOfCompanyName}, big fan of {shortParaphrasedVersionOfSomethingPlausiblyUniqueAboutThem} (genius/very smart/etc)."* Keep variables under 5 words. [#78]
7. **Append icebreaker column to master sheet.** Output: sheet with first name, email, company, icebreaker.
8. **Quality check.** Review sample of 20–30 leads. Confirm emails are valid and icebreakers are human-sounding. [#185]

---

### Act 3: Sending

**Goal:** Configure mailboxes, load leads, launch campaigns, and iterate.

1. **Buy sending domains.** Use Zapmail.ai for bulk domain purchase. Get 3 email accounts per domain. [#163] [#171]
2. **Set up DNS records.** DKIM, SPF, DMARC — covered below in deliverability section. [#32]
3. **Connect mailboxes to Instantly.ai (or Smartlead).** Export mailboxes to the platform. [#179]
4. **Enable warmup.** Turn on warmup for every account immediately after connecting. [#184]
5. **Warm for ~21 days** before sending live campaigns. [#1] [#35]
6. **Write sequences.** 6 sequences in Month 1 (2 per niche), each using one core offer. [#31]
7. **Upload leads.** Import enriched CSVs to Instantly/Smartlead campaigns. Map fields (first name, email, icebreaker variable). [#22]
8. **Preview outgoing emails.** Confirm all variables are populating correctly. [#35]
9. **Set volume.** 300–500 emails/day across all mailboxes. [#120] [#274]
10. **Launch.** Click "Launch" in Instantly. Expect first results the following morning. [#35]
11. **Set up reply notifications.** Instantly Unibox app (Hypergrowth plan) or webhooks → Slack. Respond within 5 minutes. [#30]
12. **Iterate weekly.** Identify worst-performing campaign; pause it; write new variant; split-test against current winner. [#144] [#43]

---

## Day-by-day cold email setup

### Day 1
- Choose operating name. [#2]
- Buy main domain (Namecheap or Porkbun). [#3] [#83]
- Set up Google Workspace (Business Starter ~$8/mo; set reminder to downgrade from Standard at day 25). [#3]
- Begin cold email infrastructure setup: buy sending domains via Zapmail, assign 3 mailboxes per domain. [#1] [#163] [#171]
- Enable warmup on all mailboxes in Instantly.ai immediately. [#184]
- Sign up to Instantly.ai. [#89] [#96] [#109]
- Watch the associated cold email setup video. [#100]

### Day 8
- Set up scraping infrastructure. Choose platform(s): Apollo, Apify, Vayne, LinkedIn Sales Nav, AnyMailFinder, Icypeas. [#18]
- Note: infrastructure must support scraping 4,000+ leads. This same setup can scale to hundreds of thousands. [#18]
- The major takeaway: "The difference between spending $0.00 per lead and $0.01 per lead is not just one cent: it's dozens of hours." [#18]

### Day 11
- Scrape 1,000 leads (Session 1 of 4). [#22]
- Export to Google Sheet. Naming: `Apollo, Recruitment Agencies 1-10 Employees, Sep 4 2024`. [#22]
- Do NOT upload to Instantly yet. [#22]

### Day 13
- Scrape 1,000 leads (Session 2 of 4). Total so far: 2,000. [#24]
- Same export/naming conventions. [#24]

### Day 14
- Write six offers (2 per niche). Formula: *"I will give you [thing] in [time] or your money back — just send me [input]."* [#26]
- Offers can meaningfully change reply rate by up to 10x. Don't skip. [#26]

### Day 15
- Scrape 1,000 leads (Session 3 of 4). Total so far: 3,000. [#28]

### Day 16
- Set up cold email webhooks or Instantly Unibox app for instant reply notifications. [#30]
- Configure: reply → push notification within 5 minutes. [#30]
- If not on Hypergrowth plan: build webhook → route to Slack or CRM. [#30]

### Day 17
- Write six cold email sequences (2 per niche), each using one offer developed on Day 14. [#31]
- Follow copywriting formula: Personalization → Who am I? → Why trust me? → Offer/CTA. [#31]

### Day 19
- Double-check mailbox config. In Instantly: click the grid icon (top right) → verify DKIM, DMARC, SPF all green. [#32]
- Optional: run placement test for deeper diagnostics. [#32]

### Day 20
- Run final pre-send cold email checklist: email config, copy, variable fill-in preview, volume settings. [#34]

### Day 21
- (Implied warmup completion day — 21 days from Day 1 setup.)

### Day 22
- **Launch.** Give final once-over, preview variables, confirm volume settings. Click "Launch." [#35]
- Emails begin sending; results may appear next morning. [#35]

### Day 28
- Cold email retrospective. You will have sent ~2,000 cold emails. [#42]
- Read every reply (including OOO and negative). Ask: what offer resonated? What phrasing drove replies? What niche seems most responsive? [#42]
- Record open rate, reply rate, positive reply rate, calls booked. [#42]
- Identify highest-performing sequence. Turn off the loser. [#42]

### Day 29
- Write 3 new cold email sequences (one per niche) using insights from retrospective. [#43] [#92]
- Add as variant inside the existing campaign (Instantly: "Add variant") to split-test against the Day 28 winner. [#43]
- If one offer is clearly winning, reuse it with novel framing. If no standout, write entirely new offers. [#43]

---

## Mailbox + deliverability checklist

### DNS Records
- **SPF** — verify via Instantly's built-in checker (grid icon → top right) [#32]
- **DKIM** — verify same way [#32]
- **DMARC** — verify same way [#32]
- If using Smartlead or other platform: check records manually against Namecheap (or your registrar). [#32]
- Verify domain ownership by adding a TXT record at registrar. [#108]

### Warmup
- Enable warmup immediately after connecting mailboxes to Instantly. [#184]
- Warmup period: ~21 days minimum (Day 1 setup → Day 22 launch). [#1] [#35]
- Use Instantly's built-in warmup feature; "Hypergrowth" plan or above recommended for Unibox app access. [#30]
- Do not send live campaigns before warmup completes. [#35]

### Daily limits and ramp
- Send 300–500 emails per day across all active mailboxes. [#120] [#274]
- With 9 mailboxes at ~200 emails/mailbox/day (conservative), you can reach this comfortably. [#255]
- 1,000 cold emails/month is the minimum meaningful threshold (guarantee threshold). [#61]

### Mailbox setup
- Buy sending domains separately from your main domain — never send cold email from your primary business domain. [#1]
- Use Zapmail.ai for bulk domain + mailbox purchase. [#163]
- 3 email accounts per sending domain. [#171]
- Nick's default: 9 mailboxes. [#255]

### Pre-send checklist (Day 20)
- DKIM ✓, SPF ✓, DMARC ✓
- Preview every outgoing email variant — confirm variables populate
- Double-check daily volume settings
- Confirm scheduling (timezone, send window)
[#34]

---

## Sequence templates

### Copywriting formula (all sequences follow this structure) [#31]

```
1. PERSONALIZATION LINE
   → Uses AI-generated icebreaker from website scrape
   → "Hey {name}. Love {company}, big fan of {unique thing}."
   → Buys you enough goodwill to finish the pitch

2. WHO AM I?
   → One sentence on what you do + a credibility signal
   → Example: "I work with LeftClick. We book ~20 qualified sales
     appointments per month for recruitment agencies, and I was
     wondering if you wanted some free leads (I have a lot I can
     send you!)"

3. WHY TRUST ME?
   → A proof element: case study, notable client, result
   → Tie directly to authority or outcome relevant to recipient

4. OFFER / CTA
   → Formula: "I will give you [thing] in [time] or your money
     back — just send me [input]."
   → Make it low-friction and high-value
   → One clear next step
```
[#26] [#31]

### Offer formula (exact) [#26]
> *"I will give you [thing] in [time] or your money back — just send me [input]."*

### Example email body (from corpus) [#31]
> *"I work with LeftClick. We book ~20 qualified sales appointments per month for recruitment agencies, and I was wondering if you wanted some free leads (I have a lot I can send you!)"*

### Icebreaker format (exact AI prompt output) [#78]
> *"Hey {name}. Love {shortenedVersionOfCompanyName}, big fan of {shortParaphrasedVersionOfSomethingPlausiblyUniqueAboutThem} (genius/very smart/etc)."*
>
> Rules: keep variables under 5 words. Imply you do the same thing. Example: *"Hey Jennifer. Love Macleod Trail Dental, big fan of doing same-day emergency work (we do so too!)."*

### Followup #1 / #2 / #3 (automated cadence) [#197] [#252]
- Use a 3-stage followup cadence: 3 / 7 / 14-day intervals
- Build automation in Make/n8n that runs daily, pulls CRM records, routes based on days-in-stage
- For each record: retrieve full email history + transcripts → feed into AI with template:
  > *"This is follow-up X in a series. Here is all of our communication up until now. Modify this template with the additional context provided above. Do not repeat yourself, ensure every follow-up is unique."*
- [#252]
- You need a CRM with stages: Intake → Meeting Booked → Proposal Sent → Closed Won → Closed Lost, plus a field for "date moved to stage" and "days since last contact." [#252]

### Split-testing protocol [#43]
- Run 2 sequences per niche simultaneously from Day 17
- After Day 28 retrospective: kill loser, add winner variant in same campaign ("Add variant" in Instantly)
- Continuously iterate: always be testing

---

## Reply handling + lead scoring

### Instant reply setup [#30]
- **Goal:** Respond within 5 minutes of any positive reply. Studies cited show ~400% higher conversion for instant replies.
- **Method A (Instantly Hypergrowth):** Enable Unibox app → configure push notifications on mobile.
- **Method B (webhook):** Build webhook in Instantly → route to Slack notification or CRM auto-notify.

### Auto-reply classification (AI-powered) [#200] [#81] [#66]
Use the "Instantly Auto-Reply Bot" workflow pattern:
1. Instantly webhook fires on new reply
2. AI node classifies reply intent (interested / not interested / OOO / bounce / unsubscribe)
3. Lead is scored and routed:
   - **Positive intent:** flag as hot lead, push notification to you, log to CRM
   - **Bounce:** auto-handle, remove from sequence
   - **OOO:** tag, re-queue for follow-up after return date
   - **Negative/unsubscribe:** remove from campaign, log

### Email categorization system [#199]
- AI classifies inbox into priority buckets: high / medium / low / spam
- Applies labels and routes to folders automatically
- Tools: Gmail + OpenAI + Google Sheets

### Reply classification prompt pattern [#81]
> "You are an assistant that helps respond to new customer inquiries.
> 1. Read the incoming email carefully.
> 2. Determine intent: is this a serious inquiry (YES) or spam/unqualified (NO)?
> 3. If NO, respond only with: DISQUALIFIED
> 4. If YES, write a polite, professional reply that: thanks them, confirms understanding, positions the company as capable, invites them to book a call [Calendly link], under 120 words, clear professional English."

### Lead scoring logic [#252]
- CRM stages drive follow-up routing: days in stage × category = follow-up route
- AI generates unique follow-ups per lead using full email history as context — no repeated messaging

---

## Specific numbers to internalize

| Number | Context | Source |
|---|---|---|
| 300–500 | Emails to send per day | [#120] [#274] |
| ~2,800 | Emails per week | [#274] |
| 3 | Simultaneous campaigns | [#132] [#274] |
| 1,000 | Emails per campaign (or 3 days of volume) | [#274] |
| 1% | Target positive-reply rate per campaign | [#113] [#274] |
| 10 | Replies per campaign at 1% reply rate (1,000 sent) | [#274] |
| 30 | Replies per day at 1% rate (3,000 sent/day) | [#274] |
| 3.5% | Strong reply rate (Campaign A example) | [#274] |
| 2.5% | Decent reply rate (Campaign B example) | [#274] |
| 0.4% | Dead campaign threshold (Campaign C example) | [#274] |
| 10x | Reply rate uplift from a good offer vs. no offer | [#26] |
| 400% | Conversion uplift from replying within 5 minutes | [#30] |
| 9 | Recommended mailbox count for Month 1 | [#255] |
| 21 days | Warmup period before sending | [#1] [#35] |
| 4,000 | Total leads to scrape in Month 1 | [#18] [#37] |
| 1,000 | Leads per scraping session (4 sessions) | [#22] [#24] [#28] [#37] |
| ~2,000 | Cold emails sent by Day 28 | [#42] |
| 1,000/month | Minimum monthly send for guarantee eligibility | [#61] [#255] |
| 5 minutes | Target reply time to positive responses | [#30] |
| $0.01/lead | Difference between free scraping and paid enrichment — worth every penny | [#18] |
| ~$8/month | Google Workspace Business Starter cost | [#3] |
| ~$23/month | Google Workspace Business Standard (downgrade by day 25) | [#3] |
| "couple hundred dollars" | Expected Month 1 software cost | [#64] |
| 20x–100x | Expected ROI on software spend | [#64] [#273] |
| $15,000+ | First-month earnings benchmark (many community members) | [#64] [#273] |
| $300,000 | Nick's earnings in last 12 months at time of recording | [#266] |
| 90 days | Guarantee window for first paying client | [#61] [#255] |
| ~2% | Error rate on DOE agentic workflows for low-risk business functions | [#74] |
| $80/month | What Nick wasted on polling ops before switching to webhooks | [#269] |
| $1/month | What webhook-based scenarios cost him after switching | [#269] |
| 18,882 | Prompt tokens for raw HTML website scrape (too many) | [#258] |
| 535 | Prompt tokens after stripping HTML (correct approach) | [#258] |
| $10/month | Nick's total OpenAI API spend across all companies | [#268] |

---

## Tools (table)

| Tool | What it does | Pricing | Nick's affiliate link |
|---|---|---|---|
| Instantly.ai | Primary cold email sending platform — warmup, sending, Unibox, webhooks, A/B variants | Subscription | https://instantly.ai/?via=nick-saraev [#231] |
| Smartlead.ai | Alternative cold email platform — same workflow as Instantly | Subscription | https://smartlead.ai?via=nick-saraev [#243] |
| AnyMailFinder | Email enrichment — turn LinkedIn URL or domain into verified email address | Subscription | https://anymailfinder.com?via=nick [#214] |
| Apollo.io | B2B contact database + email enrichment. Free tier covers many cases | Freemium | (none listed) [#218] |
| Apify | General-purpose web scraping marketplace — LinkedIn, Twitter, Google Maps, Instagram, Upwork actors | Freemium | https://apify.com?fpr=nick (promo: 30NS = 30% off 2 months) [#216] |
| Vayne.io | Leads-as-a-service — paste LinkedIn Sales Nav URL, receive CSV | (pricing not listed) | (none listed) [#246] |
| PhantomBuster | Scrapes LinkedIn + Instagram profiles, follower lists, post engagement | Subscription | https://phantombuster.com?deal=noah60 [#238] |
| Zapmail.ai | Bulk domain + mailbox purchase for cold email sending | (pricing not listed) | (none listed) [#250] |
| Namecheap | Domain registrar — primary recommendation | (standard pricing) | (none listed) [#3] |
| Porkbun | Domain registrar — alternative to Namecheap | (standard pricing) | (none listed) [#3] |
| Google Workspace | Business email — Business Starter ~$8/mo | ~$8/month | (none listed) [#3] |
| Firecrawl | Website scraper — returns clean Markdown, handles JS-rendered pages, LLM-ready output | (pricing not listed) | (none listed) [#79] [#258] |
| LinkedIn Sales Navigator | Advanced LinkedIn search + lead filtering by title/company/location | Subscription | (none listed) [#234] |
| n8n | No-code automation platform — self-hostable, highly flexible | Freemium | (none listed) [#49] |
| Make.com | No-code automation platform — simpler than n8n, affordable, visual | Subscription | (none listed) [#57] |
| Claude Code | AI coding agent — used for lead sourcing, copy variants, data cleaning, agentic workflows | Subscription | (none listed) [#146] |
| ClickUp | CRM and project management — used for lead pipeline stages | Subscription | (none listed) [#68] |
| PandaDoc | Proposals + agreements + invoices | Subscription | (none listed) [#68] |
| Stripe | Payment processing | (standard fees) | (none listed) [#68] |
| Airscale | Lead enrichment | (pricing not listed) | (none listed) [#211] |
| Icypeas | Email enrichment — alternative to AnyMailFinder | (pricing not listed) | (none listed) [#18] |
| Reply.io | Cold email alternative | (pricing not listed) | (none listed) [#68] |
| Missive | Shared inbox / email management | (pricing not listed) | (none listed) [#68] |

---

## Specific mistakes to avoid

1. **Sending from your primary business domain.** Buy separate sending domains. Burning your main domain is catastrophic. [#1] [#163]

2. **Launching before warmup is complete.** 21-day warmup is non-negotiable. Sending cold traffic from a cold mailbox destroys deliverability permanently. [#1] [#35]

3. **Uploading leads to Instantly before enrichment is complete.** Export to Google Sheets first, enrich, then upload. Keeps data organized and avoids wasted sends on bad emails. [#22] [#24]

4. **Skipping personalization.** "Campaigns that don't have personalization tend to suck." [#31] The icebreaker is the first thing the prospect reads — without it, your open doesn't convert to engagement.

5. **Sending without an offer.** "The difference between a campaign with a good offer and one without any offer at all can be as high as 10x the reply rate." [#26]

6. **Not iterating on campaigns.** Identify worst-performing campaign weekly and replace it. Running the same dead sequence indefinitely wastes leads. [#144] [#42]

7. **Generic opener lines.** Anything starting with "Hello! I hope you're well. My team and I have an opportunity for you…" gets ignored. Nick contrasts this with a personalized icebreaker as an explicit example of what works vs. what fails. [#18]

8. **Using file-based video links (Google Drive) instead of Loom.** "Who's up for downloading anonymous 200mb video files these days? Talk about a security risk!" (Upwork context, same principle applies to cold outreach.) [#9]

9. **Using polling-based reply detection instead of webhooks.** Polling = replies delayed 15–20 minutes, wasted operations, poor conversion. Webhooks = instant. Nick spent $80/month on wasted ops before fixing this. [#269] [#30]

10. **Responding slowly to positive replies.** Missing the 5-minute window costs ~400% conversion. Set up push notifications before launch. [#30]

11. **Running only one sequence per niche.** Run 2 per niche from Day 17 to generate split-test data. The whole point is to always be iterating. [#31] [#43]

12. **Overthinking offer development.** "There's no rule saying you have to develop your own proprietary offer. You can just copy someone else's." [#26] Ship fast, iterate based on data.

13. **Building a CRM before you have customers.** Nick explicitly avoided CRMs until Day 27 when he had ~2,000 cold emails sent and many active leads. "If you don't have customers, what use is a CRM?!" [#40]

14. **Treating 0.4% reply rate as acceptable.** That's a "dead giveaway that the idea has no market interest." [#274] Kill the campaign, rewrite the offer.

15. **Sending cold email from a gmail.com address.** Proposals "sent from gmail or goodbook addresses don't perform as well, partly because they subcommunicate that you're not a real business." [#280]

16. **Not tracking cold email metrics.** You must know open rate, reply rate, positive reply rate, calls booked per campaign. Retrospective without data is useless. [#42]

---

## Direct quotes

> *"Cold email is by far the most powerful, high-volume, scalable outreach mechanism currently available."* — [#1]

> *"The difference between spending $0.00 per lead and $0.01 per lead, for example, is not just one cent: it's dozens of hours (or weeks of progress, whichever is larger)."* — [#18]

> *"Campaigns that don't have personalization tend to suck, so make sure you have it!"* — [#31]

> *"The difference between a campaign with a good offer and one without any offer at all can be as high as 10x the reply rate."* — [#26]

> *"Leads that receive instant replies tend to convert at a far higher rate—many studies and surveys show numbers around the 400% mark."* — [#30]

> *"Campaign C sent 1024 emails, got a 0.4% reply rate. Campaign C is a dead giveaway that the idea has no market interest."* — [#274]

> *"If you're sending 1,000 emails to new leads per campaign, and you're getting a 1% product-reply rate, that means you're getting 10 replies per campaign. If you're sending 3,000 cold emails per day, you're getting 30 replies per day."* — [#274]

> *"Before I knew how webhooks worked, I was personally spending about $80/month in wasted ops and much more than that in poor client response times. After switching to webhooks, my replies became instant and my costs dropped to about $1/month for those webhook scenarios."* — [#269]

> *"You should send 300–500 emails per day. So that's 2,800 emails per week. And then you should have three campaigns running at the same time. So 1,000 emails per campaign."* — [#274]

> *"If you take this program seriously, and follow it until the end, software costs will be the least of your concerns. Most members can expect somewhere in the realm of a 20x–100x ROI, and there are many examples of community members achieving $15,000 or more in their first month."* — [#273]

> *"I work with LeftClick. We book ~20 qualified sales appointments per month for recruitment agencies, and I was wondering if you wanted some free leads (I have a lot I can send you!)"* — [#31] *(example of the "Who am I?" section in a cold email)*

> *"Hey {name}. Love {shortenedVersionOfCompanyName}, big fan of {shortParaphrasedVersionOfSomethingPlausiblyUniqueAboutThem} (genius/very smart/etc). Keep the icebreaker variables extremely short and informal. Don't write long meandering variables over 5 words—keep them super short."* — [#78]

> *"Imagine getting an email that starts with 'Hello! I hope you're well. My team and I have an opportunity for you...' Would you reply to that email?"* — [#18] *(rhetorical device Nick uses to illustrate the importance of personalization)*

> *"This is follow-up X in a series. Here is all of our communication up until now. Modify this template with the additional context provided above. Do not repeat yourself, ensure every follow-up is unique."* — [#252] *(AI prompt for automated follow-up sequences)*

> *"Polling wastes money; webhooks fire only when the event actually occurs; latter is much more efficient."* — [#260]

> *"Since you have six sequences total, this exercise will also let you identify the higher performing sequence and turn off the old one. Tomorrow, you'll write a new sequence that you'll then split test against the winner. In this way, you'll constantly be iterating and improving."* — [#42]

> *"All you need to do in order to send 1,000 cold emails is you need, what, like let's say you have nine mailboxes, that's a volume of about 200. That just means you will have needed to send cold emails for five days out of a full month. Well, there's about 20 to 25 business days per month. You're totally fine."* — [#255]