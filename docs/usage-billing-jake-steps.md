# Usage-billing rollout — steps that require Jake's hands

Everything in the hybrid centralized billing build is shipped in code and merged to `main`. The platform won't actually record or bill anything until the items below are wired up in the relevant vendor consoles. Until then, every adapter degrades gracefully — the usage dashboard renders empty, the Stripe push no-ops, etc.

## 1. Anthropic Admin API key (5 min)

The usage adapter needs an Admin-scope key (separate from inference keys; required to call the org-level usage API).

1. Anthropic Console → **Settings → API Keys → Admin Keys → Create key**. Name it `naples-usage-sync`.
2. Add to Doppler:
   ```sh
   doppler secrets set ANTHROPIC_ADMIN_KEY=sk-ant-admin-... --project naples-digital --config prd
   ```
3. The Doppler→Railway integration syncs it to `usage-sync` automatically.

## 2. Anthropic Workspace per tenant (5 min per tenant)

Each tenant gets a dedicated Anthropic Workspace. Usage is attributed by `workspace_id` on every call.

For each active tenant:

1. Anthropic Console → **Workspaces → New workspace**. Name it after the tenant slug, e.g. `239live`.
2. Copy the Workspace ID (looks like `wrkspc_…`).
3. Generate a **Workspace-scoped API key** in that workspace. This is the new `ANTHROPIC_API_KEY` for the tenant.
4. Store the workspace_id on the tenant via the admin console (or directly via Vault):
   ```sh
   # Using the existing upsertTenantIntegration helper:
   curl -X POST "$ADMIN_URL/api/integrations" \
     -H "x-tenant-slug: 239live" \
     -d '{"kind":"anthropic","config":{"workspace_id":"wrkspc_..."}}'
   ```
5. Inference code keeps using `ANTHROPIC_API_KEY` (platform-level). The workspace_id only drives the usage attribution path — it's not used at inference time today.

Optional follow-up: migrate inference to per-tenant Workspace-scoped keys so usage is attributed automatically rather than requiring the workspace_id config. Not blocking.

## 3. Apify token (already done? verify)

Check Doppler:
```sh
doppler secrets get APIFY_API_TOKEN --project naples-digital --config prd --plain
```

If missing, set it from the Apify console (Settings → Integrations → Personal API tokens). The token must have **Read** scope on actor runs.

## 4. Resend per-tenant API key (3 min per tenant, optional)

Only needed if you want per-tenant Resend usage attribution. Without per-tenant keys, the adapter skips Resend.

For each tenant:

1. Resend Dashboard → **API Keys → Create API key**. Scope: `Sending access` + `Restricted to specific domains` if you want isolation.
2. Wire into the tenant via the admin console:
   ```sh
   curl -X POST "$ADMIN_URL/api/integrations" \
     -H "x-tenant-slug: 239live" \
     -d '{"kind":"resend","secret":"re_..."}'
   ```

## 5. Stripe Products + Subscriptions (30 min first time, 10 min per tenant)

This unblocks actual invoicing. Until done, `push-stripe` skips every vendor with a "no subscription_item_id" message.

### One-time setup

1. **Add `STRIPE_SECRET_KEY` to Doppler** (the live `sk_…` key from Stripe → Developers → API keys):
   ```sh
   doppler secrets set STRIPE_SECRET_KEY=sk_live_... --project naples-digital --config prd
   ```

2. **Create 4 metered Products in Stripe** (Dashboard → Product catalog → Add product):

   | Product name | Pricing model | Price |
   |---|---|---|
   | Anthropic Usage | Metered, billed monthly | $0.01 per unit |
   | Apify Usage | Metered, billed monthly | $0.01 per unit |
   | AssemblyAI Usage | Metered, billed monthly | $0.01 per unit |
   | Resend Usage | Metered, billed monthly | $0.01 per unit |

   Quantities are reported in **cents** so $0.01/unit × cents = exact dollars on the invoice.

### Per-tenant setup

For each tenant on the new billing model:

1. **Customer** — create or find a Stripe Customer for the tenant. Note the `cus_…` ID.

2. **Subscription** — create a Subscription on that Customer with:
   - The fixed-price item for their tier (Premium / Design Partner / etc.) — create this Product separately if not already done.
   - One metered item per vendor (4 total), each pointing at the metered Products above.

3. **Capture the subscription_item IDs** — Stripe gives each item an `si_…` ID. Note one per metered vendor.

4. **Wire into the tenant via the admin console:**
   ```sh
   curl -X POST "$ADMIN_URL/api/integrations" \
     -H "x-tenant-slug: 239live" \
     -d '{
       "kind":"stripe",
       "config":{
         "customer_id":"cus_...",
         "subscription_id":"sub_...",
         "subscription_items":{
           "anthropic":"si_...",
           "apify":"si_...",
           "assemblyai":"si_...",
           "resend":"si_..."
         }
       }
     }'
   ```

5. The 1st-of-the-month `push-stripe` job will start populating real usage records on this subscription.

## 6. Schedule the Railway crons (5 min)

The `usage-sync` service runs the daily tick on its own (interval-based). The monthly Stripe push needs an external schedule.

1. **Daily sync** — already running via the service's interval loop. No action needed beyond `usage-sync` being deployed (it is).

2. **Monthly Stripe push** — add a Railway cron schedule for the same service:
   - Railway → `usage-sync` service → **Settings → Cron Schedule**: `0 2 1 * *` (02:00 UTC on the 1st of each month)
   - Override the start command for the cron run: `pnpm exec tsx src/push-stripe.ts`
   - Or alternatively, leave the always-running service and trigger `pnpm push-stripe` manually each month until you trust it.

## Verification once everything is wired

```sh
# Trigger a one-shot sync to populate yesterday's data
env -u RAILWAY_API_TOKEN -u DOPPLER_TOKEN railway run --service usage-sync -- pnpm tick

# Check that snapshot rows landed
psql $SUPABASE_DB_URL -c "SELECT vendor, COUNT(*), SUM(cost_usd) FROM tenant_usage_snapshots WHERE period_start > now() - interval '2 days' GROUP BY vendor;"

# Visit the dashboard
open https://dashboard-production-b08f.up.railway.app/usage
```

## What gets you to "working" fastest

If you want to demo the dashboard for Kevin without doing all of the above:

1. ✅ Migrations 0036 + 0037 — done
2. ✅ `usage-sync` Railway service — done
3. Just add `ANTHROPIC_ADMIN_KEY` and create one Workspace for `239live` (steps 1 + 2 above, abbreviated).
4. Wait 24h for the first daily tick. Anthropic usage will appear on the dashboard.

Apify, AssemblyAI, Resend can come later. Stripe Products + Subscriptions only matter when you flip to real invoicing — for the design-partner phase you can keep manually invoicing Kevin while the dashboard collects the data you'd use to back the bill.
