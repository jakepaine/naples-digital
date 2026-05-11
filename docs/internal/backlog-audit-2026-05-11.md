# Backlog Audit — 2026-05-11

Source: `backlog_items` table on Supabase project `ylqoxefiwwimzxeuzfxy` (Naples Digital / 239Live). 38 open rows across 5 tenants (239live, naplesdigital, mia, lifewise, jakepaine).

This is an audit; **no rows were mutated**. Use this as the action list for a cleanup pass.

---

## 1. True duplicates

Three pairs of rows that describe the same engineering work but are split across the `239live` and `naplesdigital` tenants. The pattern: a 239live-facing capability and a platform-facing implementation note for the same feature ended up as two separate rows. Pick one row per pair; delete or merge the other.

### 1a. Buffer / Publer auto-publish

| Row | Tenant | Pri | Title |
|---|---|---|---|
| `801311e4-63e0-4127-90bc-4e45f9102cf5` | 239live | P1 | Build Buffer/Publer auto-publish for clip pipeline |
| `c3c49411-ee56-46b2-a725-525c080dc0f1` | naplesdigital | P2 | Wire Buffer or Publer auto-publish from content-pipeline |

**Same work.** The 239live row frames it as a Kevin-facing capability; the naplesdigital row frames it as platform engineering. The implementation is one and the same: `content-pipeline` → Buffer/Publer push after `render-worker` finishes.

**Recommendation:** keep `801311e4` (239live, P1). It carries the actual user value framing and the right priority. Delete `c3c49411` and copy its "Phase 2 / scheduled posting across IG/TikTok/YT Shorts/X" detail into the description of the kept row.

### 1b. Stripe billing

| Row | Tenant | Pri | Title |
|---|---|---|---|
| `bb4d055d-1616-4b25-820e-84f8926cd238` | 239live | P1 | Stripe billing — wire client-portal invoices to real charges |
| `26c527f2-e886-4fc0-9362-97c301967cbe` | naplesdigital | P2 | Wire Stripe billing routes in client-portal |

**Same work.** Both target `apps/client-portal` and call out that the `invoices` table exists but no charge flow is live.

**Recommendation:** keep `bb4d055d` (239live, P1). Merge the "per-tenant Stripe Connect account + paid/refunded webhooks" specificity from `26c527f2` into the description. Delete `26c527f2`.

### 1c. Not a duplicate, but coupled — AssemblyAI

| Row | Tenant | Pri | Title |
|---|---|---|---|
| `d7806a9d-21e0-48ff-a73b-5d2edd6793cf` | 239live | P0 | Set ASSEMBLYAI_API_KEY on render-worker + content-pipeline |
| `16e48d6b-afe4-4580-9087-94fa33575840` | naplesdigital | P1 | Decide AssemblyAI placement: platform-level Doppler vs per-tenant Vault |

These are not the same row, but `d7806a9d` is **blocked** by `16e48d6b`. The naplesdigital decision (one shared key in Doppler vs per-tenant Vault) determines *where* the 239live key gets set. Recommendation: bump `16e48d6b` to P0 and add a `blocked-by` link from `d7806a9d` — or fold the decision into the description of `d7806a9d` and resolve both in one pass.

**Duplicate total: 2 true duplicate pairs (4 rows → 2 rows after merge), plus 1 coupled pair flagged for sequencing.**

---

## 2. Stale / past-due items

Today is **2026-05-11**. None of the rows have `due_at` set in the DB — all deadlines are encoded in titles/descriptions. The Kevin pitch was Friday **2026-05-08**, three days ago.

### 2a. Kevin-pitch P0s that are now post-event

These 4 rows were dated for Thu 2026-05-07 EOD (pre-pitch prep) or Friday 2026-05-08 (the pitch itself). They are 3–4 days past due:

| Row | Title | Status | Action |
|---|---|---|---|
| `54d78c3d-3ec5-447e-97eb-e7266fa1f5e7` | Friday 2026-05-08 pitch — deliver $7.5k engagement letter draft to Kevin | `backlog` | Resolve: was the LOI sent? If yes → `done`. If no → relabel to "Send engagement letter post-pitch follow-up" with new due date. |
| `b1673f17-2144-4705-ab36-3df4fe23c8ed` | Get one real episode MP4 from Kevin by Thu 2026-05-07 EOD | `backlog` | If pitch already happened with fallback footage → close. If still needed for ongoing work → relabel "Get real episode MP4 from Kevin for production pipeline" with no event-tied deadline. |
| `08d85523-cf46-493a-85fb-11226a13b3b8` | Get 2 real sponsor candidates from Kevin for live sponsor-pitch demo | `backlog` | Same as above — the "live demo" framing is now stale. Re-scope as "Sponsor candidates for first real run." |
| `61519b55-829e-4350-a988-7fbaaa9c46de` | Get 2 real leads from Kevin for live AI Angle demo | `backlog` | Same. Re-scope or close. |

**Root cause:** these were event-tied P0s. After the event passes they become zombie P0s — still blocking the priority list but no longer actually critical. Recommend a hygiene rule: any "for Friday's pitch" item gets auto-reviewed Monday morning.

### 2b. 5+ day untouched intake placeholders

Three identical "Initial intake" rows have been sitting at P1 since 2026-05-06 with zero updates:

| Row | Tenant | Status | Days idle |
|---|---|---|---|
| `cbe869ae-c2e6-4c67-8a19-810762ada4c2` | jakepaine | `backlog` | 5 |
| `0dd5346d-16a8-4920-a54c-24d255adee5a` | lifewise | `backlog` | 5 |
| `8309eaad-8e3f-45df-a6be-35e42a7022f7` | mia | `backlog` | 5 |

**Recommendation:** these are not real P1s — they're placeholders waiting on Jake to do intake. Either:
- Demote all three to P3 (`blocked` status, owner = Jake), OR
- Convert into a single `naplesdigital` tenant row "Run intake for jakepaine / lifewise / mia tenants" so the work clusters rather than fragments.

Given the GTM strategy (Kevin first, productize after), I'd demote to P3 and tag `blocked-on-jake` until Kevin engagement is signed.

### 2c. Other stale-ish but not blocking

- `8899fd6f` (Rotate Supabase keys, P0) — no due date, no movement since 2026-05-06. Real P0 security work; should not stay quiet for 5 days.
- `fc4d577d` (Update README to reflect 13 apps, P1) — created 2026-05-07, untouched. Low effort, blocks nothing critical; could be done in 20 min.

**Stale items total: 4 past-due Kevin-pitch P0s + 3 idle intake placeholders + 2 quiet-but-not-yet-stale items = 9 rows flagged.**

---

## 3. Cross-tenant scope confusion

Some rows are filed under the wrong tenant:

| Row | Current tenant | Should be | Why |
|---|---|---|---|
| `2691ae37-9bbb-4cad-9bdc-9ca74c81e229` "Vitalryze prep — clone radenergy-os shape" | `naplesdigital` | **Does not belong in this backlog at all** | Vitalryze is an EMF Protection LLC / RadEnergy concern. Per cross-project rules, RadEnergy and Naples Digital are separate orgs. Per memory, Vitalryze is deprioritized ("kind of dying"). Move this to `radenergy-os` backlog or delete. |
| `d17a7408-8720-4781-9e7e-a39ab14b20ac` "DNS for *.naplesdigital.app wildcard cert" | `239live` | `naplesdigital` | DNS for the platform's wildcard cert is platform infra, not a 239live-tenant concern. |
| `fc4d577d-d539-45bf-bf4d-7987d6f9de1b` README update | `naplesdigital` | Correct tenant, but **flag the MIA reference** | Description says "Decide whether to mention mia (separate client) at all in the public README." Per memory, MIA must NOT appear in Kevin-facing or public materials. Tighten the description: explicitly exclude MIA from the public README. |

---

## 4. Top-10 ranked — "what would I work on tomorrow morning"

Excludes blocked-on-Jake-personally items (intake placeholders), excludes stale Kevin-pitch P0s pending re-scope, excludes the Vitalryze row (wrong project).

Ordered by what unblocks the most downstream work + what Jake said he cares about (craft, real run, post-pitch follow-through):

1. **`54d78c3d` — Send the post-pitch engagement letter to Kevin** (re-scoped from "Friday pitch" → "post-pitch follow-up"). Highest-leverage item in the whole list; everything else is platform polish until Kevin signs.
2. **`16e48d6b` — Decide AssemblyAI placement (platform vs per-tenant)**. Trivial decision, unblocks #3 and the whole content pipeline live-run.
3. **`d7806a9d` — Set `ASSEMBLYAI_API_KEY`** (immediately after #2 lands). P0, currently blocking real episode transcription.
4. **`d90b29b8` — Evaluate Opus 4.7 vs Sonnet 4.6** across outreach-demo, crm-pipeline angle, content-pipeline clips, sponsor-pitch, backlog suggest. Per memory: default Opus 4.7, not Sonnet 4.6. This is craft-level work Jake explicitly flagged.
5. **`15cb3c3b` — Investigate Remotion (or alternative) to replace ffmpeg drawtext for clip rendering**. Per memory: assume current video pipeline is undercooked. Pairs with the "real episode MP4" demo loop.
6. **`f149540f` — Live-test Instantly + AssemblyAI end-to-end with real data**. Closes the "wired but never run" gap; surfaces real bugs before Kevin sees them.
7. **`8899fd6f` — Rotate Supabase anon + service-role keys** (P0 security; do not let this rot any longer).
8. **`322c0223` — Scheduled-send dispatcher cron**. Makes `outreach-dispatcher` actually push email instead of just receiving webhooks. Unblocks #6.
9. **`801311e4` — Buffer/Publer auto-publish** (after merging in `c3c49411`'s detail). Closes the "rendered → posted" gap that completes Kevin's content story.
10. **`ce990079` — Real content + branding pass on `apps/agency-site`**. This is the sales asset for client #2. Cheap to do, high leverage for Naples Digital pivot to pure SaaS.

Notably **not in top-10**:
- Stripe billing — important but no client is being billed through the platform yet. Defer to post-Kevin-signing.
- LinkedIn outreach, Meta Ad Library, Guest pipeline — all P2 greenfield; correct to defer.
- Apollo / Instantly post-signing rows — correctly gated on Kevin's signature.
- GHL CRM swap, DNS wildcard, ElevenLabs — correctly P3.

---

## 5. Suggested new backlog rows

Three gaps the current backlog doesn't capture:

### 5a. Fix dead-code path in `packages/transcription/index.ts` (AssemblyAI)

- **Tenant:** naplesdigital
- **Priority:** P1
- **Tags:** `bug`, `transcription`, `cleanup`
- **Description:** AssemblyAI integration in `packages/transcription/index.ts` contains a dead-code branch that needs to be removed/fixed before `d7806a9d` (set API key) is meaningful. Without this, even with the key set, transcription may silently fall through. Verify the call path end-to-end during the live-test in `f149540f`.

### 5b. Centralize model selection — shared `MODELS.craft | working | classify` constant

- **Tenant:** naplesdigital
- **Priority:** P1
- **Tags:** `ai`, `refactor`, `craft`
- **Description:** Currently each service (outreach-demo, crm-pipeline, content-pipeline, sponsor-pitch, backlog suggest) selects its own Anthropic model inline. Add a shared `packages/ai/models.ts` exporting `MODELS.craft` (Opus 4.7), `MODELS.working` (Sonnet 4.6), `MODELS.classify` (Haiku) so the Opus-vs-Sonnet evaluation in `d90b29b8` can land as a single-constant change. Couple this row with #4 in the ranked list.

### 5c. Track Remotion migration as its own row (split from `15cb3c3b`)

- **Tenant:** naplesdigital
- **Priority:** P1
- **Tags:** `content`, `render`, `migration`
- **Description:** `15cb3c3b` is "investigate better video editing pipeline" — open-ended research. Once Remotion is chosen (likely), spin a concrete migration row: replace `render-worker` ffmpeg drawtext composition with Remotion programmatic compositing, including per-word karaoke captioning, brand color overlay, music bed, and B-roll inserts. Blocks the "premium feel" craft bar Jake flagged.

### 5d. (Optional) Hygiene cron — auto-flag event-tied P0s after the event passes

- **Tenant:** naplesdigital
- **Priority:** P3
- **Tags:** `hygiene`, `backlog`, `automation`
- **Description:** Today, 4 of the 5 P0s are post-event zombies blocking the priority list. A simple cron: any P0 with a date in title/description that's >24h past current date posts a Slack message asking "is this still P0?" and demotes to P1 after 72h with no response.

---

## Summary counts

- **38 open rows** audited
- **2 true duplicate pairs** (4 rows → 2 after merge)
- **1 coupled pair** flagged for sequencing (AssemblyAI key vs placement decision)
- **9 stale/past-due rows** (4 zombie Kevin-pitch P0s + 3 idle intake placeholders + 2 quiet rows)
- **2 wrong-tenant rows** (Vitalryze, DNS wildcard) + 1 row needing MIA-reference tightening
- **3-4 suggested new rows** (transcription dead code, MODELS constant, Remotion migration, optional zombie-P0 cron)

After cleanup, the working priority list compresses from "5 P0s, 13 P1s" to roughly "2 real P0s, 8 real P1s" — much closer to what a single founder can actually drive in a week.
