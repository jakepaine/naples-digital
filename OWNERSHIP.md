# Ownership

This codebase is the **Naples Digital platform** — a multi-tenant SaaS chassis whose first paying tenant is 239 Live (Kevin).

## Entity mapping

| Field | Value |
|---|---|
| Legal entity | **Purity Goat LLC** |
| Operating brand / DBA | **Naples Digital** |
| Codebase identity | Naples Digital platform (multi-tenant SaaS chassis) |
| First tenant / flagship client | 239 Live (Kevin) |
| Stripe account in use | Purity Goat |
| GitHub org (target) | `naples-digital` |
| Supabase org (target) | "Naples Digital" |
| Railway workspace (target) | "Naples Digital" |

## Mirrored entity model

Jake operates two LLCs with parallel structures (operate a brand, productize the internal tooling, sell to peers):

| | Purity Goat LLC | EMF Protection LLC |
|---|---|---|
| Operating brand | Naples Digital (AI automation & consultancy) | Rad Energy (e-commerce) |
| First external client | 239 Live (Kevin) | (none yet) |
| Productized SaaS | Naples Digital platform (this repo) | Rad Energy Command Center (future, no name yet) |
| Side product | Fitness app (passion project) | — |
| Stripe | Purity Goat Stripe | EMF Protection Stripe |

## How tenancy works

- Every domain table is scoped by `tenant_id`.
- 239 Live is tenant #1.
- Naples Digital itself will eventually become a tenant (its marketing site, CRM, outreach, content all run on this same chassis).
- Future paying clients = additional tenants. New tenant onboarding is a form fill, not a code fork.
- See `project_phase8_multitenant` memory and Phase 8 commits for architecture details.

## Billing note

SaaS infra costs (GitHub, Supabase, Railway, domains) are currently paid on the EMF Protection / Rad Energy card pending intercompany cleanup. This is documented as either an intercompany expense reimbursement or simply booked as the paying LLC's expense — confirm bookkeeping treatment with CPA. Each platform's billing card can be flipped to a Purity Goat card per workspace/org with no migration.

## Sibling Purity Goat products

When the fitness app or other Purity Goat products are built, each gets its own:
- Repo under `naples-digital` GitHub org
- Supabase project under "Naples Digital" Supabase org
- Railway services under "Naples Digital" Railway workspace
- Wired to Purity Goat Stripe (one Stripe per LLC; multiple products fine)

## Out of scope for this repo

- **Rad Energy Command Center productization.** Eventually Jake plans to productize Rad Energy's internal command center for sale to other e-commerce brands. The entity ownership question (Purity Goat vs. EMF Protection) is **deferred pending attorney/CPA**. Do not assume.
- **Rad Energy infrastructure.** Lives in a separate codebase under EMF Protection LLC.

## Strategy and execution docs (outside the repo)

- `/Users/jacobpaine/Documents/business/naples-digital-strategy-memo.md` — strategy memo for advisors / attorney / CPA / partners.
- `/Users/jacobpaine/Documents/business/naples-digital-implementation-plan.md` — operational plan for the GitHub / Supabase / Railway reparenting.

## Caveat

Not legal or CPA advice. The entity mapping above describes the current operational structure. Any changes to LLC ownership of products, intercompany agreements, or revenue routing should be reviewed with attorney/CPA before execution.
