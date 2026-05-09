// PhantomBuster adapter. Launches a Phantom (agent) by id, polls until
// completion, downloads result CSV/JSON.
//
// params shape:
//   {
//     agent_id: string,            // PhantomBuster agent id
//     input: {
//       sessionCookie?: string,    // for LinkedIn agents
//       searches?: string[],
//       numberOfPagesPerSearch?: number,
//       hashtagOrPlaceUrl?: string // for IG agents
//       ...                        // any agent-specific input
//     }
//   }
//
// Auth is via the PhantomBuster API key in the X-Phantombuster-Key header.

import { ScrapeSource, ScrapeOutcome, RawScrapedLead } from "./types";

const LAUNCH = "https://api.phantombuster.com/api/v2/agents/launch";
const FETCH_OUTPUT = "https://api.phantombuster.com/api/v2/containers/fetch-output";
const FETCH_RESULT_OBJECT = "https://api.phantombuster.com/api/v2/containers/fetch-result-object";
const POLL_INTERVAL_MS = 5_000;
const POLL_MAX_MS = 120_000;

export const phantombusterSource: ScrapeSource = {
  key: "phantombuster",
  displayName: "PhantomBuster",
  isConfigured({ apiKey }) {
    return !!apiKey;
  },
  async scrape({ apiKey, params, maxLeads }) {
    if (!apiKey) return stubOutcome(maxLeads);

    const agentId = String((params as any).agent_id ?? "").trim();
    if (!agentId) {
      return { fetched: [], error: "phantombuster.params.agent_id required" };
    }
    const input = (params as any).input ?? {};

    try {
      // Launch
      const launchRes = await fetch(LAUNCH, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-phantombuster-key-1": apiKey,
        },
        body: JSON.stringify({
          id: agentId,
          argument: input,
          saveArgument: false,
        }),
      });
      const launchJson = (await launchRes.json().catch(() => ({}))) as any;
      const containerId = launchJson?.containerId;
      if (!containerId) {
        return {
          fetched: [],
          error: `phantombuster launch missing containerId: ${JSON.stringify(launchJson).slice(0, 240)}`,
        };
      }

      // Poll
      const start = Date.now();
      let finished = false;
      let lastOutput: any = null;
      while (Date.now() - start < POLL_MAX_MS && !finished) {
        await sleep(POLL_INTERVAL_MS);
        const outRes = await fetch(
          `${FETCH_OUTPUT}?id=${containerId}&mode=current`,
          { headers: { "x-phantombuster-key-1": apiKey } },
        );
        const outJson = (await outRes.json().catch(() => ({}))) as any;
        lastOutput = outJson;
        // PhantomBuster returns containerStatus: "queued" | "running" | "finished".
        if (outJson?.containerStatus === "finished") {
          finished = true;
          break;
        }
      }

      if (!finished) {
        return {
          fetched: [],
          error: `phantombuster timed out after ${POLL_MAX_MS / 1000}s`,
          raw_results_url: `phantombuster:${containerId}`,
        };
      }

      // Pull the result object
      const resultRes = await fetch(
        `${FETCH_RESULT_OBJECT}?id=${containerId}`,
        { headers: { "x-phantombuster-key-1": apiKey } },
      );
      const resultJson = (await resultRes.json().catch(() => ({}))) as any;
      const items = parseResultObject(resultJson);
      const fetched = items.slice(0, maxLeads).map(normalizePhantomItem);
      return {
        fetched,
        raw_results_url: `phantombuster:${containerId}`,
      };
    } catch (e) {
      return { fetched: [], error: (e as Error).message };
    }
  },
};

function parseResultObject(obj: any): any[] {
  // PhantomBuster wraps results various ways. Common: resultObject is a
  // JSON-encoded array string; sometimes it's directly an array.
  const ro = obj?.resultObject ?? obj;
  if (Array.isArray(ro)) return ro;
  if (typeof ro === "string") {
    try {
      const parsed = JSON.parse(ro);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

function normalizePhantomItem(it: any): RawScrapedLead {
  return {
    external_id: String(it.profileUrl ?? it.linkedinUrl ?? it.id ?? "") || null,
    email: it.email ?? it.workEmail ?? null,
    first_name: it.firstName ?? it.first_name ?? null,
    last_name: it.lastName ?? it.last_name ?? null,
    company_name: it.companyName ?? it.company ?? null,
    domain: extractDomain(it.companyWebsite ?? it.website ?? null),
    linkedin_url: it.profileUrl ?? it.linkedinUrl ?? null,
    phone: it.phoneNumber ?? it.phone ?? null,
    title: it.jobTitle ?? it.title ?? null,
    location: it.location ?? null,
    industry: it.industry ?? null,
    source: "phantombuster",
    raw: it,
  };
}

function extractDomain(raw: string | null | undefined): string | null {
  if (!raw) return null;
  try {
    const u = new URL(raw.startsWith("http") ? raw : `https://${raw}`);
    return u.hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((res) => setTimeout(res, ms));
}

function stubOutcome(maxLeads: number): ScrapeOutcome {
  const N = Math.min(maxLeads, 3);
  const fetched: RawScrapedLead[] = Array.from({ length: N }, (_, i) => ({
    external_id: `phantombuster-stub-${i + 1}`,
    email: null,
    first_name: ["Marcus", "Zoe", "Ivan"][i] ?? "Stub",
    last_name: ["Hall", "Brooks", "Petrov"][i] ?? "Lead",
    company_name: `PhantomBuster Stub ${i + 1}`,
    domain: null,
    linkedin_url: `https://linkedin.com/in/pb-stub-${i + 1}`,
    phone: null,
    title: ["VP Sales", "Founder", "Operations Lead"][i] ?? null,
    location: "Florida",
    industry: null,
    source: "phantombuster",
    raw: { stub: true, note: "PHANTOMBUSTER_API_KEY not configured." },
  }));
  return { fetched, is_stub: true };
}
