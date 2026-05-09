import Stripe from "stripe";
import type { Tier } from "@naples/db";

let cached: Stripe | null = null;

export class BillingNotConfiguredError extends Error {
  constructor() {
    super(
      "Naples billing is not configured. Set NAPLES_STRIPE_SECRET_KEY + tier price IDs in Doppler.",
    );
    this.name = "BillingNotConfiguredError";
  }
}

export function getNaplesStripe(): Stripe {
  if (cached) return cached;
  const key = process.env.NAPLES_STRIPE_SECRET_KEY;
  if (!key) throw new BillingNotConfiguredError();
  cached = new Stripe(key, { apiVersion: "2025-02-24.acacia" });
  return cached;
}

// Tier → Stripe Price ID mapping. Each tier needs a Price created in
// the Naples Digital Stripe account; the IDs go in Doppler.
export function priceIdForTier(tier: Tier): string | null {
  const env = (k: string) => process.env[k] ?? null;
  switch (tier) {
    case "starter":
      return env("NAPLES_STRIPE_PRICE_STARTER");
    case "growth":
      return env("NAPLES_STRIPE_PRICE_GROWTH");
    case "premium":
      return env("NAPLES_STRIPE_PRICE_PREMIUM");
    case "design_partner":
      return env("NAPLES_STRIPE_PRICE_DESIGN_PARTNER");
    case "enterprise":
      return null; // custom pricing — not self-serve
    default:
      return null;
  }
}

// Reverse map for webhook payload → tier
export function tierForPriceId(priceId: string | null | undefined): Tier | null {
  if (!priceId) return null;
  if (priceId === process.env.NAPLES_STRIPE_PRICE_STARTER) return "starter";
  if (priceId === process.env.NAPLES_STRIPE_PRICE_GROWTH) return "growth";
  if (priceId === process.env.NAPLES_STRIPE_PRICE_PREMIUM) return "premium";
  if (priceId === process.env.NAPLES_STRIPE_PRICE_DESIGN_PARTNER) return "design_partner";
  return null;
}

export function getWebhookSecret(): string {
  const v = process.env.NAPLES_STRIPE_WEBHOOK_SECRET;
  if (!v) throw new Error("NAPLES_STRIPE_WEBHOOK_SECRET not set");
  return v;
}
