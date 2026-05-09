// Vayne adapter — paste a LinkedIn Sales Navigator search URL,
// receive a normalized lead list. Vayne handles the scraping +
// enrichment server-side; we just kick off the run and read the result.
//
// params shape:
//   {
//     sales_nav_url: string,
//     max?: number     // default 200
//   }
//
// Vayne's public API is small and underdocumented; we POST to /api/run
// and poll /api/run/{id}/results until status=complete. If the schema
// shifts upstream, adjust normalize() + the poll predicate; the rest of
// the platform doesn't need to change.

import { ScrapeSource, ScrapeOutcome, RawScrapedLead } from "./types";

const RUN_ENDPOINT = "https://api.vayne.io/run";
const RESULT_ENDPOINT = (id: string) => `https://api.vayne.io/run/${id}/results`;
const POLL_INTERVAL_MS = 5_000;
const POLL_MAX_MS = 180_000;

export const vayneSource: ScrapeSource = {
  key: "vayne",
  displayName: "Vayne",
  isConfigured({ apiKey }) {
    return !!apiKey;
  },
  async scrape({ apiKey, params, maxLeads }) {
    if (!apiKey) return stubOutcome(maxLeads);

    const url = String((params as any).sales_nav_url ?? "").trim();
    if (!url) {
      return { fetched: [], error: "vayne.params.sales_nav_url required" };
    }
    const max = Math.min(maxLeads, Number((params as any).max ?? 200));

    try {
      const launchRes = await fetch(RUN_ENDPOINT, {
        method: "POST",
        headers: {
          authorization: `Bearer ${apiKey}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          source: "linkedin_sales_nav",
          url,
          max,
        }),
      });
      const launchJson = (await launchRes.json().catch(() => ({}))) as any;
      const runId = launchJson?.id;
      if (!runId) {
        return {
          fetched: [],
          error: `vayne run missing id: ${JSON.stringify(launchJson).slice(0, 240)}`,
        };
      }

      const start = Date.now();
      while (Date.now() - start < POLL_MAX_MS) {
        await sleep(POLL_INTERVAL_MS);
        const res = await fetch(RESULT_ENDPOINT(runId), {
          headers: { authorization: `Bearer ${apiKey}` },
        });
        const json = (await res.json().catch(() => ({}))) as any;
        const status = String(json?.status ?? "").toLowerCase();
        if (status === "complete" || status === "completed") {
          const leads = Array.isArray(json?.leads) ? json.leads : [];
          return {
            fetched: leads.slice(0, max).map(normalizeVayneLead),
            raw_results_url: `vayne:${runId}`,
          };
        }
        if (status === "failed" || status === "error") {
          return {
            fetched: [],
            error: json?.error ?? "vayne run failed",
            raw_results_url: `vayne:${runId}`,
          };
        }
      }
      return {
        fetched: [],
        error: `vayne timed out after ${POLL_MAX_MS / 1000}s`,
        raw_results_url: `vayne:${runId}`,
      };
    } catch (e) {
      return { fetched: [], error: (e as Error).message };
    }
  },
};

function normalizeVayneLead(it: any): RawScrapedLead {
  return {
    external_id: String(it.id ?? it.linkedin_url ?? "") || null,
    email: it.email ?? null,
    first_name: it.first_name ?? null,
    last_name: it.last_name ?? null,
    company_name: it.company ?? it.organization ?? null,
    domain: it.company_website ?? it.domain ?? null,
    linkedin_url: it.linkedin_url ?? null,
    phone: it.phone ?? null,
    title: it.title ?? it.headline ?? null,
    location: it.location ?? null,
    industry: it.industry ?? null,
    source: "vayne",
    raw: it,
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise((res) => setTimeout(res, ms));
}

function stubOutcome(maxLeads: number): ScrapeOutcome {
  const N = Math.min(maxLeads, 3);
  const fetched: RawScrapedLead[] = Array.from({ length: N }, (_, i) => ({
    external_id: `vayne-stub-${i + 1}`,
    email: null,
    first_name: ["Riley", "Jordan", "Casey"][i] ?? "Stub",
    last_name: ["Chen", "Singh", "Morgan"][i] ?? "Lead",
    company_name: `Vayne Stub Co ${i + 1}`,
    domain: `vayne-stub-${i + 1}.example`,
    linkedin_url: `https://linkedin.com/in/vayne-stub-${i + 1}`,
    phone: null,
    title: ["CRO", "Founder", "Head of Growth"][i] ?? null,
    location: "Florida",
    industry: "B2B SaaS",
    source: "vayne",
    raw: { stub: true, note: "VAYNE_API_KEY not configured." },
  }));
  return { fetched, is_stub: true };
}
