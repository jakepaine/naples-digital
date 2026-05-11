# Agency-site copy — draft

**Status:** Draft for Jake review. Once approved, this lands in `apps/agency-site/`.
**Tone:** Confident, direct, no fluff. PM-operator voice — Jake's communication style.
**Audience:** Service business owners (podcast studios, real estate ops, event businesses, agencies) who are paying for 5+ SaaS tools and Zapier and want one platform instead.

Note: agency-site already has a working hero, modules page, pricing, and contact. This draft consolidates the copy across all of those plus adds a founder bio and a case-study landing block. Treat existing copy as the baseline and these as the new authoritative versions.

---

## SECTION 1 — Hero

**Eyebrow:** *(none — go straight to headline)*

**Headline:**
Software infrastructure for service businesses.

**Subheadline:**
One platform for sales, content, and operations. Five tools and a Zapier graveyard, replaced by one login, one bill, one source of truth.

**Primary CTA:** Book a demo → `mailto:jake@naples.digital?subject=Naples Digital Demo`
**Secondary CTA:** See the case study → `/case-study/239-live`

---

## SECTION 2 — Social proof strip

**Eyebrow:** Trusted by service businesses across Southwest Florida

**Logos / names (in order):**
- 239 Live *(flagship)*
- MIA Real Estate
- Lifewise
- Naples Digital *(dogfooding tenant)*
- Jake Paine

*(Existing strip is fine. Keep MIA grouped with the others — it's a tenant, not a separate client carve-out. Per memory note, "MIA" must not appear in Kevin-facing materials, but on the agency-site that surfaces all tenants this is the correct placement.)*

---

## SECTION 3 — Services / What it is

**Eyebrow:** The platform

**Headline:**
A unified stack. Five tools replaced. The glue tax, gone.

**Body:**
Naples Digital ships every module a service business needs as a single tenant on shared infrastructure. CRM, booking, outreach, content production, sponsor analytics, client portal — all on one login, one bill, one Postgres.

**Bullets:**
- **One database, one identity, one design system.** Every module reads and writes the same schema. Nothing ever disagrees with anything else.
- **Modules are native Node services, not no-code glue.** Faster, cheaper, fully owned by your tenant.
- **Real AI, not chatbot theater.** Every customer-facing AI feature ships with deterministic fallbacks. Demos never break.

**Inline CTA:** Explore the module catalog → `/modules`

---

## SECTION 4 — Module catalog teaser

**Eyebrow:** Products

**Headline:**
Activate what you need. Add the rest as you grow.

**Body:**
Each module is a feature area of the platform. Tiers bundle a default set; add-ons enable individual modules above tier.

**Module cards (grouped by category):**

**Sales —** Pipeline, outreach, and conversion. Capture leads and turn them into booked revenue.
- CRM Pipeline · Cold Outreach · Booking Portal

**Content —** Content production, syndication, and analytics. Built for businesses that publish.
- Content Pipeline · Sponsor Pitch Builder · Sponsor Analytics *(syndication module — next)*

**Ops —** Internal workflows, dashboards, client portals. The workbench that runs your business.
- Operations Dashboard · Backlog Tracker · Client Portal

**Vertical —** Industry-specific modules for podcast networks, real estate, and event businesses.
- Real Estate Acquisitions *(MIA tenant)*

**CTA:** See full module catalog → `/modules`

---

## SECTION 5 — Case study (landing block on the home page)

**Eyebrow:** Case study

**Headline:**
239 Live replaced five tools with one tenant.

**Subhead:**
Kevin's podcast studio runs sales, content production, sponsorship, and operations on a single Naples Digital tenant — with AI features that turn a 4-hour weekly content loop into a single upload.

**Stat row (placeholders — Jake fills):**
- `[5+]` SaaS tools replaced
- `[X clips/week]` auto-generated from each episode
- `[Y sponsor pitches]` drafted in `[Z]` days
- `[$N/mo]` in subscription cost replaced

**CTA:** Read the case study → `/case-study/239-live`

*(Full case study lives at `docs/marketing/239live-case-study.md` until promoted into `apps/agency-site/app/case-study/239-live/page.tsx`.)*

---

## SECTION 6 — Why Naples Digital (feature grid)

**Eyebrow:** Why Naples Digital

**Headline:**
Built for how service businesses actually run.

**Feature cards (6):**

1. **Vertical-specific modules**
   Real estate acquisitions, podcast sponsorship pipelines, event-business automation. Not a generic CRM you bend to fit your business.

2. **Real AI, not chatbot theater**
   Every customer-facing AI feature ships with deterministic fallbacks. You get usable output the first time, not a demo that breaks under real data.

3. **Native, not no-code glue**
   Modules are real Node services in a single codebase, not Zapier or n8n. Faster, cheaper, fully owned.

4. **Multi-tenant by design**
   Row-level security on every table. Your data never leaves your tenant boundary. Audit-ready from day one.

5. **Outcomes, not dashboards**
   Booking conversion, sponsor pitch acceptance, content output — instrumented end-to-end. Numbers you can act on, not vanity metrics.

6. **One source of truth**
   Every module reads and writes the same schema. No data exports, no integration drift, no reconciliation rituals.

---

## SECTION 7 — Stats row

- **Live tenants:** 5
- **Production modules:** *(pulled live from `MODULES` registry)*
- **Subscription tiers:** *(pulled live from `TIERS` registry)*
- **Built in:** Naples, FL

---

## SECTION 8 — How we work

**Eyebrow:** Engagement

**Headline:**
You subscribe to the platform. We run the platform.

**Body:**
Naples Digital is a subscription SaaS, not project work. You pick a tier, get a tenant, log in. The platform is operated and maintained by us — not your dev team, not a contractor, not you.

**Three-column breakdown:**

1. **Pick a tier.**
   Starter, Growth, Premium, or Design Partner. Each tier bundles a default set of modules. Need a module above tier? Enable it as an add-on. *Tier details: `/pricing`.*

2. **Onboard in days, not months.**
   Your tenant is provisioned with sane defaults, your brand colors, and your initial data imported. Most tenants are live in under two weeks.

3. **Modules ship to you automatically.**
   Every new module we ship to the platform becomes available to your tenant the same day. No upgrade cycles, no migration projects.

**Note on engagement terms:**
*(Full engagement terms — SLAs, data ownership, exit, modification rights — are handled in a separate document. Linked from `/legal/engagement-terms`. Out of scope for this copy draft.)*

---

## SECTION 9 — Founder bio

**Eyebrow:** Founder

**Headline:**
Built by an operator, not a dev shop.

**Body (1 paragraph — Jake):**

> Naples Digital is built and run by Jake Paine. Operator background — PM and scrum, not engineering by training. Running this in parallel with **RadEnergy**, a 7-figure DTC brand on Amazon and Shopify under a separate LLC. The Naples Digital platform exists because the same problem hit twice: service businesses, no matter the vertical, end up running on the same five SaaS subscriptions, the same Zapier graveyard, the same data scattered across tools that don't talk to each other. The fix isn't another tool. The fix is one platform, vertical-tuned, that ships the modules your business actually needs and keeps shipping more.

*(Keep this short. The `/contact` page already has a longer two-person team block — Jake + Noah. That stays.)*

---

## SECTION 10 — Final CTA

**Headline:**
Ready to see it in action?

**Body:**
30-minute walkthrough on real tenant data. We'll talk through tier economics and tell you whether the platform fits your business — no pitch.

**Primary CTA:** Book a demo → `mailto:jake@naples.digital?subject=Naples Digital Demo`
**Secondary CTA:** Read the 239 Live case study → `/case-study/239-live`

---

## Page-level metadata (for `app/layout.tsx`)

**Title:** Naples Digital — Software infrastructure for service businesses
**Description:** One platform for sales, content, and operations. Five SaaS tools and a Zapier graveyard, replaced by one tenant. Multi-tenant SaaS for podcast studios, real estate operators, and service businesses.
**OG image:** *(create — currently missing)*

---

## Notes for implementation

- The existing `apps/agency-site/app/page.tsx` already has a strong layout. Copy edits above mostly tighten the headline/subhead pair, add a case-study landing block (Section 5), and add a founder bio block (Section 9).
- The case study itself needs a route: `apps/agency-site/app/case-study/239-live/page.tsx`. Source content from `docs/marketing/239live-case-study.md`.
- All placeholder numbers in `[brackets]` need to be filled before this goes public.
- The MIA tenant is real but operates under different positioning. On the public agency-site, MIA stays in the trusted-by strip but doesn't get a case study of its own (that's intentional — 239 Live is the lead asset).
