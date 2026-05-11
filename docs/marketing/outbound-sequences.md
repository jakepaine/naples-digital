# Naples Digital Outbound Sequences

Drafted 2026-05-11. Three sequences, 5 emails each, ICP-specific. Targets SWFL service businesses currently stitching together Submagic + Apollo + a CRM + a VA.

**Headline offer (referenced where relevant):** $7.5k Lite tier, no retainer 90 days, 15% commission of net new revenue, case-study rights.

**Schema fit.** Each email maps cleanly to the `outreach_sequences.emails` JSONB shape: `{ step, subject, body, delay_days }`. Merge tokens use `{{first_name}}`, `{{company}}`, `{{trigger_event}}` — populated via `PushSequenceInput.variables` in `packages/outreach/lib/types.ts`.

**Cadence (applies to all three sequences):**
- Email 1 — day 0
- Email 2 — day +3
- Email 3 — day +7
- Email 4 — day +12
- Email 5 — day +20

**Tone rules.** No "I hope this finds you well." No "Just circling back." No agency adjectives ("world-class," "synergistic," "robust"). Plain sentences. The hook is the proof, not the pitch. Each email <120 words.

---

## ICP A — SWFL Podcast / Media Studios

Targets shops shaped like 239 Live: in-house studio, weekly cadence, sponsor-funded, currently paying a clipper + a VA + a CRM + Submagic. Hook is the post-production tax — clipping, captions, sponsor decks, episode QA.

### Email 1 — Cold opener (day 0)

**Subject variants:**
- A: `the post-production tax`
- B: `{{company}} — how many clips per episode?`
- C: `your editor's bottleneck, probably`

**Body:**
```
{{first_name}} —

Saw {{trigger_event}}. Quick question: what does {{company}} spend per episode on clipping, captions, and sponsor decks combined? Most studios I talk to land between $400 and $900 — usually split across a VA, Submagic, and a Notion doc.

We built a system for 239 Live in Naples that collapses all of it into one pipeline: transcript → 8 clips → captioned shorts → sponsor-ready deck, no human in the loop until QA.

Cut their per-episode post cost ~70% and 3x'd clip output.

Worth a look? Case study here: [link]

— Jake
Naples Digital
```

---

### Email 2 — Use case (day +3)

**Subject variants:**
- A: `re: the post-production tax`
- B: `the part that breaks at 50 episodes`
- C: `sponsor decks specifically`

**Body:**
```
{{first_name}} —

The piece that surprised the 239 Live team wasn't the clips — it was sponsor decks.

Every interview, their VA was hand-building a 1-pager: guest bio, audience demo, three highlight clips, pitch. ~90 minutes per episode.

We replaced it with a generator that pulls the transcript, ranks moments by sponsor relevance, and ships a deck within 10 minutes of the upload finishing. They closed two Gold sponsors ($1k/show each) in the 30 days after we turned it on.

Curious if {{company}} is hand-building decks now, or skipping them?

— Jake
```

---

### Email 3 — Social proof (day +7)

**Subject variants:**
- A: `numbers from 239 Live, 90 days in`
- B: `what happened after we killed the VA stack`
- C: `before/after at 239 Live`

**Body:**
```
{{first_name}} —

Quick numbers from 239 Live, 90 days after rollout:

— Per-episode post-production: $720 → $180
— Clips published per episode: 3 → 9
— Sponsor decks turnaround: 36 hours → same-day
— Tools dropped: Submagic, Descript, Airtable, one VA contract

The studio runs on a single login now. One bill, one source of truth, no Zapier graveyard.

If you want the architecture diagram, I'll send it — no demo required.

— Jake
```

---

### Email 4 — Direct ask (day +12)

**Subject variants:**
- A: `15 min — {{company}} post pipeline`
- B: `worth a Tuesday call?`
- C: `Naples → {{company}}`

**Body:**
```
{{first_name}} —

Direct ask: 15 minutes to walk through your current post-production stack and tell you whether we can collapse it.

If we can, we'll quote it — $7.5k flat for the Lite tier, no retainer for 90 days, 15% commission on net new sponsor revenue we drive. Case-study rights included.

If we can't, I'll tell you that too. No demo theater.

Tuesday or Thursday this week works for me. Calendar: [link]

— Jake
```

---

### Email 5 — Breakup (day +20)

**Subject variants:**
- A: `closing the loop`
- B: `last note from Naples`
- C: `should I stop emailing?`

**Body:**
```
{{first_name}} —

Last note. If now isn't the right time, no problem — I'll stop the thread.

If post-production starts costing you a clip editor or a third VA in Q3, the offer's still open. Reply with a single word ("later") and I'll move you out of the sequence but keep you on the quarterly note.

Otherwise good luck with {{company}} — genuinely.

— Jake
Naples Digital
```

---

## ICP B — SWFL Real Estate Teams

Targets teams shaped like MIA: small acquisitions team, on/off-market listings, hand-enriching leads from PropStream / county records, distributing listings across IG + email + portals manually. Hook is lead enrichment + listing distribution.

### Email 1 — Cold opener (day 0)

**Subject variants:**
- A: `{{company}}'s lead enrichment time`
- B: `the PropStream → CRM gap`
- C: `who's enriching your leads right now?`

**Body:**
```
{{first_name}} —

Saw {{trigger_event}}. Honest question: when a lead comes in from PropStream or a referral, how long until phone + email + LLC + likely motivation are sitting in your CRM?

Most SWFL teams I talk to: 20-40 minutes per lead, done by a VA or the agent themselves.

We built a pipeline for MIA Real Estate (Naples) that does it in under 2 minutes per lead and auto-routes by buy box. They went from 30 enriched leads/week to 200.

Worth a look? Case study: [link]

— Jake
Naples Digital
```

---

### Email 2 — Use case (day +3)

**Subject variants:**
- A: `on-market vs off-market routing`
- B: `the listing distribution piece`
- C: `where MIA's leads actually came from`

**Body:**
```
{{first_name}} —

The lead enrichment is one half. The other is distribution.

For MIA we wired their new listings into a single push: IG carousel, email blast to their buyer list, portal sync, and three pre-qualified buyer DMs — all from one upload.

Before: agent uploaded to MLS, then a VA did the rest over 2 days. After: 15 minutes, done.

Question for {{company}} — when you take a new listing today, how many tools and humans touch it before it's live everywhere?

— Jake
```

---

### Email 3 — Social proof (day +7)

**Subject variants:**
- A: `MIA's Q1 numbers`
- B: `30 → 200 enriched leads/week`
- C: `what 90 days of automation looks like`

**Body:**
```
{{first_name}} —

MIA Real Estate, 90 days in:

— Enriched leads/week: 30 → 200
— Time to first contact: 18 hours → 90 minutes
— Listings distributed in <1 hour: 0% → 100%
— Tools they stopped paying for: 4

The team didn't grow. The pipeline did.

If {{company}} has a VA spending mornings on PropStream + Apollo + a CRM, this is the shape of the fix. Happy to share the architecture either way.

— Jake
```

---

### Email 4 — Direct ask (day +12)

**Subject variants:**
- A: `15 min on {{company}}'s lead flow`
- B: `should we build it for you?`
- C: `quick call — buy box → live listing`

**Body:**
```
{{first_name}} —

Direct ask: 15 minutes to map your current lead-to-listing flow. I'll tell you which steps are automatable and which aren't worth it.

If we move forward: $7.5k flat for the Lite tier, no retainer for 90 days, 15% commission on net new closed deals attributable to the pipeline. Case-study rights in.

If we don't, you keep the map.

Tuesday or Thursday: [link]

— Jake
```

---

### Email 5 — Breakup (day +20)

**Subject variants:**
- A: `closing the loop`
- B: `parking this`
- C: `should I stop emailing?`

**Body:**
```
{{first_name}} —

Last note. If {{company}} isn't looking at automation right now, that's fair — I'll stop the thread.

If the lead pile gets uglier in Q3 or you start eyeing a third VA, reply "later" and I'll move you to the quarterly note instead of the active list.

Either way, good luck with the next listing.

— Jake
Naples Digital
```

---

## ICP C — SWFL Service Businesses with Paid Ads

Targets agencies / contractors / B2B service shops running Meta or Google ads, doing outbound, and writing proposals by hand. Hook is AI proposal generation + outreach personalization at scale.

### Email 1 — Cold opener (day 0)

**Subject variants:**
- A: `how long does a proposal take {{company}}?`
- B: `the proposal-writing tax`
- C: `your salesperson is a copywriter, probably`

**Body:**
```
{{first_name}} —

Saw {{trigger_event}}. Two-part question:

1. How long does it take {{company}} to send a custom proposal after a discovery call?
2. How personalized is your outbound right now — name + company, or actual research?

Most SWFL service shops I talk to: 3-6 hours per proposal, and outbound is "Hi {first name}, hope you're well."

We built a system that drafts a tailored proposal in 4 minutes off a call transcript, and ships outbound with a specific reference to the prospect's last move.

Case study: [link]

— Jake
Naples Digital
```

---

### Email 2 — Use case (day +3)

**Subject variants:**
- A: `the call → proposal handoff`
- B: `re: the proposal-writing tax`
- C: `where 4 hours goes`

**Body:**
```
{{first_name}} —

The piece that pays for itself fast is the discovery-call → proposal handoff.

Today: salesperson takes notes, hands to ops, ops drafts in Google Docs, back-and-forth on price, send. 2-3 days, often.

What we built: Fireflies transcript drops in, our system extracts pain + scope + timeline, generates a branded proposal with PandaDoc-quality formatting, and sits in a draft folder for the salesperson to review. ~4 minutes.

For {{company}} — what does that handoff look like now?

— Jake
```

---

### Email 3 — Social proof (day +7)

**Subject variants:**
- A: `outbound personalization at 200/day`
- B: `the case-study numbers`
- C: `what changed after we killed the proposal queue`

**Body:**
```
{{first_name}} —

Two data points from clients running this:

— Proposal turnaround: 2 days → same hour. Close rate up ~30% because prospects weren't getting cold by day 3.
— Outbound: 200 personalized sends/day, each referencing a real trigger (funding, hire, expansion, ad spend bump). Reply rate 4-7x cold-blast averages.

The two systems share a research layer — same enrichment data feeds the proposal generator and the outbound sequencer. One platform, not five tools.

Worth showing you? No demo theater.

— Jake
```

---

### Email 4 — Direct ask (day +12)

**Subject variants:**
- A: `15 min — {{company}}'s sales motion`
- B: `quick map of your pipeline?`
- C: `worth a Thursday call?`

**Body:**
```
{{first_name}} —

Direct ask: 15 minutes to look at your current sales motion — outbound, discovery, proposal, follow-up. I'll mark which steps are worth automating and which are better human.

If it's a fit: $7.5k flat for the Lite tier, no retainer for 90 days, 15% commission on net new closed revenue. Case-study rights.

If it's not, you walk away with the map.

Tuesday or Thursday: [link]

— Jake
```

---

### Email 5 — Breakup (day +20)

**Subject variants:**
- A: `closing the loop`
- B: `parking this`
- C: `last note`

**Body:**
```
{{first_name}} —

Last one. If now isn't the moment for {{company}}, I'll stop the thread — no follow-ups, no drip.

If proposals start piling up or outbound flatlines in Q3, reply "later" and I'll move you to the quarterly note.

Good luck with the next deal.

— Jake
Naples Digital
```

---

## Sequence schema reference

For when these get loaded into `outreach_sequences.emails`:

```json
[
  { "step": 1, "subject": "...", "body": "...", "delay_days": 0 },
  { "step": 2, "subject": "...", "body": "...", "delay_days": 3 },
  { "step": 3, "subject": "...", "body": "...", "delay_days": 4 },
  { "step": 4, "subject": "...", "body": "...", "delay_days": 5 },
  { "step": 5, "subject": "...", "body": "...", "delay_days": 8 }
]
```

`delay_days` is delta-from-previous (per `SequenceEmail` in `packages/outreach/lib/types.ts`), not absolute. Days 0/+3/+7/+12/+20 above translate to deltas of 0/3/4/5/8.

Merge tokens to populate via `PushSequenceInput.variables`:
- `first_name` — prospect first name
- `company` — prospect company
- `trigger_event` — the specific signal that prompted the outreach (e.g. "your last episode with the Naples Beach developer", "the new Bonita listing on the team Instagram", "your latest Meta ad in the wellness vertical"). **This is the 10x personalization field.**
