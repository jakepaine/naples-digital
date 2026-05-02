// Apollo.io enrichment wrapper.
// Docs: https://docs.apollo.io/reference/people-enrichment

import type { EnrichmentVendor, EnrichedPerson, EnrichmentSource } from "./types";

const API_BASE = "https://api.apollo.io/v1";

export function createApolloVendor(opts: { apiKey: string }): EnrichmentVendor {
  const source: EnrichmentSource = "apollo";

  async function call<T>(path: string, body: Record<string, unknown>): Promise<T> {
    const res = await fetch(`${API_BASE}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache",
        "X-Api-Key": opts.apiKey,
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`Apollo ${res.status}: ${await res.text().catch(() => "")}`);
    return res.json() as Promise<T>;
  }

  function shape(p: Record<string, unknown>): EnrichedPerson {
    return {
      name: (p.name as string) ?? `${(p.first_name as string) ?? ""} ${(p.last_name as string) ?? ""}`.trim(),
      email: p.email as string | undefined,
      title: p.title as string | undefined,
      company: ((p.organization as Record<string, unknown> | undefined)?.name as string | undefined),
      domain: ((p.organization as Record<string, unknown> | undefined)?.primary_domain as string | undefined),
      linkedin_url: p.linkedin_url as string | undefined,
      twitter_url: p.twitter_url as string | undefined,
      phone: ((p.phone_numbers as Array<Record<string, unknown>> | undefined)?.[0]?.sanitized_number as string | undefined),
      location: [p.city, p.state, p.country].filter(Boolean).join(", ") || undefined,
      raw: p,
    };
  }

  return {
    source,
    async lookupByEmail(email: string): Promise<EnrichedPerson | null> {
      try {
        const data = await call<{ person?: Record<string, unknown> }>("/people/match", { email, reveal_personal_emails: false });
        if (!data.person) return null;
        return shape(data.person);
      } catch { return null; }
    },
    async lookupByDomain(domain: string): Promise<EnrichedPerson | null> {
      try {
        const data = await call<{ organization?: Record<string, unknown> }>("/organizations/enrich", { domain });
        if (!data.organization) return null;
        return {
          company: data.organization.name as string | undefined,
          domain: data.organization.primary_domain as string | undefined ?? domain,
          location: data.organization.city as string | undefined,
          raw: data.organization,
        };
      } catch { return null; }
    },
  };
}
