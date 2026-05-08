# CLAUDE.md — Naples Digital Platform
# Master context file. Read at the start of every session on this repo.
# Last updated: 2026-05-08

---

## WHO YOU ARE WORKING WITH

Jake Paine, founder. Non-developer, PM/scrum background. Be direct, skip preambles, give copy-pasteable outputs, warn about tradeoffs *before* committing to patterns. Translate jargon into plain English.

Cross-project rules auto-load from `~/.claude/rules/cross-project.md` — permissions, deploy posture, secret routing, workflow conventions all live there. Don't repeat them here.

---

## WHAT THIS REPO IS

The **Naples Digital platform** — a multi-tenant SaaS chassis. Originally agency-led; **pivoting to pure SaaS as of 2026-05-08**.

- **Legal entity:** Purity Goat LLC
- **Operating brand:** Naples Digital
- **Live tenants (5):** `239live` (flagship paying), `naplesdigital` (eventually self-hosted), `mia` (real estate acquisitions), `lifewise`, `jakepaine`
- **Repo path:** `~/Documents/Vibecoding/naples-digital/platform`
- **Production URLs + per-app inventory:** see `README.md`

---

## SIBLING PRODUCT — RadEnergy OS

Jake operates two LLCs in parallel with mirrored playbooks (operate a brand → productize the internal tooling → sell to peers):

- **This repo (Purity Goat LLC):** Naples Digital platform → service-business vertical SaaS
- **Sibling repo (EMF Protection LLC):** RadEnergy OS at `~/Documents/Vibecoding/radenergy-os` → e-commerce vertical, internal tool today, productization deferred

The two are **separate codebases by design** — domain models are structurally different (episodes/sponsors/clips vs. orders/ASINs/COGS). Don't propose folding RadEnergy OS into this monorepo, or vice versa, unless Jake explicitly asks.

**When RadEnergy OS productization activates,** it will copy this chassis's multi-tenancy pattern verbatim (`tenant_id` + RLS + `tenant_integrations` + `set_tenant_secret` / `get_tenant_secret` Vault RPCs + `packages/db/lib/tenant.ts`). That's the point of the parallel structure.

---

## CANONICAL DOCS — READ THESE FIRST IF RELEVANT

- **`OWNERSHIP.md`** — LLC mapping, Purity-Goat-vs-EMF-Protection structure, billing notes, what's in/out of scope for this repo
- **`README.md`** — every app, every URL, port assignments, deployment specifics, AI feature inventory
- **`~/Documents/business/strategic-decisions.md`** — cross-project living log of strategic decisions and open questions (covers both Naples Digital and RadEnergy OS). **This is where unresolved cross-product questions go**, not in either repo
- **`~/Documents/business/naples-digital-strategy-memo.md`** — strategy memo for advisors / attorney / CPA
- **`~/Documents/business/naples-digital-implementation-plan.md`** — operational reparenting plan
- **`.build-state.md`** — operational/runtime state of the deployed services (sometimes stale; verify against Railway before trusting)

---

## ARCHITECTURE QUICK-REFERENCE

(Full details in README.md — this is the spine.)

- **16 services** in pnpm + Turborepo monorepo
- **Stack:** Next.js 14 App Router + Tailwind + `@naples/ui` + `@naples/db` for Supabase, Anthropic Claude Sonnet 4.6 for AI features, Recharts for charts, `@dnd-kit/core` for drag-and-drop
- **Workers** (`mia-onmarket-cron`, `render-worker`) are plain Node + `tsx`, no Next.js
- **Database:** single Supabase project (`ylqoxefiwwimzxeuzfxy` / `239Live`), 13+ tables, RLS enabled, multi-tenant via `tenant_id`
- **Hosting:** Railway, one service per app
- **Secrets:** two layers — Doppler `naples-digital/prd` for platform-wide; Supabase Vault via `tenant_integrations.secret_ref` + `set_tenant_secret`/`get_tenant_secret` RPCs for per-tenant per-vendor
- **AI fallback:** every AI feature has a deterministic mock generator if `ANTHROPIC_API_KEY` is unset — demos never break

---

## HARD RULES SPECIFIC TO THIS REPO

- **Multi-tenancy is non-negotiable** — every new domain table gets `tenant_id`, every query is scoped, every RPC takes `tenant_id` as the first arg. No "we'll add it later."
- **No hardcoded tenant data** — even seed/demo rows go through the `tenant_id` boundary
- **The `railway` shell alias** is `doppler run --project radenergy ...`. Bypass with `env -u RAILWAY_API_TOKEN -u DOPPLER_TOKEN railway <cmd>` when you need plain Railway commands. Project tokens use `RAILWAY_TOKEN`, not `RAILWAY_API_TOKEN` (that's account-level).
- **Doppler→Railway sync** is one-way. Editing env vars in the Railway dashboard gets overwritten on next sync. Always edit secrets in Doppler.
- **Per-tenant secrets never go in Doppler.** Doppler is for things every tenant inherits (Anthropic key, Supabase keys, Resend). Tenant API keys (Kevin's Instantly, MIA's Apify) go in Vault via `set_tenant_secret`.

---

## ACTIVE STRATEGIC QUESTIONS (UNRESOLVED)

The full living log is at `~/Documents/business/strategic-decisions.md`. Snapshot of the open questions affecting this repo:

1. **Naples Digital pivot to pure SaaS — migration path for existing 5 tenants.** Grandfather them on agency pricing? Migrate to self-serve? Sunset tenants that aren't a fit? Affects engineering scope (do we need to support both billing models?). Undecided.
2. **Marketing automation phase architecture.** Jake flagged this 2026-05-08 as the most important upcoming build (Meta ads + AI creative + UGC + video). Open question: feature inside `radenergy-os`, sibling product, or **shared infra between Naples Digital and RadEnergy OS**? The third option is interesting because both products need it. No plan doc yet.
3. **Will RadEnergy itself eventually become a tenant of this platform?** Eat-your-own-dog-food vs. co-mingling 7-figure live ecom data with SaaS infra. Undecided.
4. **LLC ownership of any future RadEnergy OS productization.** Deferred to attorney/CPA per `OWNERSHIP.md`. Becomes urgent once this platform crosses meaningful SaaS revenue.
5. **Co-founder / equity arrangements.** Noah is co-builder. Operating role, equity share, decision rights — not formalized. Best to formalize before there's meaningful $$.

Don't relitigate these every session. Flag if a build decision depends on one; otherwise leave them for Jake to resolve at his pace.

---

## WHAT NOT TO DO IN THIS REPO

- Don't introduce a second database. Single Supabase project, multi-tenant via `tenant_id`.
- Don't add a service in the standard slots without confirming with Jake (see `~/.claude/rules/cross-project.md` for the standard-services list).
- Don't fold RadEnergy OS code into this monorepo.
- Don't propose Vercel, Telegram, Make.com/Zapier, or Python services (cross-project rule).
- Don't auto-submit anything that costs Jake real money or commits a tenant to spend (purchase orders, ad campaign launches, invoice issuance) — agent drafts; human submits.

---

## WHEN IN DOUBT

3-layer context rule: (1) check this file + auto-memory + `~/Documents/business/strategic-decisions.md`, (2) check the code, (3) only then ask Jake.
