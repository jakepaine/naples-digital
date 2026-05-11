# ASSEMBLYAI_API_KEY placement — platform-level vs per-tenant

**Status:** Decided
**Date:** 2026-05-11
**Decision:** Platform-level Doppler with hybrid override hook already in place. Switch trigger defined below.
**Owner:** Jake

---

## Current state

### How AssemblyAI is wired today

- **Code lives in:** `packages/transcription/` (single file `lib/assemblyai.ts` for the HTTP client, `index.ts` for tenant resolution).
- **Resolution function:** `getTranscriptionClientForTenant(tenantId)` in `packages/transcription/index.ts`. It checks `tenant_integrations` for an `assemblyai` row first, then falls back to `process.env.ASSEMBLYAI_API_KEY`.
- **Called from:** `apps/content-pipeline/app/api/episodes/[id]/transcribe/route.ts` (POST starts a job; GET polls for results). Render-worker does NOT call AssemblyAI — it only consumes pre-computed `word_timestamps` from the episode row.
- **Promote flow:** `app/api/podcast/inbox/[id]/promote/route.ts` creates an `episodes` row from a podcast RSS inbox item but does NOT auto-trigger transcribe. A separate POST to `/api/episodes/[id]/transcribe` is required.
- **Admin UI:** `apps/admin-console/app/tenants/[id]/integrations/page.tsx` already exposes a per-tenant AssemblyAI key slot (vendor list includes `{ kind: "assemblyai", category: "transcription" }`).

### Latent bug in the per-tenant path

The current `getTranscriptionClientForTenant` reads `tenantKey.secret_ref` and passes that string straight to AssemblyAI as the API key. Per migration `0007_tenant_secrets_vault.sql`, `secret_ref` is the **vault UUID pointer**, not the decrypted secret. Every other tenant integration in the repo (Apify, Instantly, Apollo — see `apps/lead-scraper/lib/persist.ts`, `apps/mia-onmarket-cron/src/lib/apify.ts`, `apps/mia/app/api/phone-qualify/route.ts`) calls `getTenantSecret(tenantId, kind)` to get the actual key.

**Implication:** If a tenant pastes an AssemblyAI key into admin-console today, transcription will fail with a 401 because we pass the vault UUID instead of the key. The platform-level path works fine. So **today the system is effectively platform-only**, and the per-tenant fallback is dormant + broken.

### How many tenants will actually transcribe in the next 90 days?

| Tenant | Transcription likely? | Why |
|---|---|---|
| `239live` | YES — primary user | Podcast clip pipeline is the flagship; ~1 episode/week, 30–60 min each. |
| `naplesdigital` | YES — self-dogfooding | Once Jake starts publishing the podcast for the SaaS brand. Assume late Q2. |
| `jakepaine` | MAYBE | Personal brand content. Low cadence, sporadic. |
| `mia` | NO | Real-estate acquisitions tenant. No content workflow active. |
| `lifewise` | NO (in 90 days) | Unclear product surface. Defer. |
| Kevin (next design partner) | UNLIKELY in 90 days | If signed Friday, his use case is design partner onboarding for the broader platform; podcast isn't his core motion. |

**Working number for the next 90 days: 1.5 active transcription tenants** (239live full bore + naplesdigital ramping). Treat as ≤3 even if jakepaine activates.

---

## Options

### A. Platform-level only (Doppler `naples-digital/prd`)
- One `ASSEMBLYAI_API_KEY` in Doppler, every tenant inherits.
- Zero onboarding friction. Tenants get transcription as a platform feature.
- All cost lands on Purity Goat LLC's AssemblyAI invoice. No automatic per-tenant cost attribution.
- Matches how `ANTHROPIC_API_KEY`, `RESEND_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY` work today.

### B. Per-tenant only (Vault via `set_tenant_secret`)
- Every tenant pastes their own AssemblyAI key in admin-console before transcription works.
- Clean billing isolation — each tenant pays AssemblyAI directly.
- Real onboarding friction: a tenant who wants to test the podcast pipeline has to create an AssemblyAI account first. Many won't, and the demo dies.
- Requires fixing the latent bug (swap `secret_ref` → `getTenantSecret` call).

### C. Hybrid — platform default, per-tenant override (CURRENT CODE INTENT)
- Doppler key is the default; if a tenant has a verified AssemblyAI integration row, use theirs.
- Best of both worlds for the transition: zero friction during early days, easy escape hatch when a tenant gets large enough to want their own key.
- Already the code shape in `packages/transcription/index.ts` — just needs the `secret_ref → getTenantSecret` fix.

---

## Cost math

### Platform-level cost ceiling (Option A or C with no override)

AssemblyAI list pricing is ~$0.37/hr of audio (Universal model, async). Episode pipeline today targets 30–60 min clips.

| Scenario | Audio hours/yr | Annual AssemblyAI bill |
|---|---|---|
| Today (239live only, 1 ep/wk, 60 min) | 52 hrs | **~$19** |
| 3 tenants × 1 ep/wk × 60 min × 52 wks | 156 hrs | **~$58** |
| 5 tenants × 4 hrs/wk × 52 wks (the brief's hypothetical ceiling) | 1,040 hrs | **~$385** |
| 10 tenants × 4 hrs/wk × 52 wks | 2,080 hrs | **~$770** |
| 25 tenants × 4 hrs/wk × 52 wks | 5,200 hrs | **~$1,925** |

The brief's $385/yr figure is **the upper bound at 5 tenants doing 4 hrs/wk each**. Realistic 90-day spend at current trajectory: under $20.

### Operational cost of per-tenant (Option B)

- Each new tenant must:
  1. Sign up at app.assemblyai.com
  2. Add a credit card
  3. Find the API key
  4. Paste into admin-console
- Conservative estimate: 15-30 min of friction per tenant, plus a non-zero drop-off rate where the tenant just never finishes the step and transcription silently doesn't work. Cost to Jake = at least one support DM per onboarded tenant.
- For SaaS-funnel tenants (post-pivot), this friction will kill conversion on the podcast pipeline feature. The "wow" demo is "upload your audio, see clips 10 min later" — not "go create an AssemblyAI account first."

### When does cost smearing actually matter?

Cross-tenant cost smearing becomes a problem when **any single tenant could plausibly spike the bill by 10x in a month** and you can't tell which tenant did it without piecing together usage logs. At $0.37/hr, a tenant would need to push ~270 hrs of audio in a month (≈9 hrs/day every day) to add $100 to the bill. That's not a podcast tenant — that's an outlier transcribing a back catalog or running a transcription-heavy product (call analytics, voice notes app, lecture archives).

---

## Trigger condition for switching to per-tenant override

**Trip the switch on a tenant when ANY of these becomes true:**

1. **The tenant transcribes > 50 hours of audio in any rolling 30-day window** (AssemblyAI cost > $18.50/mo for one tenant — clearly outside "we're paying for podcast clips as a feature").
2. **AssemblyAI bill exceeds $200/mo total** AND we can't trivially attribute > 60% of it to one tenant from `episodes.audio_duration` sums.
3. **A tenant explicitly asks to BYOK** for compliance, contracting, or because their parent company already has an AssemblyAI seat.
4. **A tenant is on the `agency` plan or `enterprise` tier** (those tiers contractually expect cost separation).

The most likely first trigger: #1 or #3. Tenant count alone is not the right axis — usage is.

**Disagree with Jake's "5+ tenants" heuristic.** Tenant count is a poor proxy for cost. A platform with 50 tenants who each transcribe 1 podcast/month costs less than a platform with 3 tenants where one runs a call-center back-catalog. Use usage hours, not tenant count.

---

## Migration sketch (for when the trigger fires)

### Step 0 (do now, regardless): Fix the latent bug

`packages/transcription/index.ts` currently passes `secret_ref` (vault UUID) as the API key. Replace with `getTenantSecret` lookup so the per-tenant override path actually works the day we need it. This is a 5-line change and unblocks options A→C and any future B.

```ts
// Replace tenant lookup in getTranscriptionClientForTenant:
import { getTenantSecret } from "@naples/db";
const tenantSecret = await getTenantSecret(tenantId, "assemblyai");
if (tenantSecret?.secret && tenantSecret.status !== "disabled") {
  return createAssemblyAIClient({ apiKey: tenantSecret.secret });
}
```

### Step 1: Add usage telemetry

Sum `episodes.audio_duration` per tenant per month. Surface in admin-console as "AssemblyAI hours this month." This is the dashboard that tells you when a tenant trips the threshold. Already most of the way there — `setEpisodeTranscript` writes `audio_duration` (see `packages/db/lib/queries.ts:468`).

### Step 2: When the trigger fires for tenant X

1. Email/Slack the tenant: "Your transcription usage has crossed our included plan threshold. To keep your pipeline running without interruption, please add your own AssemblyAI API key here: <admin-console URL>."
2. Tenant pastes key → `tenant_integrations` row gets a verified `secret_ref`.
3. Next call to `getTranscriptionClientForTenant(tenantId)` picks up the per-tenant key automatically — no code deploy needed (because the hybrid path is already in place after Step 0).
4. **Backfill is a no-op** — past transcripts already exist on the platform key. Only future jobs route to the tenant's key.

### Step 3 (optional, when 3+ tenants have overrides): Enforcement mode

Add a `tenant.flags.require_byok_assemblyai = true` flag. Any tenant with that flag must use their own key; the platform key is ignored. Useful for agency/enterprise tier tenants where you contractually require BYOK.

---

## Decision

**Stay platform-level for now (Option C — hybrid), with the per-tenant override hook fixed and ready.**

Concretely:
- Keep `ASSEMBLYAI_API_KEY` in Doppler `naples-digital/prd`.
- Fix the `secret_ref → getTenantSecret` bug in `packages/transcription/index.ts` so the override path works the day we need it.
- Add tenant-level audio-hour telemetry in admin-console (sum `episodes.audio_duration`).
- Switch any individual tenant to per-tenant BYOK when they cross **50 hrs/30 days** OR ask for it OR sit on agency/enterprise tier.
- Do NOT use "5+ tenants" as the trigger. Use **usage hours per tenant per month**.

**Why this beats Jake's 5-tenant rule:** the cost is so low that even at 5 tenants the platform-pays model is rounding error ($385/yr ceiling). Friction of forcing BYOK on every tenant kills the demo of the podcast pipeline, which is the feature that wins design partners. Per-tenant cost attribution only matters once one tenant becomes a cost outlier, and that's a usage signal, not a count signal.
