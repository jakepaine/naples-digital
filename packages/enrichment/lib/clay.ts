// Clay.com enrichment wrapper. Clay's API is webhook-based: you POST data
// to a Clay table's webhook URL, and Clay processes it asynchronously.
// For synchronous enrichment we expose a thin wrapper that hits Clay's
// "enrich" endpoint where available, with Apollo as a fallback.

import type { EnrichmentVendor, EnrichedPerson, EnrichmentSource } from "./types";

export function createClayVendor(opts: { apiKey: string; webhookUrl?: string }): EnrichmentVendor {
  const source: EnrichmentSource = "clay";

  return {
    source,
    async lookupByEmail(email: string): Promise<EnrichedPerson | null> {
      // Clay's typical pattern: POST to a tenant-configured webhook URL with the email,
      // wait for Clay to process, then poll or receive a callback. For v1, we send
      // and return a stub. Real implementation should be queue-based.
      if (!opts.webhookUrl) return null;
      try {
        await fetch(opts.webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-Api-Key": opts.apiKey },
          body: JSON.stringify({ email, requested_at: new Date().toISOString() }),
        });
        return { email, raw: { queued: true } };
      } catch { return null; }
    },
    async lookupByDomain(_domain: string): Promise<EnrichedPerson | null> {
      return null; // not implemented in v1
    },
  };
}
