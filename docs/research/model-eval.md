# Model Evaluation — Anthropic SDK Audit (2026-05-11)

Audit of every `@anthropic-ai/sdk` call site in the Naples Digital platform monorepo, with a recommended re-default away from blanket Sonnet 4.6 toward surface-appropriate model selection. Jake's intuition: **default to Opus 4.7** unless we explicitly proved Sonnet is sufficient. This document is the evidence base for flipping defaults.

**TL;DR:** 21 AI call sites. All currently hardcoded to `claude-sonnet-4-6`. 9 should move to **Opus 4.7** (creative judgment / brand voice / outreach craft). 8 should stay on **Sonnet 4.6** (structured extraction / classification / tagging). 4 are candidates for **Haiku 4.5** demotion (cheap loops / triage with deterministic short-circuit / categorization). Highest priority flip: **clip selection in `content-pipeline`** — it's the most visible craft surface and runs against real episode transcripts daily.

---

## 1. Inventory

All sites currently use `claude-sonnet-4-6`. Two scripts under `scripts/makerschool/*` are batch-ingest tooling, not product runtime — listed for completeness.

| # | Path | Surface | Current model | Prompt purpose | Output shape |
|---|---|---|---|---|---|
| 1 | `apps/content-pipeline/app/api/episodes/[id]/clips/route.ts:63` | Content pipeline | sonnet-4-6 | Pick 5 best podcast clips (per-platform), with hook + caption + why. Word-timestamped transcript in. | Creative judgment + JSON |
| 2 | `apps/sponsor-pitch/app/api/generate/route.ts:38` | CRM/Sales | sonnet-4-6 | Generate sponsor one-pager: audience match, 3 tiers, 5 integration ideas. Naples/SWFL-specific. | High-stakes creative + JSON |
| 3 | `apps/crm-pipeline/app/api/leads/[id]/angle/route.ts:43` | CRM/Sales | sonnet-4-6 | 1-line summary + 3 sales hooks + 4-6 sentence cold DM. | Creative + JSON |
| 4 | `apps/crm-pipeline/app/api/leads/[id]/sequences/route.ts:36` | CRM/Sales | sonnet-4-6 | 3-email cold sequence (Day 1 / 4 / 8). | Creative + JSON |
| 5 | `apps/outreach-demo/app/api/generate/route.ts:60` | CRM/Sales (demo) | sonnet-4-6 | 3-email outreach sequence for landing-page demo. | Creative + JSON |
| 6 | `apps/proposal-generator/lib/draft-proposal.ts:77` | CRM/Sales | sonnet-4-6 | Draft full proposal from lead context + ai_angle. | High-stakes creative + JSON |
| 7 | `apps/lead-won-invoice/lib/draft-invoice.ts:46` | CRM/Sales | sonnet-4-6 | Draft invoice line items from won lead. | Structured + JSON |
| 8 | `apps/lead-enrichment/lib/icebreaker.ts:61` | CRM/Sales | sonnet-4-6 | One-line personalized cold-email opener. | Creative micro-output |
| 9 | `apps/rss-commentary/lib/commentary.ts:79` | Content pipeline | sonnet-4-6 | Take an RSS item and write tenant-voiced commentary (uses voice fingerprint). | Creative + voice match |
| 10 | `apps/content-syndication/lib/tailor.ts:62` | Content pipeline | sonnet-4-6 | Tailor a single post into per-platform variants (LinkedIn / IG / X / TikTok). | Creative + JSON |
| 11 | `apps/competitor-spy/lib/analyze-ad.ts:54` | Ops / intel | sonnet-4-6 | Tag a competitor Meta ad on 5 enum axes + 1-sentence summary (vision input). | Structured extraction + vision |
| 12 | `apps/ig-reels-research/lib/analyze.ts:64` | Ops / intel | sonnet-4-6 | Score an IG Reel: hook pattern, niche relevance, retention signal (vision input). | Structured extraction + vision |
| 13 | `apps/email-triage/lib/classify.ts:123` | Ops | sonnet-4-6 | Classify inbound email → category + score + reason. Deterministic short-circuit precedes. | Classification |
| 14 | `apps/email-triage/lib/reply-intent.ts:86` | Ops | sonnet-4-6 | Classify reply intent (interested / more_info / not_interested / ooo / bounce / unsubscribe / unknown). Deterministic short-circuit at 95% confidence. | Classification |
| 15 | `apps/backlog/app/api/backlog/suggest/route.ts:175` | Ops | sonnet-4-6 | Suggest 4-8 backlog items from repo state (.build-state.md + README + git log). | Reasoning + JSON |
| 16 | `apps/mia/lib/bland.ts:204` | Ops (MIA tenant) | sonnet-4-6 | Analyze Bland.ai call transcript → qualification fields + score + recommended followup. | Classification + reasoning |
| 17 | `packages/outreach/lib/voice-profile.ts:97` | Ops / shared | sonnet-4-6 | Extract a voice fingerprint (sentence shape, register, signature phrases, do/dont words) from writing samples. Feeds rss-commentary + future copy surfaces. | Structured extraction (high-leverage) |
| 18 | `scripts/makerschool/chat.ts:27,150` | Tooling (batch) | sonnet-4-6 | RAG chat over MakerSchool corpus. Jake-internal. | Streaming Q&A |
| 19 | `scripts/makerschool/categorize-tools.ts:79` | Tooling (batch) | sonnet-4-6 | Categorize tool names into enum (hardware/saas/noise/etc). | Classification |
| 20 | `scripts/makerschool/generate-briefs.ts:238` | Tooling (batch) | sonnet-4-6 | Synthesize cold-email briefs / lessons-learned from corpus (16k token output). | Long-form reasoning |
| 21 | `apps/tone-calibrator/app/api/voice-profile/calibrate/route.ts` | Ops / shared | (delegates to #17) | (proxies `extractVoiceProfile`) | — |

(#21 is the public route; the actual SDK call lives in #17 inside `@naples/outreach`.)

---

## 2. Surface classification

### Content pipeline — high-craft, output is what tenants actually publish

| # | Site | Recommended | Why |
|---|---|---|---|
| 1 | clips/route | **Opus 4.7** | Selecting the *best* 5 of 60-90 min of word-timestamped transcript is judgment-heavy. Off-by-one bad clip = unusable. Highest-leverage flip. |
| 9 | rss-commentary | **Opus 4.7** | Has to match a per-tenant voice fingerprint while staying factually grounded. Cheaper models drift toward marketing-template tone. |
| 10 | content-syndication tailor | Sonnet 4.6 | Per-platform constraint adaptation is structured rewriting, not net-new craft. Sonnet is enough. Revisit if outputs feel formulaic. |

### CRM / Sales — high-craft, output is what we send to humans

| # | Site | Recommended | Why |
|---|---|---|---|
| 2 | sponsor-pitch generate | **Opus 4.7** | This is the **239 Live flagship craft surface**. A bad audience-match paragraph kills the pitch. Kevin-facing. |
| 3 | crm angle | **Opus 4.7** | "Did the homework" cold DMs are what differentiate Naples Digital. Sonnet writes serviceable; Opus writes specific. |
| 4 | crm sequences | **Opus 4.7** | 3-email sequence personalization. Per-lead. Worth the spend. |
| 5 | outreach-demo generate | **Opus 4.7** | Public demo on the marketing site — quality of output **is** the sales pitch. Don't cheap out here. |
| 6 | proposal-generator | **Opus 4.7** | Proposals are revenue-bearing. Off-tone proposal = lost deal. |
| 7 | lead-won-invoice | Sonnet 4.6 | Invoice line items are structured/templated. No creative upside. |
| 8 | lead-enrichment icebreaker | **Opus 4.7** | A one-liner cold opener is pure craft. ~200 tokens out → cost difference is negligible. |

### Ops — structured extraction, classification, intel

| # | Site | Recommended | Why |
|---|---|---|---|
| 11 | competitor-spy analyze-ad | Sonnet 4.6 | Multi-axis enum tagging from image + text. Sonnet handles vision well. |
| 12 | ig-reels-research analyze | Sonnet 4.6 | Same shape as #11. |
| 13 | email-triage classify | **Haiku 4.5** | Category + 0-100 score + 1-sentence reason. Deterministic rules already handle obvious cases. Hot path — runs per inbound email. Cost matters. |
| 14 | email-triage reply-intent | **Haiku 4.5** | 7-way enum + confidence + 1 sentence. Deterministic short-circuit at 95% confidence already pre-filters. |
| 15 | backlog suggest | Sonnet 4.6 | Reasoning over repo state. Not customer-facing. Sonnet fits. |
| 16 | mia bland transcript analysis | Sonnet 4.6 | Real-estate qualification scoring from call transcript. Structured output, low creative bar. Defer Opus until MIA volume justifies. |
| 17 | voice-profile extract | **Opus 4.7** | Voice fingerprint feeds *every* downstream copy surface. If this is mediocre, everything downstream inherits the mediocrity. Highest hidden-leverage call. |

### Tooling — batch / Jake-internal

| # | Site | Recommended | Why |
|---|---|---|---|
| 18 | makerschool chat | Sonnet 4.6 | RAG chat over corpus. Jake-only. Streaming, fine as-is. |
| 19 | makerschool categorize-tools | **Haiku 4.5** | Pure classification, batch of name → enum. Run once. |
| 20 | makerschool generate-briefs | **Opus 4.7** | 16k-token synthesis over corpus. Run once or twice. Worth the spend for one-shot output Jake actually reads. |

### Roll-up

- **Opus 4.7 (9 sites):** 1 clip-pick, 2 sponsor-pitch, 3 lead-angle, 4 lead-sequences, 5 outreach-demo, 6 proposal-generator, 8 icebreaker, 9 rss-commentary, 17 voice-profile-extract, 20 generate-briefs *(10 if you count the makerschool tool)*.
- **Sonnet 4.6 (8 sites):** 7 invoice, 10 content-syndication, 11 competitor-spy, 12 ig-reels, 15 backlog, 16 mia, 18 makerschool chat.
- **Haiku 4.5 (3-4 sites):** 13 email triage classify, 14 reply-intent, 19 makerschool categorize-tools. (4th candidate: 7 invoice line items if cost ever matters at scale.)

---

## 3. A/B test plan — top 3 highest-stakes surfaces

For each: define input, comparison metric, side-by-side runner. Goal is **Jake's subjective 1-5 rating** on 10 real cases, blind to which model produced which output.

### Test 1 — Sponsor pitch (sponsor-pitch app)

- **Why first:** Kevin-facing. 239 Live revenue depends on these. The most visible craft surface in front of a paying tenant.
- **Input set:** 10 real Naples-area sponsor candidates already in `lead_companies` table. Pick a mix of show targets (Billionaire Coast, 239 Built, SWFL Keys).
- **Method:** Add a feature-flagged `?model=opus` param to `/api/generate`. For each of the 10 sponsors, generate both versions. Store both in `sponsor_pitches` with a `model_variant` column. Render side-by-side in the UI with no labels.
- **Metric:** Jake rates each on `audience_match` quality (1-5), `packages` specificity (1-5), `integration_ideas` realism (1-5). Total /15. Track win rate per sponsor.
- **Cost ceiling:** ~10 sponsors × 2 models × ~1.5k tokens out ≈ trivial. Single-digit dollars.
- **Decision rule:** If Opus wins ≥6/10 head-to-head on aggregate score, flip default.

### Test 2 — Clip selection (content-pipeline app)

- **Why second:** Most visible content-pipeline surface. Bad clip = a tenant posts something bad on their feed.
- **Input set:** 5 real episodes from `episodes` table with completed word-timestamped transcripts. Pick episodes that already have human-curated clips for ground-truth comparison.
- **Method:** Add `model_variant` arg to `POST /api/episodes/[id]/clips`. Run each episode twice. Store 10 clips total per episode (5 sonnet + 5 opus), tagged by source.
- **Metric:** Jake watches each clip pair (same platform target) and rates `would I post this?` (yes/no) + 1-5 craft score. Also: overlap with the human-curated clips (sanity check).
- **Cost ceiling:** Transcripts are large (~30k input tokens). 5 episodes × 2 models ≈ $5-10 in API spend. Fine.
- **Decision rule:** If Opus's "would I post this" rate beats Sonnet by ≥20 percentage points, flip default.

### Test 3 — Voice profile extraction (`packages/outreach/lib/voice-profile.ts`)

- **Why third:** This is the **hidden leverage** call. Its output feeds rss-commentary and (likely) future copy surfaces. A weak fingerprint corrupts every downstream copy task for that tenant.
- **Input set:** 4 tenants × 5-8 writing samples each. Real samples already in the system (or pull from each tenant's website).
- **Method:** Run `extractVoiceProfile` twice per tenant — once Sonnet, once Opus. Then have each fingerprint *write* a 3-paragraph commentary on the same RSS item (use rss-commentary app). Jake reads the resulting commentary and rates which one "sounds more like the tenant."
- **Metric:** Subjective voice-match (1-5). Plus: count of suspicious "marketing template" phrases in the commentary output.
- **Cost ceiling:** 4 tenants × 2 models × ~3k tokens ≈ pennies.
- **Decision rule:** If Opus's voice-match rating averages ≥0.7 higher across 4 tenants, flip default for *this* call specifically. (Highest-leverage flip if positive.)

---

## 4. Patch sketches — exact diff to flip defaults

These are not applied. Each is a 1-line model-string change. Recommend introducing a `getDefaultModel(surface)` helper in `packages/db` or `packages/outreach` rather than scattering strings — but keep that refactor as a separate commit after the A/B results land.

### Move to Opus 4.7 (after A/B confirms)

```diff
- apps/content-pipeline/app/api/episodes/[id]/clips/route.ts:63
-         model: "claude-sonnet-4-6", max_tokens: 2500, system: SYSTEM_PROMPT,
+         model: "claude-opus-4-7", max_tokens: 2500, system: SYSTEM_PROMPT,
```

```diff
- apps/sponsor-pitch/app/api/generate/route.ts:38
-         model: "claude-sonnet-4-6",
+         model: "claude-opus-4-7",
```

```diff
- apps/crm-pipeline/app/api/leads/[id]/angle/route.ts:43
-       model: "claude-sonnet-4-6",
+       model: "claude-opus-4-7",
```

```diff
- apps/crm-pipeline/app/api/leads/[id]/sequences/route.ts:36
-         model: "claude-sonnet-4-6", max_tokens: 2000, system: SYSTEM_PROMPT,
+         model: "claude-opus-4-7", max_tokens: 2000, system: SYSTEM_PROMPT,
```

```diff
- apps/outreach-demo/app/api/generate/route.ts:60
-       model: "claude-sonnet-4-6",
+       model: "claude-opus-4-7",
```

```diff
- apps/proposal-generator/lib/draft-proposal.ts:77
-       model: "claude-sonnet-4-6",
+       model: "claude-opus-4-7",
```

```diff
- apps/lead-enrichment/lib/icebreaker.ts:61
-       model: "claude-sonnet-4-6",
+       model: "claude-opus-4-7",
```

```diff
- apps/rss-commentary/lib/commentary.ts:79
-       model: "claude-sonnet-4-6",
+       model: "claude-opus-4-7",
```

```diff
- packages/outreach/lib/voice-profile.ts:97
-       model: "claude-sonnet-4-6",
+       model: "claude-opus-4-7",
```

```diff
- scripts/makerschool/generate-briefs.ts:238
-     model: "claude-sonnet-4-6",
+     model: "claude-opus-4-7",
```

### Demote to Haiku 4.5

```diff
- apps/email-triage/lib/classify.ts:123
-       model: "claude-sonnet-4-6",
+       model: "claude-haiku-4-5",
```

```diff
- apps/email-triage/lib/reply-intent.ts:86
-       model: "claude-sonnet-4-6",
+       model: "claude-haiku-4-5",
```

```diff
- scripts/makerschool/categorize-tools.ts:79
-     model: "claude-sonnet-4-6",
+     model: "claude-haiku-4-5",
```

### Leave on Sonnet 4.6 (no change)

- `apps/lead-won-invoice/lib/draft-invoice.ts:46`
- `apps/content-syndication/lib/tailor.ts:62`
- `apps/competitor-spy/lib/analyze-ad.ts:54`
- `apps/ig-reels-research/lib/analyze.ts:64`
- `apps/backlog/app/api/backlog/suggest/route.ts:175`
- `apps/mia/lib/bland.ts:204`
- `scripts/makerschool/chat.ts:27`

---

## 5. Recommended new defaults

Move from "Sonnet 4.6 everywhere" to **surface-tiered defaults**:

| Tier | Model | Surfaces |
|---|---|---|
| Craft tier (human reads + judges output) | **claude-opus-4-7** | Clip pick, sponsor pitch, lead angle, lead sequences, outreach demo, proposals, icebreakers, RSS commentary, voice fingerprint, briefs synthesis |
| Working tier (structured rewriting / extraction / vision tagging) | **claude-sonnet-4-6** | Invoice drafting, syndication tailoring, ad-tagging, reel-tagging, backlog suggestion, MIA transcript scoring, RAG chat |
| Hot loop / classification tier (deterministic short-circuit precedes) | **claude-haiku-4-5** | Email triage classify, reply intent, batch tool categorization |

**Implementation suggestion:** add `packages/_shared/lib/models.ts`:

```ts
// Surface-tiered model defaults. Override per call site only with reason.
export const MODELS = {
  craft: "claude-opus-4-7",
  working: "claude-sonnet-4-6",
  classify: "claude-haiku-4-5",
} as const;

export type ModelTier = keyof typeof MODELS;
```

Then each call site reads `MODELS.craft` etc. Flipping a future default = one-line change in one file. Per-tenant override later via `tenant_integrations.config.model_overrides`.

**Cost intuition (rough):** moving 9 sites from Sonnet → Opus ~3-5x the per-call cost, but these are infrequent (per-lead, per-episode, per-pitch). Email triage Haiku demotion offsets it — that's the only hot path. Net spend probably flat or slightly down. Get the A/B numbers before committing.

**Open question:** does Jake want a runtime `?model=` query-string override in the API routes for future A/B tests, or always rebuild + redeploy? Recommend the override — costs nothing and lets us re-evaluate when 5.x lands.
