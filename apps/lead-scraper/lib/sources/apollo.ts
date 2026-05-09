// Apollo bulk-search adapter. Uses /v1/mixed_people/search to filter by
// industry / job title / location / company size and stream results.
//
// params shape:
//   {
//     filters: {
//       q_organization_industry_tag_ids?: string[];
//       person_titles?: string[];
//       person_locations?: string[];
//       organization_num_employees_ranges?: string[];   // e.g. ["1,10","11,50"]
//     },
//     max_per_run?: number   // default 100
//   }

import { ScrapeSource, ScrapeOutcome, RawScrapedLead } from "./types";

const ENDPOINT = "https://api.apollo.io/api/v1/mixed_people/search";
const TIMEOUT_MS = 15_000;
const PAGE_SIZE = 25;

export const apolloSource: ScrapeSource = {
  key: "apollo",
  displayName: "Apollo (bulk)",
  isConfigured({ apiKey }) {
    return !!apiKey;
  },
  async scrape({ apiKey, params, maxLeads }) {
    if (!apiKey) return stubOutcome(maxLeads);

    const filters = ((params as any).filters ?? {}) as Record<string, unknown>;
    const cap = Math.min(maxLeads, Number((params as any).max_per_run ?? 100));
    const fetched: RawScrapedLead[] = [];
    let page = 1;
    while (fetched.length < cap) {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
      try {
        const res = await fetch(ENDPOINT, {
          method: "POST",
          signal: ctrl.signal,
          headers: {
            "content-type": "application/json",
            accept: "application/json",
            "x-api-key": apiKey,
          },
          body: JSON.stringify({
            ...filters,
            page,
            per_page: PAGE_SIZE,
          }),
        });
        const json = (await res.json().catch(() => ({}))) as any;
        const people = Array.isArray(json?.people) ? json.people : [];
        if (people.length === 0) break;
        for (const p of people) {
          if (fetched.length >= cap) break;
          fetched.push(normalizeApolloPerson(p));
        }
        const total = Number(json?.pagination?.total_pages ?? page);
        if (page >= total) break;
        page++;
      } catch (e) {
        return {
          fetched,
          error: (e as Error).message,
        };
      } finally {
        clearTimeout(timer);
      }
    }
    return { fetched };
  },
};

function normalizeApolloPerson(p: any): RawScrapedLead {
  return {
    external_id: String(p.id ?? p.linkedin_url ?? "") || null,
    email: p.email ?? null,
    first_name: p.first_name ?? null,
    last_name: p.last_name ?? null,
    company_name: p.organization?.name ?? null,
    domain: p.organization?.primary_domain ?? p.organization?.website_url ?? null,
    linkedin_url: p.linkedin_url ?? null,
    phone: p.phone_numbers?.[0]?.sanitized_number ?? null,
    title: p.title ?? null,
    location: [p.city, p.state, p.country].filter(Boolean).join(", ") || null,
    industry: p.organization?.industry ?? null,
    source: "apollo",
    raw: p,
  };
}

function stubOutcome(maxLeads: number): ScrapeOutcome {
  const N = Math.min(maxLeads, 4);
  const fetched: RawScrapedLead[] = Array.from({ length: N }, (_, i) => ({
    external_id: `apollo-stub-${i + 1}`,
    email: `lead${i + 1}@apollo-stub-${i + 1}.example`,
    first_name: ["Sarah", "David", "Lin", "Marcus"][i] ?? "Stub",
    last_name: ["Lopez", "Park", "Wei", "Hall"][i] ?? "Lead",
    company_name: `Apollo Co ${i + 1}`,
    domain: `apollo-stub-${i + 1}.example`,
    linkedin_url: `https://linkedin.com/in/apollo-stub-${i + 1}`,
    phone: null,
    title: ["Owner", "Founder", "CEO", "Director"][i] ?? null,
    location: "Naples, FL",
    industry: "Wellness",
    source: "apollo",
    raw: { stub: true, note: "APOLLO_API_KEY not configured." },
  }));
  return { fetched, is_stub: true };
}
